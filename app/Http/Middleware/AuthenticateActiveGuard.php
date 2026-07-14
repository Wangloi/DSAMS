<?php

namespace App\Http\Middleware;

use App\Support\ActiveAuth;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Http\Request;

class AuthenticateActiveGuard extends Authenticate
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$guards
     */
    public function handle($request, Closure $next, ...$guards): mixed
    {
        $allowed = count($guards) > 0 ? $guards : ActiveAuth::GUARDS;

        $active = ActiveAuth::setDefaultGuard($request);

        if ($active !== null && in_array($active, $allowed, true)) {
            return $next($request);
        }

        foreach ($allowed as $guard) {
            if ($this->auth->guard($guard)->check()) {
                $request->session()->put('active_guard', $guard);
                $this->auth->shouldUse($guard);

                return $next($request);
            }
        }

        $this->unauthenticated($request, $allowed);
    }

    protected function unauthenticated($request, array $guards): void
    {
        throw new AuthenticationException(
            'Unauthenticated.',
            $guards,
            $request->expectsJson() ? null : $this->redirectTo($request),
        );
    }

    protected function redirectTo(Request $request): ?string
    {
        return route('login');
    }
}
