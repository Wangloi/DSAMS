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
            $eventQuery = Event::query()
                ->active() // Only show non-archived events
                ->withCount('attendances'); // Load attendance count

            $programHeadId = Event::currentProgramHeadId();
            if ($programHeadId !== null && Event::supportsCreatorTracking()) {
                $eventQuery->where(function ($q) use ($programHeadId) {
                    $q->whereNull('created_by_program_head_id')
                        ->orWhere('created_by_program_head_id', $programHeadId);
                });
            }

            $eventModels = $eventQuery
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

            $totalStudents = Student::query()->count();
            $studentCountsByCourseYear = $this->getStudentCountsByCourseYear();

            $events = $eventModels->map(function ($event) use ($lateByEventId) {
                /** @var Event $event */
                $scannerPortalActive = true;
                if (Schema::hasColumn('events', 'scanner_portal_active')) {
                    $scannerPortalActive = (bool) $event->scanner_portal_active;
                }

                // Update attendance counts only if out of sync, safely
                if ($event->total_attendees !== $event->attendances_count) {
                    try {
                        $event->updateAttendanceCounts();
                    } catch (\Throwable) {}
                }

                $eligibleStudentsCount = 0;
                try {
                    $eligibleStudentsCount = $event->eligibleStudentsCount();
                } catch (\Throwable) {}

                $expectedAttendees = (int) ($event->expected_attendees ?? 0);
                $attendanceDenominator = $expectedAttendees > 0
                    ? min($expectedAttendees, $eligibleStudentsCount)
                    : $eligibleStudentsCount;
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
                    'courses' => is_array($event->courses) ? $event->courses : [],
                    'year_levels' => is_array($event->year_levels) ? $event->year_levels : [],
                    'geofenceEnabled' => (bool) ($event->geofence_enabled ?? false),
                    'geofenceLatitude' => $event->geofence_latitude,
                    'geofenceLongitude' => $event->geofence_longitude,
                    'geofenceRadiusM' => (int) ($event->geofence_radius_m ?? 50),
                    'attendance_type' => $event->attendance_type ?? 'qr_scanner',
                    'conflicting_events' => [],
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
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Attendance index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

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
                if (!is_string($yearLevel)) {
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

    public function activateScannerPortal(Request $request, Event $event): \Symfony\Component\HttpFoundation\Response
    {
        try {
            if ($event->status === 'upcoming') {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Scanner portal cannot be activated yet because the event is upcoming.'], 422);
                }
                return redirect()->back()->with('info', 'Scanner portal cannot be activated yet because the event is upcoming.')->setStatusCode(303);
            }

            $wasAlreadyActive = (bool) ($event->scanner_portal_active ?? false);

            if (Schema::hasColumn('events', 'scanner_portal_active') && !$wasAlreadyActive) {
                $event->update(['scanner_portal_active' => true]);
            }

            // Only dispatch student notifications once when activating for the first time
            if (!$wasAlreadyActive) {
                try {
                    $scannerStudentIds = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];
                    $dispatcher = app(StudentNotificationDispatcher::class);

                    // 1) Notify specific scanner assignees
                    $dispatcher->scannerAccessGranted($event, $scannerStudentIds);

                    // 2) Notify eligible students
                    $dispatcher->attendanceScannerAvailable($event);
                } catch (\Throwable $notifEx) {
                    \Illuminate\Support\Facades\Log::warning('activateScannerPortal notification dispatch warning: ' . $notifEx->getMessage());
                }
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Scanner portal activated.',
                    'scanner_portal_active' => true,
                ]);
            }

            return redirect()->back()->with('success', 'Scanner portal activated.')->setStatusCode(303);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('activateScannerPortal error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to activate scanner portal: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to activate scanner portal: ' . $e->getMessage())->setStatusCode(303);
        }
    }


    public function logs(Request $request, Event $event): JsonResponse
    {
        try {
            if (Schema::hasColumn('events', 'scanner_portal_active') && !empty($event->registration_end_time)) {
                $eventDateStr = $event->event_date ? Carbon::parse($event->event_date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');
                $cutoff = Carbon::parse($eventDateStr . ' ' . $event->registration_end_time);
                $blockAt = $cutoff->copy()->addMinutes(30);
                if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                    $event->update(['scanner_portal_active' => false]);
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Error updating scanner portal status for event ' . $event->id . ': ' . $e->getMessage());
        }

        try {
            $limit = $request->has('limit') ? (int) $request->query('limit') : 2000;
            if ($limit < 1) {
                $limit = 1;
            }
            if ($limit > 2000) {
                $limit = 2000;
            }

            $rows = $this->getLogsAttendanceRows($event, $limit);
            $byCourse = $this->getLogsCourseBreakdown($event);

            $isUpcoming = ($event->status === 'upcoming');

            if ($isUpcoming) {
                $counts = [
                    'total' => 0,
                    'present' => 0,
                    'late' => 0,
                    'flagged' => 0,
                    'incomplete' => 0,
                ];
                $scannerPortalActive = false;
            } else {
                $baseScannedQuery = Attendance::query()
                    ->where('event_id', $event->id)
                    ->where(function ($q) {
                        $q->whereNotNull('checked_in_at')->orWhereNotNull('scanned_at');
                    });

                $hasFlaggedCol = Schema::hasColumn('attendances', 'is_flagged');

                $counts = [
                    'total' => (int) (clone $baseScannedQuery)->count(),
                    'present' => (int) (clone $baseScannedQuery)
                        ->whereIn('status', ['present', 'completed'])
                        ->when($hasFlaggedCol, fn($q) => $q->where('is_flagged', false))
                        ->count(),
                    'late' => (int) (clone $baseScannedQuery)->where('status', 'late')->count(),
                    'flagged' => $hasFlaggedCol ? (int) (clone $baseScannedQuery)->where('is_flagged', true)->count() : 0,
                    'incomplete' => (int) Attendance::query()->where('event_id', $event->id)->where(function ($q) {
                        $q->whereIn('status', ['incomplete', 'left_early'])->orWhereNull('checked_out_at');
                    })->where(function ($q) {
                        $q->whereNotNull('checked_in_at')->orWhereNotNull('scanned_at');
                    })->count(),
                ];
                $scannerPortalActive = Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true;
            }

            return response()->json([
                'event' => [
                    'id' => $event->id,
                    'name' => $event->event_name,
                    'status' => $event->status,
                    'is_upcoming' => $isUpcoming,
                    'event_date' => optional($event->event_date)->format('Y-m-d'),
                    'event_time' => $event->event_time,
                ],
                'status' => $event->status,
                'is_upcoming' => $isUpcoming,
                'scanner_portal_active' => $scannerPortalActive,
                'counts' => $counts,
                'byCourse' => $byCourse,
                'rows' => $rows,
                'server_time' => now()->toDateTimeString(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Real-time attendance logs error for event ' . $event->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'event' => [
                    'id' => $event->id,
                    'name' => $event->event_name ?? 'Event',
                    'status' => $event->status ?? 'upcoming',
                    'is_upcoming' => ($event->status === 'upcoming'),
                    'event_date' => optional($event->event_date)->format('Y-m-d'),
                    'event_time' => $event->event_time,
                ],
                'status' => $event->status ?? 'upcoming',
                'is_upcoming' => ($event->status === 'upcoming'),
                'scanner_portal_active' => false,
                'counts' => [
                    'total' => 0,
                    'present' => 0,
                    'late' => 0,
                    'flagged' => 0,
                    'incomplete' => 0,
                ],
                'byCourse' => [],
                'rows' => [],
                'server_time' => now()->toDateTimeString(),
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while loading real-time monitoring logs.',
            ]);
        }
    }

    /**
     * @return array{allStudents: \Illuminate\Support\Collection<int, Student>, attendances: \Illuminate\Support\Collection<string|int, Attendance>}
     */
    private function getEventStudentsAndAttendances(Event $event, ?string $courseFilter = null, ?string $yearLevelFilter = null): array
    {
        $eligibleStudents = $this->queryEligibleStudents($event, $courseFilter, $yearLevelFilter);
        $attendances = $this->queryEventAttendances((int) $event->id, $courseFilter, $yearLevelFilter);

        $attendedStudents = $attendances->pluck('student')->filter();

        $allStudents = $eligibleStudents->isEmpty()
            ? $attendedStudents->values()
            : $eligibleStudents->concat($attendedStudents)->unique('id')->values();

        if (!empty($courseFilter)) {
            $allStudents = $allStudents->filter(fn($s) => strcasecmp((string) $s->course, $courseFilter) === 0)->values();
        }
        if (!empty($yearLevelFilter)) {
            $allStudents = $allStudents->filter(function ($s) use ($yearLevelFilter) {
                $yl = (string) ($s->year_level ?? '');
                return strcasecmp($yl, $yearLevelFilter) === 0 || stripos($yl, $yearLevelFilter) === 0;
            })->values();
        }

        return [
            'allStudents' => $allStudents,
            'attendances' => $attendances,
        ];
    }

    private function queryEligibleStudents(Event $event, ?string $courseFilter, ?string $yearLevelFilter)
    {
        $eventCourses = is_array($event->courses) ? array_values(array_filter($event->courses, fn($c) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $c))) : [];
        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

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
        if (!empty($courseFilter)) {
            $studentsQuery->where('course', $courseFilter);
        } elseif (!empty($eventCourses)) {
            $studentsQuery->whereIn('course', $eventCourses);
        }

        if (!empty($yearLevelFilter)) {
            $studentsQuery->where(function ($q) use ($yearLevelFilter) {
                $q->where('year_level', $yearLevelFilter)
                    ->orWhere('year_level', 'like', $yearLevelFilter . '%');
            });
        } elseif (!empty($eventYearLevels)) {
            $studentsQuery->whereIn('year_level', $eventYearLevels);
        }

        return $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    private function queryEventAttendances(int $eventId, ?string $courseFilter, ?string $yearLevelFilter)
    {
        $attendancesQuery = Attendance::where('event_id', $eventId)->with('student');

        if (!empty($courseFilter)) {
            $attendancesQuery->whereHas('student', fn($q) => $q->where('course', $courseFilter));
        }
        if (!empty($yearLevelFilter)) {
            $attendancesQuery->whereHas('student', function ($q) use ($yearLevelFilter) {
                $q->where('year_level', $yearLevelFilter)
                    ->orWhere('year_level', 'like', $yearLevelFilter . '%');
            });
        }

        return $attendancesQuery->get()->keyBy('student_id');
    }

    private function getLogsAttendanceRows(Event $event, int $limit): array
    {
        try {
            $attendances = Attendance::query()
                ->where('event_id', $event->id)
                ->with(['student' => function ($q) {
                    $q->select('id', 'student_id', 'name', 'first_name', 'last_name', 'middle_name', 'course', 'year_level');
                }])
                ->where(function ($q) {
                    $q->whereNotNull('checked_in_at')->orWhereNotNull('scanned_at');
                })
                ->orderByDesc('checked_in_at')
                ->orderByDesc('scanned_at')
                ->orderByDesc('id')
                ->limit($limit)
                ->get();

            return $attendances
                ->map(function ($att) use ($event) {
                    $student = $att->student;
                    $timeCarbon = $att->checked_in_at ?? $att->scanned_at;

                    $fullName = trim((string) ($student?->name ?? ''));
                    if (!empty($student?->last_name) || !empty($student?->first_name)) {
                        $fullName = trim(($student->last_name ?? '') . ', ' . ($student->first_name ?? '') . ' ' . ($student->middle_name ?? ''));
                    }

                    $isFlagged = (bool) ($att && $att->is_flagged);
                    $rawStatus = strtolower((string) ($att->status ?? 'present'));
                    if ($isFlagged) {
                        $status = 'Flagged';
                    } elseif (in_array($rawStatus, ['incomplete', 'left_early'], true) || ($event->status === 'completed' && empty($att->checked_out_at))) {
                        $status = 'Incomplete';
                    } else {
                        $status = ucfirst($rawStatus);
                    }

                    return [
                        'id' => (string) $att->id,
                        'attendance_id' => (int) $att->id,
                        'student_id' => (string) ($student?->student_id ?? '—'),
                        'name' => $fullName ?: (string) ($student?->name ?? '—'),
                        'program' => (string) (($student?->course ?? '') ?: '—'),
                        'year_level' => (string) ($student?->year_level ?? '—'),
                        'checked_in_at' => $timeCarbon ? optional($timeCarbon)->toDateTimeString() : null,
                        'checked_out_at' => ($att && $att->checked_out_at) ? optional($att->checked_out_at)->toDateTimeString() : null,
                        'mid_session_verified_at' => ($att && $att->mid_session_verified_at) ? optional($att->mid_session_verified_at)->toDateTimeString() : null,
                        'time' => $timeCarbon ? optional($timeCarbon)->format('g:i A') : '—',
                        'time_out' => ($att && $att->checked_out_at) ? optional($att->checked_out_at)->format('g:i A') : '—',
                        'mid_session_time' => ($att && $att->mid_session_verified_at) ? optional($att->mid_session_verified_at)->format('g:i A') : '—',
                        'status' => $status,
                        'is_flagged' => $isFlagged,
                        'flagged_reason' => $att?->flagged_reason,
                        'is_absent' => false,
                    ];
                })
                ->values()
                ->all();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('getLogsAttendanceRows error: ' . $e->getMessage());
            return [];
        }
    }

    private function getLogsCourseBreakdown(Event $event): array
    {
        try {
            $eventCourses = is_array($event->courses) ? array_values(array_filter($event->courses, fn($c) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $c))) : [];
            $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

            $expectedStudentsQuery = Student::query();
            if (Schema::hasColumn('students', 'status')) {
                $expectedStudentsQuery->where(function ($q) {
                    $q->where('status', 'approved')->orWhereNull('status');
                });
            }
            if (Schema::hasColumn('students', 'is_archived')) {
                $expectedStudentsQuery->where(function ($q) {
                    $q->where('is_archived', false)->orWhereNull('is_archived');
                });
            }
            if (!empty($eventCourses)) {
                $expectedStudentsQuery->whereIn('course', $eventCourses);
            }
            if (!empty($eventYearLevels)) {
                $expectedStudentsQuery->whereIn('year_level', $eventYearLevels);
            }

            $expectedByCourse = $expectedStudentsQuery
                ->selectRaw("COALESCE(NULLIF(TRIM(course), ''), '—') as program, COUNT(*) as total")
                ->groupBy(DB::raw("COALESCE(NULLIF(TRIM(course), ''), '—')"))
                ->pluck('total', 'program');

            $scannedByCourse = DB::table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->where('attendances.event_id', $event->id)
                ->where(function ($q) {
                    $q->whereNotNull('attendances.checked_in_at')
                        ->orWhereNotNull('attendances.scanned_at');
                })
                ->when(!empty($eventCourses), fn($q) => $q->whereIn('students.course', $eventCourses))
                ->when(!empty($eventYearLevels), fn($q) => $q->whereIn('students.year_level', $eventYearLevels))
                ->selectRaw("COALESCE(NULLIF(TRIM(students.course), ''), '—') as program, COUNT(*) as total")
                ->groupBy(DB::raw("COALESCE(NULLIF(TRIM(students.course), ''), '—')"))
                ->pluck('total', 'program');

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
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Course breakdown error for event ' . $event->id . ': ' . $e->getMessage());
            return [];
        }
    }

    public function scanAttendance(Request $request, Event $event): JsonResponse
    {
        $admin = auth()->guard('admin')->user();
        if (!$admin) {
            abort(403);
        }

        if ((string) $event->status === 'completed') {
            if (Schema::hasColumn('events', 'scanner_portal_active') && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }

            return response()->json(['message' => 'This event is already completed. Scanner portal is closed.'], 403);
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && !empty($event->registration_end_time)) {
            $cutoff = Carbon::parse(Carbon::parse($event->event_date)->format('Y-m-d') . ' ' . $event->registration_end_time);
            $blockAt = $cutoff->copy()->addMinutes(30);
            if (Carbon::now()->greaterThanOrEqualTo($blockAt) && (bool) $event->scanner_portal_active) {
                $event->update(['scanner_portal_active' => false]);
            }
        }

        if (Schema::hasColumn('events', 'scanner_portal_active') && !(bool) $event->scanner_portal_active) {
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
            if (!empty($decoded['student_id'])) {
                $studentIdValue = trim((string) $decoded['student_id']);
            } elseif (!empty($decoded['id'])) {
                $studentIdValue = trim((string) $decoded['id']);
            }
        }

        if ($studentIdValue === null) {
            $urlParts = parse_url($qrValue);
            if (is_array($urlParts) && isset($urlParts['scheme']) && isset($urlParts['host'])) {
                $qs = [];
                parse_str((string) ($urlParts['query'] ?? ''), $qs);

                if (!empty($qs['student_id'])) {
                    $studentIdValue = trim((string) $qs['student_id']);
                } elseif (!empty($qs['id'])) {
                    $studentIdValue = trim((string) $qs['id']);
                } else {
                    $path = trim((string) ($urlParts['path'] ?? ''), '/');
                    if ($path !== '') {
                        $segments = array_values(array_filter(explode('/', $path), fn($s) => $s !== ''));
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

            $student = Student::query()->whereIn('student_id', $candidateIds)->first();
        }

        if (!$student && $studentIdValue !== '' && ctype_digit($studentIdValue)) {
            $student = Student::query()->whereKey((int) $studentIdValue)->first();
        }

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $now = Carbon::now();
        $conflictService = app(\App\Services\Attendance\ConflictAttendanceService::class);

        // Check if student is eligible for primary event
        $isEligible = \App\Services\Attendance\EventEligibilityService::isStudentEligible($student, $event);
        if (!$isEligible) {
            // Check if student is eligible for any conflicting schedule event
            $conflictResult = $conflictService->scanConflictingEventIfPrimaryIneligible($event, $student, $now, [], $request);
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
                        'time' => $now->format('h:i A'),
                    ]
                ], $conflictResult['additional_conflicts'] ?? []);

                return response()->json([
                    'attendance_id' => $primaryAtt->id,
                    'status' => $status,
                    'action' => $isTimeOut ? 'check_out' : 'check_in',
                    'message' => ($isTimeOut ? 'Time-out (Check-out) recorded' : 'Time-in (Check-in) recorded') . " for conflicting schedule '{$primaryConflict->event_name}' (Student is registered for this conflicting schedule).",
                    'conflicted_events_scanned' => $allConflictedScans,
                    'scanned_at' => $now->toDateTimeString(),
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

            return response()->json([
                'message' => 'Attendance Denied: Student ' . ($student->name ?? $student->student_id) . ' is not eligible for this event (course/year mismatch).',
            ], 403);
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

        $requestedMode = $request->input('mode') ?? $request->input('scan_type');
        $scanEval = $event->evaluateAttendanceScan($now, $existingAttendance, $requestedMode);
        if (!$scanEval['allowed']) {
            return response()->json([
                'message' => $scanEval['error_message'],
            ], $scanEval['status_code']);
        }

        $status = $scanEval['status'];
        $isTimeOut = ($scanEval['action'] === 'check_out');

        if (!$existingAttendance) {
            $attendance = Attendance::create([
                'event_id' => $event->id,
                'student_id' => $student->id,
                'scanned_at' => $now,
                'checked_in_at' => $now,
                'status' => $status,
            ]);
        } else {
            $existingAttendance->update([
                'scanned_at' => $now,
                'checked_out_at' => $now,
            ]);
            $attendance = $existingAttendance;
        }

        // Also record attendance for any eligible conflicting schedule events
        $conflictedScans = $conflictService->recordAttendanceForEligibleConflicts(
            $event,
            $student,
            $now,
            $isTimeOut ? 'check_out' : 'check_in',
            $status,
            [],
            $request
        );

        $event->updateAttendanceCounts();
        app(StudentNotificationDispatcher::class)->attendanceRecorded($event, $attendance);

        try {
            app(\App\Services\RealtimeNotificationService::class)->broadcastAttendanceScan($event->id, [
                'action' => $isTimeOut ? 'check_out' : 'check_in',
                'status' => $attendance->status,
                'scanned_at' => $now->toDateTimeString(),
                'time' => $now->format('h:i A'),
                'is_flagged' => false,
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
                    'action' => $isTimeOut ? 'check_out' : 'check_in',
                ],
            ]);
        } catch (\Throwable) {}

        $conflictedSuffix = '';
        if (!empty($conflictedScans)) {
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
            'scanned_at' => $now->toDateTimeString(),
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

        $rows = $students->map(function ($student) use ($attendances) {
            /** @var Student $student */
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
        \Log::info('STORE method called with: ' . $request->method());

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
                    ActivityLog::logForUser($actor, 'Attendance', 'Created', 'Created event: ' . (string) $event->event_name);
                }
            }

            // Return a proper Inertia redirect response
            return redirect()->back()->with('success', 'Event created successfully');

        } catch (\Exception $e) {
            \Log::error('Failed to create event: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to create event: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        \Log::info('UPDATE method called with: ' . $request->method() . ' for ID: ' . $id);

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
            'scanner_student_ids' => 'nullable|array',
            'scanner_student_ids.*' => 'string',
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
                    ActivityLog::logForUser($actor, 'Attendance', 'Updated', 'Updated event: ' . (string) $event->event_name);
                }
            }

            return redirect()->back()->with('success', 'Event updated successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to update event: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to update event: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        \Log::info('DESTROY method called with ID: ' . $id . ' and method: ' . request()->method());
        \Log::info('Request URI: ' . request()->getRequestUri());
        \Log::info('Request headers:', request()->headers->all());

        try {
            $event = Event::findOrFail($id);
            $event->archive(); // Archive instead of delete

            if (Schema::hasTable('activity_logs')) {
                $actor = auth()->guard('admin')->user() ?: auth()->guard('program_head')->user() ?: auth()->user();
                if ($actor) {
                    ActivityLog::logForUser($actor, 'Attendance', 'Archived', 'Archived event: ' . (string) $event->event_name);
                }
            }

            // Debug: Log the archiving
            \Log::info('Event archived:', ['id' => $id, 'event' => $event->toArray()]);

            return redirect()->back()->with('success', 'Event archived successfully');

        } catch (\Exception $e) {
            \Log::error('Failed to archive event: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to archive event: ' . $e->getMessage());
        }
    }

    public function printEvent(Request $request, Event $event): \Illuminate\Http\Response
    {
        $courseFilter = $request->query('course') ?: $request->query('program');
        if ($courseFilter === 'all' || trim((string) $courseFilter) === '') {
            $courseFilter = null;
        }

        $yearLevelFilter = $request->query('year_level');
        if ($yearLevelFilter === 'all' || trim((string) $yearLevelFilter) === '') {
            $yearLevelFilter = null;
        }

        $data = $this->getEventStudentsAndAttendances($event, $courseFilter, $yearLevelFilter);
        $allStudents = $data['allStudents'];
        $attendances = $data['attendances'];

        // Group by course/program, then within course group by year level
        $groupedByCourse = $allStudents
            ->groupBy(fn($s) => trim((string) ($s->course ?? 'Unknown Program')));

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
            if (!$raw)
                return '';
            $raw = trim($raw);
            if ($raw === '' || $raw === '—')
                return '';
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
        $eventDateTimeLabel = trim($dateLabel . ($timeLabel ? ' | ' . $timeLabel : '') . ($locationLabel ? ' | ' . $locationLabel : ''));

        return response()->view('admin.attendance.print-sheet', [
            'event' => $event,
            'academicYear' => now()->format('Y') . ' - ' . (now()->addYear()->format('Y')),
            'eventDateTimeLabel' => $eventDateTimeLabel,
            'sections' => $sections,
            'totalAttendees' => $overallPresentCount,
            'totalAbsent' => $overallAbsentCount,
            'totalStudents' => $overallPresentCount + $overallAbsentCount,
            'selectedCourse' => $courseFilter,
            'selectedYearLevel' => $yearLevelFilter,
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

    /**
     * Clear dwell gap or missing mid-session attendance flag for an attendee.
     */
    public function clearAttendanceFlag(Attendance $attendance, Request $request)
    {
        $attendance->clearFlag(auth()->id());
        $attendance->update(['status' => 'present']);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'Attendance',
                'Flag Cleared',
                "Cleared dwell gap attendance flag for student #{$attendance->student_id} on event #{$attendance->event_id}.",
                $request
            );
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Attendance flag cleared successfully. Attendance verified.',
            ]);
        }

        return back()->with('success', 'Attendance flag cleared successfully.')->setStatusCode(303);
    }
}
