<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Incident;
use App\Models\Program;
use App\Models\Student;
use App\Services\EvaluationEligibilityService;
use App\Services\StudentNotificationPresenter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StudentDashboardController extends Controller
{
    /**
     * @return \Inertia\Response
     */
    public function index()
    {
        /** @var Student|\App\Models\User|null $user */
        $user = Auth::guard('student')->user() ?: auth()->user();
        
        $stats = [
            'active_incidents' => $this->getActiveIncidentsCount($user),
            'event_attendance' => $this->getEventAttendanceCount($user),
            'pending_evaluations' => $user instanceof Student
                ? self::pendingEvaluationsForStudent($user)->count()
                : 0,
        ];

        $pendingEvaluations = $user instanceof Student
            ? $this->getFormattedPendingEvaluations($user)
            : collect();

        $incidents = $this->getFormattedIncidents($user);

        $notifications = $user instanceof Student
            ? StudentNotificationPresenter::recentForStudent($user, 5)
            : [];

        $events = $this->getFormattedEvents($user);


        Log::info('[StudentDashboardController] computed notifications', [
            'student_id' => $user instanceof Student ? $user->id : null,
            'notifications_count' => is_array($notifications) ? count($notifications) : 0,
            'notifications_first' => is_array($notifications) && count($notifications) > 0 ? array_intersect_key((array) $notifications[0], array_flip(['id','type','title','subtitle','eventId','evaluationId'])) : null,
            'notifications_raw_first_type' => is_array($notifications) && count($notifications) > 0 ? ($notifications[0]['type'] ?? null) : null,
        ]);

        \App\Models\Violation::ensureDefaultViolations();
        $violations = \App\Models\Violation::all();
        
        // Fetch active programs for admission slip form (grouped by department)
        $programs = Schema::hasTable('programs')
            ? Program::where('is_active', true)
                ->orderBy('department')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'department'])
                ->map(fn ($p) => [
                    'id'         => $p->id,
                    'name'       => $p->name,
                    'code'       => $p->code,
                    'department' => $p->department ?? 'General',
                ])
            : collect();

        return Inertia::render('student/Dashboard', [
            'user' => $user,
            'stats' => $stats,
            'evaluations' => $pendingEvaluations,
            'notifications' => $notifications,
            'recentNotifications' => $notifications,
            'events' => $events,
            'incidents' => $incidents,
            'violations' => $violations,
            'programs' => $programs,
        ]);
    }

    private function getActiveIncidentsCount($user): int
    {
        if (!Schema::hasTable('incidents') || !$user) {
            return 0;
        }

        $studentDbId = (string) $user->id;
        $studentSchoolId = (string) ($user->student_id ?? '');

        return Incident::where('is_archived', false)
            ->where('status', '!=', 'Resolved')
            ->where(function ($q) use ($studentDbId, $studentSchoolId) {
                $q->whereJsonContains('students_involved', $studentDbId)
                  ->orWhereJsonContains('students_involved', ['id' => $studentDbId])
                  ->orWhereJsonContains('students_involved', ['id' => (int) $studentDbId]);
                if ($studentSchoolId) {
                    $q->orWhereJsonContains('students_involved', $studentSchoolId)
                      ->orWhereJsonContains('students_involved', ['id' => $studentSchoolId]);
                }
            })
            ->count();
    }

    private function getEventAttendanceCount($user): int
    {
        if (!Schema::hasTable('attendances') || !$user) {
            return 0;
        }
        return Attendance::where('student_id', $user->id)->count();
    }

    private function getFormattedPendingEvaluations(Student $user)
    {
        return self::pendingEvaluationsForStudent($user)
            ->take(5)
            ->map(function ($evaluation) {
                $eventName = $evaluation->eventRecord ? (string) ($evaluation->eventRecord->event_name ?? '') : '';
                $eventDate = $evaluation->eventRecord && $evaluation->eventRecord->event_date
                    ? optional($evaluation->eventRecord->event_date)->format('M d, Y')
                    : '';

                return [
                    'id' => (string) $evaluation->id,
                    'title' => (string) ($evaluation->name ?? $eventName ?: 'Evaluation Form'),
                    'date' => $eventDate,
                    'statusLabel' => 'Pending',
                ];
            })
            ->values();
    }

    private function getFormattedIncidents($user)
    {
        if (!Schema::hasTable('incidents') || !$user) {
            return collect();
        }

        $studentDbId = (string) $user->id;
        $studentSchoolId = (string) ($user->student_id ?? '');

        return Incident::where('is_archived', false)
            ->where(function ($q) use ($studentDbId, $studentSchoolId) {
                $q->whereJsonContains('students_involved', $studentDbId)
                  ->orWhereJsonContains('students_involved', ['id' => $studentDbId])
                  ->orWhereJsonContains('students_involved', ['id' => (int) $studentDbId]);
                if ($studentSchoolId) {
                    $q->orWhereJsonContains('students_involved', $studentSchoolId)
                      ->orWhereJsonContains('students_involved', ['id' => $studentSchoolId]);
                }
            })
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($incident) {
                $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
                $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
                $callingPhase = $incident->calling_phase ?? (
                    $incident->status === 'Resolved' ? 8 : (
                        $incident->status === 'Escalated' ? 7 : (
                            $incident->status === 'Ongoing' ? 4 : 1
                        )
                    )
                );

                return [
                    'id' => $incident->id,
                    'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                    'title' => $incident->incident_type,
                    'classification' => $incident->classification,
                    'date' => $date ? $date->format('M d, Y') : '—',
                    'time' => $time ? $time->format('h:i A') : '',
                    'location' => $incident->location ?? 'Office of the Dean of Student Affairs',
                    'status' => $incident->status,
                    'calling_phase' => $callingPhase,
                    'statusLabel' => $incident->status === 'Resolved' ? 'Resolved' : ($callingPhase >= 4 ? 'Under Review / Hearing' : 'Notice to Appear Issued'),
                    'reported_by' => $incident->reported_by,
                    'description' => $incident->description,
                ];
            });
    }

    private function getFormattedEvents($user = null)
    {
        if (!Schema::hasTable('events')) {
            return collect();
        }

        $events = Event::active()
            ->orderBy('event_date', 'desc')
            ->take(10)
            ->get();

        $studentId = ($user instanceof Student) ? $user->id : null;
        $attendances = ($studentId && Schema::hasTable('attendances'))
            ? Attendance::where('student_id', $studentId)
                ->whereIn('event_id', $events->pluck('id'))
                ->get()
                ->keyBy('event_id')
            : collect();

        return $events->map(function ($event) use ($attendances) {
            $att = $attendances->get($event->id);
            $attendanceStatus = 'none';
            if ($att) {
                $attendanceStatus = $att->checked_out_at ? 'checked_out' : 'checked_in';
            }

            $isDone = false;
            $statusLower = strtolower((string) ($event->status ?? ''));
            if ($statusLower === 'completed' || $statusLower === 'cancelled') {
                $isDone = true;
            } elseif ($event->event_date) {
                $eventDay = Carbon::parse($event->event_date)->startOfDay();
                $today = Carbon::now()->startOfDay();
                if ($eventDay->lt($today)) {
                    $isDone = true;
                } elseif ($eventDay->eq($today) && !empty($event->registration_end_time)) {
                    try {
                        $cutoff = Carbon::parse($event->event_date->format('Y-m-d') . ' ' . $event->registration_end_time);
                        $blockAt = $cutoff->copy()->addMinutes(30);
                        if (Carbon::now()->greaterThanOrEqualTo($blockAt)) {
                            $isDone = true;
                        }
                    } catch (\Throwable) {}
                }
            }

            return [
                'id'                    => $event->id,
                'title'                 => $event->event_name,
                'date'                  => $event->event_date ? $event->event_date->format('M d, Y') : '',
                'time'                  => $event->event_time,
                'location'              => $event->location,
                'description'           => $event->description,
                'status'                => $isDone ? 'completed' : $event->status,
                'is_done'               => $isDone,
                'scanner_portal_active' => (bool) ($event->scanner_portal_active ?? false) && !$isDone,
                'geofence_enabled'      => (bool) ($event->geofence_enabled ?? false),
                'geofence_latitude'     => $event->geofence_latitude ? (float) $event->geofence_latitude : null,
                'geofence_longitude'    => $event->geofence_longitude ? (float) $event->geofence_longitude : null,
                'geofence_radius_m'     => (int) ($event->geofence_radius_m ?? 50),
                'attendance_status'     => $attendanceStatus,
                'checked_in_at'         => $att && $att->checked_in_at ? $att->checked_in_at->toDateTimeString() : null,
                'checked_out_at'        => $att && $att->checked_out_at ? $att->checked_out_at->toDateTimeString() : null,
            ];
        });
    }

    /**
     * @return \Illuminate\Support\Collection<int, Evaluation>
     */
    public static function pendingEvaluationsForStudent(Student $student)
    {
        if (! Schema::hasTable('evaluations') || ! Schema::hasTable('evaluation_responses') || ! Schema::hasTable('attendances')) {
            return collect();
        }

        return Evaluation::query()
            ->where('is_active', true)
            ->where('is_archived', false)
            ->whereDoesntHave('responses', function ($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->with(['eventRecord:id,event_name,event_date,courses,year_levels,archived_at'])
            ->orderByDesc('id')
            ->get()
            ->filter(fn (Evaluation $evaluation) => EvaluationEligibilityService::studentCanAccessEvaluation($student, $evaluation))
            ->values();
    }
}
