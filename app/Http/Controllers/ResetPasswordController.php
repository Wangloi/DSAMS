<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class ResetPasswordController extends Controller
{
    /**
     * Show the reset-password form.
     */
    public function create(Request $request, string $token)
    {
        return inertia('auth/reset-password', [
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    /**
     * Handle an incoming new-password request.
     * Tries each broker until the token + email pair is valid.
     */
    public function store(Request $request)
    {
        $request->validate([
            'token'                 => ['required'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $brokers = ['students', 'admin_users', 'program_heads'];

        foreach ($brokers as $brokerName) {
            $broker = Password::broker($brokerName);

            // Only attempt if a user with this email exists in the broker's provider
            $user = $broker->getUser(['email' => $request->email]);
            if (! $user) {
                continue;
            }

            $status = $broker->reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password'       => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    event(new PasswordReset($user));
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return redirect()->route('login')->with('status', __($status));
            }

            if ($status === Password::INVALID_TOKEN) {
                throw ValidationException::withMessages([
                    'email' => [__($status)],
                ]);
            }

            // For any other failure, fall through to next broker
        }

        throw ValidationException::withMessages([
            'email' => [trans('passwords.user')],
        ]);
    }
}
