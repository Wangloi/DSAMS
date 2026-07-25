<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Models\PasswordResetRequest;
use App\Notifications\PasswordResetRequestedAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class ForgotPasswordController extends Controller
{
    /**
     * Show the forgot-password form.
     * Fortify renders the Inertia page at resources/js/pages/auth/forgot-password.tsx
     */
    public function create()
    {
        return inertia('auth/forgot-password', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming forgot-password request.
     * Tries students → admin_users → program_heads until a match is found.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Map of broker name → broker instance
        $brokers = ['students', 'admin_users', 'program_heads'];

        foreach ($brokers as $brokerName) {
            $broker = Password::broker($brokerName);

            // Check if the user exists under this broker
            $user = $broker->getUser(['email' => $request->email]);

            if ($user) {
                // Check if a pending request already exists
                $existingRequest = PasswordResetRequest::where('email', $request->email)
                    ->where('status', 'pending')
                    ->first();
                
                if (!$existingRequest) {
                    PasswordResetRequest::create([
                        'email' => $request->email,
                        'user_type' => $brokerName,
                        'status' => 'pending',
                    ]);

                    $admins = AdminUser::all();
                    Notification::send($admins, new PasswordResetRequestedAdmin($request->email));
                }

                return back()->with('status', 'Your password reset request has been sent to the administrator for approval.');
            }
        }

        // No user found in any table — return generic error for security
        throw ValidationException::withMessages([
            'email' => [trans('passwords.user')],
        ]);
    }
}
