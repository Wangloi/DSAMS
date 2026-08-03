<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Auth\AuthenticationException;
use Inertia\Inertia;

if (file_exists(dirname(__DIR__).'/.env')) {
    \Dotenv\Dotenv::createMutable(dirname(__DIR__))->safeLoad();
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'auth.active' => \App\Http\Middleware\AuthenticateActiveGuard::class,
            'approved' => \App\Http\Middleware\EnsureStudentApproved::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\SyncActiveAuthGuard::class,
            AddLinkHeadersForPreloadedAssets::class,
            HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityAudit::class,
            \App\Http\Middleware\HandleAppearance::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (Throwable $e) {
            \Illuminate\Support\Facades\Log::error($e->getMessage(), [
                'stack' => $e->getTraceAsString(),
            ]);
        });

        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('login'));
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 401);
            }

            return redirect()->guest(route('login'));
        });

        // Handle all other exceptions for Inertia requests
        $exceptions->render(function (Throwable $e, $request) {
            // Let Laravel handle ValidationExceptions natively (redirects with errors)
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return null;
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            if ($request->header('X-Inertia')) {
                return Inertia::render('Error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            // Fall back to default Laravel error page for non-Inertia requests
            return null;
        });
    })->create();
