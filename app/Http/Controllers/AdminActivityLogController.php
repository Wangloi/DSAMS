<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = collect();
        
        if (Schema::hasTable('activity_logs')) {
            $isInertiaPartialReload = (bool) $request->header('X-Inertia-Partial-Data')
                || (bool) $request->header('X-Inertia-Partial-Component');

            if (!$isInertiaPartialReload) {
                $user = auth()->user() ?: auth()->guard('admin')->user();
                ActivityLog::logForUser($user, 'Activity Log', 'Viewed', 'Viewed the activity log page');
            }

            $logs = ActivityLog::query()
                ->orderByDesc('created_at')
                ->limit(500)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => (string) $log->id,
                        'timestamp' => $log->created_at->format('M d, Y h:i A'),
                        'user' => $log->user_name ?? 'Unknown',
                        'module' => $log->module,
                        'action' => $log->action,
                        'details' => $log->details ?? '',
                        'userType' => $log->user_type,
                    ];
                });
        }

        return Inertia::render('admin-dashboard/activity-log/index', [
            'logs' => $logs,
        ]);
    }
}
