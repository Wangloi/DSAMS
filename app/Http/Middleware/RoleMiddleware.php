<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use App\Services\Audit;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!Auth::check() || Auth::user()->role !== $role) {

            // Log unauthorized access attempt
            Audit::log('authorization_failure', [
                'actor_id' => Auth::id(),
                'role' => Auth::user()?->role,
                'required' => $role,
                'route' => $request->route()?->getName(),
                'ip' => $request->ip(),
                'device' => $request->userAgent(),
            ]);

            if (Auth::check()) {
                Auth::logout();
            }

            return redirect()->route('login.choice');
        }

        return $next($request);
    }
}