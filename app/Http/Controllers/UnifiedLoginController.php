<?php

namespace App\Http\Controllers;

use App\Support\TwoFactorLoginHelper;
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
            if ($user->verification_status === 'rejected' || $user->status === 'rejected') {
                Auth::guard('student')->logout();
                throw ValidationException::withMessages([
                    'identifier' => 'Your registration has been rejected. Please contact the administrator.',
                ]);
            }
            // Check for two-factor authentication
            if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'student', $remember)) {
                return $redirect;
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['student']);
            $request->session()->flash('success', $successMessages['student']);
            return redirect($dashboardRoutes['student']);
        }
        if (Auth::guard('student')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $user = Auth::guard('student')->user();
            if ($user->verification_status === 'rejected' || $user->status === 'rejected') {
                Auth::guard('student')->logout();
                throw ValidationException::withMessages([
                    'identifier' => 'Your registration has been rejected. Please contact the administrator.',
                ]);
            }
            // Check for two-factor authentication
            if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'student', $remember)) {
                return $redirect;
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['student']);
            $request->session()->flash('success', $successMessages['student']);
            return redirect($dashboardRoutes['student']);
        }

        // Try admin guard with email
        if (Auth::guard('admin')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $admin = Auth::guard('admin')->user();
            if ($admin->isHandoverExpired() || $admin->is_active === false) {
                if ($admin->is_active !== false) {
                    $admin->update(['is_active' => false]);
                }
                Auth::guard('admin')->logout();
                throw ValidationException::withMessages([
                    'identifier' => 'This administrator account has expired following the 3-day handover transition period. Please sign in using the new administrator account.',
                ]);
            }
            // Check for two-factor authentication
            if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $admin, 'admin', $remember)) {
                return $redirect;
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['admin']);
            $request->session()->flash('success', $successMessages['admin']);
            return redirect($dashboardRoutes['admin']);
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
            // Check for two-factor authentication
            if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'program_head', $remember)) {
                return $redirect;
            }
            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['program_head']);
            $request->session()->flash('success', $successMessages['program_head']);
            return redirect($dashboardRoutes['program_head']);
        }

        // If none of the guards worked, throw validation exception
        throw ValidationException::withMessages([
            'identifier' => trans('auth.failed'),
        ]);
    }
}

