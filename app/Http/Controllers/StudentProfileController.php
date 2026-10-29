<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class StudentProfileController extends Controller
{
    /**
     * Display the Student Information Sheet view for the authenticated student.
     */
    public function showInformationSheet()
    {
        $student = Auth::guard('student')->user();

        if (! $student) {
            return redirect()->route('login');
        }

        return Inertia::render('student/information-sheet/index', [
            'student' => $student,
        ]);
    }

    /**
     * Update the Student Information Sheet details.
     */
    public function updateInformationSheet(Request $request)
    {
        $student = Auth::guard('student')->user();

        if (! $student) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        $validator = $this->makeProfileValidator($request);

        if ($validator->fails()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors'  => $validator->errors(),
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $updateData = [
                // Personal Information
                'home_address'   => $request->home_address,
                'birthday'       => $request->birthday,
                'place_of_birth' => $request->place_of_birth,
                'religion'       => $request->religion,
                'gender'         => $request->gender,
                'contact_no'     => $request->contact_no,
                'nationality'    => $request->nationality,

                // Academic Background
                'elementary_school'          => $request->elementary_school,
                'elementary_year_started'    => $request->elementary_year_started,
                'elementary_year_graduated'  => $request->elementary_year_graduated,
                'junior_high_school'         => $request->junior_high_school,
                'junior_high_year_started'   => $request->junior_high_year_started,
                'junior_high_year_graduated' => $request->junior_high_year_graduated,
                'senior_high_school'         => $request->senior_high_school,
                'senior_high_year_started'   => $request->senior_high_year_started,
                'senior_high_year_graduated' => $request->senior_high_year_graduated,

                // Family Background
                'mother_name'      => $request->filled('mother_name') ? $request->mother_name : null,
                'mother_contact'   => $request->filled('mother_contact') ? $request->mother_contact : null,
                'father_name'      => $request->filled('father_name') ? $request->father_name : null,
                'father_contact'   => $request->filled('father_contact') ? $request->father_contact : null,
                'guardian_name'    => $request->guardian_name ?? null,
                'guardian_relation' => $request->guardian_relation ?? null,
                'guardian_contact' => $request->guardian_contact ?? null,
            ];

            if ($request->has('major')) {
                $updateData['major'] = $request->major;
            }

            if ($request->has('middle_name')) {
                $updateData['middle_name'] = $request->middle_name;
                $firstName = $student->first_name ?: '';
                $lastName = $student->last_name ?: '';
                $updateData['name'] = trim($firstName . ' ' . ($request->middle_name ? $request->middle_name . ' ' : '') . $lastName);
            }

            $student->update($updateData);
        } catch (\Throwable $e) {
            \Log::error('Student information sheet update failed: ' . $e->getMessage(), ['student_id' => $student->id]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error'   => 'Could not update your information sheet due to a server error.',
                ], 500);
            }
            return redirect()->back()->with('error', 'Could not update your information sheet due to a server error.');
        }

        \Log::info('Student information sheet updated:', [
            'student_id' => $student->id,
            'email'      => $student->email,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Student Information Sheet updated successfully!',
            ]);
        }

        return redirect()->back()->with('success', 'Student Information Sheet updated successfully!');
    }

    /**
     * Save personal info, academic background, and family background
     * for the currently authenticated student.
     *
     * This endpoint is called by the in-dashboard ProfileCompletionModal
     * that appears when a student has not yet provided their profile data.
     */
    public function store(Request $request)
    {
        $student = Auth::guard('student')->user();

        if (! $student) {
            return response()->json(['success' => false, 'error' => 'Unauthenticated.'], 401);
        }

        $validator = $this->makeProfileValidator($request);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $student->update([
                // Personal Information
                'home_address'   => $request->home_address,
                'birthday'       => $request->birthday,
                'place_of_birth' => $request->place_of_birth,
                'religion'       => $request->religion,
                'gender'         => $request->gender,
                'contact_no'     => $request->contact_no,
                'nationality'    => $request->nationality,

                // Academic Background
                'elementary_school'          => $request->elementary_school,
                'elementary_year_started'    => $request->elementary_year_started,
                'elementary_year_graduated'  => $request->elementary_year_graduated,
                'junior_high_school'         => $request->junior_high_school,
                'junior_high_year_started'   => $request->junior_high_year_started,
                'junior_high_year_graduated' => $request->junior_high_year_graduated,
                'senior_high_school'         => $request->senior_high_school,
                'senior_high_year_started'   => $request->senior_high_year_started,
                'senior_high_year_graduated' => $request->senior_high_year_graduated,

                // Family Background
                'mother_name'      => $request->filled('mother_name') ? $request->mother_name : null,
                'mother_contact'   => $request->filled('mother_contact') ? $request->mother_contact : null,
                'father_name'      => $request->filled('father_name') ? $request->father_name : null,
                'father_contact'   => $request->filled('father_contact') ? $request->father_contact : null,
                'guardian_name'    => $request->guardian_name ?? null,
                'guardian_relation' => $request->guardian_relation ?? null,
                'guardian_contact' => $request->guardian_contact ?? null,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Student profile save failed: ' . $e->getMessage(), ['student_id' => $student->id]);

            return response()->json([
                'success' => false,
                'error'   => str_contains($e->getMessage(), 'Unknown column')
                    ? 'Database is out of date. Please run: php artisan migrate'
                    : 'Could not save your profile due to a server error.',
            ], 500);
        }

        \Log::info('Student profile completed:', [
            'student_id' => $student->id,
            'email'      => $student->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile information saved successfully!',
        ]);
    }

    /**
     * Build standard profile validation.
     */
    private function makeProfileValidator(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Personal Information (All required)
            'home_address'    => 'required|string|max:500',
            'birthday'        => 'required|date|before:today',
            'place_of_birth'  => 'required|string|max:255',
            'religion'        => 'required|string|max:255',
            'gender'          => 'required|in:Male,Female',
            'contact_no'      => ['required', 'string', 'regex:/^(09\d{9}|\+639\d{9})$/'],
            'nationality'     => 'required|string|max:255',

            // Academic Background (All required)
            'elementary_school'              => 'required|string|max:255',
            'elementary_year_started'        => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'elementary_year_graduated'      => 'required|integer|digits:4|min:1900|max:' . date('Y') . '|gte:elementary_year_started',
            'junior_high_school'             => 'required|string|max:255',
            'junior_high_year_started'       => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'junior_high_year_graduated'     => 'required|integer|digits:4|min:1900|max:' . date('Y') . '|gte:junior_high_year_started',
            'senior_high_school'             => 'required|string|max:255',
            'senior_high_year_started'       => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'senior_high_year_graduated'     => 'required|integer|digits:4|min:1900|max:' . date('Y') . '|gte:senior_high_year_started',

            // Family Background (At least one parent: Mother OR Father OR Both)
            'mother_name'      => 'nullable|string|max:255',
            'mother_contact'   => ['nullable', 'string', 'regex:/^(09\d{9}|\+639\d{9})$/'],
            'father_name'      => 'nullable|string|max:255',
            'father_contact'   => ['nullable', 'string', 'regex:/^(09\d{9}|\+639\d{9})$/'],

            // Emergency Contact (All required)
            'guardian_name'    => 'required|string|max:255',
            'guardian_relation' => 'required|string|max:255',
            'guardian_contact' => ['required', 'string', 'regex:/^(09\d{9}|\+639\d{9})$/'],

            // Optional profile additions
            'middle_name'      => 'nullable|string|max:255',
            'major'            => 'nullable|string|max:255',
        ], [
            'contact_no.regex' => 'Contact number must be 11 digits (09XXXXXXXXX) or in +63 format (+639XXXXXXXXX).',
            'mother_contact.regex' => 'Mother contact number must be 11 digits (09XXXXXXXXX) or in +63 format (+639XXXXXXXXX).',
            'father_contact.regex' => 'Father contact number must be 11 digits (09XXXXXXXXX) or in +63 format (+639XXXXXXXXX).',
            'guardian_contact.regex' => 'Emergency contact number must be 11 digits (09XXXXXXXXX) or in +63 format (+639XXXXXXXXX).',
            'elementary_year_graduated.gte' => 'Elementary Year Ended must be greater than or equal to Year Started.',
            'junior_high_year_graduated.gte' => 'Junior High Year Ended must be greater than or equal to Year Started.',
            'senior_high_year_graduated.gte' => 'Senior High Year Ended must be greater than or equal to Year Started.',
        ]);

        $validator->after(function ($v) use ($request) {
            $hasMotherName = trim((string) $request->input('mother_name')) !== '';
            $hasMotherContact = trim((string) $request->input('mother_contact')) !== '';
            $hasFatherName = trim((string) $request->input('father_name')) !== '';
            $hasFatherContact = trim((string) $request->input('father_contact')) !== '';

            $hasMother = $hasMotherName || $hasMotherContact;
            $hasFather = $hasFatherName || $hasFatherContact;

            if (! $hasMother && ! $hasFather) {
                $v->errors()->add('mother_name', 'Please provide details for at least one parent (Mother or Father).');
                $v->errors()->add('father_name', 'Please provide details for at least one parent (Mother or Father).');
            } else {
                if ($hasMother) {
                    if (! $hasMotherName) {
                        $v->errors()->add('mother_name', "Mother's full name is required.");
                    }
                    if (! $hasMotherContact) {
                        $v->errors()->add('mother_contact', "Mother's contact number is required.");
                    }
                }
                if ($hasFather) {
                    if (! $hasFatherName) {
                        $v->errors()->add('father_name', "Father's full name is required.");
                    }
                    if (! $hasFatherContact) {
                        $v->errors()->add('father_contact', "Father's contact number is required.");
                    }
                }
            }
        });

        return $validator;
    }
}
