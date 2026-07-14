<?php

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActiveAuth
{
    /** @var list<string> */
    public const GUARDS = ['student', 'program_head', 'admin'];

    public static function syncFromRoute(Request $request): void
    {
        $routeName = (string) optional($request->route())->getName();
        $path = (string) $request->path();

        if (str_starts_with($routeName, 'student.') || str_starts_with($path, 'student') || str_starts_with($path, 'student-dashboard')) {
            $request->session()->put('active_guard', 'student');

            return;
        }

        if (str_starts_with($routeName, 'program_head.') || str_starts_with($path, 'program-head')) {
            $request->session()->put('active_guard', 'program_head');

            return;
        }

        if (str_starts_with($routeName, 'admin.') || str_starts_with($path, 'admin') || str_starts_with($path, 'admin-dashboard')) {
            $request->session()->put('active_guard', 'admin');
        }
    }

    public static function resolve(Request $request): ?string
    {
        static::syncFromRoute($request);

        $explicit = $request->query('as');
        if (is_string($explicit) && in_array($explicit, self::GUARDS, true) && Auth::guard($explicit)->check()) {
            $request->session()->put('active_guard', $explicit);

            return $explicit;
        }

        $sessionGuard = $request->session()->get('active_guard');
        if (is_string($sessionGuard) && in_array($sessionGuard, self::GUARDS, true) && Auth::guard($sessionGuard)->check()) {
            return $sessionGuard;
        }

        foreach (self::GUARDS as $guard) {
            if (Auth::guard($guard)->check()) {
                $request->session()->put('active_guard', $guard);

                return $guard;
            }
        }

        return null;
    }

    public static function setDefaultGuard(Request $request): ?string
    {
        $guard = self::resolve($request);

        if ($guard !== null) {
            Auth::shouldUse($guard);
        }

        return $guard;
    }

    public static function user(Request $request): ?Authenticatable
    {
        $guard = self::resolve($request);

        return $guard ? Auth::guard($guard)->user() : null;
    }

    public static function roleLabel(?string $guard): string
    {
        return match ($guard) {
            'student' => 'Student',
            'program_head' => 'Program Head',
            'admin' => 'Administrator',
            default => 'User',
        };
    }

    public static function backUrl(?string $guard): string
    {
        return match ($guard) {
            'student' => '/student-dashboard',
            'program_head' => '/program-head-dashboard',
            'admin' => '/admin-dashboard',
            default => '/',
        };
    }

    public static function logoutUrl(?string $guard): string
    {
        return match ($guard) {
            'student' => '/student-logout',
            default => '/logout',
        };
    }
}
