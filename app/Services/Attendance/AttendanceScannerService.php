<?php

namespace App\Services\Attendance;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AttendanceScannerService
{
    public function __construct(
        protected GeofenceValidationService $geofenceService,
        protected EvaluationGateService $evaluationGateService
    ) {}

    /**
     * Check if a student is authorized to scan for an event.
     */
    public function isAssignedScanner(?Student $student, Event $event): bool
    {
        if (! $student) {
            return false;
        }

        $allowed = $event->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }
        $legacyAllowed = trim((string) ($event->scanner_student_id ?? ''));
        if ($legacyAllowed !== '' && ! in_array($legacyAllowed, $allowed, true)) {
            $allowed[] = $legacyAllowed;
        }

        if (empty($allowed)) {
            return false;
        }

        $studentId = trim((string) ($student->student_id ?? ''));
        $dbId = trim((string) ($student->id ?? ''));

        return ($studentId !== '' && in_array($studentId, $allowed, true))
            || ($dbId !== '' && in_array($dbId, $allowed, true));
    }

    /**
     * Extract student identifier from raw QR value (JSON, URL, or plain string).
     */
    public function extractStudentIdFromQr(string $qrValue): string
    {
        $studentKey = null;
        $studentIdValue = null;

        $decoded = json_decode($qrValue, true);
        if (is_array($decoded)) {
            if (! empty($decoded['student_id'])) {
                $studentKey = 'student_id';
                $studentIdValue = trim((string) $decoded['student_id']);
            } elseif (! empty($decoded['id'])) {
                $studentKey = 'id';
                $studentIdValue = trim((string) $decoded['id']);
            }
        }

        if (! $studentKey) {
            $urlParts = parse_url($qrValue);
            if (is_array($urlParts) && isset($urlParts['scheme']) && isset($urlParts['host'])) {
                $qs = [];
                parse_str((string) ($urlParts['query'] ?? ''), $qs);

                if (! empty($qs['student_id'])) {
                    $studentIdValue = trim((string) $qs['student_id']);
                } elseif (! empty($qs['id'])) {
                    $studentIdValue = trim((string) $qs['id']);
                } else {
                    $path = trim((string) ($urlParts['path'] ?? ''), '/');
                    if ($path !== '') {
                        $segments = array_values(array_filter(explode('/', $path), fn ($s) => $s !== ''));
                        $last = trim((string) ($segments[count($segments) - 1] ?? ''));
                        if ($last !== '') {
                            $studentIdValue = $last;
                        }
                    }
                }
            }
        }

        if ($studentIdValue === null) {
            $studentIdValue = $qrValue;
        }

        return trim((string) $studentIdValue);
    }

    /**
     * Process and record a QR scan by an assigned scanner.
     */
    public function processScan(Event $event, Student $scanner, array $validated, Request $request): JsonResponse
    {
        $lat = $validated['latitude'] ?? null;
        $lng = $validated['longitude'] ?? null;
        $accuracyM = $validated['accuracy_m'] ?? null;

        // Geofence validation
        $geoError = $this->geofenceService->validate($event, $lat ? (float)$lat : null, $lng ? (float)$lng : null, $accuracyM ? (float)$accuracyM : null);
        if ($geoError) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Geofence error in event #' . $event->id . ': ' . $geoError['message'], $request);
            }
            return response()->json($geoError, $geoError['status']);
        }

        $rawValue = trim((string) $validated['value']);
        $studentIdValue = $this->extractStudentIdFromQr($rawValue);

        $student = null;
        if ($studentIdValue !== '') {
            $student = Student::query()->where('student_id', $studentIdValue)->first();
        }
        if (! $student && $studentIdValue !== '' && ctype_digit($studentIdValue)) {
            $student = Student::query()->whereKey((int) $studentIdValue)->first();
        }
        if (! $student) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Student not found for QR value in event #' . $event->id, $request);
            }
            return response()->json(['message' => 'Student attendee record not found.'], 404);
        }

        // Check Course & Year Eligibility
        if (! $this->isStudentEligible($student, $event)) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', "Attendee '{$student->student_id}' not eligible for event #{$event->id}", $request);
            }
            return response()->json([
                'message' => 'Attendance Denied: Student ' . ($student->name ?? $student->student_id) . ' is not eligible for this event (course/year mismatch).',
            ], 403);
        }

        // Check Pending Evaluations
        if ($this->evaluationGateService->hasPendingEvaluations($student, $event)) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Pending evaluations for student in event #' . $event->id, $request);
            }
            app(StudentNotificationDispatcher::class)->attendanceIssue(
                $event,
                $student,
                'Your attendance for '.(string) $event->event_name.' requires verification because previous evaluations are pending.',
                'pending_evaluation',
            );

            return response()->json([
                'message' => 'You must complete evaluations for previous events before attending this event.',
                'requires_evaluation' => true,
            ], 422);
        }

        $now = Carbon::now();
        $attendance = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->first();

        // Evaluate Time-In vs Late vs Time-Out based on event time windows
        $scanEval = $event->evaluateAttendanceScan($now, $attendance);
        if (! $scanEval['allowed']) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', $scanEval['error_message'] . ' in event #' . $event->id, $request);
            }
            if ($scanEval['status_code'] === 409) {
                app(StudentNotificationDispatcher::class)->attendanceIssue(
                    $event,
                    $student,
                    'A scanner attempted another attendance scan after you had already checked out.',
                    'already_checked_out',
                );
            }

            return response()->json([
                'message' => $scanEval['error_message'],
            ], $scanEval['status_code']);
        }

        $status = $scanEval['status'];
        $isTimeOut = ($scanEval['action'] === 'check_out');

        $eventLat = $event->geofence_latitude;
        $eventLng = $event->geofence_longitude;
        $distanceRounded = null;
        if ((bool) ($event->geofence_enabled ?? false) && $lat !== null && $lng !== null && $eventLat !== null && $eventLng !== null) {
            $distanceRounded = (int) round($this->geofenceService->haversineDistanceMeters((float) $lat, (float) $lng, (float) $eventLat, (float) $eventLng));
        }

        if (! $attendance) {
            $attendance = Attendance::create([
                'event_id' => $event->id,
                'student_id' => $student->id,
                'scanned_at' => $now,
                'status' => $status,
                'checked_in_at' => $now,
                'check_in_latitude' => $lat,
                'check_in_longitude' => $lng,
                'check_in_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                'check_in_distance_m' => $distanceRounded,
            ]);
        } else {
            $attendance->update([
                'scanned_at' => $now,
                'checked_out_at' => $now,
                'check_out_latitude' => $lat,
                'check_out_longitude' => $lng,
                'check_out_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                'check_out_distance_m' => $distanceRounded,
            ]);
        }

        $this->evaluationGateService->triggerEvaluationNotification($student, $event);

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($scanner, 'Attendance', $isTimeOut ? 'Checked Out' : 'Checked In', "Recorded attendance for event #{$event->id} (status: {$status}, action: " . ($isTimeOut ? 'Time Out' : 'Time In') . ")", $request);
        }

        $cutoff = $scanEval['time_in_cutoff'] ?? null;
        $cutoffStr = ($cutoff instanceof \Carbon\CarbonInterface)
            ? ' (cut-off was ' . $cutoff->format('h:i A') . ', 1 hr after start)'
            : ' (cut-off was 1 hr after start)';

        $checkInLabel = $status === 'late'
            ? 'Time-in (Check-in) recorded as LATE' . $cutoffStr . '.'
            : 'Time-in (Check-in) recorded successfully (On-Time).';

        return response()->json([
            'attendance_id' => $attendance->id,
            'status' => $attendance->status,
            'scanned_at' => $now->toDateTimeString(),
            'action' => $isTimeOut ? 'check_out' : 'check_in',
            'message' => $isTimeOut ? 'Time-out (Check-out) recorded successfully.' : $checkInLabel,
            'time_in' => optional($attendance->checked_in_at)->format('h:i A'),
            'time_out' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->format('h:i A') : null,
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->name,
                'course' => $student->course ?? $student->program,
                'year_level' => $student->year_level,
            ],
        ]);
    }

    /**
     * Determine if a student is eligible for an event based on courses and year levels.
     */
    protected function isStudentEligible(Student $student, Event $event): bool
    {
        return EventEligibilityService::isStudentEligible($student, $event);
    }
}
