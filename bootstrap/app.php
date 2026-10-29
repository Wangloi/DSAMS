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
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->validateCsrfTokens(except: [
            'admin/manage-users/bulk-import',
            'admin/attendance/*/scan',
            'admin/attendance/*/logs',
            'admin/attendance/*/activate-scanner-portal',
            'program-head/attendance/*/scan',
            'program-head/attendance/*/logs',
            'program-head/attendance/*/activate-scanner-portal',
            'student/attendance/*/scan',
            'student/attendance/*/dynamic-qr-scan',
            'student/attendance/*/geofence-checkin',
            'api/session/extend',
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'auth.active' => \App\Http\Middleware\AuthenticateActiveGuard::class,
            'approved' => \App\Http\Middleware\EnsureStudentApproved::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\SetSecurityHeaders::class,
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
            // If the user is logged into another guard (e.g. Student trying to visit /admin-dashboard),
            // show the 403 Forbidden Error page with the Please Go Back button instead of kicking them out to login.
            $isLoggedInAnyGuard = \Illuminate\Support\Facades\Auth::guard('student')->check()
                || \Illuminate\Support\Facades\Auth::guard('program_head')->check()
                || \Illuminate\Support\Facades\Auth::guard('admin')->check();

            if ($isLoggedInAnyGuard && ! $request->expectsJson()) {
                return Inertia::render('Error', [
                    'status' => 403,
                    'message' => 'You do not have permission to access this page with your current account.',
                ])->toResponse($request)->setStatusCode(403);
            }

            if ($request->header('X-Inertia')) {
                return Inertia::location(route('login'));
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 401);
            }

            return redirect()->guest(route('login'));
        });

        // Handle all other HTTP exceptions (404, 403, 500, etc.)
        $exceptions->render(function (Throwable $e, $request) {
            // Let Laravel handle ValidationExceptions natively (redirects with errors)
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return null;
            }

            if ($request->expectsJson()) {
                return null;
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            if (in_array($status, [401, 403, 404, 405, 419, 429, 500, 503], true)) {
                return Inertia::render('Error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return null;
        });
    })->create();
