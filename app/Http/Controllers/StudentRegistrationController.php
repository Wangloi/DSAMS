<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use App\Models\Student;

class StudentRegistrationController extends Controller
{
    public function storeStep1(Request $request)
    {
        // Debug: Log incoming data
        \Log::info('Step 1 registration data:', $request->all());
        
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:students,email',
            'password' => 'required|min:8|confirmed',
            'student_id' => 'required|unique:students,student_id',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'entry_status' => 'required|in:1st Year,2nd Year,3rd Year,4th Year,Freshman,Returnee,Transferee,Old Student',
            'program' => 'required|string|max:255',
            'major' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            \Log::error('Step 1 validation errors:', $validator->errors()->toArray());
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Store step 1 data in session
        $registrationData = $request->only([
            'email', 'password', 'student_id', 'first_name', 'middle_name', 
            'last_name', 'entry_status', 'program', 'major'
        ]);
        
        // Create full name from parts
        $registrationData['name'] = trim($request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name);
        
        Session::put('registration_data', $registrationData);

        return response()->json(['success' => true, 'next_step' => 2]);
    }

    public function storeStep2(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'home_address' => 'required|string|max:500',
            'birthday' => 'required|date|before:today',
            'place_of_birth' => 'required|string|max:255',
            'religion' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'contact_no' => 'required|string|max:20',
            'nationality' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Store step 2 data in session
        $registrationData = Session::get('registration_data', []);
        $registrationData = array_merge($registrationData, $request->only([
            'home_address', 'birthday', 'place_of_birth', 'religion', 
            'gender', 'contact_no', 'nationality'
        ]));
        
        Session::put('registration_data', $registrationData);

        return response()->json(['success' => true, 'next_step' => 3]);
    }

    public function storeStep3(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'elementary_school' => 'required|string|max:255',
            'elementary_year_graduated' => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'junior_high_school' => 'required|string|max:255',
            'junior_high_year_graduated' => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'senior_high_school' => 'required|string|max:255',
            'senior_high_year_graduated' => 'required|integer|digits:4|min:1900|max:' . date('Y'),
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Store step 3 data in session
        $registrationData = Session::get('registration_data', []);
        $registrationData = array_merge($registrationData, $request->only([
            'elementary_school', 'elementary_year_graduated', 'junior_high_school',
            'junior_high_year_graduated', 'senior_high_school', 'senior_high_year_graduated'
        ]));
        
        Session::put('registration_data', $registrationData);

        return response()->json(['success' => true, 'next_step' => 4]);
    }

