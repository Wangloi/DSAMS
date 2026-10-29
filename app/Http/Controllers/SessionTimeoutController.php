<?php

namespace App\Http\Controllers;

use App\Support\ActiveAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionTimeoutController extends Controller
{
    /**
     * Get the current session status and remaining lifetime in seconds.
     * Complies with WCAG 2.2.1 Timing Adjustable.
     */
    public function status(Request $request): JsonResponse
    {
        $activeGuard = ActiveAuth::resolve($request);
        $user = $activeGuard ? Auth::guard($activeGuard)->user() : null;

        $lifetimeMinutes = (int) config('session.lifetime', 120);
        $lifetimeSeconds = $lifetimeMinutes * 60;

        $lastActivity = (int) $request->session()->get('last_activity_time', now()->timestamp);
        $elapsed = max(0, now()->timestamp - $lastActivity);
        $remaining = max(0, $lifetimeSeconds - $elapsed);

        return response()->json([
            'authenticated' => $user !== null,
            'guard' => $activeGuard,
            'lifetime_seconds' => $lifetimeSeconds,
            'remaining_seconds' => $remaining,
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
        ]);
    }

    /**
     * Extend the session upon explicit user action (e.g. clicking "Stay Logged In" or pressing Space).
     * WCAG 2.2.1 Requirement: The user can extend the time limit at least ten times.
     */
    public function extend(Request $request): JsonResponse
    {
        $activeGuard = ActiveAuth::resolve($request);
        $user = $activeGuard ? Auth::guard($activeGuard)->user() : null;

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Session has already expired. Please log in again.',
                'authenticated' => false,
            ], 401);
        }

        // Refresh last activity timestamp in session
        $now = now()->timestamp;
        $request->session()->put('last_activity_time', $now);
        $request->session()->save();

        $lifetimeMinutes = (int) config('session.lifetime', 120);
        $lifetimeSeconds = $lifetimeMinutes * 60;

        return response()->json([
            'success' => true,
            'message' => 'Session extended successfully.',
            'authenticated' => true,
            'lifetime_seconds' => $lifetimeSeconds,
            'remaining_seconds' => $lifetimeSeconds,
            'extended_at' => now()->toIso8601String(),
        ]);
    }
}
