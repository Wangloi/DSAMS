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

        if ($student->status !== 'approved') {
            abort(403, 'Your account is pending approval. Please wait for admin verification.');
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

        if ($scanner->status !== 'approved') {
            abort(403, 'Your account is pending approval.');
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

        if ($student->status !== 'approved') {
            return response()->json(['message' => 'Your account is pending approval.'], 403);
        }

        $courses = is_array($event->courses) ? $event->courses : [];
        $yearLevels = is_array($event->year_levels) ? $event->year_levels : [];
        $studentCourse = $student->course ?? $student->program;
        $studentYearLevel = $student->year_level;

        if ((! empty($courses) && ! in_array($studentCourse, $courses, true)) || (! empty($yearLevels) && ! in_array($studentYearLevel, $yearLevels, true))) {
            return response()->json(['message' => 'This event is not assigned to your course or year level.'], 403);
        }

        $validated = $request->validate([
            'token' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

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
        if ($existing && $existing->checked_out_at) {
            return response()->json(['message' => 'You have already checked out for this event.'], 409);
        }

        $now = Carbon::now();
        $status = 'present';

        if (! empty($event->registration_end_time)) {
            $eventDate = Carbon::parse($event->event_date);
            $cutoff = Carbon::parse($eventDate->format('Y-m-d') . ' ' . $event->registration_end_time);
            if ($now->greaterThan($cutoff)) {
                $status = 'late';
            }
        }

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
            $isTimeOut = false;
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
            $isTimeOut = true;
        }

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        return response()->json([
            'attendance_id' => $attendance->id,
            'status' => $attendance->status,
            'action' => $isTimeOut ? 'check_out' : 'check_in',
            'message' => $isTimeOut ? 'Time-out (Check-out) recorded successfully.' : 'Time-in (Check-in) recorded successfully.',
            'checked_in_at' => optional($attendance->checked_in_at)->toDateTimeString(),
            'checked_out_at' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->toDateTimeString() : null,
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->name,
                'program' => (string) ($student->course ?? $student->program ?? ''),
            ],
        ]);
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

        if ($student->status !== 'approved') {
            return response()->json(['message' => 'Your account is pending approval.'], 403);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'accuracy_m' => 'nullable|numeric',
        ]);

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

        $now = Carbon::now();
        $status = 'present';

        if (! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse(Carbon::parse($event->event_date)->format('Y-m-d') . ' ' . $event->registration_end_time);
            if ($now->greaterThan($cutoff)) {
                $status = 'late';
            }
        }

        $existing = Attendance::query()->where('event_id', $event->id)->where('student_id', $student->id)->first();
        $eventLat = (float) $event->geofence_latitude;
        $eventLng = (float) $event->geofence_longitude;
        $distanceRounded = (int) round($this->geofenceService->haversineDistanceMeters((float) $validated['latitude'], (float) $validated['longitude'], $eventLat, $eventLng));

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

            $event->updateAttendanceCounts();
            app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

            return response()->json([
                'success' => true,
                'message' => "Check-in successful! You are {$distanceRounded}m from the venue.",
                'type' => 'check_in',
                'status' => $status,
                'distance_m' => $distanceRounded,
                'checked_at' => $now->toDateTimeString(),
            ]);
        } elseif ($existing->checked_out_at) {
            return response()->json(['message' => 'You have already checked out for this event.'], 409);
        } else {
            $existing->update([
                'scanned_at' => $now,
                'checked_out_at' => $now,
                'check_out_latitude' => $validated['latitude'],
                'check_out_longitude' => $validated['longitude'],
                'check_out_accuracy_m' => isset($validated['accuracy_m']) ? (int) round((float) $validated['accuracy_m']) : null,
                'check_out_distance_m' => $distanceRounded,
            ]);

            $event->updateAttendanceCounts();

            return response()->json([
                'success' => true,
                'message' => "Check-out successful! You are {$distanceRounded}m from the venue.",
                'type' => 'check_out',
                'status' => $existing->status,
                'distance_m' => $distanceRounded,
                'checked_at' => $now->toDateTimeString(),
            ]);
        }
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
