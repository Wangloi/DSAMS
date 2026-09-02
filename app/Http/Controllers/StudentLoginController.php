<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StudentLoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = $request->input('email');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // Check by student_id or email
        if (
            Auth::guard('student')->attempt(['student_id' => $loginInput, 'password' => $password], $remember) ||
            Auth::guard('student')->attempt(['email' => $loginInput, 'password' => $password], $remember)
        ) {
            $user = Auth::guard('student')->user();
            if ($user->verification_status !== 'approved' && $user->status !== 'approved') {
                Auth::guard('student')->logout();
                $msg = ($user->verification_status === 'rejected' || $user->status === 'rejected')
                    ? 'Your registration has been rejected. Please contact the administrator.'
                    : 'Your account is pending approval. Please wait for verification.';
                throw ValidationException::withMessages([
                    'email' => $msg,
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', 'Login successful! Welcome back!');

            return redirect()->intended(route('student.dashboard'));
        }

        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('student.login');
    }
}