    public function storeStep4(Request $request)
    {
        // Debug: Log incoming data
        \Log::info('Step 4 registration data:', $request->all());
        
        // Check if we have data from previous steps
        $existingData = Session::get('registration_data', []);
        \Log::info('Existing session data before step 4:', $existingData);
        
        $validator = Validator::make($request->all(), [
            'mother_name' => 'required|string|max:255',
            'mother_contact' => 'required|string|max:20',
            'father_name' => 'required|string|max:255',
            'father_contact' => 'required|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_relation' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            \Log::error('Step 4 validation errors:', $validator->errors()->toArray());
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Store step 4 data in session
        $registrationData = Session::get('registration_data', []);
        $registrationData = array_merge($registrationData, $request->only([
            'mother_name', 'mother_contact', 'father_name', 'father_contact',
            'guardian_name', 'guardian_relation', 'guardian_contact'
        ]));
        
        \Log::info('Final registration data before completion:', $registrationData);
        
        Session::put('registration_data', $registrationData);

        // Check if all required data is present before completing
        $requiredFields = [
            'email', 'password', 'student_id', 'first_name', 'last_name', 
            'entry_status', 'program', 'home_address', 'birthday', 
            'place_of_birth', 'religion', 'gender', 'contact_no', 'nationality',
            'elementary_school', 'elementary_year_graduated', 'junior_high_school',
            'junior_high_year_graduated', 'senior_high_school', 'senior_high_year_graduated',
            'mother_name', 'mother_contact', 'father_name', 'father_contact'
        ];
        
        $missingFields = [];
        foreach ($requiredFields as $field) {
            if (!isset($registrationData[$field]) || empty($registrationData[$field])) {
                $missingFields[] = $field;
            }
        }
        
        if (!empty($missingFields)) {
            \Log::error('Missing required fields for completion:', $missingFields);
            return response()->json([
                'success' => false, 
                'error' => 'Missing required data: ' . implode(', ', $missingFields)
            ], 422);
        }

        // Complete the registration immediately for modal
        return $this->complete();
    }

    public function complete()
    {
        $registrationData = Session::get('registration_data', []);
        
        \Log::info('Complete method called with session data:', $registrationData);
        
        if (!isset($registrationData['email'])) {
            \Log::error('No email found in registration data');
            return response()->json(['success' => false, 'error' => 'No registration data found'], 422);
        }

        try {
            // Create the student record
            $student = Student::create([
                'name' => trim($registrationData['first_name'] . ' ' . ($registrationData['middle_name'] ?? '') . ' ' . $registrationData['last_name']),
                'email' => $registrationData['email'],
                'password' => bcrypt($registrationData['password']),
                'first_name' => $registrationData['first_name'],
                'middle_name' => $registrationData['middle_name'] ?? null,
                'last_name' => $registrationData['last_name'],
                'student_id' => $registrationData['student_id'],
                'course' => $registrationData['program'],
                'year_level' => $this->mapEntryStatusToYearLevel($registrationData['entry_status']),
                'role' => 'student',
                'is_active' => false, // Admin needs to activate
                // Student Information Sheet fields
                'entry_status' => $registrationData['entry_status'],
                'program' => $registrationData['program'],
                'major' => $registrationData['major'] ?? null,
                'home_address' => $registrationData['home_address'],
                'birthday' => $registrationData['birthday'],
                'place_of_birth' => $registrationData['place_of_birth'],
                'religion' => $registrationData['religion'],
                'gender' => $registrationData['gender'],
                'contact_no' => $registrationData['contact_no'],
                'nationality' => $registrationData['nationality'],
                // Academic Background
                'elementary_school' => $registrationData['elementary_school'],
                'elementary_year_graduated' => $registrationData['elementary_year_graduated'],
                'junior_high_school' => $registrationData['junior_high_school'],
                'junior_high_year_graduated' => $registrationData['junior_high_year_graduated'],
                'senior_high_school' => $registrationData['senior_high_school'],
                'senior_high_year_graduated' => $registrationData['senior_high_year_graduated'],
                // Family Background
                'mother_name' => $registrationData['mother_name'],
                'mother_contact' => $registrationData['mother_contact'],
                'father_name' => $registrationData['father_name'],
                'father_contact' => $registrationData['father_contact'],
                'guardian_name' => $registrationData['guardian_name'] ?? null,
                'guardian_relation' => $registrationData['guardian_relation'] ?? null,
                'guardian_contact' => $registrationData['guardian_contact'] ?? null,
            ]);

            \Log::info('Student created successfully:', ['id' => $student->id, 'email' => $student->email]);

            // Clear registration session
            Session::forget('registration_data');

            return response()->json([
                'success' => true, 
                'message' => 'Registration completed successfully! Your account is pending activation by the administrator.'
            ]);

        } catch (\Exception $e) {
            \Log::error('Registration failed with exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'error' => 'Registration failed: ' . $e->getMessage()], 422);
        }
    }

    private function mapEntryStatusToYearLevel($entryStatus)
    {
        $mapping = [
            '1st Year' => '1st Year',
            '2nd Year' => '2nd Year', 
            '3rd Year' => '3rd Year',
            '4th Year' => '4th Year',
            'Freshman' => '1st Year',
            'Returnee' => '1st Year', // Default to 1st year for returnees
            'Transferee' => '1st Year', // Default to 1st year for transferees
            'Old Student' => '1st Year', // Default to 1st year for old students
        ];

        return $mapping[$entryStatus] ?? '1st Year';
    }

    public function restart()
    {
        Session::forget('registration_data');
        return redirect()->route('student.register.step1');
    }
}
