<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Attendance;
use App\Models\Event;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProgramHeadAttendanceController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';
        $search = (string) $request->query('search', '');

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
                ->when($search !== '', function ($query) use ($search) {
                    $query->search($search);
                })
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc')
                ->get();

            $eventIds = $eventModels->pluck('id')->all();

            $lateByEventId = collect();
            if ($program !== '' && !empty($eventIds) && Schema::hasTable('attendances')) {
                $lateByEventId = Attendance::query()
                    ->whereIn('event_id', $eventIds)
                    ->where('status', 'late')
                    ->whereHas('student', fn ($q) => $q->where('course', $program))
                    ->groupBy('event_id')
                    ->selectRaw('event_id, COUNT(*) as late_count')
                    ->pluck('late_count', 'event_id');
            }

            $events = $this->formatEventsList($eventModels, $program, $lateByEventId);
            $stats = $this->calculateStats($events, $lateByEventId, $program);

            return Inertia::render('program-head/Attendance', [
                'events' => $events,
                'program' => $program,
                'filters' => [
                    'search' => $search,
                ],
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            return Inertia::render('program-head/Attendance', [
                'events' => [],
                'program' => $program,
                'filters' => [
                    'search' => $search,
                ],
                'stats' => [
                    'totalEvents' => 0,
                    'totalAttendees' => 0,
                    'avgAttendanceRate' => 0,
                    'totalLate' => 0,
                    'totalStudents' => 0,
                ],
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function formatEventsList(\Illuminate\Support\Collection $eventModels, string $program, \Illuminate\Support\Collection $lateByEventId): \Illuminate\Support\Collection
    {
        return $eventModels->map(function (Event $event) use ($program, $lateByEventId) {
            if ($event->total_attendees !== $event->attendances_count) {
                $event->updateAttendanceCounts();
            }

            $eligibleStudentsCount = $this->programEligibleStudentsCount($event, $program);
            $scannedCount = $this->programAttendanceCount($event, $program);

            return [
                'id' => $event->id,
                'event' => $event->event_name,
                'dateTime' => $event->date_time,
                'organizer' => $event->organizer,
                'totalAttendees' => $eligibleStudentsCount,
                'presentCount' => $this->programAttendanceCount($event, $program, 'present'),
                'scannedCount' => $scannedCount,
                'lateCount' => (int) ($lateByEventId[$event->id] ?? 0),
                'eligibleStudentsCount' => $eligibleStudentsCount,
                'expectedAttendees' => $eligibleStudentsCount,
                'attendanceDenominator' => $eligibleStudentsCount,
                'status' => $event->status,
                'location' => $event->location,
                'event_time' => $event->event_time,
                'registration_end_time' => $event->registration_end_time,
                'registrationEndTime' => $event->registration_end_time,
                'scannerPortalActive' => Schema::hasColumn('events', 'scanner_portal_active') ? (bool) $event->scanner_portal_active : true,
            ];
        });
    }

    private function calculateStats(\Illuminate\Support\Collection $events, \Illuminate\Support\Collection $lateByEventId, string $program): array
    {
        $totalEvents = $events->count();
        $totalAttendees = (int) $events->sum('scannedCount');
        $avgAttendanceRate = $totalEvents > 0
            ? (int) round($events->sum(function (array $event) {
                $cap = (int) ($event['attendanceDenominator'] ?? 0);
                $scanned = (int) ($event['scannedCount'] ?? 0);
                return $cap > 0 ? ($scanned / $cap) * 100 : 0;
            }) / $totalEvents)
            : 0;

        $totalStudents = Student::query()->where('course', $program)->count();

        return [
            'totalEvents' => $totalEvents,
            'totalAttendees' => $totalAttendees,
            'avgAttendanceRate' => $avgAttendanceRate,
            'totalLate' => (int) $lateByEventId->sum(),
            'totalStudents' => $totalStudents,
        ];
    }

    public function studentsByCourse(Event $event)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        if (!$program) {
            return response()->json(['rows' => []]);
        }

        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        $studentsQuery = Student::query()->where('course', $program);
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
            ->get();

        $attendances = Attendance::where('event_id', $event->id)
            ->whereIn('student_id', $students->pluck('id')->all())
            ->get()
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($attendances) {
            $attendance = $attendances->get($student->id);
            $isScanned = ($attendance !== null && ($attendance->checked_in_at !== null || $attendance->scanned_at !== null));
            $status = $isScanned ? (string) ($attendance->status ?? 'present') : 'absent';

            return [
                'id' => (string) $student->id,
                'student_id' => (string) ($student->student_id ?? ''),
                'name' => (string) ($student->name ?? ''),
                'year_level' => (string) ($student->year_level ?? ''),
                'program' => (string) ($student->course ?? ''),
                'scanned' => $isScanned,
                'status' => $status,
                'time' => $attendance && $attendance->checked_in_at ? Carbon::parse($attendance->checked_in_at)->format('h:i A') : null,
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

        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        // Query eligible students for this event in this program
        $studentsQuery = Student::query();
        if ($program !== '') {
            $studentsQuery->where('course', $program);
        }
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
        if (!empty($eventYearLevels)) {
            $studentsQuery->whereIn('year_level', $eventYearLevels);
        }

        $eligibleStudents = $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // Fetch attendance records for this event
        $attendances = Attendance::where('event_id', $event->id)
            ->with('student')
            ->whereHas('student', function ($q) use ($program) {
                if ($program !== '') {
                    $q->where('course', $program);
                }
            })
            ->get()
            ->keyBy('student_id');

        $allStudents = $eligibleStudents;
        if ($allStudents->isEmpty()) {
            $allStudents = $attendances->map(fn($a) => $a->student)->filter()->values();
        } else {
            $attendedStudents = $attendances->map(fn($a) => $a->student)->filter();
            $allStudents = $allStudents->merge($attendedStudents)->unique('id')->values();
        }

        $limit = $request->has('limit') ? (int) $request->query('limit') : 2000;
        if ($limit < 1) $limit = 1;
        if ($limit > 2000) $limit = 2000;

        $rows = $allStudents
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
            ->take($limit);

        $expected = $this->programEligibleStudentsCount($event, $program);
        $scanned = $attendances->count();

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
        $eventYearLevels = is_array($event->year_levels) ? array_values(array_filter($event->year_levels, fn($y) => !\App\Services\Attendance\EventEligibilityService::isAllWildcard((string) $y))) : [];

        // Query eligible students for this event in this program
        $studentsQuery = Student::query();
        if ($program !== '') {
            $studentsQuery->where('course', $program);
        }
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
        if (!empty($eventYearLevels)) {
            $studentsQuery->whereIn('year_level', $eventYearLevels);
        }

        $eligibleStudents = $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // Fetch attendance records for this event
        $attendances = Attendance::where('event_id', $event->id)
            ->with('student')
            ->whereHas('student', function ($q) use ($program) {
                if ($program !== '') {
                    $q->where('course', $program);
                }
            })
            ->get()
            ->keyBy('student_id');

        $allStudents = $eligibleStudents;
        if ($allStudents->isEmpty()) {
            $allStudents = $attendances->map(fn($a) => $a->student)->filter()->values();
        } else {
            $attendedStudents = $attendances->map(fn($a) => $a->student)->filter();
            $allStudents = $allStudents->merge($attendedStudents)->unique('id')->values();
        }

        // Group by year level
        $groupedByYear = $allStudents->groupBy(function ($s) {
            $yl = trim((string) ($s->year_level ?? ''));
            return $yl !== '' ? $yl : 'General';
        });

        // Sort year levels (1st Year -> 1, 2nd Year -> 2, etc.)
        $sortedYears = $groupedByYear->keys()->sort(function ($a, $b) {
            $numA = preg_match('/(\d+)/', (string) $a, $mA) ? (int) $mA[1] : 999;
            $numB = preg_match('/(\d+)/', (string) $b, $mB) ? (int) $mB[1] : 999;
            if ($numA === $numB) {
                return strcmp((string) $a, (string) $b);
            }
            return $numA <=> $numB;
        });

        $sections = [];
        $overallPresentCount = 0;
        $overallAbsentCount = 0;

        foreach ($sortedYears as $yearLevel) {
            $yearStudents = $groupedByYear[$yearLevel];

            $sectionPresentCount = 0;
            $sectionAbsentCount = 0;

            $tableRows = $yearStudents
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

            $programStr = (string) ($program ?: 'Program');
            $yearLevelStr = (string) $yearLevel;
            $programYearLabel = ($yearLevelStr !== '' && $yearLevelStr !== 'General')
                ? ($program ? "{$program} — {$yearLevelStr}" : $yearLevelStr)
                : $programStr;

            $sections[] = [
                'course' => $programStr,
                'year_level' => $yearLevelStr,
                'program_year_label' => $programYearLabel,
                'tableRows' => $tableRows,
                'present_count' => $sectionPresentCount,
                'absent_count' => $sectionAbsentCount,
                'total_count' => count($tableRows),
            ];
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

    public function activateScannerPortal(Request $request, Event $event): RedirectResponse
    {
        if (Schema::hasColumn('events', 'scanner_portal_active')) {
            $event->update(['scanner_portal_active' => true]);
        }

        $scannerStudentIds = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];
        $dispatcher = app(StudentNotificationDispatcher::class);

        // 1) Notify specific scanner assignees
        $dispatcher->scannerAccessGranted($event, $scannerStudentIds);

        // 2) Notify ALL eligible students for this event's selected courses + year levels
        $dispatcher->attendanceScannerAvailable($event);

        return redirect()->route('program-head.attendance')->with('success', 'Scanner portal activated.')->setStatusCode(303);
    }

    public function scanAttendance(Request $request, Event $event): JsonResponse
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        if (! $programHead) {
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
}
