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
        ActiveAuth::syncFromRoute($request);

        return $next($request);
    }
}
