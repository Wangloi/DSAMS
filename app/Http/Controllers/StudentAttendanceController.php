<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
use App\Services\Attendance\AttendanceScannerService;
use App\Services\Attendance\AttendanceStatsService;
use App\Services\Attendance\EvaluationGateService;
use App\Services\Attendance\GeofenceValidationService;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentAttendanceController extends Controller
{
    public function __construct(
        protected AttendanceScannerService $scannerService,
        protected AttendanceStatsService $statsService,
        protected GeofenceValidationService $geofenceService,
        protected EvaluationGateService $evaluationGateService
    ) {}

    /**
     * Render the student scanner portal.
     */
    public function scannerPortal(Request $request, Event $event): Response|RedirectResponse
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student) {
            abort(403);
        }

        if ($student->status === 'rejected' || $student->verification_status === 'rejected') {
            abort(403, 'Your account has been rejected. Please contact admin.');
        }

        if (! $this->scannerService->isAssignedScanner($student, $event)) {
            return redirect()
                ->route('student.dashboard')
                ->with('error', 'Access Denied: You are not an assigned scanner for "' . ($event->event_name ?? 'this event') . '".')
                ->setStatusCode(303);
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

        $initialLogRows = $this->statsService->getRecentLogs($event);
        $studentsByProgram = $this->statsService->getStudentsByProgram($event);
        $alerts = $this->getSecurityAlerts($request);

        $conflicts = $event->getConflictingEvents()->map(fn (Event $ce) => [
            'id' => (string) $ce->id,
            'name' => (string) ($ce->event_name ?? ''),
            'date' => optional($ce->event_date)->format('Y-m-d') ?: '',
            'timeIn' => (string) ($ce->event_time ?? ''),
            'timeEnd' => (string) ($ce->registration_end_time ?? ''),
            'location' => (string) ($ce->location ?? ''),
        ])->all();

        return Inertia::render('student/attendance/scanner-portal', [
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
                'date' => optional($event->event_date)->format('Y-m-d'),
                'timeIn' => (string) ($event->event_time ?? ''),
                'timeEnd' => (string) ($event->registration_end_time ?? ''),
                'location' => $event->location,
                'scannerPortalActive' => true,
                'geofence_enabled' => (bool) ($event->geofence_enabled ?? false),
                'geofence_latitude' => $event->geofence_latitude,
                'geofence_longitude' => $event->geofence_longitude,
                'geofence_radius_m' => (int) ($event->geofence_radius_m ?? 50),
            ],
            'conflictingEvents' => $conflicts,
            'initialLogRows' => $initialLogRows,
            'studentsByProgram' => $studentsByProgram,
            'securityAlerts' => $alerts,
            'scannerBlockedUntil' => $request->session()->get('scanner_blocked_until'),
        ]);
    }

    /**
     * Process scanned QR code from authorized student scanner.
     */
    public function scanAttendance(Request $request, Event $event): JsonResponse
    {
        /** @var Student|null $scanner */
        $scanner = auth()->guard('student')->user();

        if (! $scanner) {
            abort(403);
        }

        if ($scanner->status === 'rejected' || $scanner->verification_status === 'rejected') {
            abort(403, 'Your account has been rejected.');
        }

        if (! $this->scannerService->isAssignedScanner($scanner, $event)) {
            return response()->json(['message' => 'Unauthorized scanner.'], 403);
        }

        $validated = $request->validate([
            'value' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

        return $this->scannerService->processScan($event, $scanner, $validated, $request);
    }

    /**
     * Dynamic QR Scan (Attendee scans the rotating projector QR).
     */
    public function dynamicQrScan(Request $request, Event $event): JsonResponse
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student) {
            return response()->json(['message' => 'Unauthorized student account.'], 403);
        }

        if ($student->status === 'rejected' || $student->verification_status === 'rejected') {
            return response()->json(['message' => 'Your account has been rejected.'], 403);
        }

        $validated = $request->validate([
            'token' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

        $conflictService = app(\App\Services\Attendance\ConflictAttendanceService::class);
        $isEligible = $this->isStudentEligible($student, $event);

        if (! $isEligible) {
            $conflictResult = $conflictService->scanConflictingEventIfPrimaryIneligible($event, $student, Carbon::now(), [
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'accuracy_m' => $validated['accuracy_m'] ?? null,
                'token_id' => $validated['token'] ?? null,
                'user_agent' => $request->userAgent(),
            ], $request);

            if ($conflictResult) {
                $primaryConflict = $conflictResult['primary']['event'];
                $primaryAtt = $conflictResult['primary']['attendance'];
                $scanEval = $conflictResult['primary']['scanEval'];
                $status = $primaryAtt->status;
                $isTimeOut = ($scanEval['action'] === 'check_out');

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
                    'status' => $primaryAtt->status ?? $status,
                    'action' => $isTimeOut ? 'check_out' : 'check_in',
                    'message' => ($isTimeOut ? 'Time-out (Check-out) recorded' : 'Time-in (Check-in) recorded') . " for conflicting schedule '{$primaryConflict->event_name}' (Student is registered for this conflicting schedule).",
                    'conflicted_events_scanned' => $allConflictedScans,
                    'checked_in_at' => optional($primaryAtt->checked_in_at)->toDateTimeString(),
                    'checked_out_at' => $primaryAtt->checked_out_at ? optional($primaryAtt->checked_out_at)->toDateTimeString() : null,
                    'student' => [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'name' => $student->name,
                        'program' => (string) ($student->course ?? $student->program ?? ''),
                    ],
                ]);
            }

            return response()->json(['message' => 'This event is not assigned to your course or year level.'], 403);
        }

        try {
            // Dynamic QR Token Security & Expiration Check
            $tokenData = DynamicAttendanceQrController::tokenData($validated['token']);
            if (! $tokenData || (int) ($tokenData['event_id'] ?? 0) !== (int) $event->id) {
                return response()->json([
                    'message' => 'The dynamic QR code is invalid or has expired. Please scan the live QR code currently displayed on the screen.',
                ], 422);
            }

            // Geofence check
            $geoError = $this->geofenceService->validate($event, $validated['latitude'] ?? null, $validated['longitude'] ?? null, $validated['accuracy_m'] ?? null);
            if ($geoError) {
                return response()->json($geoError, $geoError['status']);
            }

            // Pending evaluations check
            if ($this->evaluationGateService->hasPendingEvaluations($student, $event)) {
                return response()->json([
                    'message' => 'You must complete evaluations for previous events before attending this one.',
                    'requires_evaluation' => true,
                ], 422);
            }

            $existing = Attendance::query()->where('event_id', $event->id)->where('student_id', $student->id)->first();
            $now = Carbon::now();

            $scanEval = $event->evaluateAttendanceScan($now, $existing);
            if (! $scanEval['allowed']) {
                return response()->json([
                    'message' => $scanEval['error_message'],
                ], $scanEval['status_code']);
            }

            $status = $scanEval['status'];
            $isTimeOut = ($scanEval['action'] === 'check_out');

            $eventLat = $event->geofence_latitude;
            $eventLng = $event->geofence_longitude;
            $distanceRounded = null;
            if ((bool) ($event->geofence_enabled ?? false) && isset($validated['latitude'], $validated['longitude']) && $eventLat !== null && $eventLng !== null) {
                $distanceRounded = (int) round($this->geofenceService->haversineDistanceMeters((float) $validated['latitude'], (float) $validated['longitude'], (float) $eventLat, (float) $eventLng));
            }

            if (! $existing) {
                $attendance = Attendance::create([
                    'event_id' => $event->id,
                    'student_id' => $student->id,
                    'scanned_at' => $now,
                    'status' => $status,
                    'checked_in_at' => $now,
                    'check_in_latitude' => $validated['latitude'] ?? null,
                    'check_in_longitude' => $validated['longitude'] ?? null,
                    'check_in_accuracy_m' => isset($validated['accuracy_m']) ? (int) round((float) $validated['accuracy_m']) : null,
                    'check_in_distance_m' => $distanceRounded,
                    'check_in_token_id' => $validated['token'],
                    'check_in_user_agent' => $request->userAgent(),
                ]);
            } else {
                $existing->update([
                    'scanned_at' => $now,
                    'checked_out_at' => $now,
                    'check_out_latitude' => $validated['latitude'] ?? null,
                    'check_out_longitude' => $validated['longitude'] ?? null,
                    'check_out_accuracy_m' => isset($validated['accuracy_m']) ? (int) round((float) $validated['accuracy_m']) : null,
                    'check_out_distance_m' => $distanceRounded,
                    'check_out_token_id' => $validated['token'],
                    'check_out_user_agent' => $request->userAgent(),
                ]);
                $attendance = $existing;
            }

            // Also record attendance for any conflicting schedule events the student is eligible for
            $conflictedScans = $conflictService->recordAttendanceForEligibleConflicts(
                $event,
                $student,
                $now,
                $isTimeOut ? 'check_out' : 'check_in',
                $status,
                [
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'accuracy_m' => $validated['accuracy_m'] ?? null,
                    'distance_m' => $distanceRounded,
                    'token_id' => $validated['token'],
                    'user_agent' => $request->userAgent(),
                ],
                $request
            );

            $event->updateAttendanceCounts();
            try {
                app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);
            } catch (\Throwable) {}

            $conflictedSuffix = '';
            if (! empty($conflictedScans)) {
                $names = array_column($conflictedScans, 'event_name');
                $conflictedSuffix = ' (Also scanned for conflicting schedule: ' . implode(', ', $names) . ')';
            }

            $checkInLabel = $status === 'late'
                ? 'Time-in (Check-in) recorded as LATE.'
                : 'Time-in (Check-in) recorded successfully (On-Time).';

            return response()->json([
                'attendance_id' => $attendance->id,
                'status' => $attendance->status,
                'action' => $isTimeOut ? 'check_out' : 'check_in',
                'message' => ($isTimeOut ? 'Time-out (Check-out) recorded successfully.' : $checkInLabel) . $conflictedSuffix,
                'conflicted_events_scanned' => $conflictedScans,
                'checked_in_at' => optional($attendance->checked_in_at)->toDateTimeString(),
                'checked_out_at' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->toDateTimeString() : null,
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'program' => (string) ($student->course ?? $student->program ?? ''),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Dynamic QR scan error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Attendance error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Direct GPS Location Check-In / Check-Out for geofenced events.
     */
    public function directGeofenceCheckin(Request $request, Event $event): JsonResponse
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student) {
            return response()->json(['message' => 'Unauthorized student account.'], 403);
        }

        if ($student->status === 'rejected' || $student->verification_status === 'rejected') {
            return response()->json(['message' => 'Your account has been rejected.'], 403);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

        $conflictService = app(\App\Services\Attendance\ConflictAttendanceService::class);
        $isEligible = $this->isStudentEligible($student, $event);

        if (! $isEligible) {
            $conflictResult = $conflictService->scanConflictingEventIfPrimaryIneligible($event, $student, Carbon::now(), [
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'accuracy_m' => $validated['accuracy_m'] ?? null,
                'user_agent' => $request->userAgent(),
            ], $request);

            if ($conflictResult) {
                $primaryConflict = $conflictResult['primary']['event'];
                $primaryAtt = $conflictResult['primary']['attendance'];
                $scanEval = $conflictResult['primary']['scanEval'];
                $status = $primaryAtt->status;
                $isTimeOut = ($scanEval['action'] === 'check_out');

                return response()->json([
                    'success' => true,
                    'message' => ($isTimeOut ? 'Check-out successful' : 'Check-in successful') . " for conflicting schedule '{$primaryConflict->event_name}'.",
                    'type' => $isTimeOut ? 'check_out' : 'check_in',
                    'status' => $status,
                    'checked_at' => Carbon::now()->toDateTimeString(),
                    'conflicted_events_scanned' => array_merge([
                        [
                            'event_id' => $primaryConflict->id,
                            'event_name' => $primaryConflict->event_name,
                            'action' => $isTimeOut ? 'check_out' : 'check_in',
                            'status' => $status,
                            'time' => Carbon::now()->format('h:i A'),
                        ]
                    ], $conflictResult['additional_conflicts'] ?? []),
                ]);
            }

            return response()->json(['message' => 'This event is not assigned to your course or year level.'], 403);
        }

        try {
            $geoError = $this->geofenceService->validate($event, (float) $validated['latitude'], (float) $validated['longitude'], isset($validated['accuracy_m']) ? (float) $validated['accuracy_m'] : null);
            if ($geoError) {
                return response()->json($geoError, $geoError['status']);
            }

            if ($this->evaluationGateService->hasPendingEvaluations($student, $event)) {
                return response()->json([
                    'message' => 'You must complete evaluations for previous events before attending this one.',
                    'requires_evaluation' => true,
                ], 422);
            }

            $existing = Attendance::query()->where('event_id', $event->id)->where('student_id', $student->id)->first();
            $now = Carbon::now();

            $scanEval = $event->evaluateAttendanceScan($now, $existing);
            if (! $scanEval['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $scanEval['error_message'],
                ], $scanEval['status_code']);
            }

            $status = $scanEval['status'];
            $isTimeOut = ($scanEval['action'] === 'check_out');

            $eventLat = $event->geofence_latitude ?? config('geofence.campus_latitude', 8.743070);
            $eventLng = $event->geofence_longitude ?? config('geofence.campus_longitude', 124.774500);
            $distanceRounded = (int) round($this->geofenceService->haversineDistanceMeters((float) $validated['latitude'], (float) $validated['longitude'], (float) $eventLat, (float) $eventLng));
            $allowedRadius = (int) ($event->geofence_radius_m ?? 50);

            if (! $existing) {
                $attendance = Attendance::create([
                    'event_id' => $event->id,
                    'student_id' => $student->id,
                    'scanned_at' => $now,
                    'status' => $status,
                    'checked_in_at' => $now,
                    'check_in_latitude' => $validated['latitude'],
                    'check_in_longitude' => $validated['longitude'],
                    'check_in_accuracy_m' => isset($validated['accuracy_m']) ? (int) round((float) $validated['accuracy_m']) : null,
                    'check_in_distance_m' => $distanceRounded,
                    'check_in_user_agent' => $request->userAgent(),
                ]);

                // Also record for eligible conflicting schedule events
                $conflictedScans = $conflictService->recordAttendanceForEligibleConflicts(
                    $event,
                    $student,
                    $now,
                    'check_in',
                    $status,
                    [
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                        'accuracy_m' => $validated['accuracy_m'] ?? null,
                        'distance_m' => $distanceRounded,
                        'user_agent' => $request->userAgent(),
                    ],
                    $request
                );

                $event->updateAttendanceCounts();
                try {
                    app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);
                } catch (\Throwable) {}

                $conflictedSuffix = '';
                if (! empty($conflictedScans)) {
                    $names = array_column($conflictedScans, 'event_name');
                    $conflictedSuffix = ' (Also recorded for conflicting schedule: ' . implode(', ', $names) . ')';
                }

                $checkInMsg = $status === 'late'
                    ? "Check-in successful (Late Arrival)! You are {$distanceRounded}m from the venue." . $conflictedSuffix
                    : "Check-in successful! You are {$distanceRounded}m from the venue." . $conflictedSuffix;

                return response()->json([
                    'success' => true,
                    'message' => $checkInMsg,
                    'type' => 'check_in',
                    'status' => $status,
                    'distance_m' => $distanceRounded,
                    'allowed_radius_m' => $allowedRadius,
                    'checked_at' => $now->toDateTimeString(),
                    'conflicted_events_scanned' => $conflictedScans,
                ]);
            } else {
                $existing->update([
                    'scanned_at' => $now,
                    'checked_out_at' => $now,
                    'check_out_latitude' => $validated['latitude'],
                    'check_out_longitude' => $validated['longitude'],
                    'check_out_accuracy_m' => isset($validated['accuracy_m']) ? (int) round((float) $validated['accuracy_m']) : null,
                    'check_out_distance_m' => $distanceRounded,
                ]);

                // Also record checkout for eligible conflicting schedule events
                $conflictedScans = $conflictService->recordAttendanceForEligibleConflicts(
                    $event,
                    $student,
                    $now,
                    'check_out',
                    $status,
                    [
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                        'accuracy_m' => $validated['accuracy_m'] ?? null,
                        'distance_m' => $distanceRounded,
                        'user_agent' => $request->userAgent(),
                    ],
                    $request
                );

                $event->updateAttendanceCounts();

                $conflictedSuffix = '';
                if (! empty($conflictedScans)) {
                    $names = array_column($conflictedScans, 'event_name');
                    $conflictedSuffix = ' (Also recorded for conflicting schedule: ' . implode(', ', $names) . ')';
                }

                return response()->json([
                    'success' => true,
                    'message' => "Check-out successful! You are {$distanceRounded}m from the venue." . $conflictedSuffix,
                    'type' => 'check_out',
                    'status' => $existing->status,
                    'distance_m' => $distanceRounded,
                    'allowed_radius_m' => $allowedRadius,
                    'checked_at' => $now->toDateTimeString(),
                    'conflicted_events_scanned' => $conflictedScans,
                ]);
            }
        } catch (\Throwable $e) {
            \Log::error('Direct geofence checkin error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Attendance error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Determine if a student is eligible for an event based on courses and year levels.
     */
    protected function isStudentEligible(Student $student, Event $event): bool
    {
        return \App\Services\Attendance\EventEligibilityService::isStudentEligible($student, $event);
    }

    /**
     * Provide real-time logs and statistics for the student scanner portal.
     */
    public function logs(Request $request, Event $event): JsonResponse
    {
        /** @var Student|null $student */
        $student = auth()->guard('student')->user();

        if (! $student || $student->status !== 'approved') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (! $this->scannerService->isAssignedScanner($student, $event)) {
            return response()->json(['message' => 'Access Denied'], 403);
        }

        $limit = min(max((int) $request->query('limit', 100), 1), 500);

        return response()->json([
            'rows' => $this->statsService->getRecentLogs($event, $limit),
            'counts' => [
                'total' => Attendance::query()->where('event_id', $event->id)->count(),
                'present' => Attendance::query()->where('event_id', $event->id)->where('status', 'present')->count(),
                'late' => Attendance::query()->where('event_id', $event->id)->where('status', 'late')->count(),
            ],
            'byCourse' => $this->statsService->getCourseBreakdown($event),
            'studentsByProgram' => $this->statsService->getStudentsByProgram($event),
            'server_time' => now()->format('M d, Y h:i:s A'),
            'scanner_portal_active' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true,
        ]);
    }

    private function getSecurityAlerts(Request $request): array
    {
        if (! Schema::hasTable('activity_logs')) {
            return [];
        }

        return ActivityLog::query()
            ->where('module', 'Security Monitor')
            ->where('action', 'ALERT')
            ->where('ip_address', $request->ip())
            ->where('created_at', '>=', now()->subMinutes(30))
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'module', 'action', 'details', 'created_at'])
            ->map(function ($log) {
                return [
                    'id' => (string) $log->id,
                    'module' => (string) $log->module,
                    'action' => (string) $log->action,
                    'details' => (string) $log->details,
                    'created_at' => $log->created_at ? $log->created_at->toDateTimeString() : '',
                ];
            })
            ->all();
    }
}
