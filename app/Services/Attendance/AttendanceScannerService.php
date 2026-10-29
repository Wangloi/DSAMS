<?php

namespace App\Services\Attendance;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AttendanceScannerService
{
    public function __construct(
        protected GeofenceValidationService $geofenceService,
        protected EvaluationGateService $evaluationGateService,
        protected ?ConflictAttendanceService $conflictService = null
    ) {
        $this->conflictService = $this->conflictService ?? app(ConflictAttendanceService::class);
    }

    /**
     * Check if a student is authorized to scan for an event (or any of its conflicting schedule events).
     */
    public function isAssignedScanner(?Student $student, Event $event): bool
    {
        if (! $student) {
            return false;
        }

        if ($this->checkScannerAssignment($student, $event)) {
            return true;
        }

        // Allow if scanner is assigned to any active event with a conflicting schedule
        $conflicts = $event->getConflictingEvents();
        foreach ($conflicts as $conflictEvent) {
            if ($this->checkScannerAssignment($student, $conflictEvent)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check direct scanner assignment on an event.
     */
    protected function checkScannerAssignment(Student $student, Event $event): bool
    {
        $allowed = $event->scanner_student_ids;
        if (is_string($allowed)) {
            $decoded = json_decode($allowed, true);
            $allowed = is_array($decoded) ? $decoded : [];
        } elseif (! is_array($allowed)) {
            $allowed = [];
        }
        $allowed = array_values(array_unique(array_filter(array_map('strval', (array) $allowed))));
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
            $rawId = $studentIdValue;
            $stripped = preg_replace('/^ID-/i', '', $rawId);
            $withPrefix = 'ID-' . $stripped;
            $candidateIds = array_values(array_unique(array_filter([
                $rawId,
                $withPrefix,
                $stripped,
                strtoupper($rawId),
                strtoupper($withPrefix),
                strtoupper($stripped),
                strtolower($rawId),
            ])));

            $student = Student::query()
                ->whereIn('student_id', $candidateIds)
                ->first();
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
            // Check if student is eligible for any conflicting schedule event
            $conflictResult = $this->conflictService->scanConflictingEventIfPrimaryIneligible($event, $student, Carbon::now(), [
                'latitude' => $lat,
                'longitude' => $lng,
                'accuracy_m' => $accuracyM,
            ], $request);

            if ($conflictResult) {
                $primaryConflict = $conflictResult['primary']['event'];
                $primaryAtt = $conflictResult['primary']['attendance'];
                $scanEval = $conflictResult['primary']['scanEval'];
                $status = $primaryAtt->status;
                $isTimeOut = ($scanEval['action'] === 'check_out');

                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', $isTimeOut ? 'Checked Out' : 'Checked In', "Recorded attendance for conflicting event #{$primaryConflict->id} ({$primaryConflict->event_name}) via scanner on event #{$event->id}", $request);
                }

                $allConflictedScans = array_merge([
                    [
                        'event_id' => $primaryConflict->id,
                        'event_name' => $primaryConflict->event_name,
                        'action' => $isTimeOut ? 'check_out' : 'check_in',
                        'status' => $status,
                        'time' => Carbon::now()->format('h:i A'),
                    ]
                ], $conflictResult['additional_conflicts'] ?? []);

                return response()->json([
                    'attendance_id' => $primaryAtt->id,
                    'status' => $status,
                    'scanned_at' => Carbon::now()->toDateTimeString(),
                    'action' => $isTimeOut ? 'check_out' : 'check_in',
                    'message' => ($isTimeOut ? 'Time-out (Check-out) recorded' : 'Time-in (Check-in) recorded') . " for conflicting schedule '{$primaryConflict->event_name}' (Student is registered for this conflicting schedule).",
                    'conflicted_events_scanned' => $allConflictedScans,
                    'time_in' => optional($primaryAtt->checked_in_at)->format('h:i A'),
                    'time_out' => $primaryAtt->checked_out_at ? optional($primaryAtt->checked_out_at)->format('h:i A') : null,
                    'student' => [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'name' => $student->name,
                        'course' => $student->course ?? $student->program,
                        'year_level' => $student->year_level,
                    ],
                ]);
            }

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
        $requestedMode = $request->input('mode') ?? $request->input('scan_type');

        try {
            [$attendance, $scanEval, $conflictedScans] = DB::transaction(function () use ($event, $student, $now, $requestedMode, $lat, $lng, $accuracyM, $request) {
                // Row-level lock to prevent concurrent double-scans from adjacent stations
                $attendance = Attendance::query()
                    ->where('event_id', $event->id)
                    ->where('student_id', $student->id)
                    ->lockForUpdate()
                    ->first();

                // Evaluate Time-In vs Late vs Time-Out based on event time windows and requested mode
                $scanEval = $event->evaluateAttendanceScan($now, $attendance, $requestedMode);
                if (! $scanEval['allowed']) {
                    return [$attendance, $scanEval, []];
                }

                $status = $scanEval['status'];
                $isMidSession = ($scanEval['action'] === 'mid_session_verify');
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
                } elseif ($isMidSession) {
                    $attendance->update([
                        'mid_session_verified_at' => $now,
                        'scanned_at' => $now,
                    ]);
                } else {
                    $updateData = [
                        'status' => $status,
                        'scanned_at' => $now,
                        'checked_out_at' => $now,
                        'check_out_latitude' => $lat,
                        'check_out_longitude' => $lng,
                        'check_out_accuracy_m' => $accuracyM !== null ? (int) round((float) $accuracyM) : null,
                        'check_out_distance_m' => $distanceRounded,
                    ];
                    if (! empty($scanEval['is_flagged'])) {
                        $updateData['is_flagged'] = true;
                        $updateData['flagged_reason'] = $scanEval['flagged_reason'] ?? 'Dwell gap detected';
                    }
                    $attendance->update($updateData);
                }

                // Also record attendance for any conflicting schedule events the student is eligible for
                $conflictedScans = $this->conflictService->recordAttendanceForEligibleConflicts(
                    $event,
                    $student,
                    $now,
                    $isTimeOut ? 'check_out' : 'check_in',
                    $status,
                    [
                        'latitude' => $lat,
                        'longitude' => $lng,
                        'accuracy_m' => $accuracyM,
                        'distance_m' => $distanceRounded,
                    ],
                    $request
                );

                $event->updateAttendanceCounts();

                return [$attendance, $scanEval, $conflictedScans];
            });
        } catch (QueryException $qe) {
            // Gracefully handle duplicate key race condition
            $attendance = Attendance::query()
                ->where('event_id', $event->id)
                ->where('student_id', $student->id)
                ->first();

            if ($attendance) {
                return response()->json([
                    'message' => 'Attendance was already recorded for this event.',
                    'attendance_id' => $attendance->id,
                    'status' => $attendance->status,
                ], 409);
            }

            \Log::error('[AttendanceScannerService] Database error recording attendance: ' . $qe->getMessage(), ['exception' => $qe]);
            return response()->json(['message' => 'A database error occurred while recording attendance. Please try again.'], 500);
        }

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

        $this->evaluationGateService->triggerEvaluationNotification($student, $event);
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        try {
            app(\App\Services\RealtimeNotificationService::class)->broadcastAttendanceScan($event->id, [
                'action' => $scanEval['action'],
                'status' => $attendance->status,
                'scanned_at' => $now->toDateTimeString(),
                'time' => $now->format('h:i A'),
                'is_flagged' => (bool) ($attendance->is_flagged ?? false),
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'course' => $student->course ?? $student->program,
                    'year_level' => $student->year_level,
                ],
                'log' => [
                    'id' => (string) $attendance->id,
                    'student_id' => (string) $student->student_id,
                    'name' => (string) $student->name,
                    'program' => (string) ($student->course ?? $student->program ?? ''),
                    'course' => (string) ($student->course ?? $student->program ?? ''),
                    'year_level' => (string) ($student->year_level ?? ''),
                    'time' => $now->format('h:i A'),
                    'status' => $attendance->status,
                    'scanned' => true,
                    'action' => $scanEval['action'],
                ],
            ]);
        } catch (\Throwable) {}

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($scanner, 'Attendance', $isTimeOut ? 'Checked Out' : 'Checked In', "Recorded attendance for event #{$event->id} (status: {$status}, action: " . ($isTimeOut ? 'Time Out' : 'Time In') . ")", $request);
        }

