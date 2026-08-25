<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Attendance;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProgramHeadAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        $search = $request->query('search', '');
        
        try {
            $eventModels = Event::query()
                ->withCount('attendances')
                ->when(method_exists(Event::class, 'scopeActive'), fn ($query) => $query->active())
                ->when($program !== '' && Schema::hasColumn('events', 'courses'), function ($query) use ($program) {
                    $query->where(function ($sub) use ($program) {
                        $sub->whereJsonContains('courses', $program)
                            ->orWhereNull('courses')
                            ->orWhereJsonLength('courses', 0)
                            ->orWhere('courses', '[]');
                    });
                })
                ->when($search !== '', function($query) use ($search) {
                    $query->search($search);
                })
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc')
                ->get();

            $eventIds = $eventModels->pluck('id')->all();

            $lateByEventId = collect();
            if ($program !== '' && count($eventIds) > 0 && Schema::hasTable('attendances')) {
                $lateByEventId = Attendance::query()
                    ->whereIn('event_id', $eventIds)
                    ->where('status', 'late')
                    ->whereHas('student', fn ($q) => $q->where('course', $program))
                    ->groupBy('event_id')
                    ->selectRaw('event_id, COUNT(*) as late_count')
                    ->pluck('late_count', 'event_id');
            }

            $events = $eventModels
                ->map(function (Event $event) use ($program, $lateByEventId) {
                    if ($event->total_attendees !== $event->attendances_count) {
                        $event->updateAttendanceCounts();
                    }

                    $eligibleStudentsCount = $this->programEligibleStudentsCount($event, $program);
                    $expectedAttendees = $eligibleStudentsCount;
                    $attendanceDenominator = $eligibleStudentsCount;
                    $scannedCount = $this->programAttendanceCount($event, $program);

                    return [
                        'id' => $event->id,
                        'event' => $event->event_name,
                        'dateTime' => $event->date_time,
                        'organizer' => $event->organizer,
                        'totalAttendees' => $attendanceDenominator,
                        'presentCount' => $this->programAttendanceCount($event, $program, 'present'),
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
                        'scannerPortalActive' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true,
                    ];
                });

            $totalEvents = $events->count();
            $totalAttendees = (int) $events->sum('scannedCount');
            $avgAttendanceRate = $totalEvents > 0
                ? (int) round($events->sum(function ($event) {
                    $cap = (int) ($event['attendanceDenominator'] ?? 0);
                    $scanned = (int) ($event['scannedCount'] ?? 0);

                    return $cap > 0 ? ($scanned / $cap) * 100 : 0;
                }) / $totalEvents)
                : 0;

            $totalStudents = Student::query()->where('course', $program)->count();

            return Inertia::render('program-head/Attendance', [
                'events' => $events,
                'program' => $program,
                'filters' => [
                    'search' => $search,
                ],
                'stats' => [
                    'totalEvents' => $totalEvents,
                    'totalAttendees' => $totalAttendees,
                    'avgAttendanceRate' => $avgAttendanceRate,
                    'totalLate' => (int) $lateByEventId->sum(),
                    'totalStudents' => $totalStudents,
                ]
            ]);
        } catch (\Exception $e) {
            return Inertia::render('program-head/Attendance', [
                'events' => [],
                'program' => $program,
                'filters' => ['search' => clone $search],
                'stats' => [
                    'totalEvents' => 0,
                    'totalAttendees' => 0,
                    'avgAttendanceRate' => 0,
                    'totalLate' => 0,
                    'totalStudents' => 0,
                ],
                'error' => $e->getMessage()
            ]);
        }
    }

    public function studentsByCourse(Event $event)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        if (!$program) {
            return response()->json(['rows' => []]);
        }

        $students = Student::query()
            ->where('course', $program)
            ->when(Schema::hasColumn('students', 'is_archived'), function ($q) {
                $q->where(function ($sub) {
                    $sub->where('is_archived', false)->orWhereNull('is_archived');
                });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $attendances = Attendance::where('event_id', $event->id)
            ->get()
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($attendances) {
            $attendance = $attendances->get($student->student_id);
            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->name,
                'year_level' => $student->year_level,
                'program' => $student->course,
                'scanned' => $attendance !== null,
                'status' => $attendance ? $attendance->status : null,
                'time' => $attendance ? \Carbon\Carbon::parse($attendance->time)->format('h:i A') : null,
            ];
        });

        return response()->json(['rows' => $rows]);
    }

    public function logs(Request $request, Event $event): \Illuminate\Http\JsonResponse
    {
        $program = $this->programHeadProgram();
        if ($program === '') {
            return response()->json([
                'rows' => [],
                'counts' => ['total' => 0, 'present' => 0, 'late' => 0],
                'byCourse' => [],
                'server_time' => now()->toDateTimeString(),
            ]);
        }

        $limit = (int) $request->query('limit', 25);
        $limit = max(1, min($limit, 100));

        $baseAttendanceQuery = Attendance::query()
            ->where('event_id', $event->id)
            ->whereHas('student', fn ($q) => $q->where('course', $program));

        $rows = (clone $baseAttendanceQuery)
            ->with('student')
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
                    'checked_out_at' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->toDateTimeString() : null,
                    'time' => optional($attendance->checked_in_at)->format('h:i A') ?: '—',
                    'time_out' => $attendance->checked_out_at ? optional($attendance->checked_out_at)->format('h:i A') : '—',
                    'status' => (string) ($attendance->status ?? ''),
                ];
            })
            ->values();

        $expected = $this->programEligibleStudentsCount($event, $program);
        $scanned = (clone $baseAttendanceQuery)
            ->where(function ($q) {
                $q->whereNotNull('checked_in_at')
                    ->orWhereNotNull('scanned_at');
            })
            ->count();

        return response()->json([
            'event' => [
                'id' => $event->id,
                'name' => $event->event_name,
            ],
            'scanner_portal_active' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true,
            'counts' => [
                'total' => (int) (clone $baseAttendanceQuery)->count(),
                'present' => (int) (clone $baseAttendanceQuery)->where('status', 'present')->count(),
                'late' => (int) (clone $baseAttendanceQuery)->where('status', 'late')->count(),
            ],
            'byCourse' => [[
                'program' => $program,
                'expected' => $expected,
                'scanned' => $scanned,
                'remaining' => max($expected - $scanned, 0),
                'percentage' => $expected > 0 ? round(($scanned / $expected) * 100, 1) : 0,
            ]],
            'rows' => $rows,
            'server_time' => now()->toDateTimeString(),
        ]);
    }

    public function printEvent(Request $request, Event $event): \Illuminate\Http\Response
    {
        $program = $this->programHeadProgram();

        // Fetch only students who actually have attendance records for this event
        $attendances = Attendance::where('event_id', $event->id)
            ->with('student')
            ->whereHas('student', function ($q) use ($program) {
                if ($program !== '') {
                    $q->where('course', $program);
                }
            })
            ->orderBy('checked_in_at', 'asc')
            ->get();

        $tableRows = $attendances
            ->filter(fn ($a) => $a->student !== null)
            ->map(function ($a) {
                $checkedInAt = $a->checked_in_at
                    ? Carbon::parse($a->checked_in_at)->format('g:i A')
                    : ($a->scanned_at ? Carbon::parse($a->scanned_at)->format('g:i A') : '');

                $timeOut = $a->checked_out_at
                    ? Carbon::parse($a->checked_out_at)->format('g:i A')
                    : '';

                return [
                    'name' => (string) ($a->student->name ?? ''),
                    'major' => (string) ($a->student->course ?? ''),
                    'year_level' => (string) ($a->student->year_level ?? ''),
                    'checked_in_at' => $checkedInAt,
                    'time_out' => $timeOut,
                    'status' => ucfirst((string) ($a->status ?? 'present')),
                ];
            })
            ->sortBy('name')
            ->values()
            ->toArray();

        $dateLabel = $event->event_date ? Carbon::parse($event->event_date)->format('F d, Y') : '';
        $timeLabel = (string) ($event->event_time ?? '');
        $locationLabel = (string) ($event->location ?? '');
        $eventDateTimeLabel = trim($dateLabel.($timeLabel ? ' | '.$timeLabel : '').($locationLabel ? ' | '.$locationLabel : ''));

        $totalAttendees = count($tableRows);

        return response()->view('admin.attendance.print-sheet', [
            'event' => $event,
            'academicYear' => now()->format('Y').' - '.(now()->addYear()->format('Y')),
            'eventDateTimeLabel' => $eventDateTimeLabel,
            'sections' => [[
                'course' => $program ?: 'Program',
                'tableRows' => $tableRows,
            ]],
            'totalAttendees' => $totalAttendees,
        ]);
    }

    private function programHeadProgram(): string
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();

        return is_object($programHead) ? (string) ($programHead->program ?? '') : '';
    }

    private function programEligibleStudentsCount(Event $event, string $program): int
    {
        if ($program === '') {
            return 0;
        }

        return Student::query()
            ->where('course', $program)
            ->when(! empty($event->year_levels), function ($q) use ($event) {
                $q->whereIn('year_level', is_array($event->year_levels) ? $event->year_levels : []);
            })
            ->count();
    }

    private function programAttendanceCount(Event $event, string $program, ?string $status = null): int
    {
        if ($program === '') {
            return 0;
        }

        return Attendance::query()
            ->where('event_id', $event->id)
            ->whereHas('student', fn ($q) => $q->where('course', $program))
            ->when($status !== null, fn ($q) => $q->where('status', $status))
            ->count();
    }
}
