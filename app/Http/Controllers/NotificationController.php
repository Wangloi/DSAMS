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
     * Get user's notifications + unread count
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $userId = $user?->id ?? $request->query('user_id');

        if (!$userId) {
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
            ]);
        }

        $notifications = AppNotification::forRecipient($userId)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $unreadCount = AppNotification::forRecipient($userId)
            ->unread()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();
        $notification = AppNotification::find($id);

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
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();
        $userId = $user?->id ?? $request->input('user_id');

        if (!$userId) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        AppNotification::forRecipient($userId)
            ->unread()
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $notification = AppNotification::find($id);

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
        $user = Auth::user();
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
}
