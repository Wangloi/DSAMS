<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Audit;
use Illuminate\Support\Facades\Redis;

class SecurityAudit
{
    /**
     * Handle an incoming request and log audit information.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $route = $request->route();
        $routeName = $route ? $route->getName() : null;

        // Skip if route is excluded from auditing
        $excluded = config('audit.excluded_routes', []);
        if ($routeName && in_array($routeName, $excluded)) {
            return $response;
        }

        $actor = $request->user();


        // Prepare audit payload
        $payload = [
            'actor_id' => $actor?->id,
            'role' => $actor?->role,
            'target_id' => $route ? $route->parameter('id') : null,
            'action' => $routeName,
            'old' => $request->old(),
            'new' => $request->all(),
            'ip' => $request->ip(),
            'device' => $request->header('User-Agent'),
        ];

        // Dispatch audit log
        Audit::log($routeName ?? 'unknown', $payload);

        // Track failed login attempts
        if ($routeName === 'login' && $response->getStatusCode() === 401) {
            $key = $actor ? $actor->id : $request->ip();
            $redisKey = config('audit.redis_prefixes.login_failed') . ':' . $key;

            Redis::incr($redisKey);
            Redis::expire(
                $redisKey,
                config('audit.thresholds.login_failed.window')
            );
        }

        // Additional patterns can be added similarly
        // (qr_invalid, access_denied, geofence_fail, etc.)

        return $response;
    }
}