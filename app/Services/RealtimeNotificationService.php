<?php

namespace App\Services;

use App\Models\AppNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeNotificationService
{
    protected string $socketUrl;
    protected string $socketSecret;

    public function __construct()
    {
        $this->socketUrl = rtrim(config('services.socket_server.url', 'http://127.0.0.1:3001'), '/');
        $this->socketSecret = config('services.socket_server.secret', 'dsams_realtime_secret_key_change_in_production');
    }

    /**
     * Send real-time notification to a specific user
     */
    public function sendToUser(int|string $userId, array $payload, ?string $userType = 'App\\Models\\User'): ?AppNotification
    {
        try {
            // 1. Persist notification in MySQL database
            $notification = AppNotification::create([
                'user_id'      => $userId,
                'user_type'    => $userType ?? 'App\\Models\\User',
                'type'         => $payload['type'] ?? 'general',
                'title'        => $payload['title'] ?? 'New Notification',
                'message'      => $payload['message'] ?? '',
                'related_id'   => $payload['related_id'] ?? null,
                'related_type' => $payload['related_type'] ?? null,
                'meta_data'    => $payload['meta_data'] ?? null,
                'is_read'      => false,
            ]);

            // 2. Emit event to Node.js Socket.IO server (Room: user_{userId})
            $this->emitToSocket([
                'room'  => 'user_' . $userId,
                'event' => 'notification',
                'data'  => [
                    'id'           => $notification->id,
                    'user_id'      => $notification->user_id,
                    'type'         => $notification->type,
                    'title'        => $notification->title,
                    'message'      => $notification->message,
                    'related_id'   => $notification->related_id,
                    'related_type' => $notification->related_type,
                    'meta_data'    => $notification->meta_data,
                    'is_read'      => false,
                    'created_at'   => $notification->created_at->toISOString(),
                ],
            ]);

            return $notification;
        } catch (\Throwable $e) {
            Log::error('RealtimeNotificationService::sendToUser failed: ' . $e->getMessage(), [
                'userId' => $userId,
                'payload' => $payload,
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Send real-time notification to a specific user role (e.g. role_admin, role_student, role_program_head)
     */
    public function sendToRole(string $role, array $payload): ?AppNotification
    {
        try {
            // Persist as a general broadcast notification or role record
            $notification = AppNotification::create([
                'user_id'      => null,
                'user_type'    => 'role_' . strtolower($role),
                'type'         => $payload['type'] ?? 'general',
                'title'        => $payload['title'] ?? 'New Announcement',
                'message'      => $payload['message'] ?? '',
                'related_id'   => $payload['related_id'] ?? null,
                'related_type' => $payload['related_type'] ?? null,
                'meta_data'    => $payload['meta_data'] ?? null,
                'is_read'      => false,
            ]);

            // Emit to role room
            $this->emitToSocket([
                'room'  => 'role_' . strtolower($role),
                'event' => 'notification',
                'data'  => [
                    'id'           => $notification->id,
                    'type'         => $notification->type,
                    'title'        => $notification->title,
                    'message'      => $notification->message,
                    'related_id'   => $notification->related_id,
                    'related_type' => $notification->related_type,
                    'meta_data'    => $notification->meta_data,
                    'is_read'      => false,
                    'created_at'   => $notification->created_at->toISOString(),
                ],
            ]);

            return $notification;
        } catch (\Throwable $e) {
            Log::error('RealtimeNotificationService::sendToRole failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Broadcast to all connected clients
     */
    public function broadcast(array $payload): ?AppNotification
    {
        try {
            $notification = AppNotification::create([
                'user_id'      => null,
                'user_type'    => 'broadcast',
                'type'         => $payload['type'] ?? 'general',
                'title'        => $payload['title'] ?? 'System Broadcast',
                'message'      => $payload['message'] ?? '',
                'related_id'   => $payload['related_id'] ?? null,
                'related_type' => $payload['related_type'] ?? null,
                'meta_data'    => $payload['meta_data'] ?? null,
                'is_read'      => false,
            ]);

            $this->emitToSocket([
                'room'  => null, // null room triggers io.emit to all connected sockets
                'event' => 'notification',
                'data'  => [
                    'id'           => $notification->id,
                    'type'         => $notification->type,
                    'title'        => $notification->title,
                    'message'      => $notification->message,
                    'related_id'   => $notification->related_id,
                    'related_type' => $notification->related_type,
                    'meta_data'    => $notification->meta_data,
                    'is_read'      => false,
                    'created_at'   => $notification->created_at->toISOString(),
                ],
            ]);

            return $notification;
        } catch (\Throwable $e) {
            Log::error('RealtimeNotificationService::broadcast failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Dispatch HTTP POST request to Node.js Socket.IO emit endpoint
     */
    protected function emitToSocket(array $data): void
    {
        try {
            $response = Http::timeout(2)
                ->withHeaders([
                    'X-Socket-Secret' => $this->socketSecret,
                    'Accept'          => 'application/json',
                ])
                ->post("{$this->socketUrl}/api/notifications/emit", $data);

            if (!$response->successful()) {
                Log::warning('Socket server responded with non-200 status', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            // Socket server might not be running yet; do not crash the main application
            Log::info('RealtimeNotificationService: Socket server unreachable. Notification persisted to MySQL. (' . $e->getMessage() . ')');
        }
    }
}
