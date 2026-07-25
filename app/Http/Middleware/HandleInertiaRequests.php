<?php

namespace App\Http\Middleware;

use App\Models\Event;
use App\Models\Student;
use App\Services\StudentNotificationPresenter;
use App\Support\ActiveAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $activeGuard = ActiveAuth::resolve($request);
        $user = $activeGuard ? Auth::guard($activeGuard)->user() : Auth::user();

        $unreadNotifications = 0;
        $recentNotifications = [];

        if ($user instanceof Student) {
            try {
                $recentNotifications = StudentNotificationPresenter::recentForStudent($user, 5);
                $unreadNotifications = StudentNotificationPresenter::unreadCountForStudent($user);
            } catch (\Exception $e) {
                \Log::error('Failed to build student notifications', [
                    'message' => $e->getMessage(),
                ]);
            }
        }

        try {
            if (! ($user instanceof Student) && $user && Schema::hasTable('notifications') && method_exists($user, 'unreadNotifications')) {
                $unreadNotifications = $user->unreadNotifications()->count();
            }
        } catch (\Exception $e) {
            \Log::error('Error getting unread notifications', [
                'error' => $e->getMessage(),
            ]);
            $unreadNotifications = 0;
        }

        try {
            if (! ($user instanceof Student) && $user && Schema::hasTable('notifications') && method_exists($user, 'notifications')) {
                $notifications = $user->notifications()
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get();

                \Log::info('Fetched notifications', [
                    'user_id' => $user->id,
                    'user_type' => get_class($user),
                    'count' => $notifications->count(),
                ]);

                $recentNotificationsCollection = $notifications->map(function ($notification) {
                    // Decode JSON data if it's a string
                    $data = $notification->data;
                    if (is_string($data)) {
                        $data = json_decode($data, true) ?? [];
                    }
                    if (!is_array($data)) {
                        $data = [];
                    }
                    
                    $type = (string) ($data['type'] ?? '');
                    $title = (string) ($data['title'] ?? $data['message'] ?? 'Notification');
                    $subtitle = (string) ($data['subtitle'] ?? '');
                    $eventId = null;
                    $evaluationId = null;

                    if ($type === 'admission_slip_status_updated') {
                        $status = (string) ($data['status'] ?? '');
                        $slipId = (string) ($data['slip_id'] ?? '');
                        $subtitle = trim("Admission Slip #{$slipId} • {$status}");
                    }

                    if ($type === 'admission_slip_requested') {
                        $status = (string) ($data['status'] ?? 'PENDING');
                        $slipId = (string) ($data['slip_id'] ?? '');
                        $studentName = (string) ($data['student_name'] ?? '');
                        $subtitle = trim(implode(' • ', array_filter([
                            $slipId !== '' ? "Admission Slip #{$slipId}" : '',
                            $studentName,
                            $status,
                        ])));
                    }

                    if ($type === 'admission_slip_submitted') {
                        $slipId = (string) ($data['slip_id'] ?? '');
                        $subtitle = 'Please visit the Office of Student Affairs (OSA) for approval and to collect your printed admission slip.';
                    }

                    if ($type === 'scanner_portal_access_granted') {
                        $eventName = (string) ($data['event_name'] ?? '');
                        $eventDate = (string) ($data['event_date'] ?? '');
                        $subtitle = trim(implode(' • ', array_filter([$eventName, $eventDate])));
                        $eventId = $data['event_id'] ?? null;
                    }

                    if ($type === 'evaluation_available') {
                        $eventName = (string) ($data['event_name'] ?? '');
                        $eventDate = (string) ($data['event_date'] ?? '');
                        $evaluationName = (string) ($data['evaluation_name'] ?? '');
                        $subtitle = trim(implode(' • ', array_filter([$eventName ?: $evaluationName, $eventDate])));
                        $eventId = $data['event_id'] ?? null;
                        $evaluationId = $data['evaluation_id'] ?? null;
                    }

                    if ($type === 'announcement_created') {
                        $announcementTitle = (string) ($data['title'] ?? '');
                        $subtitle = trim($announcementTitle);
                    }

                    if ($type === 'incident_reported_program_head' || $type === 'incident_reported_admin') {
                        $incidentType = (string) ($data['incident_type'] ?? '');
                        $subtitle = (string) ($data['subtitle'] ?? $data['message'] ?? '');
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
                        'url' => (string) ($data['url'] ?? ''),
                        'timeAgo' => $notification->created_at?->diffForHumans() ?? '',
                        'is_read' => $notification->read_at !== null,
                    ];
                });

                $scannerEventIds = $recentNotificationsCollection
                    ->filter(fn ($n) => ($n['type'] ?? null) === 'scanner_portal_access_granted' && !empty($n['eventId']))
                    ->map(fn ($n) => (int) $n['eventId'])
                    ->values()
                    ->all();

                $evaluationEventIds = $recentNotificationsCollection
                    ->filter(fn ($n) => ($n['type'] ?? null) === 'evaluation_available' && !empty($n['eventId']))
                    ->map(fn ($n) => (int) $n['eventId'])
                    ->values()
                    ->all();

                $activeScannerEventIds = [];
                if (count($scannerEventIds) > 0) {
                    $activeScannerEventIds = Event::query()
                        ->whereIn('id', $scannerEventIds)
                        ->whereNull('archived_at')
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->all();
                }

                $activeEvaluationEventIds = [];
                if (count($evaluationEventIds) > 0) {
                    $activeEvaluationEventIds = Event::query()
                        ->whereIn('id', $evaluationEventIds)
                        ->whereNull('archived_at')
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->all();
                }

                $recentNotifications = $recentNotificationsCollection
                    ->filter(function ($n) use ($activeScannerEventIds) {
                        if (($n['type'] ?? null) !== 'scanner_portal_access_granted') {
                            return true;
                        }

                        $eventId = $n['eventId'] ?? null;
                        if (!$eventId) {
                            return false;
                        }

                        return in_array((int) $eventId, $activeScannerEventIds, true);
                    })
                    ->filter(function ($n) use ($activeEvaluationEventIds) {
                        if (($n['type'] ?? null) !== 'evaluation_available') {
                            return true;
                        }

                        $eventId = $n['eventId'] ?? null;
                        if (!$eventId) {
                            return false;
                        }

                        return in_array((int) $eventId, $activeEvaluationEventIds, true);
                    })
                    ->take(5)
                    ->values()
                    ->all();
            }
        } catch (\Exception $e) {
            \Log::error('Failed to build recentNotifications', [
                'message' => $e->getMessage(),
                'class' => get_class($e),
            ]);
            $recentNotifications = [];
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $user,
                'guard' => $activeGuard,
                'roleLabel' => ActiveAuth::roleLabel($activeGuard),
                'backUrl' => ActiveAuth::backUrl($activeGuard),
                'logoutUrl' => ActiveAuth::logoutUrl($activeGuard),
            ],
            'unreadNotifications' => $unreadNotifications,
            'recentNotifications' => $recentNotifications,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'geofence' => [
                'campus' => [
                    'latitude' => config('geofence.campus_latitude'),
                    'longitude' => config('geofence.campus_longitude'),
                ],
            ],
        ];
    }
}
