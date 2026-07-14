<?php

namespace App\Jobs;

use App\Models\AuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class LogAuditEntry implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $action;
    protected array $payload;

    /**
     * Create a new job instance.
     */
    public function __construct(string $action, array $payload = [])
    {
        $this->action = $action;
        $this->payload = $payload;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        AuditLog::create([
            'actor_id'   => $this->payload['actor_id'] ?? null,
            'role'       => $this->payload['role'] ?? null,
            'target_id'  => $this->payload['target_id'] ?? null,
            'action'     => $this->action,
            'old'        => $this->payload['old'] ?? null,
            'new'        => $this->payload['new'] ?? null,
            'ip'         => $this->payload['ip'] ?? null,
            'device'     => $this->payload['device'] ?? null,
            'request_id' => $this->payload['request_id'] ?? null,
        ]);
    }
}
?>
