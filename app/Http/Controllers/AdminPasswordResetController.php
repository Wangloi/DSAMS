<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AdminPasswordResetController extends Controller
{
    public function approve(PasswordResetRequest $passwordResetRequest)
    {
        if ($passwordResetRequest->status !== 'pending') {
            return back()->with('error', 'Request is no longer pending.');
        }

        $modelClass = match($passwordResetRequest->user_type) {
            'students' => \App\Models\Student::class,
            'admin_users' => \App\Models\AdminUser::class,
            'program_heads' => \App\Models\ProgramHead::class,
            default => null,
        };

        if (!$modelClass) {
            return back()->with('error', 'Invalid user type.');
        }

        $user = $modelClass::where('email', $passwordResetRequest->email)->first();

        if (!$user) {
            return back()->with('error', 'User not found.');
        }

        $staticPassword = 'password123';
        $user->password = \Illuminate\Support\Facades\Hash::make($staticPassword);
        $user->save();

        $user->notify(new \App\Notifications\PasswordResetApprovedStatic($staticPassword));

        $passwordResetRequest->update([
            'status' => 'approved',
            'resolved_at' => now(),
        ]);

        return back()->with('status', 'Password reset to static password and user notified.');
    }

    public function reject(PasswordResetRequest $passwordResetRequest)
    {
        if ($passwordResetRequest->status !== 'pending') {
            return back()->with('error', 'Request is no longer pending.');
        }

        $passwordResetRequest->update([
            'status' => 'rejected',
            'resolved_at' => now(),
        ]);

        return back()->with('status', 'Password reset request rejected.');
    }
}
