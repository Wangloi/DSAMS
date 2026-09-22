<?php

namespace App\Http\Middleware;

use App\Support\ActiveAuth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncActiveAuthGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        // Resolve the active guard and set it as the default so that
        // $request->user() returns the correct user for ALL routes,
        // including Fortify's two-factor authentication endpoints
        // which use the generic auth:web middleware.
        ActiveAuth::setDefaultGuard($request);

        return $next($request);
    }
}

