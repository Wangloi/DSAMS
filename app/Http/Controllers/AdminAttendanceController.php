<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
// Student notification dispatcher
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminAttendanceController extends Controller
{
    public function index()
    {
        try {
            // Get only active (non-archived) events with search and filter parameters
            $eventModels = Event::query()
                ->active() // Only show non-archived events
                ->withCount('attendances') // Load attendance count
                ->when(request('search'), function ($query, $search) {
                    $query->search($search);
                })
                ->when(request('start_date') && request('end_date'), function ($query) {
                    $query->dateRange(request('start_date'), request('end_date'));
                })
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc')
                ->get();

            $eventIds = $eventModels->pluck('id')->all();

            $lateByEventId = collect();
            if (count($eventIds) > 0 && Schema::hasTable('attendances')) {
                $lateByEventId = Attendance::query()
                    ->whereIn('event_id', $eventIds)
                    ->where('status', 'late')
                    ->groupBy('event_id')
                    ->selectRaw('event_id, COUNT(*) as late_count')
                    ->pluck('late_count', 'event_id');
            }

            $totalLate = (int) $lateByEventId->sum();

            $events = $eventModels->map(function (Event $event) use ($lateByEventId) {
                $scannerPortalActive = true;
                if (Schema::hasColumn('events', 'scanner_portal_active')) {
                    $scannerPortalActive = (bool) $event->scanner_portal_active;
                }

                // Update attendance counts if they're out of sync
                if ($event->total_attendees !== $event->attendances_count) {
                    $event->updateAttendanceCounts();
                }

                $eligibleStudentsCount = $event->eligibleStudentsCount();
                $expectedAttendees = (int) ($event->expected_attendees ?? 0);
                $attendanceDenominator = $event->attendanceCapacity();
                $scannedCount = (int) $event->attendances_count;

                return [
                    'id' => $event->id,
                    'event' => $event->event_name,
                    'dateTime' => $event->date_time,
                    'organizer' => $event->organizer,
                    'totalAttendees' => $attendanceDenominator,
                    'presentCount' => $event->present_count,
                    'scannedCount' => $scannedCount,
                    'lateCount' => (int) ($lateByEventId[$event->id] ?? 0),
                    'eligibleStudentsCount' => $eligibleStudentsCount,
                    'expectedAttendees' => $expectedAttendees,
                    'attendanceDenominator' => $attendanceDenominator,
                    'status' => $event->status,
                    'location' => $event->location,
                    'event_time' => $event->event_time,
                    'registration_end_time' => $event->registration_end_time,
                    'registrationEndTime' => $event->registration_end_time,
                    'scannerStudentIds' => $event->scanner_student_ids ?? [],
                    'scannerPortalActive' => $scannerPortalActive,
                    'courses' => $event->courses || [],
                    'year_levels' => $event->year_levels || [],
                    'geofenceEnabled' => (bool) ($event->geofence_enabled ?? false),
                    'geofenceLatitude' => $event->geofence_latitude,
                    'geofenceLongitude' => $event->geofence_longitude,
                    'geofenceRadiusM' => (int) ($event->geofence_radius_m ?? 50),
                    'attendance_type' => $event->attendance_type ?? 'qr_scanner',
                ];
            });

            // Calculate statistics (total = check-ins; rate vs target capacity per event)
            $totalEvents = $events->count();
            $totalAttendees = (int) $events->sum('scannedCount');
            $avgAttendanceRate = $totalEvents > 0
                ? (int) round($events->sum(function ($event) {
                    $cap = (int) ($event['attendanceDenominator'] ?? 0);
                    $scanned = (int) ($event['scannedCount'] ?? 0);

                    return $cap > 0 ? ($scanned / $cap) * 100 : 0;
                }) / $totalEvents)
                : 0;

            $courses = $this->getCoursesList();
            $yearLevels = $this->getYearLevelsList();
            $totalStudents = Student::query()->count();
            $studentCountsByCourseYear = $this->getStudentCountsByCourseYear();

            return Inertia::render('admin-dashboard/attendance/index', [
                'events' => $events,
                'stats' => [
                    'totalEvents' => $totalEvents,
                    'totalAttendees' => $totalAttendees,
                    'avgAttendanceRate' => $avgAttendanceRate,
                    'totalLate' => $totalLate,
                ],
                'courses' => $courses,
                'yearLevels' => $yearLevels,
                'totalStudents' => $totalStudents,
                'studentCountsByCourseYear' => $studentCountsByCourseYear,
                'announcements' => [],
            ]);
        } catch (\Exception $e) {
            // Return empty data if there's an error
            return Inertia::render('admin-dashboard/attendance/index', [
                'events' => [],
                'stats' => [
                    'totalEvents' => 0,
                    'totalAttendees' => 0,
                    'avgAttendanceRate' => 0,
                    'totalLate' => 0,
                ],
                'courses' => [],
                'yearLevels' => [],
                'totalStudents' => 0,
                'studentCountsByCourseYear' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getCoursesList(): array
    {
        return Student::distinct('course')
            ->whereNotNull('course')
            ->pluck('course')
            ->map(function ($course) {
                return [
                    'id' => $course,
                    'name' => $course,
                    'code' => $course,
                ];
            })
            ->values()
            ->all();
    }

    private function getYearLevelsList(): array
    {
        return Student::distinct('year_level')
            ->whereNotNull('year_level')
            ->pluck('year_level')
            ->sortBy(function ($yearLevel) {
                if (! is_string($yearLevel)) {
                    return 999;
                }

                if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                    return (int) $matches[1];
                }

                return 999;
            })
            ->values()
            ->map(function ($yearLevel) {
                return [
                    'id' => $yearLevel,
                    'name' => $yearLevel,
                    'code' => $yearLevel,
                ];
            })
            ->all();
    }

    private function getStudentCountsByCourseYear(): array
    {
        return Student::query()
            ->select('course', 'year_level', DB::raw('COUNT(*) as total'))
            ->groupBy('course', 'year_level')
            ->get()
            ->toArray();
    }

    private function calculateExpectedAttendees(array $courses = [], array $yearLevels = []): int
    {
        return Event::make([
            'courses' => $courses,
            'year_levels' => $yearLevels,
        ])->eligibleStudentsCount();
    }

    public function activateScannerPortal(Request $request, Event $event): RedirectResponse
    {
        if (Schema::hasColumn('events', 'scanner_portal_active')) {
            $event->update(['scanner_portal_active' => true]);
        }

        $scannerStudentIds = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];
        $dispatcher = app(StudentNotificationDispatcher::class);

        // 1) Notify specific scanner assignees (existing behavior)
        $dispatcher->scannerAccessGranted($event, $scannerStudentIds);

        // 2) Notify ALL eligible students for this event's selected courses + year levels
        $dispatcher->attendanceScannerAvailable($event);

        return redirect()->route('admin.attendance')->with('success', 'Scanner portal activated.')->setStatusCode(303);
    }


    public function logs(Request $request, Event $event): JsonResponse
    {
        if (Schema::hasColumn('events', 'scanner_portal_active') && ! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse(Carbon::parse($event->event_date)->format('Y-m-d').' '.$event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);
            if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }
        }

        $limit = $request->has('limit') ? (int) $request->query('limit') : 2000;
        if ($limit < 1) {
            $limit = 1;
        }
        if ($limit > 2000) {
            $limit = 2000;
        }

        $rows = $this->getLogsAttendanceRows($event, $limit);
        $byCourse = $this->getLogsCourseBreakdown($event);

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
            ],
            'scanner_portal_active' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true,
            'counts' => [
                'total' => (int) count($rows),
                'present' => (int) Attendance::query()->where('event_id', $event->id)->where('status', 'present')->count(),
                'late' => (int) Attendance::query()->where('event_id', $event->id)->where('status', 'late')->count(),
            ],
            'byCourse' => $byCourse,
            'rows' => $rows,
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    /**
     * @return array{allStudents: \Illuminate\Support\Collection, attendances: \Illuminate\Support\Collection}
     */
    private function getEventStudentsAndAttendances(Event $event): array
    {
        $eventCourses = is_array($event->courses) ? array_values(array_filter($event->courses, fn($c) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $c))) : [];
        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        // Query eligible students for this event
        $studentsQuery = Student::query();
        if (Schema::hasColumn('students', 'status')) {
            $studentsQuery->where(function ($q) {
                $q->where('status', 'approved')->orWhereNull('status');
            });
        }
        if (Schema::hasColumn('students', 'is_archived')) {
            $studentsQuery->where(function ($q) {
                $q->where('is_archived', false)->orWhereNull('is_archived');
            });
        }
        if (!empty($eventCourses)) {
            $studentsQuery->whereIn('course', $eventCourses);
        }
        if (!empty($eventYearLevels)) {
            $studentsQuery->whereIn('year_level', $eventYearLevels);
        }

        $eligibleStudents = $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $attendances = Attendance::where('event_id', $event->id)
            ->with('student')
            ->get()
            ->keyBy('student_id');

        $allStudents = $eligibleStudents;
        if ($allStudents->isEmpty()) {
            $allStudents = $attendances->map(fn($a) => $a->student)->filter()->values();
        } else {
            $attendedStudents = $attendances->map(fn($a) => $a->student)->filter();
            $allStudents = $allStudents->merge($attendedStudents)->unique('id')->values();
        }

        return [
            'allStudents' => $allStudents,
            'attendances' => $attendances,
        ];
    }

    private function getLogsAttendanceRows(Event $event, int $limit): array
    {
        $data = $this->getEventStudentsAndAttendances($event);
        $allStudents = $data['allStudents'];
        $attendances = $data['attendances'];

        return $allStudents
            ->map(function ($student) use ($attendances) {
                $att = $attendances->get($student->id);
                $hasScanned = ($att !== null && ($att->checked_in_at !== null || $att->scanned_at !== null));
                $timeCarbon = $att ? ($att->checked_in_at ?? $att->scanned_at) : null;

                $fullName = trim((string) ($student->name ?? ''));
                if (!empty($student->last_name) || !empty($student->first_name)) {
                    $fullName = trim(($student->last_name ?? '') . ', ' . ($student->first_name ?? '') . ' ' . ($student->middle_name ?? ''));
                }

                $status = $hasScanned ? ucfirst((string) ($att->status ?? 'present')) : 'Absent';

                return [
                    'id' => (string) ($att?->id ?? $student->id),
                    'student_id' => (string) ($student->student_id ?? '—'),
                    'name' => $fullName ?: (string) ($student->name ?? '—'),
                    'program' => (string) (($student->course ?? $student->program ?? '') ?: '—'),
                    'year_level' => (string) ($student->year_level ?? '—'),
                    'checked_in_at' => $timeCarbon ? optional($timeCarbon)->toDateTimeString() : null,
                    'checked_out_at' => ($att && $att->checked_out_at) ? optional($att->checked_out_at)->toDateTimeString() : null,
                    'time' => $timeCarbon ? optional($timeCarbon)->format('g:i A') : '—',
                    'time_out' => ($att && $att->checked_out_at) ? optional($att->checked_out_at)->format('g:i A') : '—',
                    'status' => $status,
                    'is_absent' => !$hasScanned,
                ];
            })
            ->sortBy('name')
            ->values()
            ->take($limit)
            ->all();
    }

    private function getLogsCourseBreakdown(Event $event): array
    {
        $eventCourses = $event->courses ?? [];
        $eventYearLevels = $event->year_levels ?? [];

        $expectedStudentsQuery = Student::query();
        if (! empty($eventCourses)) {
            $expectedStudentsQuery->whereIn('course', $eventCourses);
        }
        if (! empty($eventYearLevels)) {
            $expectedStudentsQuery->whereIn('year_level', $eventYearLevels);
        }

        $expectedByCourse = $expectedStudentsQuery
            ->selectRaw("COALESCE(NULLIF(TRIM(course), ''), '—') as program, COUNT(*) as total")
            ->groupBy('program')
            ->pluck('total', 'program');

        $scannedByCourse = Attendance::query()
            ->where('event_id', $event->id)
            ->where(function ($q) {
                $q->whereNotNull('checked_in_at')
                    ->orWhereNotNull('scanned_at');
            })
            ->whereHas('student', function ($q) use ($eventCourses, $eventYearLevels) {
                if (! empty($eventCourses)) {
                    $q->whereIn('course', $eventCourses);
                }
                if (! empty($eventYearLevels)) {
                    $q->whereIn('year_level', $eventYearLevels);
                }
            })
            ->get()
            ->groupBy(function (Attendance $attendance) {
                $student = $attendance->student;

                return (string) (($student?->course ?? '') ?: '—');
            })
            ->map(fn ($group) => $group->count());

        $allCourses = $expectedByCourse->keys()->merge($scannedByCourse->keys())->unique()->sort()->values();

        return $allCourses->map(function ($program) use ($expectedByCourse, $scannedByCourse) {
            $expected = (int) ($expectedByCourse[$program] ?? 0);
            $scanned = (int) ($scannedByCourse[$program] ?? 0);
            $remaining = max($expected - $scanned, 0);

            return [
                'program' => (string) $program,
                'expected' => $expected,
                'scanned' => $scanned,
                'remaining' => $remaining,
                'percentage' => $expected > 0 ? round(($scanned / $expected) * 100, 1) : 0,
            ];
        })->values()->all();
    }

    public function scanAttendance(Request $request, Event $event): JsonResponse
    {
        $admin = auth()->guard('admin')->user();
        if (! $admin) {
            abort(403);
        }

        if ((string) $event->status === 'completed') {
            if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }

            return response()->json(['message' => 'This event is already completed. Scanner portal is closed.'], 403);
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && ! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse(Carbon::parse($event->event_date)->format('Y-m-d').' '.$event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);
            if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && ! (bool) $event->scanner_portal_active) {
            return response()->json(['message' => 'Scanner portal is not activated yet.'], 403);
        }

        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $rawValue = trim((string) $validated['value']);
        if ($rawValue === '') {
            return response()->json(['message' => 'Invalid QR value.'], 422);
        }

        $qrValue = $rawValue;
        $studentIdValue = null;

        $decoded = json_decode($qrValue, true);
        if (is_array($decoded)) {
            if (! empty($decoded['student_id'])) {
                $studentIdValue = trim((string) $decoded['student_id']);
            } elseif (! empty($decoded['id'])) {
                $studentIdValue = trim((string) $decoded['id']);
            }
        }

        if ($studentIdValue === null) {
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

        $studentIdValue = trim((string) $studentIdValue);

        $student = null;
        if ($studentIdValue !== '') {
            $student = Student::query()->where('student_id', $studentIdValue)->first();
        }

        if (! $student && $studentIdValue !== '' && ctype_digit($studentIdValue)) {
            $student = Student::query()->whereKey((int) $studentIdValue)->first();
        }

        if (! $student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $existingAttendance = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existingAttendance && $existingAttendance->checked_out_at) {
            app(StudentNotificationDispatcher::class)->attendanceIssue(
                $event,
                $student,
                'A scanner attempted another attendance scan after you had already checked out.',
                'already_checked_out',
            );

            return response()->json(['message' => 'Student has already timed out (checked out) for this event.'], 409);
        }

        $now = Carbon::now();

        $scanEval = $event->evaluateAttendanceScan($now, $existingAttendance);
        if (! $scanEval['allowed']) {
            return response()->json([
                'message' => $scanEval['error_message'],
            ], $scanEval['status_code']);
        }

        $status = $scanEval['status'];
        $isTimeOut = ($scanEval['action'] === 'check_out');

        if (! $existingAttendance) {
            $attendance = Attendance::create([
                'event_id'      => $event->id,
                'student_id'    => $student->id,
                'scanned_at'    => $now,
                'checked_in_at' => $now,
                'status'        => $status,
            ]);
        } else {
            $existingAttendance->update([
                'scanned_at'     => $now,
                'checked_out_at' => $now,
            ]);
            $attendance = $existingAttendance;
        }

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        $checkInLabel = $status === 'late'
            ? 'Time-in (Check-in) recorded as LATE.'
            : 'Time-in (Check-in) recorded successfully (On-Time).';

        return response()->json([
            'attendance_id'  => $attendance->id,
            'status'         => $attendance->status,
            'action'         => $isTimeOut ? 'check_out' : 'check_in',
            'message'        => $isTimeOut ? 'Time-out (Check-out) recorded successfully.' : $checkInLabel,
            'scanned_at'     => $now->toDateTimeString(),
            'checked_in_at'  => optional($attendance->checked_in_at)->toDateTimeString(),
            'checked_out_at' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->toDateTimeString() : null,
            'student' => [
                'id'         => $student->id,
                'student_id' => $student->student_id,
                'name'       => $student->name,
                'program'    => (string) ($student->course ?? $student->program ?? ''),
            ],
        ]);
    }

    public function studentsByCourse(Request $request, Event $event): JsonResponse
    {
        $course = trim((string) $request->query('course', ''));
        if ($course === '') {
            return response()->json(['message' => 'Course is required.'], 422);
        }

        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        $studentsQuery = Student::query()->where('course', $course);
        if (!empty($eventYearLevels)) {
            $studentsQuery->whereIn('year_level', $eventYearLevels);
        }
        if (Schema::hasColumn('students', 'is_archived')) {
            $studentsQuery->where(function ($q) {
                $q->where('is_archived', false)->orWhereNull('is_archived');
            });
        }

        $students = $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'student_id', 'first_name', 'last_name', 'name', 'course', 'year_level']);

        $attendances = Attendance::where('event_id', $event->id)
            ->whereIn('student_id', $students->pluck('id')->all())
            ->get(['student_id', 'checked_in_at', 'scanned_at', 'status', 'check_in_distance_m'])
            ->keyBy('student_id');

        $rows = $students->map(function (Student $student) use ($attendances) {
            $attendance = $attendances->get($student->id);
            $isScanned = ($attendance !== null && ($attendance->checked_in_at !== null || $attendance->scanned_at !== null));
            $status = $isScanned ? (string) ($attendance->status ?? 'present') : 'absent';

            return [
                'id' => (string) $student->id,
                'student_id' => (string) ($student->student_id ?? ''),
                'name' => (string) ($student->name ?? ''),
                'course' => (string) ($student->course ?? ''),
                'year_level' => (string) ($student->year_level ?? ''),
                'scanned' => $isScanned,
                'status' => $status,
                'checked_in_at' => $attendance
                    ? optional($attendance->checked_in_at ?? $attendance->scanned_at)->toDateTimeString()
                    : null,
                'check_in_distance_m' => $attendance ? $attendance->check_in_distance_m : null,
            ];
        })->values();

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
            ],
            'course' => $course,
            'rows' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('STORE method called with: '.$request->method());

        // Pre-normalize empty string values to null
        $input = array_map(function ($val) {
            return is_string($val) && trim($val) === '' ? null : $val;
        }, $request->all());
        $request->merge($input);

        $validated = $request->validate([
            'eventName' => 'required|string|max:255',
            'organizer' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'eventDate' => 'required|date',
            'eventTime' => 'required|string',
            'registrationEndTime' => 'nullable|date_format:H:i',
            'expectedAttendees' => 'nullable|integer|min:1',
            'description' => 'nullable|string|max:1000',
            'courses' => 'nullable|array',
            'courses.*' => 'string',
            'yearLevels' => 'nullable|array',
            'yearLevels.*' => 'string',
            'scannerStudentId' => 'nullable|string',
            'scannerStudentIds' => 'nullable|array',
            'scannerStudentIds.*' => 'string',
            'geofenceEnabled' => 'nullable|boolean',
            'geofenceLatitude' => 'nullable|numeric',
            'geofenceLongitude' => 'nullable|numeric',
            'geofenceRadiusM' => 'nullable|integer|min:10|max:500',
            'attendanceType' => 'nullable|string|in:qr_scanner,dynamic_qr',
        ]);

        $geofenceEnabled = (bool) ($validated['geofenceEnabled'] ?? false);
        $geofenceLat = $validated['geofenceLatitude'] ?? null;
        $geofenceLng = $validated['geofenceLongitude'] ?? null;
        $geofenceRadius = (int) ($validated['geofenceRadiusM'] ?? 50);

        if ($geofenceEnabled && ($geofenceLat === null || $geofenceLng === null)) {
            return redirect()->back()->with('error', 'Geofence is enabled but latitude/longitude is missing.')->setStatusCode(303);
        }

        $courses = $validated['courses'] ?? [];
        $yearLevels = $validated['yearLevels'] ?? [];
        $expectedAttendees = $this->calculateExpectedAttendees($courses, $yearLevels);

        try {
            $scannerStudentIdsRaw = $validated['scannerStudentIds'] ?? [];
            $scannerStudentIds = array_values(array_unique(array_filter(array_map('strval', $scannerStudentIdsRaw), function ($v) {
                return trim($v) !== '';
            })));

            $event = Event::create([
                'event_name' => $validated['eventName'],
                'organizer' => $validated['organizer'],
                'location' => $validated['location'],
                'event_date' => $validated['eventDate'],
                'event_time' => $validated['eventTime'],
                'registration_end_time' => $validated['registrationEndTime'] ?? null,
                'expected_attendees' => $expectedAttendees,
                'description' => $validated['description'] ?? null,
                'total_attendees' => 0,
                'present_count' => 0,
                'courses' => $courses,
                'year_levels' => $yearLevels,
                'scanner_student_id' => $validated['scannerStudentId'] ?? ($scannerStudentIds[0] ?? null),
                'scanner_student_ids' => $scannerStudentIds,
                'geofence_enabled' => $geofenceEnabled,
                'geofence_latitude' => $geofenceEnabled ? $geofenceLat : null,
                'geofence_longitude' => $geofenceEnabled ? $geofenceLng : null,
                'geofence_radius_m' => $geofenceRadius,
                'attendance_type' => $validated['attendanceType'] ?? 'qr_scanner',
            ]);

            $dispatcher = app(StudentNotificationDispatcher::class);
            $dispatcher->eventCreated($event);
            $dispatcher->scannerAccessGranted($event, $scannerStudentIds);

            if (Schema::hasTable('activity_logs')) {
                $actor = auth()->guard('admin')->user() ?: auth()->guard('program_head')->user() ?: auth()->user();
                if ($actor) {
                    ActivityLog::logForUser($actor, 'Attendance', 'Created', 'Created event: '.(string) $event->event_name);
                }
            }

            // Return a proper Inertia redirect response
            return redirect()->back()->with('success', 'Event created successfully');

        } catch (\Exception $e) {
            \Log::error('Failed to create event: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to create event: '.$e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        \Log::info('UPDATE method called with: '.$request->method().' for ID: '.$id);

        // Pre-normalize empty string values to null
        $input = array_map(function ($val) {
            return is_string($val) && trim($val) === '' ? null : $val;
        }, $request->all());
        $request->merge($input);

        $validated = $request->validate([
            'eventName' => 'required|string|max:255',
            'organizer' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'eventDate' => 'required|date',
            'eventTime' => 'required|string',
            'registrationEndTime' => 'nullable|date_format:H:i',
            'expectedAttendees' => 'nullable|integer|min:1',
            'description' => 'nullable|string|max:1000',
            'courses' => 'nullable|array',
            'courses.*' => 'string',
            'yearLevels' => 'nullable|array',
            'yearLevels.*' => 'string',
            'scannerStudentIds' => 'nullable|array',
            'scannerStudentIds.*' => 'string',
            'geofenceEnabled' => 'nullable|boolean',
            'geofenceLatitude' => 'nullable|numeric',
            'geofenceLongitude' => 'nullable|numeric',
            'geofenceRadiusM' => 'nullable|integer|min:10|max:500',
            'attendanceType' => 'nullable|string|in:qr_scanner,dynamic_qr',
        ]);

        $geofenceEnabled = (bool) ($validated['geofenceEnabled'] ?? false);
        $geofenceLat = $validated['geofenceLatitude'] ?? null;
        $geofenceLng = $validated['geofenceLongitude'] ?? null;
        $geofenceRadius = (int) ($validated['geofenceRadiusM'] ?? 50);

        if ($geofenceEnabled && ($geofenceLat === null || $geofenceLng === null)) {
            return redirect()->back()->with('error', 'Geofence is enabled but latitude/longitude is missing.')->setStatusCode(303);
        }

        try {
            $event = Event::findOrFail($id);

            $previousScannerStudentIds = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];
            $previousScannerStudentIds = array_values(array_unique(array_filter(array_map('strval', $previousScannerStudentIds), function ($v) {
                return trim($v) !== '';
            })));

            $hasScannerStudentIds = array_key_exists('scannerStudentIds', $validated)
                || array_key_exists('scanner_student_ids', $validated)
                || $request->has('scannerStudentIds')
                || $request->has('scanner_student_ids');
            $scannerStudentIdsRaw = $hasScannerStudentIds
                ? ($validated['scannerStudentIds'] ?? ($validated['scanner_student_ids'] ?? []))
                : (is_array($event->scanner_student_ids) ? $event->scanner_student_ids : []);
            $scannerStudentIds = array_values(array_unique(array_filter(array_map('strval', $scannerStudentIdsRaw), function ($v) {
                return trim($v) !== '';
            })));

            $event->fill([
                'event_name' => $validated['eventName'],
                'organizer' => $validated['organizer'],
                'location' => $validated['location'],
                'event_date' => $validated['eventDate'],
                'event_time' => $validated['eventTime'],
                'registration_end_time' => $validated['registrationEndTime'] ?? null,
                'expected_attendees' => $validated['expectedAttendees'] ?? $event->expected_attendees,
                'description' => $validated['description'] ?? $event->description,
                'courses' => $validated['courses'] ?? [],
                'year_levels' => $validated['yearLevels'] ?? [],
                'scanner_student_id' => $scannerStudentIds[0] ?? null,
                'scanner_student_ids' => $scannerStudentIds,
                'geofence_enabled' => $geofenceEnabled,
                'geofence_latitude' => $geofenceEnabled ? $geofenceLat : null,
                'geofence_longitude' => $geofenceEnabled ? $geofenceLng : null,
                'geofence_radius_m' => $geofenceRadius,
                'attendance_type' => $validated['attendanceType'] ?? $event->attendance_type ?? 'qr_scanner',
            ]);
            $changedFields = array_keys($event->getDirty());
            $event->save();

            $newlyGrantedScannerIds = array_values(array_diff($scannerStudentIds, $previousScannerStudentIds));
            $dispatcher = app(StudentNotificationDispatcher::class);
            $dispatcher->eventUpdated($event, $changedFields);
            $dispatcher->scannerAccessGranted($event, $newlyGrantedScannerIds);

            if (Schema::hasTable('activity_logs')) {
                $actor = auth()->guard('admin')->user() ?: auth()->guard('program_head')->user() ?: auth()->user();
                if ($actor) {
                    ActivityLog::logForUser($actor, 'Attendance', 'Updated', 'Updated event: '.(string) $event->event_name);
                }
            }

            return redirect()->back()->with('success', 'Event updated successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to update event: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to update event: '.$e->getMessage());
        }
    }

    public function destroy($id)
    {
        \Log::info('DESTROY method called with ID: '.$id.' and method: '.request()->method());
        \Log::info('Request URI: '.request()->getRequestUri());
        \Log::info('Request headers:', request()->headers->all());

        try {
            $event = Event::findOrFail($id);
            $event->archive(); // Archive instead of delete

            if (Schema::hasTable('activity_logs')) {
                $actor = auth()->guard('admin')->user() ?: auth()->guard('program_head')->user() ?: auth()->user();
                if ($actor) {
                    ActivityLog::logForUser($actor, 'Attendance', 'Archived', 'Archived event: '.(string) $event->event_name);
                }
            }

            // Debug: Log the archiving
            \Log::info('Event archived:', ['id' => $id, 'event' => $event->toArray()]);

            return redirect()->back()->with('success', 'Event archived successfully');

        } catch (\Exception $e) {
            \Log::error('Failed to archive event: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to archive event: '.$e->getMessage());
        }
    }

    public function printEvent(Request $request, Event $event): \Illuminate\Http\Response
    {
        $data = $this->getEventStudentsAndAttendances($event);
        $allStudents = $data['allStudents'];
        $attendances = $data['attendances'];

        // Group by course/program, then within course group by year level
        $groupedByCourse = $allStudents
            ->groupBy(fn ($s) => trim((string) ($s->course ?? 'Unknown Program')));

        $sections = [];
        $overallPresentCount = 0;
        $overallAbsentCount = 0;

        foreach ($groupedByCourse->sortKeys() as $course => $courseStudents) {
            $groupedByYear = $courseStudents->groupBy(function ($s) {
                $yl = trim((string) ($s->year_level ?? ''));
                return $yl !== '' ? $yl : 'General';
            });

            // Sort year levels (1st Year -> 1, 2nd Year -> 2, 3rd Year -> 3, 4th Year -> 4, etc.)
            $sortedGroupedByYear = $groupedByYear->sortKeysUsing(function ($a, $b) {
                $numA = preg_match('/(\d+)/', (string) $a, $mA) ? (int) $mA[1] : 999;
                $numB = preg_match('/(\d+)/', (string) $b, $mB) ? (int) $mB[1] : 999;
                if ($numA === $numB) {
                    return strcmp((string) $a, (string) $b);
                }
                return $numA <=> $numB;
            });

            foreach ($sortedGroupedByYear as $yearLevel => $yearStudents) {
                $yearStudentsList = collect($yearStudents);

                $sectionPresentCount = 0;
                $sectionAbsentCount = 0;

                $tableRows = $yearStudentsList
                    ->map(function ($student) use ($attendances, &$sectionPresentCount, &$sectionAbsentCount, &$overallPresentCount, &$overallAbsentCount) {
                        $att = $attendances->get($student->id);
                        $hasScanned = ($att !== null && ($att->checked_in_at !== null || $att->scanned_at !== null));

                        if ($hasScanned) {
                            $status = ucfirst((string) ($att->status ?? 'present'));
                            $checkedInAt = $att->checked_in_at
                                ? Carbon::parse($att->checked_in_at)->format('g:i A')
                                : ($att->scanned_at ? Carbon::parse($att->scanned_at)->format('g:i A') : '—');
                            $timeOut = $att->checked_out_at
                                ? Carbon::parse($att->checked_out_at)->format('g:i A')
                                : '—';
                            $sectionPresentCount++;
                            $overallPresentCount++;
                        } else {
                            $status = 'Absent';
                            $checkedInAt = '—';
                            $timeOut = '—';
                            $sectionAbsentCount++;
                            $overallAbsentCount++;
                        }

                        $fullName = trim((string) ($student->name ?? ''));
                        if (!empty($student->last_name) || !empty($student->first_name)) {
                            $fullName = trim(($student->last_name ?? '') . ', ' . ($student->first_name ?? '') . ' ' . ($student->middle_name ?? ''));
                        }

                        return [
                            'student_id' => (string) ($student->student_id ?? '—'),
                            'name' => $fullName ?: (string) ($student->name ?? '—'),
                            'major' => (string) ($student->course ?? '—'),
                            'year_level' => (string) ($student->year_level ?? '—'),
                            'checked_in_at' => $checkedInAt,
                            'time_out' => $timeOut,
                            'status' => $status,
                            'is_absent' => !$hasScanned,
                        ];
                    })
                    ->sortBy('name')
                    ->values()
                    ->toArray();

                $courseStr = (string) $course;
                $yearLevelStr = (string) $yearLevel;
                $programYearLabel = ($yearLevelStr !== '' && $yearLevelStr !== 'General')
                    ? ($courseStr . ' — ' . $yearLevelStr)
                    : $courseStr;

                $sections[] = [
                    'course' => $courseStr,
                    'year_level' => $yearLevelStr,
                    'program_year_label' => $programYearLabel,
                    'tableRows' => $tableRows,
                    'present_count' => $sectionPresentCount,
                    'absent_count' => $sectionAbsentCount,
                    'total_count' => count($tableRows),
                ];
            }
        }

        $dateLabel = $event->event_date ? Carbon::parse($event->event_date)->format('F d, Y') : '';

        $formatTime12 = function (?string $raw): string {
            if (!$raw) return '';
            $raw = trim($raw);
            if ($raw === '' || $raw === '—') return '';
            try {
                return Carbon::parse($raw)->format('g:i A');
            } catch (\Throwable $e) {
                return $raw;
            }
        };

        $timeLabel = '';
        if (!empty($event->event_time) && !empty($event->registration_end_time)) {
            $t1 = $formatTime12($event->event_time);
            $t2 = $formatTime12($event->registration_end_time);
            $timeLabel = ($t1 && $t2) ? "{$t1} - {$t2}" : ($t1 ?: $t2);
        } elseif (!empty($event->event_time)) {
            if (preg_match('/^(.*?)(?:\s*(?:-|to)\s*)(.*)$/i', (string) $event->event_time, $m)) {
                $t1 = $formatTime12($m[1]);
                $t2 = $formatTime12($m[2]);
                $timeLabel = ($t1 && $t2) ? "{$t1} - {$t2}" : ($t1 ?: $event->event_time);
            } else {
                $timeLabel = $formatTime12($event->event_time);
            }
        }

        $locationLabel = (string) ($event->location ?? '');
        $eventDateTimeLabel = trim($dateLabel.($timeLabel ? ' | '.$timeLabel : '').($locationLabel ? ' | '.$locationLabel : ''));

        return response()->view('admin.attendance.print-sheet', [
            'event' => $event,
            'academicYear' => now()->format('Y').' - '.(now()->addYear()->format('Y')),
            'eventDateTimeLabel' => $eventDateTimeLabel,
            'sections' => $sections,
            'totalAttendees' => $overallPresentCount,
            'totalAbsent' => $overallAbsentCount,
            'totalStudents' => $overallPresentCount + $overallAbsentCount,
        ]);
    }

    public function archive(Event $event): RedirectResponse
    {
        $event->archive();

        return redirect()->back()->with('success', 'Event archived.')->setStatusCode(303);
    }

    public function unarchive(Event $event): RedirectResponse
    {
        $event->unarchive();

        return redirect()->back()->with('success', 'Event restored.')->setStatusCode(303);
    }
}
