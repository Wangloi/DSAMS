<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;

class LogLogout
{
    public function __construct(protected Request $request) {}

    public function handle(Logout $event): void
    {
        ActivityLog::logForUser(
            user: $event->user,
            module: 'Authentication',
            action: 'Logout',
            details: 'User logged out',
            request: $this->request
        );
    }
}
