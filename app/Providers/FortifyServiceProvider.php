<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\Laravel\Fortify\Contracts\LoginResponse::class, \App\Http\Responses\LoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn(Request $request) => Inertia::render('auth/AdminLogin', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => session()->pull('status'),
        ]));

        Fortify::resetPasswordView(fn(Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn(Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn(Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn() => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn() => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn() => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    /**
 * Configure rate limiting.
 */
private function configureRateLimiting(): void
{
    RateLimiter::for('two-factor', function (Request $request) {
        return Limit::perMinute(5)->by($request->session()->get('login.id'));
    });

    // Default / Student Login Rate Limiter
    RateLimiter::for('login', function (Request $request) {
        $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())));

        return Limit::perMinute(5)
            ->by($throttleKey)
            ->response(function (Request $req) use ($throttleKey) {
                $seconds = RateLimiter::availableIn($throttleKey);
                
                if ($req->expectsJson()) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in ' . $seconds . ' seconds.',
                    ], 429);
                }
                
                $req->session()->put('active_guard', 'student');
                return response()->view('auth.lockout', ['seconds' => $seconds], 200);
            });
    });

    // Admin login rate limiter
    RateLimiter::for('admin-login', function (Request $request) {
        $throttleKey = 'admin|' . Str::transliterate(Str::lower($request->input(Fortify::username())));

        return Limit::perMinute(5)
            ->by($throttleKey)
            ->response(function (Request $req) use ($throttleKey) {
                $seconds = RateLimiter::availableIn($throttleKey);
                
                // 1. Check if the request is from Inertia (JSON)
                if ($req->expectsJson()) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in ' . $seconds . ' seconds.',
                    ], 429);
                }

                // Fallback for native/non-JS requests
                $req->session()->put('active_guard', 'admin');
                return response()->view('auth.admin-lockout', ['seconds' => $seconds], 200);
            });
    });

    // Program Head login rate limiter
    RateLimiter::for('program-head-login', function (Request $request) {
        $throttleKey = 'program_head|' . Str::transliterate(Str::lower($request->input(Fortify::username())));

        return Limit::perMinute(5)
            ->by($throttleKey)
            ->response(function (Request $req) use ($throttleKey) {
                $seconds = RateLimiter::availableIn($throttleKey);

                // 2. Check if the request is from Inertia (JSON)
                if ($req->expectsJson()) {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in ' . $seconds . ' seconds.',
                    ], 429);
                }

                // Fallback for native/non-JS requests
                $req->session()->put('active_guard', 'program_head');
                return response()->view('auth.program-head-lockout', ['seconds' => $seconds], 200);
            });
    });
}
}