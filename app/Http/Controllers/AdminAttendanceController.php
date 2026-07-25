<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Student;
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

        $limit = (int) $request->query('limit', 25);
        if ($limit < 1) {
            $limit = 1;
        }
        if ($limit > 100) {
            $limit = 100;
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
                'total' => (int) Attendance::query()->where('event_id', $event->id)->count(),
                'present' => (int) Attendance::query()->where('event_id', $event->id)->where('status', 'present')->count(),
                'late' => (int) Attendance::query()->where('event_id', $event->id)->where('status', 'late')->count(),
            ],
            'byCourse' => $byCourse,
            'rows' => $rows,
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    private function getLogsAttendanceRows(Event $event, int $limit): array
    {
        $eventCourses = $event->courses ?? [];
        $eventYearLevels = $event->year_levels ?? [];

        return Attendance::query()
            ->with('student')
            ->where('event_id', $event->id)
            ->whereHas('student', function ($q) use ($eventCourses, $eventYearLevels) {
                if (! empty($eventCourses)) {
                    $q->whereIn('course', $eventCourses);
                }
                if (! empty($eventYearLevels)) {
                    $q->whereIn('year_level', $eventYearLevels);
                }
            })
            ->orderByDesc('checked_in_at')
            ->limit($limit)
            ->get()
            ->map(function (Attendance $attendance) {
                $student = $attendance->student;

                return [
                    'id' => (string) $attendance->id,
                    'student_id' => (string) ($student?->student_id ?? $attendance->student_id ?? ''),
                    'name' => (string) ($student?->name ?? ''),
                    'program' => (string) (($student?->course ?? $student?->program ?? '') ?: '—'),
                    'checked_in_at' => optional($attendance->checked_in_at)->toDateTimeString(),
                    'time' => optional($attendance->checked_in_at)->format('h:i A') ?: '—',
                    'status' => (string) ($attendance->status ?? ''),
                ];
            })
            ->values()
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
            ->selectRaw("COALESCE(NULLIF(TRIM(course), ''), '—') as program")
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw("COALESCE(NULLIF(TRIM(course), ''), '—')")
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

        if ($existingAttendance) {
            app(StudentNotificationDispatcher::class)->attendanceIssue(
                $event,
                $student,
                'A scanner attempted to record your attendance again for '.(string) $event->event_name.'.',
                'duplicate_scan',
            );

            return response()->json(['message' => 'Student has already been scanned for this event.'], 409);
        }

        $now = Carbon::now();
        $status = 'present';

        if (! empty($event->registration_end_time)) {
            $cutoff = Carbon::parse(Carbon::parse($event->event_date)->format('Y-m-d').' '.$event->registration_end_time);

            $blockAt = $cutoff->copy()->addMinutes(30);
            if ($now->greaterThanOrEqualTo($blockAt)) {
                if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                    $event->update(['scanner_portal_active' => false]);
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

        $attendance = Attendance::query()->updateOrCreate(
            ['event_id' => $event->id, 'student_id' => $student->id],
            ['scanned_at' => $now, 'status' => $status]
        );

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        return response()->json([
            'attendance_id' => $attendance->id,
            'status' => $status,
            'scanned_at' => $now->toDateTimeString(),
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->name,
                'program' => (string) ($student->course ?? $student->program ?? ''),
            ],
        ]);
    }

    public function studentsByCourse(Request $request, Event $event): JsonResponse
    {
        $course = trim((string) $request->query('course', ''));
        if ($course === '') {
            return response()->json(['message' => 'Course is required.'], 422);
        }

        // Return ONLY students that have an attendance record (scanned)
        // for this event and selected course.
        $studentsWithAttendance = Student::query()
            ->where('course', $course)
            ->whereHas('attendances', function ($q) use ($event) {
                $q->where('event_id', $event->id)
                    ->where(function ($qq) {
                        $qq->whereNotNull('checked_in_at')
                            ->orWhereNotNull('scanned_at');
                    });
            })
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'student_id', 'name', 'course', 'year_level']);

        $attendanceByStudentId = Attendance::query()
            ->where('event_id', $event->id)
            ->whereIn('student_id', $studentsWithAttendance->pluck('id')->all())
            ->get(['student_id', 'checked_in_at', 'scanned_at', 'status'])
            ->keyBy('student_id');

        $rows = $studentsWithAttendance->map(function (Student $student) use ($attendanceByStudentId) {
            $attendance = $attendanceByStudentId->get($student->id);

            return [
                'id' => (string) $student->id,
                'student_id' => (string) ($student->student_id ?? ''),
                'name' => (string) ($student->name ?? ''),
                'course' => (string) ($student->course ?? ''),
                'year_level' => (string) ($student->year_level ?? ''),
                'scanned' => true,
                'status' => $attendance ? (string) ($attendance->status ?? '') : null,
                'checked_in_at' => $attendance
                    ? optional($attendance->checked_in_at ?? $attendance->scanned_at)->toDateTimeString()
                    : null,
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
                $admin = auth()->guard('admin')->user();
                ActivityLog::logForUser($admin, 'Attendance', 'Created', 'Created event: '.(string) $event->event_name);
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

            $scannerStudentIdsRaw = $validated['scannerStudentIds'] ?? [];
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
                $admin = auth()->guard('admin')->user();
                ActivityLog::logForUser($admin, 'Attendance', 'Updated', 'Updated event: '.(string) $event->event_name);
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
                $admin = auth()->guard('admin')->user();
                ActivityLog::logForUser($admin, 'Attendance', 'Archived', 'Archived event: '.(string) $event->event_name);
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
        $rowCount = (int) $request->query('rows', 25);
        if ($rowCount < 10) {
            $rowCount = 10;
        }
        if ($rowCount > 100) {
            $rowCount = 100;
        }

        $eventCourses = is_array($event->courses) ? $event->courses : [];
        $eventYearLevels = is_array($event->year_levels) ? $event->year_levels : [];

        $baseQuery = Student::query();
        if (! empty($eventCourses)) {
            $baseQuery->whereIn('course', $eventCourses);
        }
        if (! empty($eventYearLevels)) {
            $baseQuery->whereIn('year_level', $eventYearLevels);
        }

        $courses = (clone $baseQuery)
            ->whereNotNull('course')
            ->where('course', '!=', '')
            ->distinct()
            ->orderBy('course')
            ->pluck('course')
            ->values();

        $sections = [];
        foreach ($courses as $course) {
            $students = (clone $baseQuery)
                ->select(['id', 'name', 'course', 'year_level'])
                ->where('course', $course)
                ->orderBy('name')
                ->limit($rowCount)
                ->get();

            $tableRows = $students
                ->map(function ($s) {
                    return [
                        'name' => (string) ($s->name ?? ''),
                        'major' => (string) ($s->course ?? ''),
                        'year_level' => (string) ($s->year_level ?? ''),
                    ];
                })
                ->toArray();

            $missing = max(0, $rowCount - count($tableRows));
            for ($i = 0; $i < $missing; $i++) {
                $tableRows[] = ['name' => '', 'major' => '', 'year_level' => ''];
            }

            $sections[] = [
                'course' => (string) $course,
                'tableRows' => $tableRows,
            ];
        }

        $dateLabel = $event->event_date ? Carbon::parse($event->event_date)->format('F d, Y') : '';
        $timeLabel = (string) ($event->event_time ?? '');
        $locationLabel = (string) ($event->location ?? '');
        $eventDateTimeLabel = trim($dateLabel.($timeLabel ? ' | '.$timeLabel : '').($locationLabel ? ' | '.$locationLabel : ''));

        return response()->view('admin.attendance.print-sheet', [
            'event' => $event,
            'academicYear' => now()->format('Y').' - '.(now()->addYear()->format('Y')),
            'eventDateTimeLabel' => $eventDateTimeLabel,
            'sections' => $sections,
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
