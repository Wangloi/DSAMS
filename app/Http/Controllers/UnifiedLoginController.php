<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class UnifiedLoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'identifier' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $identifier = $request->input('identifier');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // List of guards to try
        $guards = ['student', 'admin', 'program_head'];
        $dashboardRoutes = [
            'student' => route('student.dashboard'),
            'admin' => route('admin.dashboard'),
            'program_head' => route('program-head.dashboard'),
        ];
        $successMessages = [
            'student' => 'Login successful! Welcome back!',
            'admin' => 'Login successful! Welcome back, Admin!',
            'program_head' => 'Login successful! Welcome back, Program Head!',
        ];

        // Try student guard first with student_id, then with email
        if (Auth::guard('student')->attempt(['student_id' => $identifier, 'password' => $password], $remember)) {
            $user = Auth::guard('student')->user();
            if ($user->verification_status !== 'approved' && $user->status !== 'approved') {
                Auth::guard('student')->logout();
                $msg = ($user->verification_status === 'rejected' || $user->status === 'rejected')
                    ? 'Your registration has been rejected. Please contact the administrator.'
                    : 'Your account is pending approval. Please wait for verification.';
                throw ValidationException::withMessages([
                    'identifier' => $msg,
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['student']);
            return redirect()->intended($dashboardRoutes['student']);
        }
        if (Auth::guard('student')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $user = Auth::guard('student')->user();
            if ($user->verification_status !== 'approved' && $user->status !== 'approved') {
                Auth::guard('student')->logout();
                $msg = ($user->verification_status === 'rejected' || $user->status === 'rejected')
                    ? 'Your registration has been rejected. Please contact the administrator.'
                    : 'Your account is pending approval. Please wait for verification.';
                throw ValidationException::withMessages([
                    'identifier' => $msg,
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['student']);
            return redirect()->intended($dashboardRoutes['student']);
        }

        // Try admin guard with email
        if (Auth::guard('admin')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['admin']);
            return redirect()->intended($dashboardRoutes['admin']);
        }

        // Try program_head guard with email
        if (Auth::guard('program_head')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $user = Auth::guard('program_head')->user();
            if ($user->verification_status !== 'approved') {
                Auth::guard('program_head')->logout();
                $msg = ($user->verification_status === 'rejected')
                    ? 'Your registration has been rejected. Please contact the administrator.'
                    : 'Your account is pending approval. Please wait for verification.';
                throw ValidationException::withMessages([
                    'identifier' => $msg,
                ]);
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['program_head']);
            return redirect()->intended($dashboardRoutes['program_head']);
        }

        // If none of the guards worked, throw validation exception
        throw ValidationException::withMessages([
            'identifier' => trans('auth.failed'),
        ]);
    }
}
