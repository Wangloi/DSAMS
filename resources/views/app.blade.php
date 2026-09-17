@php
    $componentName = $page['component'] ?? '';
    $isLandingPage = in_array($componentName, [
        'landing-page',
        'landing/about',
        'landing/features',
        'landing/get-started',
        'help',
        'privacy',
        'terms',
        'sitemap',
        'welcome',
    ]);
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => !$isLandingPage && ($appearance ?? 'light') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

        <!-- PWA Web App Manifest & App Metadata -->
        <link rel="manifest" href="/manifest.json">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="DSAMS">
        <meta name="application-name" content="DSAMS">
        <meta name="theme-color" content="#0b1c5c">

        {{-- Inline script to apply user appearance preference immediately (disabled on landing pages) --}}
        <script>
            (function() {
                const isLandingPage = {{ $isLandingPage ? 'true' : 'false' }};
                if (isLandingPage) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                    return;
                }

                let appearance = 'light';
                try {
                    const stored = localStorage.getItem('appearance');
                    if (stored === 'dark' || stored === 'light') {
                        appearance = stored;
                    } else {
                        appearance = '{{ ($appearance ?? "light") === "dark" ? "dark" : "light" }}';
                    }
                } catch (e) {
                    appearance = '{{ ($appearance ?? "light") === "dark" ? "dark" : "light" }}';
                }

                if (appearance === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'OSAMS') }}</title>

        <!-- CSRF Token -->
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/images/DSA.ico" sizes="any">
        <link rel="icon" href="/images/DSA.png" type="image/png">
        <link rel="apple-touch-icon" href="/images/DSA.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/images/DSA.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/images/DSA.png">
        <link rel="apple-touch-icon" sizes="167x167" href="/images/DSA.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
