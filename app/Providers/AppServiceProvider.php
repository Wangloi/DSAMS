<?php

namespace App\Providers;

use App\Listeners\LogFailedLogin;
use App\Listeners\LogLogout;
use App\Listeners\LogSuccessfulLogin;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureUrl();
        $this->configureDefaults();
        $this->registerEventListeners();
        $this->configureRateLimiting();
    }

    protected function configureUrl(): void
    {
        $appUrl = config('app.url');

        // Force HTTPS ONLY if the request is actually coming through HTTPS / SSL proxy (e.g. Laragon SSL port 443)
        $isHttpsRequest = request()->isSecure()
            || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on')
            || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        if ($isHttpsRequest) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        if (($appUrl === 'http://localhost' || empty($appUrl)) && app()->environment('local')) {
            $host = request()->getHost();
            $scheme = $isHttpsRequest ? 'https' : 'http';
            $port = request()->getPort();

            $portSuffix = (($scheme === 'http' && $port != 80) || ($scheme === 'https' && $port != 443))
                ? ':' . $port
                : '';

            config(['app.url' => "{$scheme}://{$host}{$portSuffix}"]);
            \Illuminate\Support\Facades\URL::forceRootUrl("{$scheme}://{$host}{$portSuffix}");
        }
    }

    protected function configureRateLimiting(): void
    {
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });

        \Illuminate\Support\Facades\RateLimiter::for('web', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by(
                $request->user()?->id ?: $request->ip()
            );
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => Password::min(8)
            ->mixedCase()
            ->letters()
            ->numbers()
            ->symbols()
        );
    }

    protected function registerEventListeners(): void
    {
        Event::listen(Login::class, LogSuccessfulLogin::class);
        Event::listen(Failed::class, LogFailedLogin::class);
        Event::listen(Logout::class, LogLogout::class);
    }
}
