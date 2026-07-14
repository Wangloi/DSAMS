<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Incident;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProgramHeadDashboardController extends Controller
{
    public function index(Request $request)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        $activities = $this->getActivities();
        $events = $this->getEvents();

        $selectedEventId = null;
        $requestedEvent = (string) $request->query('event', '');
        if ($requestedEvent !== '' && ctype_digit($requestedEvent)) {
            $selectedEventId = $requestedEvent;
        } elseif (!empty($events)) {
            $selectedEventId = (string) ($events[0]['id'] ?? '');
        }

        $attendanceRows = $this->getAttendanceRows($program, $selectedEventId);

        $violationsData = $this->getViolationsData($program);
        $violationsByYearLevel = $violationsData['by_year_level'];
        $totalViolationsCount = $violationsData['total'];

        // Recent notifications for the bell icon (latest announcements for program heads)
        $recentNotifications = $this->getRecentNotifications();

        return Inertia::render('ProgramHeadDashboard', [
            'user'                  => $programHead,
            'program'               => $program,
            'recentActivities'      => $activities,
            'events'                => $events,
            'selectedEventId'       => $selectedEventId,
            'attendanceRows'        => $attendanceRows,
            'violationsByYearLevel' => $violationsByYearLevel,
            'totalViolationsCount'  => $totalViolationsCount,
            'recentNotifications'   => $recentNotifications,
        ]);
    }

    public function students(Request $request)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        $students = [];
        if ($program !== '' && Schema::hasTable('students')) {
            $studentsQuery = Student::where('course', $program);
            
            if (Schema::hasColumn('students', 'is_archived')) {
                $studentsQuery->where(function ($q) {
                    $q->where('is_archived', false)->orWhereNull('is_archived');
                });
            }

            $students = $studentsQuery
                ->orderBy('year_level')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get(['id', 'student_id', 'name', 'course', 'year_level', 'status'])
                ->map(function ($student) {
                    return [
                        'id' => (string) $student->id,
                        'student_id' => (string) ($student->student_id ?? ''),
                        'name' => (string) ($student->name ?? ''),
                        'course' => (string) ($student->course ?? ''),
                        'year_level' => (string) ($student->year_level ?? ''),
                        'status' => (string) ($student->status ?? 'Active'),
                    ];
                })
                ->all();
        }

        $recentNotifications = $this->getRecentNotifications();

        return Inertia::render('program-head/StudentsList', [
            'user' => $programHead,
            'program' => $program,
            'students' => $students,
            'recentNotifications' => $recentNotifications,
        ]);
    }

    private function getEvents(): array
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $eventsQuery = Event::query();

        if (Schema::hasColumn('events', 'archived_at')) {
            $eventsQuery->whereNull('archived_at');
        }

        return $eventsQuery
            ->orderByDesc('event_date')
            ->orderByDesc('event_time')
            ->limit(200)
            ->get(['id', 'event_name', 'event_date', 'event_time', 'status'])
            ->map(function (Event $event) {
                return [
                    'id' => (string) $event->id,
                    'event_name' => (string) ($event->event_name ?? ''),
                    'event_date' => $event->event_date?->format('Y-m-d') ?? '',
                    'event_time' => (string) ($event->event_time ?? ''),
                    'status' => (string) ($event->status ?? ''),
                ];
            })
            ->values()
            ->all();
    }

    private function getAttendanceRows(string $program, ?string $selectedEventId): array
    {
        if (
            $program === ''
            || !$selectedEventId
            || !Schema::hasTable('students')
            || !Schema::hasColumn('students', 'course')
        ) {
            return [];
        }

        $studentsQuery = Student::query()->where('course', $program);

        if (Schema::hasColumn('students', 'is_archived')) {
            $studentsQuery->where(function ($q) {
                $q->where('is_archived', false)->orWhereNull('is_archived');
            });
        }

        $students = $studentsQuery
            ->orderBy('year_level')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(1000)
            ->get(['id', 'student_id', 'name', 'course', 'year_level']);

        $attendanceByStudentId = [];
        if (Schema::hasTable('attendances')) {
            $attendanceByStudentId = Attendance::query()
                ->where('event_id', (int) $selectedEventId)
                ->whereIn('student_id', $students->pluck('id'))
                ->get(['student_id', 'status', 'scanned_at'])
                ->keyBy('student_id')
                ->all();
        }

        return $students
            ->map(function (Student $student) use ($attendanceByStudentId) {
                $attendance = $attendanceByStudentId[$student->id] ?? null;
                $status = $attendance ? (string) ($attendance->status ?? 'present') : 'absent';

                return [
                    'id' => (string) $student->id,
                    'student_id' => (string) ($student->student_id ?? ''),
                    'name' => (string) ($student->name ?? ''),
                    'course' => (string) ($student->course ?? ''),
                    'year_level' => (string) ($student->year_level ?? ''),
                    'status' => $status,
                    'scanned_at' => $attendance?->scanned_at?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();
    }

    private function getViolationsData(string $program): array
    {
        $violationsByYearLevel = [
            ['label' => '1st Year', 'value' => 0, 'color' => 'bg-blue-600'],
            ['label' => '2nd Year', 'value' => 0, 'color' => 'bg-emerald-500'],
            ['label' => '3rd Year', 'value' => 0, 'color' => 'bg-amber-500'],
            ['label' => '4th Year', 'value' => 0, 'color' => 'bg-rose-500'],
        ];

        $totalViolationsCount = 0;

        if ($program !== '' && Schema::hasTable('incidents')) {
            $programStudents = Student::where('course', $program)->get(['student_id', 'year_level']);
            $programStudentIds = $programStudents->pluck('student_id')->toArray();
            $yearLevelByStudentId = $programStudents->pluck('year_level', 'student_id')->toArray();

            $incidents = Incident::where('is_archived', false)->get();

            foreach ($incidents as $incident) {
                $involved = (array) ($incident->students_involved ?? []);
                $foundProgramStudent = false;
                $incidentYears = [];

                foreach ($involved as $id) {
                    if (in_array((string)$id, $programStudentIds)) {
                        $foundProgramStudent = true;
                        $year = (string)($yearLevelByStudentId[(string)$id] ?? '');
                        if ($year !== '') {
                            $incidentYears[] = $year;
                        }
                    }
                }

                if ($foundProgramStudent) {
                    $totalViolationsCount++;
                    $incidentYears = array_unique($incidentYears);
                    foreach ($incidentYears as $year) {
                        foreach ($violationsByYearLevel as &$item) {
                            if (stripos($year, $item['label']) !== false || stripos($item['label'], $year) !== false) {
                                $item['value']++;
                            }
                        }
                    }
                }
            }
        }

        return [
            'by_year_level' => $violationsByYearLevel,
            'total' => $totalViolationsCount,
        ];
    }

    private function getActivities(): array
    {
        if (!Schema::hasTable('activity_logs')) {
            return [];
        }

        $logs = ActivityLog::query()
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return $logs
            ->map(function (ActivityLog $log) {
                $module = strtolower((string) ($log->module ?? ''));
                $action = strtolower((string) ($log->action ?? ''));
                $details = (string) ($log->details ?? '');

                $type = 'notifications';
                if (str_contains($module, 'attendance')) {
                    $type = 'attendance';
                } elseif (str_contains($module, 'announcement')) {
                    $type = 'announcements';
                } elseif (str_contains($module, 'incident') || str_contains($module, 'violation')) {
                    $type = 'violations';
                }

                $title = trim((string) ($log->module ?? 'Activity') . ' ' . (string) ($log->action ?? ''));
                $subtitle = $details !== '' ? $details : 'Recent system update.';

                return [
                    'id' => (string) $log->id,
                    'type' => $type,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'time' => $log->created_at?->diffForHumans() ?? '',
                ];
            })
            ->values()
            ->all();
    }

    private function getRecentNotifications(): array
    {
        if (!Schema::hasTable('announcements')) {
            return [];
        }

        return Announcement::query()
            ->where('is_archived', false)
            ->where(function ($q) {
                $q->where('target_audience', 'all')
                  ->orWhere('target_audience', 'head');
            })
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($a) {
                return [
                    'id'       => (string) $a->id,
                    'type'     => 'announcement',
                    'title'    => (string) $a->title,
                    'subtitle' => (string) ($a->content ?? ''),
                    'timeAgo'  => $a->created_at?->diffForHumans() ?? '',
                ];
            })
            ->values()
            ->all();
    }
}
