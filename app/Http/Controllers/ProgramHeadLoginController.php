<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ProgramHeadLoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::guard('program_head')->attempt($credentials, $request->boolean('remember'))) {
            $user = Auth::guard('program_head')->user();
            if ($user->verification_status !== 'approved') {
                Auth::guard('program_head')->logout();
                $msg = ($user->verification_status === 'rejected')
                    ? 'Your registration has been rejected. Please contact the administrator.'
                    : 'Your account is pending approval. Please wait for verification.';
                throw ValidationException::withMessages([
                    'email' => $msg,
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', 'Login successful! Welcome back, Program Head!');

            return redirect()->intended(route('program-head.dashboard'));
        }

        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        ]);
    }
}
