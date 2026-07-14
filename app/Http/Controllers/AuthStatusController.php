<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthStatusController extends Controller
{
    public function loginBlock(): JsonResponse
    {
        $blockedUntil = session()->get('login_blocked_until');

        $remaining = 0;
        if ($blockedUntil) {
            $parsed = \Carbon\Carbon::parse($blockedUntil);
            $remaining = max(0, (int) ceil(now()->diffInSeconds($parsed)));
        }

        return response()->json([
            'login_blocked' => $remaining > 0,
            'login_blocked_until' => $blockedUntil,
            'remaining_seconds' => $remaining,
        ]);
    }

    public function scannerBlock(): JsonResponse
    {
        $blockedUntil = session()->get('scanner_blocked_until');

        $remaining = 0;
        if ($blockedUntil) {
            $parsed = \Carbon\Carbon::parse($blockedUntil);
            $remaining = max(0, (int) ceil(now()->diffInSeconds($parsed)));
        }

        return response()->json([
            'scanner_blocked' => $remaining > 0,
            'scanner_blocked_until' => $blockedUntil,
            'remaining_seconds' => $remaining,
        ]);
    }
}
