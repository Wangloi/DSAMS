<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminLoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::guard('admin')->attempt($credentials, $request->boolean('remember'))) {
            $admin = Auth::guard('admin')->user();
            if ($admin->isHandoverExpired() || $admin->is_active === false) {
                if ($admin->is_active !== false) {
                    $admin->update(['is_active' => false]);
                }
                Auth::guard('admin')->logout();
                throw ValidationException::withMessages([
                    'email' => 'This administrator account has expired following the 3-day handover transition period. Please sign in using the new administrator account.',
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', 'Login successful! Welcome back, Admin!');

            return redirect()->intended(route('admin.dashboard'));
        }

        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        ]);
    }
}
