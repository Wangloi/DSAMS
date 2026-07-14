<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;

class LogFailedLogin
{
    public function __construct(protected Request $request) {}

    public function handle(Failed $event): void
    {
        $username = $this->request->input($event->credentials['email'] ?? 'email');
        
        ActivityLog::log(
            module: 'Authentication',
            action: 'Login Failed',
            details: "Failed login attempt for username: {$username}",
            userName: $username,
            userType: $event->guard,
            request: $this->request
        );
    }
}
