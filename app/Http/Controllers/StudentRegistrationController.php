<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use App\Models\Student;

class StudentRegistrationController extends Controller
{
    /**
     * Step 1 — Account credentials & basic student info.
     * Personal Info, Academic Background, and Family Background
     * are collected AFTER the student logs in for the first time.
     */
    public function storeStep1(Request $request)
    {
        // Debug: Log incoming data
        \Log::info('Step 1 registration data:', $request->all());

        $validator = Validator::make($request->all(), [
            'email'        => 'required|email|unique:students,email',
            'password'     => 'required|min:8|confirmed',
            'student_id'   => 'required|unique:students,student_id',
            'first_name'   => 'required|string|max:255',
            'middle_name'  => 'nullable|string|max:255',
            'last_name'    => 'required|string|max:255',
            'entry_status' => 'required|in:1st Year,2nd Year,3rd Year,4th Year,Freshman,Returnee,Transferee,Old Student',
            'program'      => 'required|string|max:255',
            'major'        => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            \Log::error('Step 1 validation errors:', $validator->errors()->toArray());
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $firstName  = $request->first_name;
            $middleName = $request->middle_name ?? null;
            $lastName   = $request->last_name;
            $fullName   = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);

            $student = Student::create([
                'name'         => $fullName,
                'email'        => $request->email,
                'password'     => bcrypt($request->password),
                'first_name'   => $firstName,
                'middle_name'  => $middleName,
                'last_name'    => $lastName,
                'student_id'   => $request->student_id,
                'course'       => $request->program,
                'year_level'   => $this->mapEntryStatusToYearLevel($request->entry_status),
                'role'         => 'student',
                'is_active'    => false, // Admin needs to activate
                'entry_status' => $request->entry_status,
                'program'      => $request->program,
                'major'        => $request->major ?? null,
            ]);

            \Log::info('Student created successfully (step 1 only):', [
                'id'    => $student->id,
                'email' => $student->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registration completed successfully! Your account is pending activation by the administrator.',
            ]);

        } catch (\Exception $e) {
            \Log::error('Registration failed with exception:', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);
            return response()->json(['success' => false, 'error' => 'Registration failed: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Legacy stub endpoints — kept so existing sessions don't 404,
     * but step 1 now completes registration directly.
     */
    public function storeStep2(Request $request)
    {
        return response()->json(['success' => false, 'error' => 'This endpoint is no longer used. Profile info is collected after login.'], 410);
    }

    public function storeStep3(Request $request)
    {
        return response()->json(['success' => false, 'error' => 'This endpoint is no longer used. Profile info is collected after login.'], 410);
    }

    public function storeStep4(Request $request)
    {
        return response()->json(['success' => false, 'error' => 'This endpoint is no longer used. Profile info is collected after login.'], 410);
    }

    public function complete()
    {
        return response()->json(['success' => false, 'error' => 'This endpoint is no longer used.'], 410);
    }

    private function mapEntryStatusToYearLevel($entryStatus)
    {
        $mapping = [
            '1st Year'   => '1st Year',
            '2nd Year'   => '2nd Year',
            '3rd Year'   => '3rd Year',
            '4th Year'   => '4th Year',
            'Freshman'   => '1st Year',
            'Returnee'   => '1st Year',
            'Transferee' => '1st Year',
            'Old Student' => '1st Year',
        ];

        return $mapping[$entryStatus] ?? '1st Year';
    }

    public function restart()
    {
        Session::forget('registration_data');
        return redirect()->route('login');
    }

    public function register(Request $request)
    {
        \Log::info('Unified registration request:', $request->all());

        $role = $request->input('role');

        $rules = [
            'role' => 'required|in:student,program_head,admin',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|min:8|confirmed',
        ];

        if ($role === 'student') {
            $rules['student_id'] = 'required|string|max:50|unique:students,student_id';
            $rules['course'] = 'required|string|max:255';
            $rules['email'] .= '|unique:students,email';
        } elseif ($role === 'program_head') {
            $rules['student_id'] = 'required|string|max:50'; 
            $rules['course'] = 'required|string|max:255';
            $rules['email'] .= '|unique:program_heads,email';
        } elseif ($role === 'admin') {
            $rules['student_id'] = 'required|string|max:50'; 
            $rules['email'] .= '|unique:admin_users,email';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            \Log::error('Registration validation errors:', $validator->errors()->toArray());
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            if ($role === 'student') {
                $student = Student::create([
                    'name'         => $request->name,
                    'email'        => $request->email,
                    'password'     => bcrypt($request->password),
                    'student_id'   => $request->student_id,
                    'course'       => $request->course,
                    'year_level'   => '1st Year',
                    'role'         => 'student',
                    'is_active'    => false,
                    'status'       => 'pending',
                    'verification_status' => 'pending',
                ]);
                \Log::info('Registered Student successfully:', ['id' => $student->id, 'email' => $student->email]);
            } elseif ($role === 'program_head') {
                $ph = \App\Models\ProgramHead::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => bcrypt($request->password),
                    'program' => $request->course,
                    'verification_status' => 'pending',
                ]);
                \Log::info('Registered Program Head successfully:', ['id' => $ph->id, 'email' => $ph->email]);
            } elseif ($role === 'admin') {
                $admin = \App\Models\AdminUser::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => bcrypt($request->password),
                ]);
                \Log::info('Registered Admin successfully:', ['id' => $admin->id, 'email' => $admin->email]);
            }

            session()->flash('status', 'Registration successful! Your account is pending verification and approval.');

            return redirect()->route('login');

        } catch (\Exception $e) {
            \Log::error('Registration failed with exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return redirect()->back()->withErrors(['email' => 'Registration failed: ' . $e->getMessage()])->withInput();
        }
    }
}
