<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>DSAMS Hostinger Diagnostic & Repair Tool</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px 15px; margin: 0; line-height: 1.5; }
        .card { max-width: 850px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-top: 0; font-size: 22px; }
        h2 { color: #94a3b8; font-size: 16px; margin: 20px 0 10px; border-bottom: 1px solid #334155; padding-bottom: 6px; }
        .item { padding: 10px 14px; margin-bottom: 8px; border-radius: 8px; background: #090d16; font-family: monospace; font-size: 13px; word-break: break-all; }
        .item-ok { color: #4ade80; border-left: 4px solid #22c55e; }
        .item-warn { color: #fbbf24; border-left: 4px solid #f59e0b; }
        .item-err { color: #f87171; border-left: 4px solid #ef4444; }
        pre.log { background: #020617; color: #fca5a5; padding: 14px; border-radius: 8px; font-size: 12px; max-height: 350px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px; margin-right: 10px; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
<div class="card">
    <h1>🚀 DSAMS Hostinger Diagnostic & Repair</h1>

    <h2>1. Environment & System Checks</h2>
<?php
$baseDir = __DIR__;
if (!file_exists($baseDir . '/artisan') && file_exists(dirname($baseDir) . '/artisan')) {
    $baseDir = dirname($baseDir);
}

// PHP Version
$phpVersion = PHP_VERSION;
if (version_compare($phpVersion, '8.2.0', '>=')) {
    echo '<div class="item item-ok">✓ PHP Version: ' . htmlspecialchars($phpVersion) . ' (Supported)</div>';
} else {
    echo '<div class="item item-err">✗ PHP Version: ' . htmlspecialchars($phpVersion) . ' (TOO LOW! Hostinger requires PHP 8.2 or 8.3 for Laravel 12)</div>';
}

// .env File & Key
$envPath = $baseDir . '/.env';
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    if (preg_match('/^APP_KEY=(.+)$/m', $envContent, $m) && !empty(trim($m[1]))) {
        echo '<div class="item item-ok">✓ .env file exists and APP_KEY is set</div>';
    } else {
        echo '<div class="item item-err">✗ APP_KEY is empty in .env! Run "php artisan key:generate" or set APP_KEY</div>';
    }
} else {
    echo '<div class="item item-err">✗ Missing .env file in ' . htmlspecialchars($baseDir) . '</div>';
}

// Writable Storage & Cache
$storagePath = $baseDir . '/storage';
$cachePath = $baseDir . '/bootstrap/cache';
if (is_writable($storagePath)) {
    echo '<div class="item item-ok">✓ storage directory is writable</div>';
} else {
    echo '<div class="item item-err">✗ storage directory is NOT writable! Set chmod to 775 or 777 in Hostinger File Manager</div>';
}

if (is_writable($cachePath)) {
    echo '<div class="item item-ok">✓ bootstrap/cache directory is writable</div>';
} else {
    echo '<div class="item item-err">✗ bootstrap/cache directory is NOT writable! Set chmod to 775 or 777 in Hostinger File Manager</div>';
}

// Vite Manifest check
$manifestPath = $baseDir . '/public/build/manifest.json';
if (file_exists($manifestPath)) {
    echo '<div class="item item-ok">✓ public/build/manifest.json exists (Production assets built)</div>';
} else {
    echo '<div class="item item-warn">⚠ Missing public/build/manifest.json! Make sure to upload the "public/build" directory built with "npm run build"</div>';
}
?>

    <h2>2. Maintenance & 503 Auto-Fixes</h2>
<?php
// Remove Maintenance Mode
if (file_exists($baseDir . '/storage/framework/down')) {
    @unlink($baseDir . '/storage/framework/down');
    echo '<div class="item item-ok">✓ Removed storage/framework/down (Maintenance mode turned OFF)</div>';
} else {
    echo '<div class="item item-ok">✓ Application is not in maintenance mode</div>';
}

if (file_exists($baseDir . '/storage/framework/maintenance.php')) {
    @unlink($baseDir . '/storage/framework/maintenance.php');
    echo '<div class="item item-ok">✓ Removed storage/framework/maintenance.php</div>';
}

// Remove public/hot (prevents Vite 503 error)
if (file_exists($baseDir . '/public/hot')) {
    @unlink($baseDir . '/public/hot');
    echo '<div class="item item-ok">✓ Removed public/hot (Vite will use pre-built production assets)</div>';
} else {
    echo '<div class="item item-ok">✓ public/hot is not present (Production mode active)</div>';
}
?>

    <h2>3. Application Boot & Cache Clear</h2>
<?php
try {
    require_once $baseDir . '/vendor/autoload.php';
    $app = require_once $baseDir . '/bootstrap/app.php';
    $request = \Illuminate\Http\Request::capture();
    $app->instance('request', $request);
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $kernel->bootstrap();

    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo '<div class="item item-ok">✓ Cleared route, config, view, and application cache</div>';
} catch (\Throwable $e) {
    echo '<div class="item item-err">✗ Boot / Cache error: ' . htmlspecialchars($e->getMessage()) . '<br><small>' . htmlspecialchars($e->getFile() . ':' . $e->getLine()) . '</small></div>';
}
?>

    <h2>4. View & Blade Check</h2>
<?php
$bladePath = $baseDir . '/resources/views/app.blade.php';
if (file_exists($bladePath)) {
    $bladeContent = file_get_contents($bladePath);
    $hasOldBug = str_contains($bladeContent, '$pageComponent') 
        || str_contains($bladeContent, "resources/js/pages/{\$page['component']}.tsx")
        || str_contains($bladeContent, 'resources/js/pages/{$page[\'component\']}');
    $hasCleanVite = preg_match('/@vite\(\s*\[[\'"]resources\/js\/app\.tsx[\'"]\]\s*\)/', $bladeContent);
    if (!$hasOldBug && $hasCleanVite) {
        echo '<div class="item item-ok">✓ resources/views/app.blade.php is CLEAN (No dynamic component in @vite, 500 error eliminated! Modified: ' . date('Y-m-d H:i:s', filemtime($bladePath)) . ')</div>';
    } else {
        echo '<div class="item item-err">✗ resources/views/app.blade.php still has the problematic code! Please upload the new app.blade.php to resources/views/app.blade.php</div>';
    }
} else {
    echo '<div class="item item-err">✗ Missing resources/views/app.blade.php</div>';
}
?>

    <h2>5. Test Simulated Student Dashboard Request</h2>
<?php
try {
    $student = \App\Models\Student::first();
    if ($student) {
        \Illuminate\Support\Facades\Auth::guard('student')->setUser($student);
        $testReq = \Illuminate\Http\Request::create('/student-dashboard', 'GET');
        $testReq->setUserResolver(fn () => $student);
        $response = $app->handle($testReq);
        $status = $response->getStatusCode();
        if ($status === 200) {
            echo '<div class="item item-ok">✓ GET /student-dashboard returned HTTP 200 OK for student ID ' . htmlspecialchars((string) $student->id) . '</div>';
        } else {
            echo '<div class="item item-err">✗ GET /student-dashboard returned HTTP ' . $status . '</div>';
            if ($status >= 400 && method_exists($response, 'getContent')) {
                echo '<pre class="log" style="max-height:200px;">' . htmlspecialchars(substr($response->getContent(), 0, 1000)) . '</pre>';
            }
        }
    } else {
        echo '<div class="item item-warn">⚠ No student found in database to test</div>';
    }
} catch (\Throwable $e) {
    echo '<div class="item item-err">✗ Exception when simulating /student-dashboard: ' . htmlspecialchars($e->getMessage()) . '<br><small>' . htmlspecialchars($e->getFile() . ':' . $e->getLine()) . '</small><br><pre class="log" style="max-height:250px;">' . htmlspecialchars($e->getTraceAsString()) . '</pre></div>';
}
?>

    <h2>6. Laravel Error & Exception Logs</h2>
<?php
$logFile = $baseDir . '/storage/logs/laravel.log';
if (file_exists($logFile) && filesize($logFile) > 0) {
    $lines = file($logFile);
    $errorLines = [];
    $total = count($lines);
    // Find lines matching error patterns or get last 60 lines
    for ($i = max(0, $total - 250); $i < $total; $i++) {
        $line = $lines[$i];
        if (preg_match('/(ERROR|CRITICAL|EMERGENCY|Exception|Stack trace|#\d+\s+)/i', $line)) {
            $errorLines[] = $line;
        }
    }
    
    if (!empty($errorLines)) {
        echo '<h3 style="color:#f87171;font-size:14px;margin-top:5px;">Recent Errors / Exceptions:</h3>';
        echo '<pre class="log" style="max-height:300px;">' . htmlspecialchars(implode('', array_slice($errorLines, -40))) . '</pre>';
    }

    $lastLines = array_slice($lines, -35);
    echo '<h3 style="color:#94a3b8;font-size:14px;margin-top:10px;">Tail of laravel.log (Last 35 lines):</h3>';
    echo '<pre class="log" style="max-height:250px;">' . htmlspecialchars(implode('', $lastLines)) . '</pre>';
} else {
    echo '<div class="item item-ok">✓ No error logs in storage/logs/laravel.log</div>';
}
?>

    <div style="margin-top:20px;">
        <a href="/" class="btn">Return to Application</a>
        <a href="javascript:location.reload()" class="btn" style="background:#475569;">Refresh Diagnostics</a>
    </div>
</div>
</body>
</html>