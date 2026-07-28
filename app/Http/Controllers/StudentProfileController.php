<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class StudentProfileController extends Controller
{
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

        $validator = Validator::make($request->all(), [
            // Personal Information
            'home_address'    => 'required|string|max:500',
            'birthday'        => 'required|date|before:today',
            'place_of_birth'  => 'required|string|max:255',
            'religion'        => 'required|string|max:255',
            'gender'          => 'required|in:Male,Female',
            'contact_no'      => 'required|string|max:20',
            'nationality'     => 'required|string|max:255',

            // Academic Background
            'elementary_school'              => 'required|string|max:255',
            'elementary_year_graduated'      => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'junior_high_school'             => 'required|string|max:255',
            'junior_high_year_graduated'     => 'required|integer|digits:4|min:1900|max:' . date('Y'),
            'senior_high_school'             => 'required|string|max:255',
            'senior_high_year_graduated'     => 'required|integer|digits:4|min:1900|max:' . date('Y'),

            // Family Background
            'mother_name'      => 'required|string|max:255',
            'mother_contact'   => 'required|string|max:20',
            'father_name'      => 'required|string|max:255',
            'father_contact'   => 'required|string|max:20',
            'guardian_name'    => 'nullable|string|max:255',
            'guardian_relation' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

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
            'elementary_year_graduated'  => $request->elementary_year_graduated,
            'junior_high_school'         => $request->junior_high_school,
            'junior_high_year_graduated' => $request->junior_high_year_graduated,
            'senior_high_school'         => $request->senior_high_school,
            'senior_high_year_graduated' => $request->senior_high_year_graduated,

            // Family Background
            'mother_name'      => $request->mother_name,
            'mother_contact'   => $request->mother_contact,
            'father_name'      => $request->father_name,
            'father_contact'   => $request->father_contact,
            'guardian_name'    => $request->guardian_name ?? null,
            'guardian_relation' => $request->guardian_relation ?? null,
            'guardian_contact' => $request->guardian_contact ?? null,
        ]);

        \Log::info('Student profile completed:', [
            'student_id' => $student->id,
            'email'      => $student->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile information saved successfully!',
        ]);
    }
}
