<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Student;
use App\Notifications\EvaluationAvailable;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class StudentAttendanceController extends Controller
{
    private function recordAttendanceLog($user, string $action, string $details, ?Request $request = null): void
    {
        if (!Schema::hasTable('activity_logs')) {
            return;
        }

        ActivityLog::logForUser($user, 'Attendance', $action, $details, $request ?? request());

        if (in_array($action, ['Access Denied', 'Denied'])) {
            $blocked = \App\Services\SecurityMonitor::alertIfThresholdExceeded(
                'Attendance',
                $action,
                $user?->student_id ?? 'unknown',
                5,
                15,
                $request ?? request()
            );

            if ($blocked && ($request ?? request())->hasSession()) {
                $request->session()->put('scanner_blocked_until', now()->addSeconds(30)->toDateTimeString());
            }
        }
    }

    private function haversineDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function scannerPortal(Request $request, Event $event)
    {
        $student = auth()->guard('student')->user();

        if (! $student) {
            abort(403);
        }

        if ($student->status !== 'approved') {
            abort(403, 'Your account is pending approval. Please wait for admin verification.');
        }

        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        $studentCourse = $student->course ?? $student->program;
        $studentYearLevel = $student->year_level;

        $courseMatch = empty($courses) || in_array($studentCourse, $courses, true);
        $yearLevelMatch = empty($yearLevels) || in_array($studentYearLevel, $yearLevels, true);

        $allowed = $event->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }
        $legacyAllowed = (string) ($event->scanner_student_id ?? '');
        if ($legacyAllowed !== '' && ! in_array($legacyAllowed, $allowed, true)) {
            $allowed[] = $legacyAllowed;
        }

        $studentId = (string) ($student->student_id ?? '');
        $isManuallyAllowed = $studentId !== '' && in_array($studentId, $allowed, true);

        if (! $isManuallyAllowed && (! $courseMatch || ! $yearLevelMatch)) {
            abort(403);
        }

        if ((string) $event->status === 'completed') {
            if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }

            return redirect()
                ->route('student.dashboard')
                ->with('error', 'This event is already completed. Scanner portal is closed.')
                ->setStatusCode(303);
        }

        $isScannerPortalActive = true;
        if (Schema::hasColumn('events', 'scanner_portal_active')) {
            $isScannerPortalActive = (bool) $event->scanner_portal_active;
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && ! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse($event->event_date->format('Y-m-d').' '.$event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);
            if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
                $isScannerPortalActive = false;
            }
        }

        $initialLogRows = Attendance::query()
            ->with('student')
            ->where('event_id', $event->id)
            ->orderByDesc('scanned_at')
            ->limit(100)
            ->get()
            ->map(function (Attendance $attendance) {
                $student = $attendance->student;

                return [
                    'id' => (string) ($student?->student_id ?? $attendance->student_id),
                    'name' => (string) ($student?->name ?? ''),
                    'program' => (string) (($student?->course ?? $student?->program ?? '') ?: '—'),
                    'time' => optional($attendance->scanned_at)->format('h:i A') ?: '—',
                    'status' => 'valid',
                ];
            })
            ->values();

        $studentsByProgram = Student::query()
            ->selectRaw("COALESCE(NULLIF(TRIM(course), ''), NULLIF(TRIM(program), ''), '—') as program")
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw("COALESCE(NULLIF(TRIM(course), ''), NULLIF(TRIM(program), ''), '—')")
            ->pluck('total', 'program');

        $alerts = [];
        if (Schema::hasTable('activity_logs')) {
            $alerts = ActivityLog::query()
                ->where('module', 'Security Monitor')
                ->where('action', 'ALERT')
                ->where('ip_address', $request->ip())
                ->where('created_at', '>=', now()->subMinutes(30))
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'module', 'action', 'details', 'created_at', 'old_value', 'new_value'])
                ->map(function ($log) {
                    $old = $log->old_value ? json_decode($log->old_value, true) : null;
                    return [
                        'id' => $log->id,
                        'module' => $log->module,
                        'action' => $log->action,
                        'details' => $log->details,
                        'timestamp' => $log->created_at?->toDateTimeString(),
                        'recent_count' => $old['recent_count'] ?? null,
                        'window_minutes' => $old['window_minutes'] ?? null,
                    ];
                })
                ->values()
                ->all();
        }

        $alerts = [];
        if (Schema::hasTable('activity_logs')) {
            $alerts = ActivityLog::query()
                ->where('module', 'Security Monitor')
                ->where('action', 'ALERT')
                ->where('ip_address', $request->ip())
                ->where('created_at', '>=', now()->subMinutes(30))
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'module', 'action', 'details', 'created_at', 'old_value', 'new_value'])
                ->map(function ($log) {
                    $old = $log->old_value ? json_decode($log->old_value, true) : null;
                    return [
                        'id' => $log->id,
                        'module' => $log->module,
                        'action' => $log->action,
                        'details' => $log->details,
                        'timestamp' => $log->created_at?->toDateTimeString(),
                        'recent_count' => $old['recent_count'] ?? null,
                        'window_minutes' => $old['window_minutes'] ?? null,
                    ];
                })
                ->values()
                ->all();
        }

        return Inertia::render('student/attendance/scanner-portal', [
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
                'date' => optional($event->event_date)->format('Y-m-d'),
                'timeIn' => (string) ($event->event_time ?? ''),
                'timeEnd' => (string) ($event->registration_end_time ?? ''),
                'location' => $event->location,
                'scannerPortalActive' => $isScannerPortalActive,
            ],
            'initialLogRows' => $initialLogRows,
            'studentsByProgram' => $studentsByProgram,
            'securityAlerts' => $alerts,
            'scannerBlockedUntil' => $request->session()->get('scanner_blocked_until'),
        ]);
    }

    public function scanAttendance(Request $request, Event $event): JsonResponse
    {
        \Log::warning('[ScannerPortal][scanAttendance] entered', [
            'event_id' => $event->id,
            'event_name' => $event->event_name ?? null,
            'registration_end_time' => $event->registration_end_time,
            'app_timezone' => (string) config('app.timezone'),
            'now' => Carbon::now()->toDateTimeString(),
        ]);

        $scanner = auth()->guard('student')->user();


        if (! $scanner) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::log('Attendance', 'Access Denied', 'Scanner access denied: no authenticated student for event #' . $event->id, null, null, null, $request);
            }
            abort(403);
        }

        if ($scanner->status !== 'approved') {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Access Denied', 'Scanner denied: account not approved for event #' . $event->id, $request);
            }
            abort(403, 'Your account is pending approval. You cannot scan attendance.');
        }

        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        $scannerCourse = $scanner->course ?? $scanner->program;
        $scannerYearLevel = $scanner->year_level;

        $courseMatch = empty($courses) || in_array($scannerCourse, $courses, true);
        $yearLevelMatch = empty($yearLevels) || in_array($scannerYearLevel, $yearLevels, true);

        $allowed = $event->scanner_student_ids;
        if (! is_array($allowed)) {
            $allowed = [];
        }
        $legacyAllowed = (string) ($event->scanner_student_id ?? '');
        if ($legacyAllowed !== '' && ! in_array($legacyAllowed, $allowed, true)) {
            $allowed[] = $legacyAllowed;
        }

        $scannerStudentId = (string) ($scanner->student_id ?? '');
        $isManuallyAllowed = $scannerStudentId !== '' && in_array($scannerStudentId, $allowed, true);

        if (! $isManuallyAllowed && (! $courseMatch || ! $yearLevelMatch)) {
            abort(403);
        }

        if ((string) $event->status === 'completed') {
            if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }

            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Scan denied: event #' . $event->id . ' is completed.', $request);
            }

            return response()->json(['message' => 'This event is already completed. Scanner portal is closed.'], 403);
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && ! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse($event->event_date->format('Y-m-d').' '.$event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);
            if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && ! (bool) $event->scanner_portal_active) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Scan denied: scanner portal not active for event #' . $event->id, $request);
            }
            return response()->json(['message' => 'Scanner portal is not activated yet.'], 403);
        }

        $validated = $request->validate([
            'value' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

        $lat = $validated['latitude'] ?? null;
        $lng = $validated['longitude'] ?? null;
        $accuracyM = $validated['accuracy_m'] ?? null;

        if ((bool) ($event->geofence_enabled ?? false)) {
            if ($lat === null || $lng === null || $accuracyM === null) {
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Location missing for geofenced event #' . $event->id, $request);
                }
                return response()->json(['message' => 'Location is required to record attendance for this event.'], 422);
            }

            $accuracyM = (float) $accuracyM;
            if ($accuracyM > 50) {
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Location accuracy too low (' . $accuracyM . 'm) for event #' . $event->id, $request);
                }
                return response()->json(['message' => 'Location accuracy is too low. Please move to an open area and try again.'], 422);
            }

            $eventLat = $event->geofence_latitude;
            $eventLng = $event->geofence_longitude;
            $radius = (int) ($event->geofence_radius_m ?? 50);
            if ($eventLat === null || $eventLng === null) {
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Geofence not configured for event #' . $event->id, $request);
                }
                return response()->json(['message' => 'Event geofence is not configured. Please contact DSA.'], 422);
            }

            $distance = $this->haversineDistanceMeters((float) $lat, (float) $lng, (float) $eventLat, (float) $eventLng);
            if ($distance > $radius) {
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', 'Denied', "Geofence violation: {$distance}m from event #{$event->id} (radius: {$radius}m)", $request);
                }
                return response()->json(['message' => 'You are not within the event area. Please go near the event location to attend.'], 403);
            }
        }

        $rawValue = trim((string) $validated['value']);
        if ($rawValue === '') {
            return response()->json(['message' => 'Invalid QR value.'], 422);
        }

        $qrValue = $rawValue;
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
                    $studentKey = 'student_id';
                    $studentIdValue = trim((string) $qs['student_id']);
                } elseif (! empty($qs['id'])) {
                    $studentKey = 'id';
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

        $studentIdValue = trim((string) $studentIdValue);

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
            return response()->json(['message' => 'Student not found.'], 404);
        }

        // Self check-in rule: the scanned QR must belong to the currently authenticated student.
        // Prevents using another student's school ID QR / account to record attendance.
        // Determine the authenticated student's school ID field safely.
        // This guard must have a matching student_id to allow self check-in.
        $authenticatedStudentId = (string) ($scanner->student_id ?? '');

        if ($authenticatedStudentId === '' || (string) $student->student_id !== $authenticatedStudentId) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', "QR not owned: attempted to scan student '{$student->student_id}' but scanner is '{$authenticatedStudentId}' for event #{$event->id}", $request);
            }
            app(StudentNotificationDispatcher::class)->attendanceIssue(
                $event,
                $student,
                'Invalid self check-in: the scanned QR code does not belong to the currently logged-in student.',
                'qr_not_owned',
            );

            return response()->json([
                'message' => 'Invalid - This QR code does not belong to the currently logged-in student.',
            ], 403);
        }


        // Check evaluation requirement before allowing attendance
        $studentProgram = $student->course ?? $student->program;

        if ($studentProgram) {
            $pendingEvaluations = Evaluation::query()
                ->join('events', 'evaluations.event_id', '=', 'events.id')
                ->join('attendances', 'events.id', '=', 'attendances.event_id')
                ->where('attendances.student_id', $student->id)
                ->where('attendances.status', 'present')
                ->where('evaluations.is_active', true)
                ->where('evaluations.is_archived', false)
                ->where('events.event_date', '<', $event->event_date)
                ->whereRaw('LOWER(TRIM(events.organizer)) LIKE ?', ['%'.strtolower($studentProgram).'%'])
                ->whereNotExists(function ($query) use ($student) {
                    $query->select(\DB::raw(1))
                        ->from('evaluation_responses')
                        ->whereColumn('evaluation_responses.evaluation_id', 'evaluations.id')
                        ->where('evaluation_responses.student_id', $student->id);
                })
                ->exists();

            if ($pendingEvaluations) {
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
        }

        $now = Carbon::now();
        $status = 'present';

        if (! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse($event->event_date->format('Y-m-d').' '.$event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);

            \Log::warning('[ScannerPortal][scanAttendance] time check', [
                'now' => $now->toDateTimeString(),
                'app_timezone' => (string) config('app.timezone'),
                'event_date' => $event->event_date?->toDateString(),
                'registration_end_time' => $event->registration_end_time,
                'cutoff' => $cutoff->toDateTimeString(),
                'blockAt' => $blockAt->toDateTimeString(),
                'now_gte_blockAt' => $now->greaterThanOrEqualTo($blockAt),
                'scanner_portal_active' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : null,
                'event_status' => (string) ($event->status ?? ''),
            ]);

            if ($now->greaterThanOrEqualTo($blockAt)) {
                if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                    $event->update(['scanner_portal_active' => false]);
                }
                if (Schema::hasTable('activity_logs')) {
                    ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Scanning closed for event #' . $event->id . ' (blockAt: ' . $blockAt->toDateTimeString() . ')', $request);
                }
                app(StudentNotificationDispatcher::class)->attendanceIssue(
                    $event,
                    $student,
                    'Attendance scanning for '.(string) $event->event_name.' is already closed.',
                    'scanner_closed',
                );

                return response()->json([
                    'message' => 'Scanning is disabled 30 minutes after the registration end time.',
                ], 403);
            }


            if ($now->greaterThan($cutoff)) {
                $status = 'late';
            }
        }

        $attendance = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->first();

        $eventLat = $event->geofence_latitude;
        $eventLng = $event->geofence_longitude;
        $distanceRounded = null;
        if ((bool) ($event->geofence_enabled ?? false) && $lat !== null && $lng !== null && $eventLat !== null && $eventLng !== null) {
            $distanceRounded = (int) round($this->haversineDistanceMeters((float) $lat, (float) $lng, (float) $eventLat, (float) $eventLng));
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
        } elseif ($attendance->checked_out_at) {
            if (Schema::hasTable('activity_logs')) {
                ActivityLog::logForUser($scanner, 'Attendance', 'Denied', 'Already checked out for event #' . $event->id, $request);
            }
            app(StudentNotificationDispatcher::class)->attendanceIssue(
                $event,
                $student,
                'A scanner attempted another attendance scan after you had already checked out.',
                'already_checked_out',
            );

            return response()->json(['message' => 'You have already checked out for this event.'], 409);
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

        if (Schema::hasTable('evaluations') && Schema::hasTable('notifications')) {
            /** @var \App\Models\Evaluation|null $evaluation */
            $evaluation = Evaluation::query()
                ->where('event_id', $event->id)
                ->where('is_active', true)
                ->where('is_archived', false)
                ->orderByDesc('id')
                ->first();

            if ($evaluation && Schema::hasTable('evaluation_responses')) {
                $alreadySubmitted = EvaluationResponse::query()
                    ->where('evaluation_id', $evaluation->id)
                    ->where('student_id', $student->id)
                    ->exists();

                if (! $alreadySubmitted) {
                    $alreadyNotified = $student
                        ->notifications()
                        ->where('data->type', 'evaluation_available')
                        ->where('data->evaluation_id', $evaluation->id)
                        ->exists();

                    if (! $alreadyNotified) {
                        $student->notify(new EvaluationAvailable($evaluation));
                    }
                }
            }
        }

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($scanner, 'Attendance', $attendance->checked_out_at ? 'Checked Out' : 'Checked In', "Recorded attendance for event #{$event->id} (status: {$status})", $request);
        }

        return response()->json([
            'attendance_id' => $attendance->id,
            'status' => $status,
            'scanned_at' => $now->toDateTimeString(),
            'action' => $attendance->checked_out_at ? 'check_out' : 'check_in',
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->name,
                'program' => (string) ($student->course ?? $student->program ?? ''),
            ],
        ]);
    }
}
