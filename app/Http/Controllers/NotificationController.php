<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Services\RealtimeNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected RealtimeNotificationService $realtimeService;

    public function __construct(RealtimeNotificationService $realtimeService)
    {
        $this->realtimeService = $realtimeService;
    }

    /**
     * Get current authenticated user across guards
     */
    private function resolveAuthUser(?Request $request = null)
    {
        if ($request) {
            $activeUser = \App\Support\ActiveAuth::user($request);
            if ($activeUser) {
                return $activeUser;
            }
        }

        return Auth::guard('program_head')->user()
            ?: Auth::guard('student')->user()
            ?: Auth::guard('admin')->user()
            ?: Auth::guard('web')->user()
            ?: Auth::user();
    }

    /**
     * Get user's notifications + unread count (API endpoint)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);

        if (!$user) {
            $userId = $request->query('user_id');
            if (!$userId) {
                return response()->json([
                    'notifications' => [],
                    'unread_count' => 0,
                ]);
            }
        }

        if ($user instanceof \App\Models\Student) {
            $notifications = \App\Services\StudentNotificationPresenter::recentForStudent($user, 30);
            $unreadCount = \App\Services\StudentNotificationPresenter::unreadCountForStudent($user);

            return response()->json([
                'notifications' => $notifications,
                'unread_count'  => $unreadCount,
            ]);
        }

        if ($user) {
            $dbNotifications = $user->notifications()
                ->orderByDesc('created_at')
                ->limit(30)
                ->get()
                ->map(function ($n) {
                    $data = is_string($n->data) ? json_decode($n->data, true) : (array) $n->data;
                    return [
                        'id' => (string) $n->id,
                        'type' => (string) ($data['type'] ?? ''),
                        'title' => (string) ($data['title'] ?? $data['message'] ?? 'Notification'),
                        'subtitle' => (string) ($data['subtitle'] ?? ''),
                        'message' => (string) ($data['message'] ?? ''),
                        'timeAgo' => $n->created_at?->diffForHumans() ?? '',
                        'created_at' => $n->created_at?->toISOString() ?? $n->created_at?->toDateTimeString(),
                        'is_read' => $n->read_at !== null,
                        'eventId' => $data['event_id'] ?? null,
                        'evaluationId' => $data['evaluation_id'] ?? null,
                    ];
                });

            $userClass = get_class($user);
            $appNotifications = AppNotification::where('user_id', $user->id)
                ->where('user_type', $userClass)
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->get()
                ->map(function ($n) {
                    return [
                        'id' => (string) $n->id,
                        'type' => (string) $n->type,
                        'title' => (string) $n->title,
                        'subtitle' => (string) $n->message,
                        'message' => (string) $n->message,
                        'timeAgo' => $n->created_at?->diffForHumans() ?? '',
                        'created_at' => $n->created_at?->toISOString() ?? $n->created_at?->toDateTimeString(),
                        'is_read' => (bool) $n->is_read,
                        'eventId' => $n->meta_data['event_id'] ?? null,
                        'evaluationId' => $n->meta_data['evaluation_id'] ?? null,
                    ];
                });

            $allNotifications = $dbNotifications->concat($appNotifications)
                ->sortByDesc('created_at')
                ->values()
                ->all();

            $unreadCount = $user->unreadNotifications()->count() +
                AppNotification::where('user_id', $user->id)
                    ->where('user_type', $userClass)
                    ->unread()
                    ->count();

            return response()->json([
                'notifications' => $allNotifications,
                'unread_count'  => $unreadCount,
            ]);
        }

        return response()->json([
            'notifications' => [],
            'unread_count'  => 0,
        ]);
    }

    /**
     * Mark a single notification as read
     */
    public function markAsRead(string $id, Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);

        // 1. First check Laravel's standard database notifications
        if ($user) {
            $dbNotification = $user->notifications()->where('id', $id)->first();
            if ($dbNotification) {
                $dbNotification->markAsRead();
                return response()->json([
                    'success' => true,
                    'notification' => $dbNotification,
                ]);
            }
        }

        // 2. Otherwise check AppNotification model
        $notification = is_numeric($id) ? AppNotification::find((int) $id) : null;

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        // Check ownership if user_id is set
        if ($notification->user_id && $user && $notification->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success'      => true,
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all notifications for the current user as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $this->resolveAuthUser($request);
        $userId = $user?->id ?? $request->input('user_id');

        if (!$user && !$userId) {
            if ($request->wantsJson() || $request->isJson() || $request->header('X-Inertia') === null) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }
            return back();
        }

        if ($user && method_exists($user, 'unreadNotifications')) {
            $user->unreadNotifications()->update(['read_at' => now()]);
        }

        if ($userId) {
            $userClass = $user ? get_class($user) : null;
            AppNotification::forRecipient($userId, $userClass)
                ->unread()
                ->update(['is_read' => true]);
        }

        if ($request->wantsJson() || $request->isJson()) {
            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        }

        return back();
    }

    /**
     * Delete a notification
     */
    public function destroy(string $id): JsonResponse
    {
        $user = $this->resolveAuthUser();

        if ($user) {
            $dbNotification = $user->notifications()->where('id', $id)->first();
            if ($dbNotification) {
                $dbNotification->delete();
                return response()->json(['success' => true]);
            }
        }

        $notification = is_numeric($id) ? AppNotification::find((int) $id) : null;

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        if ($notification->user_id && $user && $notification->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Helper test endpoint to verify real-time dispatch
     */
    public function testNotification(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser();
        $userId = $request->input('user_id', $user?->id ?? 1);

        $notification = $this->realtimeService->sendToUser($userId, [
            'type'         => $request->input('type', 'system_alert'),
            'title'        => $request->input('title', '🔔 Test Real-Time Notification'),
            'message'      => $request->input('message', 'This is a live test notification delivered via Node.js + Socket.IO!'),
            'related_id'   => $request->input('related_id', 'TEST-001'),
            'related_type' => 'test',
        ]);

        return response()->json([
            'success'      => (bool) $notification,
            'notification' => $notification,
            'message'      => 'Notification event dispatched to Node.js Socket.IO server',
        ]);
    }

    /**
     * Render student notifications page
     */
    public function studentIndex(Request $request)
    {
        /** @var \App\Models\Student|null $user */
        $user = Auth::guard('student')->user() ?: Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $paginated = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(15);

        $formattedData = collect($paginated->items())
            ->map(fn ($n) => \App\Services\StudentNotificationPresenter::format($n))
            ->filter(fn ($row) => $row !== null && \App\Services\StudentNotificationPresenter::isRelevantForStudent($user, $row))
            ->values()
            ->all();

        $paginatedNotifications = [
            'data' => $formattedData,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'prev_page_url' => $paginated->previousPageUrl(),
            'next_page_url' => $paginated->nextPageUrl(),
        ];

        return \Inertia\Inertia::render('student/notifications/index', [
            'paginatedNotifications' => $paginatedNotifications,
        ]);
    }

    /**
     * Render program head notifications page
     */
    public function programHeadIndex(Request $request)
    {
        /** @var \App\Models\ProgramHead|null $user */
        $user = Auth::guard('program_head')->user() ?: Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $paginated = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(15);

        $formattedData = collect($paginated->items())
            ->map(function ($n) {
                $data = is_string($n->data) ? json_decode($n->data, true) : (array) $n->data;
                return [
                    'id' => (string) $n->id,
                    'type' => (string) ($data['type'] ?? ''),
                    'eventId' => $data['event_id'] ?? null,
                    'evaluationId' => $data['evaluation_id'] ?? null,
                    'title' => (string) ($data['title'] ?? $data['message'] ?? 'Notification'),
                    'subtitle' => (string) ($data['subtitle'] ?? ''),
                    'timeAgo' => $n->created_at?->diffForHumans() ?? '',
                    'created_at' => $n->created_at?->toISOString() ?? $n->created_at?->toDateTimeString(),
                    'is_read' => $n->read_at !== null,
                ];
            })
            ->values()
            ->all();

        $paginatedNotifications = [
            'data' => $formattedData,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'prev_page_url' => $paginated->previousPageUrl(),
            'next_page_url' => $paginated->nextPageUrl(),
        ];

        return \Inertia\Inertia::render('program-head/notifications/index', [
            'paginatedNotifications' => $paginatedNotifications,
        ]);
    }

    /**
     * Render admin notifications page
     */
    public function adminIndex(Request $request)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::guard('admin')->user() ?: Auth::user();
        if (!$user) {
            return redirect()->route('login');
        }

        $paginated = $user->notifications()
            ->orderByDesc('created_at')
            ->paginate(15);

        $formattedData = collect($paginated->items())
            ->map(function ($n) {
                $data = is_string($n->data) ? json_decode($n->data, true) : (array) $n->data;
                return [
                    'id' => (string) $n->id,
                    'type' => (string) ($data['type'] ?? ''),
                    'eventId' => $data['event_id'] ?? null,
                    'evaluationId' => $data['evaluation_id'] ?? null,
                    'title' => (string) ($data['title'] ?? $data['message'] ?? 'Notification'),
                    'subtitle' => (string) ($data['subtitle'] ?? ''),
                    'timeAgo' => $n->created_at?->diffForHumans() ?? '',
                    'created_at' => $n->created_at?->toISOString() ?? $n->created_at?->toDateTimeString(),
                    'is_read' => $n->read_at !== null,
                ];
            })
            ->values()
            ->all();

        $paginatedNotifications = [
            'data' => $formattedData,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'prev_page_url' => $paginated->previousPageUrl(),
            'next_page_url' => $paginated->nextPageUrl(),
        ];

        return \Inertia\Inertia::render('admin-dashboard/notifications/index', [
            'paginatedNotifications' => $paginatedNotifications,
        ]);
    }
}

