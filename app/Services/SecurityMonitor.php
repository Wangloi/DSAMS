<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SecurityMonitor
{
    public static function alertIfThresholdExceeded(
        string $module,
        string $action,
        string $identifier,
        int $threshold = 5,
        int $minutes = 15,
        ?Request $request = null
    ): bool {
        if (!Schema::hasTable('activity_logs')) {
            return false;
        }

        $recentCount = ActivityLog::query()
            ->where('module', $module)
            ->where('action', $action)
            ->where('ip_address', $request?->ip() ?? request()->ip())
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();

        if ($recentCount >= $threshold) {
            ActivityLog::log(
                'Security Monitor',
                'ALERT',
                "Threshold exceeded: {$recentCount} '{$action}' attempts in {$minutes} minutes for {$module} from IP " . ($request?->ip() ?? request()->ip()),
                null,
                null,
                null,
                $request,
                ['threshold' => $threshold, 'minutes' => $minutes, 'recent_count' => $recentCount],
                ['alert_triggered' => true]
            );

            Log::warning("Security Alert: {$recentCount} {$action} attempts detected", [
                'module' => $module,
                'action' => $action,
                'ip' => $request?->ip() ?? request()->ip(),
                'threshold' => $threshold,
                'window_minutes' => $minutes,
            ]);

            return true;
        }

        return false;
    }
}
