<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class LogSuccessfulLogin
{
    public function __construct(protected Request $request) {}

    public function handle(Login $event): void
    {
        ActivityLog::logForUser(
            user: $event->user,
            module: 'Authentication',
            action: 'Login Successful',
            details: 'User logged in successfully',
            request: $this->request
        );
    }
}
