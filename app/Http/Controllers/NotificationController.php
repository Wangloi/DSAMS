<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index()
    {
        $user = auth('admin')->user();
        if (!$user) {
            abort(403);
        }

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function (DatabaseNotification $notification) {
                // Formatting logic similar to HandleInertiaRequests
                $data = $notification->data;
                $type = (string) ($data['type'] ?? '');
                $title = (string) ($data['title'] ?? $data['message'] ?? 'Notification');
                $subtitle = (string) ($data['subtitle'] ?? '');
                $eventId = null;
                $evaluationId = null;
                
                if (in_array($type, ['admission_slip_requested', 'admission_slip_status_updated'])) {
                    $status = (string) ($data['status'] ?? ($type === 'admission_slip_requested' ? 'PENDING' : ''));
                    $slipId = (string) ($data['slip_id'] ?? '');
                    if ($type === 'admission_slip_requested') {
                        $studentName = (string) ($data['student_name'] ?? '');
                        $subtitle = trim(implode(' • ', array_filter([
                            $slipId !== '' ? "Admission Slip #{$slipId}" : '',
                            $studentName,
                            $status,
                        ])));
                    } else {
                        $subtitle = trim("Admission Slip #{$slipId} • {$status}");
                    }
                }

                if ($type === 'incident_reported_admin') {
                    $incidentType = (string) ($data['incident_type'] ?? '');
                    $subtitle = (string) ($data['subtitle'] ?? $data['message'] ?? '');
                }

                if (in_array($type, ['activity_plan_submitted_admin', 'activity_plan_status_updated'])) {
                    $eventId = $data['event_id'] ?? null;
                }

                $slipId = $data['slip_id'] ?? null;
                $incidentId = $data['incident_id'] ?? $data['id'] ?? null;

                return [
                    'id' => $notification->id,
                    'type' => $type,
                    'eventId' => $eventId,
                    'evaluationId' => $evaluationId,
                    'slipId' => $slipId,
                    'incidentId' => $incidentId,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'timeAgo' => $notification->created_at?->diffForHumans() ?? '',
                    'is_read' => $notification->read_at !== null,
                    'created_at' => $notification->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('admin-dashboard/notifications/index', [
            'paginatedNotifications' => $notifications
        ]);
    }

    public function studentIndex()
    {
        $user = auth('student')->user();
        if (!$user) {
            abort(403);
        }

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function (DatabaseNotification $notification) {
                // Formatting logic similar to HandleInertiaRequests
                $data = $notification->data;
                $type = (string) ($data['type'] ?? '');
                $title = (string) ($data['title'] ?? $data['message'] ?? 'Notification');
                $subtitle = (string) ($data['subtitle'] ?? '');
                $eventId = null;
                $evaluationId = null;

                if ($type === 'scanner_portal_access_granted') {
                    $eventId = $data['event_id'] ?? null;
                    $subtitle = (string) ($data['message'] ?? $subtitle);
                }

                if ($type === 'evaluation_available') {
                    $evaluationId = $data['evaluation_id'] ?? null;
                    $eventId = $data['event_id'] ?? null;
                    $subtitle = (string) ($data['message'] ?? $subtitle);
                }

                if (in_array($type, ['admission_slip_status_updated'])) {
                    $status = (string) ($data['status'] ?? '');
                    $slipId = (string) ($data['slip_id'] ?? '');
                    $subtitle = trim("Admission Slip #{$slipId} • {$status}");
                }

                if ($type === 'incident_reported_student') {
                    $incidentType = (string) ($data['incident_type'] ?? '');
                    $subtitle = (string) ($data['subtitle'] ?? $data['message'] ?? '');
                }

                return [
                    'id' => $notification->id,
                    'type' => $type,
                    'eventId' => $eventId,
                    'evaluationId' => $evaluationId,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'timeAgo' => $notification->created_at?->diffForHumans() ?? '',
                    'is_read' => $notification->read_at !== null,
                    'created_at' => $notification->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('student/notifications/index', [
            'paginatedNotifications' => $notifications
        ]);
    }

    public function programHeadIndex()
    {
        $user = auth('program_head')->user();
        if (!$user) {
            abort(403);
        }

        $notifications = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function (DatabaseNotification $notification) {
                $data = $notification->data;
                $type = (string) ($data['type'] ?? '');
                $title = (string) ($data['title'] ?? $data['message'] ?? 'Notification');
                $subtitle = (string) ($data['subtitle'] ?? '');
                $eventId = null;
                $evaluationId = null;

                if (in_array($type, ['activity_plan_submitted_admin', 'activity_plan_status_updated'])) {
                    $eventId = $data['event_id'] ?? null;
                    $eventName = (string) ($data['event_name'] ?? '');
                    $status = (string) ($data['approval_status'] ?? '');
                    $subtitle = (string) ($data['message'] ?? trim(implode(' • ', array_filter([$eventName, strtoupper($status)]))));
                }

                if (in_array($type, ['admission_slip_requested', 'admission_slip_status_updated'])) {
                    $status = (string) ($data['status'] ?? ($type === 'admission_slip_requested' ? 'PENDING' : ''));
                    $slipId = (string) ($data['slip_id'] ?? '');
                    $studentName = (string) ($data['student_name'] ?? '');
                    $subtitle = trim(implode(' • ', array_filter([
                        $slipId !== '' ? "Admission Slip #{$slipId}" : '',
                        $studentName,
                        $status,
                    ])));
                }

                if ($type === 'incident_reported_program_head' || $type === 'incident_reported_admin') {
                    $incidentType = (string) ($data['incident_type'] ?? '');
                    $subtitle = (string) ($data['subtitle'] ?? $data['message'] ?? '');
                }

                $slipId = $data['slip_id'] ?? null;
                $incidentId = $data['incident_id'] ?? $data['id'] ?? null;

                return [
                    'id' => $notification->id,
                    'type' => $type,
                    'eventId' => $eventId,
                    'evaluationId' => $evaluationId,
                    'slipId' => $slipId,
                    'incidentId' => $incidentId,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'timeAgo' => $notification->created_at?->diffForHumans() ?? '',
                    'is_read' => $notification->read_at !== null,
                    'created_at' => $notification->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('program-head/notifications/index', [
            'paginatedNotifications' => $notifications
        ]);
    }
    public function markAsRead($id)
    {
        $user = auth('admin')->user() ?? auth('student')->user() ?? auth('program_head')->user() ?? auth('dsa')->user();
        if ($user && method_exists($user, 'notifications')) {
            $notification = $user->notifications()->find($id);
            if ($notification) {
                $notification->markAsRead();
            }
        }
        
        return response()->json(['success' => true]);
    }
    
    public function markAllAsRead()
    {
        $user = auth('admin')->user() ?? auth('student')->user() ?? auth('program_head')->user() ?? auth('dsa')->user();
        if ($user && method_exists($user, 'unreadNotifications')) {
            $user->unreadNotifications->markAsRead();
        }
        
        return response()->json(['success' => true]);
    }
}
