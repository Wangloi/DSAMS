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
        $rawTargetId = $route ? $route->parameter('id') : null;

        // target_id is bigint unsigned — only store numeric IDs, not UUIDs or string slugs
        $targetId = ($rawTargetId !== null && is_numeric($rawTargetId))
            ? (int) $rawTargetId
            : null;

        // Sanitize request data — never log passwords or tokens, and convert UploadedFile objects to strings
        $sanitized = collect($request->all())
            ->except(['password', 'password_confirmation', 'token', '_token'])
            ->map(function ($value) {
                if ($value instanceof \Illuminate\Http\UploadedFile) {
                    return '[File: ' . $value->getClientOriginalName() . ']';
                }
                if (is_array($value)) {
                    return array_map(function ($item) {
                        return ($item instanceof \Illuminate\Http\UploadedFile)
                            ? '[File: ' . $item->getClientOriginalName() . ']'
                            : $item;
                    }, $value);
                }
                return $value;
            })
            ->toArray();

        $payload = [
            'actor_id' => $actor?->id,
            'role'     => $actor?->role,
            'target_id' => $targetId,
            'action'   => $routeName,
            'old'      => $request->old(),
            'new'      => $sanitized,
            'ip'       => $request->ip(),
            'device'   => $request->header('User-Agent'),
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