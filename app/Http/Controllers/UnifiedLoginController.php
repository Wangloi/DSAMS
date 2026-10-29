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

        $identifier = trim((string) $request->input('identifier'));
        $password = (string) $request->input('password');
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

        // 1. Resolve student authentication: allow logging in with raw student ID (without 'ID-'), with 'ID-', or via email
        $studentAttempt = false;
        if (!str_contains($identifier, '@')) {
            $rawId = $identifier;
            $stripped = preg_replace('/^ID-/i', '', $rawId);
            $withPrefix = 'ID-' . $stripped;

            $candidateStudent = \App\Models\Student::where(function ($q) use ($rawId, $stripped, $withPrefix) {
                $q->where('student_id', $rawId)
                  ->orWhere('student_id', $withPrefix)
                  ->orWhere('student_id', $stripped)
                  ->orWhereRaw('UPPER(student_id) = ?', [strtoupper($withPrefix)])
                  ->orWhereRaw('UPPER(student_id) = ?', [strtoupper($stripped)]);
            })->first();

            if ($candidateStudent && \Illuminate\Support\Facades\Hash::check($password, $candidateStudent->password)) {
                Auth::guard('student')->login($candidateStudent, $remember);
                $studentAttempt = true;
            }
        }

        // Fallback attempt with student guard by student_id or email
        if (!$studentAttempt) {
            $studentAttempt = Auth::guard('student')->attempt(['student_id' => $identifier, 'password' => $password], $remember)
                || Auth::guard('student')->attempt(['email' => $identifier, 'password' => $password], $remember);
        }

        if ($studentAttempt) {
            $user = Auth::guard('student')->user();
            if ($user->verification_status === 'rejected' || $user->status === 'rejected') {
                Auth::guard('student')->logout();
                throw ValidationException::withMessages([
                    'identifier' => 'Your registration has been rejected. Please contact the administrator.',
                ]);
            }
            // Enforce One Device, One Account Policy
            try {
                if (class_exists(\App\Services\Auth\DeviceBindingService::class)) {
                    app(\App\Services\Auth\DeviceBindingService::class)->enforceDeviceBinding($user, $request);
                }
            } catch (ValidationException $e) {
                Auth::guard('student')->logout();
                throw $e;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Device binding check skipped due to error: ' . $e->getMessage());
            }

            // Check for two-factor authentication
            try {
                if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'student', $remember)) {
                    return $redirect;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('TwoFactor check skipped due to error: ' . $e->getMessage());
            }

            $request->session()->regenerate();
            $request->session()->flash('status', $successMessages['student']);
            $request->session()->flash('success', $successMessages['student']);
            return redirect($dashboardRoutes['student']);
        }

        // Try admin guard with email
        if (Auth::guard('admin')->attempt(['email' => $identifier, 'password' => $password], $remember)) {
            $admin = Auth::guard('admin')->user();
            try {
                if (method_exists($admin, 'isHandoverExpired') && ($admin->isHandoverExpired() || $admin->is_active === false)) {
                    if ($admin->is_active !== false) {
                        $admin->update(['is_active' => false]);
                    }
                    Auth::guard('admin')->logout();
                    throw ValidationException::withMessages([
                        'identifier' => 'This administrator account has expired following the 3-day handover transition period. Please sign in using the new administrator account.',
                    ]);
                }
            } catch (ValidationException $e) {
                throw $e;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Admin handover check error: ' . $e->getMessage());
            }

            // Check for two-factor authentication
            try {
                if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $admin, 'admin', $remember)) {
                    return $redirect;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Admin TwoFactor check error: ' . $e->getMessage());
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
            try {
                if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'program_head', $remember)) {
                    return $redirect;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('ProgramHead TwoFactor check error: ' . $e->getMessage());
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