        $cutoff = $scanEval['time_in_cutoff'] ?? null;
        $cutoffStr = ($cutoff instanceof \Carbon\CarbonInterface)
            ? ' (cut-off was ' . $cutoff->format('h:i A') . ', 1 hr after start)'
            : ' (cut-off was 1 hr after start)';

        $conflictedSuffix = '';
        if (! empty($conflictedScans)) {
            $names = array_column($conflictedScans, 'event_name');
            $conflictedSuffix = ' (Also scanned for conflicting schedule: ' . implode(', ', $names) . ')';
        }

        $checkInLabel = $status === 'late'
            ? 'Time-in (Check-in) recorded as LATE' . $cutoffStr . '.'
            : 'Time-in (Check-in) recorded successfully (On-Time).';

        $midSessionLabel = 'Mid-session in-venue presence verified successfully (Spot-Check Confirmed).';

        $checkOutLabel = $status === 'left_early'
            ? 'Time-out recorded: Early Departure (Left before official conclusion).'
            : ($attendance->is_flagged
                ? 'Time-out recorded with WARNING: Missing mid-session presence verification. Attendance flagged for administrative review.'
                : 'Time-out (Check-out) recorded successfully. Full attendance verified.');

        $finalMessage = $isMidSession ? $midSessionLabel : ($isTimeOut ? $checkOutLabel : $checkInLabel);

        return response()->json([
            'attendance_id' => $attendance->id,
            'status' => $attendance->status,
            'scanned_at' => $now->toDateTimeString(),
            'action' => $scanEval['action'],
            'is_flagged' => (bool) ($attendance->is_flagged ?? false),
            'flagged_reason' => $attendance->flagged_reason,
            'message' => $finalMessage . $conflictedSuffix,
            'conflicted_events_scanned' => $conflictedScans,
            'time_in' => optional($attendance->checked_in_at)->format('h:i A'),
            'time_out' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->format('h:i A') : null,
            'mid_session_verified_at' => $attendance->mid_session_verified_at ? optional($attendance->mid_session_verified_at)->format('h:i A') : null,
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
