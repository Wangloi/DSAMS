<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Services\Auth\DeviceBindingService;
use App\Support\TwoFactorLoginHelper;
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

        $loginInput = trim((string) $request->input('email'));
        $password = (string) $request->input('password');
        $remember = $request->boolean('remember');

        // Check by student_id (with or without 'ID-' prefix, case-insensitive) or email
        $studentAttempt = false;
        if (!str_contains($loginInput, '@')) {
            $rawId = $loginInput;
            $stripped = preg_replace('/^ID-/i', '', $rawId);
            $withPrefix = 'ID-' . $stripped;

            $candidateStudent = Student::where(function ($q) use ($rawId, $stripped, $withPrefix) {
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

        if (!$studentAttempt) {
            $studentAttempt = Auth::guard('student')->attempt(['student_id' => $loginInput, 'password' => $password], $remember)
                || Auth::guard('student')->attempt(['email' => $loginInput, 'password' => $password], $remember);
        }

        if ($studentAttempt) {
            /** @var Student $user */
            $user = Auth::guard('student')->user();
            if ($user->verification_status === 'rejected' || $user->status === 'rejected') {
                Auth::guard('student')->logout();
                throw ValidationException::withMessages([
                    'email' => 'Your registration has been rejected. Please contact the administrator.',
                ]);
            }
            // Enforce One Device, One Account Policy
            try {
                if ($user instanceof Student && class_exists(DeviceBindingService::class)) {
                    app(DeviceBindingService::class)->enforceDeviceBinding($user, $request);
                }
            } catch (ValidationException $e) {
                Auth::guard('student')->logout();
                throw $e;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Device binding check skipped: ' . $e->getMessage());
            }

            // Check for two-factor authentication
            try {
                if ($redirect = TwoFactorLoginHelper::redirectIfTwoFactorEnabled($request, $user, 'student', $remember)) {
                    return $redirect;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('TwoFactor check skipped: ' . $e->getMessage());
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
