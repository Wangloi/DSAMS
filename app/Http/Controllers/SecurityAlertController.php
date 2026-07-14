<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class SecurityAlertController extends Controller
{
    public function index(): JsonResponse
    {
        if (!Schema::hasTable('activity_logs')) {
            return response()->json(['alerts' => []]);
        }

        $ip = request()->ip();
        $recentAlerts = ActivityLog::query()
            ->where('module', 'Security Monitor')
            ->where('action', 'ALERT')
            ->where('ip_address', $ip)
            ->where('created_at', '>=', now()->subMinutes(30))
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'module', 'action', 'details', 'created_at', 'old_value', 'new_value']);

        $alerts = $recentAlerts->map(function ($log) {
            $old = $log->old_value ? json_decode($log->old_value, true) : null;
            $new = $log->new_value ? json_decode($log->new_value, true) : null;

            return [
                'id' => $log->id,
                'module' => $log->module,
                'action' => $log->action,
                'details' => $log->details,
                'timestamp' => $log->created_at?->toDateTimeString(),
                'threshold' => $old['threshold'] ?? null,
                'recent_count' => $old['recent_count'] ?? null,
                'window_minutes' => $old['window_minutes'] ?? null,
            ];
        })->values()->all();

        return response()->json(['alerts' => $alerts]);
    }
}
