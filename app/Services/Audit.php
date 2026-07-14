<?php
namespace App\Services;

use App\Jobs\LogAuditEntry;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redis;

class Audit
{
    public static function log(string $action, array $payload = []): void
    {
        // Dispatch job to store audit log
        LogAuditEntry::dispatch($action, $payload);

        // Increment Redis counter for alerting if configured
        $config = config('audit');
        $redisKey = $config['redis_prefixes'][$action] ?? null;
        if ($redisKey) {
            $threshold = $config['thresholds'][$action] ?? ['limit' => 5, 'window' => 60];
            $windowKey = $redisKey . ':' . now()->timestamp;
            $count = Redis::incr($windowKey);
            Redis::expire($windowKey, $threshold['window']);

            if ($count >= $threshold['limit']) {
                // Send email alert (simple implementation)
                Mail::raw(
                    "Alert: {$action} exceeded threshold of {$threshold['limit']} within {$threshold['window']} seconds.",
                    function ($message) {
                        $message->to(config('audit.alert_email', 'admin@example.com'))
                            ->subject('Audit Alert');
                    }
                );
            }
        }
    }
}
