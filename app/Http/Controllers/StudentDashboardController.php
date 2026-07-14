<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Incident;
use App\Models\Student;
use App\Services\EvaluationEligibilityService;
use App\Services\StudentNotificationPresenter;
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

        $events = $this->getFormattedEvents();

        Log::info('[StudentDashboardController] computed notifications', [
            'student_id' => $user instanceof Student ? $user->id : null,
            'notifications_count' => is_array($notifications) ? count($notifications) : 0,
            'notifications_first' => is_array($notifications) && count($notifications) > 0 ? array_intersect_key((array) $notifications[0], array_flip(['id','type','title','subtitle','eventId','evaluationId'])) : null,
            'notifications_raw_first_type' => is_array($notifications) && count($notifications) > 0 ? ($notifications[0]['type'] ?? null) : null,
        ]);

        return Inertia::render('student/Dashboard', [
            'user' => $user,
            'stats' => $stats,
            'evaluations' => $pendingEvaluations,
            'notifications' => $notifications,
            'recentNotifications' => $notifications,
            'events' => $events,
            'incidents' => $incidents,
        ]);
    }

    private function getActiveIncidentsCount($user): int
    {
        if (!Schema::hasTable('incidents') || !$user) {
            return 0;
        }
        return Incident::whereJsonContains('students_involved', $user->id)->where('status', 'Pending')->count();
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

        return Incident::whereJsonContains('students_involved', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($incident) {
                return [
                    'id' => $incident->id,
                    'title' => $incident->incident_type,
                    'date' => $incident->incident_date->format('M d, Y'),
                    'statusLabel' => $incident->status === 'Pending' ? 'Under Review' : 'Resolved',
                ];
            });
    }

    private function getFormattedEvents()
    {
        if (!Schema::hasTable('events')) {
            return collect();
        }

        return Event::active()
            ->orderBy('event_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($event) {
                return [
                    'id'                   => $event->id,
                    'title'                => $event->event_name,
                    'date'                 => $event->event_date->format('M d, Y'),
                    'time'                 => $event->event_time,
                    'location'             => $event->location,
                    'description'          => $event->description,
                    'status'               => $event->status,
                    'scanner_portal_active' => (bool) ($event->scanner_portal_active ?? false),
                ];
            });
    }

    /**
     * @return \Illuminate\Support\Collection<int, Evaluation>
     */
    private static function pendingEvaluationsForStudent(Student $student)
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
