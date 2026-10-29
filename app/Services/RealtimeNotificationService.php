<?php

namespace App\Services;

use App\Models\AppNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeNotificationService
{
    protected string $socketUrl;
    protected string $socketSecret;

    protected static ?bool $socketAvailable = null;
    protected static ?int $lastSocketCheck = null;

    public function __construct()
    {
        $this->socketUrl = rtrim(config('services.socket_server.url', 'http://127.0.0.1:3001'), '/');
        $this->socketSecret = config('services.socket_server.secret', 'dsams_realtime_secret_key_change_in_production');
    }

    /**
     * Check if socket server is known to be available without repeatedly hanging requests
     */
    protected function isSocketAvailable(): bool
    {
        if (self::$socketAvailable === false) {
            if (self::$lastSocketCheck && (time() - self::$lastSocketCheck) < 60) {
                return false;
            }
        }

        return true;
    }

    /**
     * Send real-time notification to multiple users efficiently (bulk DB insert + bulk socket emit)
     */
    public function sendToUsers(array $userIds, array $payload, ?string $userType = 'App\\Models\\User'): void
    {
        $userIds = array_values(array_unique(array_filter($userIds)));
        if (empty($userIds)) {
            return;
        }

        try {
            $effectiveUserType = $userType ?? 'App\\Models\\User';
            $now = now();
            $metaData = isset($payload['meta_data'])
                ? (is_string($payload['meta_data']) ? $payload['meta_data'] : json_encode($payload['meta_data']))
                : null;

            $records = [];
            foreach ($userIds as $uid) {
                $records[] = [
                    'user_id'      => $uid,
                    'user_type'    => $effectiveUserType,
                    'type'         => $payload['type'] ?? 'general',
                    'title'        => $payload['title'] ?? 'New Notification',
                    'message'      => $payload['message'] ?? '',
                    'related_id'   => $payload['related_id'] ?? null,
                    'related_type' => $payload['related_type'] ?? null,
                    'meta_data'    => $metaData,
                    'is_read'      => false,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }

            foreach (array_chunk($records, 250) as $chunk) {
                AppNotification::insert($chunk);
            }

            // Socket delivery if available
            if ($this->isSocketAvailable()) {
                $isBroadcastRole = (bool) ($payload['broadcast_to_role'] ?? false);

                if ($isBroadcastRole && $effectiveUserType === 'App\\Models\\Student') {
                    $this->emitToSocket([
                        'room'  => 'role_student',
                        'event' => 'notification',
                        'data'  => [
                            'type'         => $payload['type'] ?? 'general',
                            'title'        => $payload['title'] ?? 'New Notification',
                            'message'      => $payload['message'] ?? '',
                            'related_id'   => $payload['related_id'] ?? null,
                            'related_type' => $payload['related_type'] ?? null,
                            'meta_data'    => $payload['meta_data'] ?? null,
                            'is_read'      => false,
                            'created_at'   => $now->toISOString(),
                        ],
                    ]);
                } else {
                    // Send to specific target rooms in a single batch socket call
                    $rolePrefix = match ($effectiveUserType) {
                        'App\\Models\\ProgramHead', 'program_head' => 'program_head',
                        'App\\Models\\Student', 'student'          => 'student',
                        'App\\Models\\User', 'admin'              => 'admin',
                        default                                    => null,
                    };

                    $targetRooms = [];
                    foreach (array_slice($userIds, 0, 100) as $uid) {
                        if ($rolePrefix) {
                            $targetRooms[] = "user_{$rolePrefix}_{$uid}";
                        }
                        $targetRooms[] = "user_{$uid}";
                    }

                    $this->emitToSocket([
                        'rooms' => array_values(array_unique($targetRooms)),
                        'event' => 'notification',
                        'data'  => [
                            'type'         => $payload['type'] ?? 'general',
                            'title'        => $payload['title'] ?? 'New Notification',
                            'message'      => $payload['message'] ?? '',
                            'related_id'   => $payload['related_id'] ?? null,
                            'related_type' => $payload['related_type'] ?? null,
                            'meta_data'    => $payload['meta_data'] ?? null,
                            'is_read'      => false,
                            'created_at'   => $now->toISOString(),
                        ],
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('RealtimeNotificationService::sendToUsers failed: ' . $e->getMessage());
        }
    }

    /**
     * Send real-time notification to a specific user
     */
    public function sendToUser(int|string $userId, array $payload, ?string $userType = 'App\\Models\\User'): ?AppNotification
    {
        try {
            $effectiveUserType = $userType ?? 'App\\Models\\User';

            // 1. Persist notification in MySQL database
            $notification = AppNotification::create([
                'user_id'      => $userId,
                'user_type'    => $effectiveUserType,
                'type'         => $payload['type'] ?? 'general',
                'title'        => $payload['title'] ?? 'New Notification',
                'message'      => $payload['message'] ?? '',
                'related_id'   => $payload['related_id'] ?? null,
                'related_type' => $payload['related_type'] ?? null,
                'meta_data'    => $payload['meta_data'] ?? null,
                'is_read'      => false,
            ]);

            if ($this->isSocketAvailable()) {
                // Determine role prefix for room isolation
                $rolePrefix = match ($effectiveUserType) {
                    'App\\Models\\ProgramHead', 'program_head' => 'program_head',
                    'App\\Models\\Student', 'student'          => 'student',
                    'App\\Models\\User', 'admin'              => 'admin',
                    default                                    => null,
                };

                $room = $rolePrefix ? "user_{$rolePrefix}_{$userId}" : "user_{$userId}";

                // 2. Emit event to Node.js Socket.IO server
                $this->emitToSocket([
                    'room'  => $room,
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
            }

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
            if ($this->isSocketAvailable()) {
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
            }

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

            if ($this->isSocketAvailable()) {
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
            }

            return $notification;
        } catch (\Throwable $e) {
            Log::error('RealtimeNotificationService::broadcast failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Broadcast a real-time attendance scan update to the active event room and admin/head monitors
     */
    public function broadcastAttendanceScan(int|string $eventId, array $scanData): void
    {
        if (!$this->isSocketAvailable()) {
            return;
        }

        $rooms = [
            "event_{$eventId}",
            'role_admin',
            'role_program_head',
        ];

        $this->emitToSocket([
            'rooms' => $rooms,
            'event' => 'attendance_scanned',
            'data'  => array_merge(['event_id' => $eventId], $scanData),
        ]);
    }

    /**
     * Generic public method to emit any custom event to a room or rooms
     */
    public function emitEvent(string $event, array $data, ?string $room = null, ?array $rooms = null): void
    {
        if (!$this->isSocketAvailable()) {
            return;
        }

        $payload = [
            'event' => $event,
            'data'  => $data,
        ];

        if (!empty($rooms)) {
            $payload['rooms'] = array_values(array_unique(array_filter($rooms)));
        } elseif ($room) {
            $payload['room'] = $room;
        }

        $this->emitToSocket($payload);
    }

    /**
     * Dispatch HTTP POST request to Node.js Socket.IO emit endpoint
     */
    protected function emitToSocket(array $data): void
    {
        if (!$this->isSocketAvailable()) {
            return;
        }

        try {
            $response = Http::connectTimeout(0.8)
                ->timeout(1.5)
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
            } else {
                self::$socketAvailable = true;
            }
        } catch (\Throwable $e) {
            self::$socketAvailable = false;
            self::$lastSocketCheck = time();
            Log::info('RealtimeNotificationService: Socket server unreachable. Subsequent notifications will skip socket emit for 60s. (' . $e->getMessage() . ')');
        }
    }
}
