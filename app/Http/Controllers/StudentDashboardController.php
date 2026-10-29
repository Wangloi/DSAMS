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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StudentDashboardController extends Controller
{
    /**
     * Display the student dashboard.
     */
    public function index(?Request $request = null): \Inertia\Response
    {
        try {
            $user = Auth::guard('student')->user();
            
            $stats = $this->getStats($user);
            $pendingEvaluations = $this->getFormattedPendingEvaluations($user);
            $incidents = $this->getFormattedIncidents($user);
            $notifications = $this->getNotifications($user);
            $events = $this->getFormattedEvents($user);
            $attendedEvents = $this->getAttendedEventsHistory($user);
            $violations = $this->getViolationsList();
            $programs = $this->getProgramsList();

            $tabParam = $request ? $request->query('tab') : null;
            $initialTab = $tabParam === 'history' ? 'history' : 'schedule';

            Log::info('[StudentDashboardController] computed dashboard props', [
                'student_id' => $user instanceof Student ? $user->id : null,
                'notifications_count' => count($notifications),
                'attended_events_count' => count($attendedEvents),
            ]);

            return Inertia::render('student/Dashboard', [
                'user' => $user,
                'stats' => $stats,
                'evaluations' => $pendingEvaluations,
                'notifications' => $notifications,
                'recentNotifications' => $notifications,
                'events' => $events,
                'attendedEvents' => $attendedEvents,
                'incidents' => $incidents,
                'violations' => $violations,
                'programs' => $programs,
                'initialTab' => $initialTab,
            ]);
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::index] Error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            $user = Auth::guard('student')->user();

            return Inertia::render('student/Dashboard', [
                'user' => $user,
                'stats' => [
                    'active_incidents' => 0,
                    'event_attendance' => 0,
                    'pending_evaluations' => 0,
                ],
                'evaluations' => [],
                'notifications' => [],
                'recentNotifications' => [],
                'events' => [],
                'attendedEvents' => [],
                'incidents' => [],
                'violations' => [],
                'programs' => [],
                'initialTab' => 'schedule',
            ]);
        }
    }

    /**
     * Direct route to student event attendance history.
     */
    public function history(Request $request): \Inertia\Response
    {
        $request->merge(['tab' => 'history']);
        return $this->index($request);
    }

    /**
     * @param mixed $user
     * @return array<string, int>
     */
    private function getStats($user): array
    {
        try {
            return [
                'active_incidents' => $this->getActiveIncidentsCount($user),
                'event_attendance' => $this->getEventAttendanceCount($user),
                'pending_evaluations' => $user instanceof Student
                    ? self::pendingEvaluationsForStudent($user)->count()
                    : 0,
            ];
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getStats] ' . $e->getMessage());
            return [
                'active_incidents' => 0,
                'event_attendance' => 0,
                'pending_evaluations' => 0,
            ];
        }
    }

    /**
     * @param mixed $user
     * @return array<int, mixed>
     */
    private function getNotifications($user): array
    {
        if ($user instanceof Student) {
            try {
                return StudentNotificationPresenter::recentForStudent($user, 5);
            } catch (\Throwable $e) {
                Log::error('[StudentDashboardController::getNotifications] ' . $e->getMessage());
                return [];
            }
        }
        return [];
    }

    /**
     * @return \Illuminate\Support\Collection<int, mixed>
     */
    private function getViolationsList(): \Illuminate\Support\Collection
    {
        try {
            if (!Schema::hasTable('violations')) {
                return collect();
            }
            \App\Models\Violation::ensureDefaultViolations();
            return \App\Models\Violation::all();
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getViolationsList] ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getProgramsList(): \Illuminate\Support\Collection
    {
        try {
            if (!Schema::hasTable('programs')) {
                return collect();
            }

            return Program::where('is_active', true)
                ->orderBy('department')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'department'])
                ->map(fn ($p) => [
                    'id'         => $p->id,
                    'name'       => $p->name,
                    'code'       => $p->code,
                    'department' => $p->department ?? 'General',
                ]);
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getProgramsList] ' . $e->getMessage());
            return collect();
        }
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

    /**
     * @param mixed $user
     * @return \Illuminate\Support\Collection<int, array<string, string>>
     */
    private function getFormattedPendingEvaluations($user): \Illuminate\Support\Collection
    {
        if (!($user instanceof Student)) {
            return collect();
        }

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

    /**
     * @param mixed $user
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getFormattedIncidents($user): \Illuminate\Support\Collection
    {
        try {
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
                        $incident->status === 'Resolved' ? 5 : (
                            $incident->status === 'Escalated' ? 4 : (
                                $incident->status === 'Ongoing' ? 3 : 1
                            )
                        )
                    );

                    $isAnonymousIncident = !empty($incident->investigation_details['is_anonymous'])
                        || str_contains(strtolower((string) $incident->reported_by), 'anonymous');
                    $displayReportedBy = $isAnonymousIncident
                        ? 'Anonymous Student'
                        : ($incident->reported_by ?: 'Authorized Reporter');

                    return [
                        'id' => $incident->id,
                        'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                        'title' => $incident->incident_type,
                        'classification' => $incident->classification,
                        'date' => $date ? $date->format('F j, Y') : '—',
                        'time' => $time ? $time->format('g:i A') : '',
                        'location' => $incident->location ?? 'Office of the Dean of Student Affairs',
                        'status' => $incident->status,
                        'calling_phase' => $callingPhase,
                        'statusLabel' => $incident->status === 'Resolved' ? 'Resolved' : ($callingPhase >= 4 ? 'Outcome / Sanction' : ($callingPhase === 3 ? 'Meeting / Hearing' : ($callingPhase === 2 ? 'Investigation' : 'Notice to Appear Issued'))),
                        'calling_notice_sent_at' => $incident->calling_notice_sent_at ? (\Illuminate\Support\Carbon::parse($incident->calling_notice_sent_at)->toISOString()) : null,
                        'calling_notice_details' => $incident->calling_notice_details ?? null,
                        'action_data' => $incident->action_data ?? null,
                        'reported_by' => $displayReportedBy,
                        'description' => $incident->description,
                    ];
                });
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getFormattedIncidents] ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * @param mixed $user
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function getFormattedEvents($user = null): \Illuminate\Support\Collection
    {
        try {
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

            return $events->map(function ($event) use ($attendances, $user) {
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
                            $dateStr = $event->event_date instanceof Carbon ? $event->event_date->format('Y-m-d') : (string) $event->event_date;
                            $cutoff = Carbon::parse($dateStr . ' ' . $event->registration_end_time);
                            $blockAt = $cutoff->copy()->addMinutes(30);
                            if (Carbon::now()->greaterThanOrEqualTo($blockAt)) {
                                $isDone = true;
                            }
                        } catch (\Throwable) {}
                    }
                }

                $att = $attendances->get($event->id);
                $attendanceStatus = 'none';
                if ($att) {
                    if ($att->checked_out_at) {
                        $attendanceStatus = ($att->status === 'left_early') ? 'left_early' : 'checked_out';
                    } elseif ($isDone || in_array($att->status, ['incomplete', 'left_early'])) {
                        $attendanceStatus = 'incomplete';
                    } else {
                        $attendanceStatus = 'checked_in';
                    }
                }

                $allowedScanners = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];
                if (is_string($event->scanner_student_ids)) {
                    $decoded = json_decode($event->scanner_student_ids, true);
                    if (is_array($decoded)) {
                        $allowedScanners = $decoded;
                    }
                }
                $allowedScanners = array_values(array_unique(array_filter(array_map('strval', (array) $allowedScanners))));
                $legacyScanner = trim((string) ($event->scanner_student_id ?? ''));
                if ($legacyScanner !== '' && ! in_array($legacyScanner, $allowedScanners, true)) {
                    $allowedScanners[] = $legacyScanner;
                }

                $isScannerAssigned = false;
                if ($user instanceof Student && ! empty($allowedScanners)) {
                    $stSchoolId = trim((string) ($user->student_id ?? ''));
                    $stDbId = trim((string) ($user->id ?? ''));
                    $isScannerAssigned = ($stSchoolId !== '' && in_array($stSchoolId, $allowedScanners, true))
                        || ($stDbId !== '' && in_array($stDbId, $allowedScanners, true));
                }

                $formattedTime = '';
                if (! empty($event->event_time)) {
                    try {
                        $formattedTime = Carbon::parse($event->event_time)->format('g:i A');
                    } catch (\Throwable) {
                        $formattedTime = (string) $event->event_time;
                    }
                }

                $eventDateStr = '';
                if ($event->event_date) {
                    try {
                        $eventDateStr = $event->event_date instanceof Carbon
                            ? $event->event_date->format('F j, Y')
                            : Carbon::parse($event->event_date)->format('F j, Y');
                    } catch (\Throwable) {
                        $eventDateStr = (string) $event->event_date;
                    }
                }

                return [
                    'id'                    => $event->id,
                    'title'                 => $event->event_name,
                    'date'                  => $eventDateStr,
                    'time'                  => $formattedTime ?: (string) ($event->event_time ?? ''),
                    'location'              => $event->location,
                    'description'           => $event->description,
                    'status'                => $isDone ? 'completed' : $event->status,
                    'is_done'               => $isDone,
                    'is_scanner_assigned'   => $isScannerAssigned,
                    'scanner_portal_active' => $isScannerAssigned && !$isDone,
                    'attendance_type'       => (string) ($event->attendance_type ?? 'qr_scanner'),
                    'geofence_enabled'      => (bool) ($event->geofence_enabled ?? false),
                    'geofence_latitude'     => $event->geofence_latitude ? (float) $event->geofence_latitude : null,
                    'geofence_longitude'    => $event->geofence_longitude ? (float) $event->geofence_longitude : null,
                    'geofence_radius_m'     => (int) ($event->geofence_radius_m ?? 50),
                    'attendance_status'     => $attendanceStatus,
                    'checked_in_at'         => $att && $att->checked_in_at ? $att->checked_in_at->toDateTimeString() : null,
                    'checked_out_at'        => $att && $att->checked_out_at ? $att->checked_out_at->toDateTimeString() : null,
                ];
            });
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getFormattedEvents] ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, Evaluation>
     */
    public static function pendingEvaluationsForStudent(Student $student)
    {
        try {
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
                ->filter(function ($evaluation) use ($student) {
                    return $evaluation instanceof Evaluation && EvaluationEligibilityService::studentCanAccessEvaluation($student, $evaluation);
                })
                ->values();
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::pendingEvaluationsForStudent] ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Get events that the student actually attended with database attendance records.
     *
     * @param mixed $user
     * @return array<int, array<string, mixed>>
     */
    private function getAttendedEventsHistory($user): array
    {
        if (! ($user instanceof Student)) {
            return [];
        }

        try {
            if (! Schema::hasTable('attendances') || ! Schema::hasTable('events')) {
                return [];
            }

            $attendances = Attendance::query()
                ->where('student_id', $user->id)
                ->whereHas('event')
                ->with(['event'])
                ->orderByDesc('checked_in_at')
                ->orderByDesc('scanned_at')
                ->orderByDesc('id')
                ->get();

            return $attendances->map(function (Attendance $att) {
                $event = $att->event;

                $rawStatus = (string) ($att->status ?? '');
                $normalizedStatus = match ($rawStatus) {
                    'checked_out' => 'checked_out',
                    'checked_in'  => 'checked_in',
                    'late'        => 'late',
                    'left_early'  => 'left_early',
                    'excused'     => 'excused',
                    'incomplete'  => 'incomplete',
                    default       => ! empty($att->checked_out_at) ? 'checked_out' : 'checked_in',
                };

                $eventDateStr = '';
                $rawDate = null;
                if ($event && $event->event_date) {
                    try {
                        $cDate = $event->event_date instanceof Carbon
                            ? $event->event_date
                            : Carbon::parse($event->event_date);
                        $eventDateStr = $cDate->format('F j, Y');
                        $rawDate = $cDate->format('Y-m-d');
                    } catch (\Throwable) {
                        $eventDateStr = (string) $event->event_date;
                    }
                }

                $formattedTime = '';
                if ($event && ! empty($event->event_time)) {
                    try {
                        $formattedTime = Carbon::parse($event->event_time)->format('g:i A');
                    } catch (\Throwable) {
                        $formattedTime = (string) $event->event_time;
                    }
                }

                return [
                    'attendance_id'          => $att->id,
                    'event_id'               => $event ? $event->id : $att->event_id,
                    'title'                  => $event ? ($event->event_name ?? 'Untitled Event') : 'Archived Event',
                    'date'                   => $eventDateStr,
                    'raw_date'               => $rawDate,
                    'time'                   => $formattedTime,
                    'location'               => $event ? ($event->location ?? 'Campus') : 'Campus',
                    'organizer'              => $event ? ($event->organizer ?? 'Student Affairs') : 'Student Affairs',
                    'description'            => $event ? ($event->description ?? '') : '',
                    'attendance_type'        => (string) ($event->attendance_type ?? 'qr_scanner'),
                    'status'                 => $normalizedStatus,
                    'raw_status'             => $rawStatus,
                    'checked_in_at'          => $att->checked_in_at ? $att->checked_in_at->toIso8601String() : ($att->scanned_at ? $att->scanned_at->toIso8601String() : null),
                    'checked_out_at'         => $att->checked_out_at ? $att->checked_out_at->toIso8601String() : null,
                    'check_in_time'          => $att->checked_in_at ? $att->checked_in_at->format('g:i A') : ($att->scanned_at ? $att->scanned_at->format('g:i A') : null),
                    'check_out_time'         => $att->checked_out_at ? $att->checked_out_at->format('g:i A') : null,
                    'check_in_distance_m'    => $att->check_in_distance_m !== null ? (float) $att->check_in_distance_m : null,
                    'check_out_distance_m'   => $att->check_out_distance_m !== null ? (float) $att->check_out_distance_m : null,
                    'is_flagged'             => (bool) $att->is_flagged,
                    'flagged_reason'         => $att->flagged_reason,
                    'is_manual_override'     => (bool) $att->is_manual_override,
                    'manual_override_reason' => $att->manual_override_reason,
                    'mid_session_verified_at'=> $att->mid_session_verified_at ? $att->mid_session_verified_at->toIso8601String() : null,
                ];
            })->values()->all();
        } catch (\Throwable $e) {
            Log::error('[StudentDashboardController::getAttendedEventsHistory] ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return [];
        }
    }
}
