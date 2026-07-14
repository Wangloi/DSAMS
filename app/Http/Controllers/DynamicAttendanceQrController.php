<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DynamicAttendanceQrController extends Controller
{
    /** Token lifetime in seconds — must match the frontend countdown. */
    private const LIFETIME_SECONDS = 30;

    // ─── Admin: display the rotating QR code page ────────────────────────────

    public function show(Event $event): Response
    {
        return Inertia::render('admin-dashboard/attendance/dynamic-qr', [
            'event' => [
                'id'                 => $event->id,
                'name'               => $event->event_name,
                'location'           => $event->location,
                'scannerPortalActive' => (bool) $event->scanner_portal_active,
            ],
            'tokenLifetimeSeconds' => self::LIFETIME_SECONDS,
        ]);
    }

    // ─── Admin API: generate a fresh short-lived token ───────────────────────

    /**
     * The QR carries only an opaque token; the event binding and expiry
     * are stored server-side in the cache — not embedded in the QR itself.
     */
    public function token(Request $request, Event $event): JsonResponse
    {
        abort_unless(
            (bool) $event->scanner_portal_active,
            409,
            'Activate the attendance session before displaying its QR code.'
        );

        $token     = Str::random(48);
        $expiresAt = now()->addSeconds(self::LIFETIME_SECONDS);

        Cache::put(
            self::cacheKey($token),
            ['event_id' => $event->id],
            $expiresAt
        );

        return response()->json([
            'payload'    => json_encode(
                ['type' => 'dsams-attendance-token', 'event_id' => $event->id, 'token' => $token],
                JSON_UNESCAPED_SLASHES
            ),
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    // ─── Shared helper (used by StudentAttendanceController) ─────────────────

    /**
     * Retrieve and consume a token in one atomic-ish step.
     *
     * Returns the cached payload (e.g. ['event_id' => 5]) on success,
     * or null if the token is missing / already consumed.
     *
     * The token is deleted immediately so it cannot be reused.
     */
    public static function consumeToken(string $token): ?array
    {
        $key  = self::cacheKey($token);
        $data = Cache::get($key);

        if ($data !== null) {
            Cache::forget($key); // single-use
        }

        return $data;
    }

    /** Non-destructive peek — used for debugging or admin checks. */
    public static function tokenData(string $token): ?array
    {
        return Cache::get(self::cacheKey($token));
    }

    public static function cacheKey(string $token): string
    {
        return 'attendance:dynamic-qr:' . $token;
    }
}
