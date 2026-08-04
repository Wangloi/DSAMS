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
