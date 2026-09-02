<?php

namespace App\Http\Controllers;

use App\Models\AdmissionSlip;
use App\Models\ActivityLog;
use App\Models\AdminUser;
use App\Notifications\AdmissionSlipRequested;
use App\Notifications\AdmissionSlipSubmitted;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StudentAdmissionSlipController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $student = Auth::guard('student')->user() ?: $request->user('student');

        $validated = $request->validate([
            'student_name' => ['nullable', 'string', 'max:255'],
            'program_year_level' => ['nullable', 'string', 'max:255'],
            'case_text' => ['required', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'date'],
        ]);

        $studentName = trim((string) ($validated['student_name'] ?? ''));
        if ($studentName === '') {
            $studentName = (string) ($student?->name ?? '');
        }

        // Disciplinary clearance check: prevent admission slip if active major violation
        if ($student) {
            $studentDbId = (string) $student->id;
            $studentSchoolId = (string) ($student->student_id ?? '');

            $hasActiveMajorIncident = \App\Models\Incident::where('is_archived', false)
                ->where('status', '!=', 'Resolved')
                ->whereIn('classification', ['Suspension', 'Exclusion', 'Expulsion'])
                ->where(function ($q) use ($studentDbId, $studentSchoolId) {
                    $q->whereJsonContains('students_involved', $studentDbId)
                      ->orWhereJsonContains('students_involved', ['id' => $studentDbId])
                      ->orWhereJsonContains('students_involved', ['id' => (int) $studentDbId]);
                    if ($studentSchoolId) {
                        $q->orWhereJsonContains('students_involved', $studentSchoolId)
                          ->orWhereJsonContains('students_involved', ['id' => $studentSchoolId]);
                    }
                })
                ->first();

            if ($hasActiveMajorIncident) {
                return redirect()->back()->with('error', "Disciplinary Clearance Required: You have an active incident ({$hasActiveMajorIncident->incident_type} - {$hasActiveMajorIncident->classification}). Please report to the Office of Student Affairs before requesting an Admission Slip.");
            }
        }

        $programYearLevel = trim((string) ($validated['program_year_level'] ?? ''));
        if ($programYearLevel === '') {
            $programYearLevel = trim(implode(' ', array_filter([
                $student?->course,
                $student?->year_level,
            ])));
        }

        $slipAttributes = [
            'student_name' => $studentName,
            'program_year_level' => $programYearLevel,
            'date_issued' => now()->toDateString(),
            'case_text' => $validated['case_text'],
            'reason_text' => $validated['reason_text'],
            'valid_until' => $validated['valid_until'],
            'status' => 'PENDING',
            'is_archived' => false,
        ];

        if (Schema::hasColumn('admission_slips', 'student_id')) {
            $slipAttributes['student_id'] = $student?->id;
        }

        $slip = AdmissionSlip::create($slipAttributes);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($student, 'Admission Slip', 'Requested', 'Submitted admission slip request.');
        }

        // Send notifications to all admins
        if (Schema::hasTable('notifications')) {
            $admins = AdminUser::query()->get();
            \Log::info('Admission slip request: notifying admins', [
                'slip_id' => $slip->id,
                'admin_count' => $admins->count(),
            ]);

            if ($admins->count() > 0) {
                foreach ($admins as $admin) {
                    try {
                        \Log::info('Sending notification to admin', [
                            'admin_id' => $admin->id,
                            'admin_name' => $admin->name,
                        ]);
                        
                        $admin->notify(new AdmissionSlipRequested($slip));
                        
                        \Log::info('Notification sent to admin', [
                            'admin_id' => $admin->id,
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to send notification', [
                            'admin_id' => $admin->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            } else {
                \Log::warning('No admins found to notify');
            }
        }

        // Send confirmation notification back to the student
        if (Schema::hasTable('notifications') && $student && method_exists($student, 'notify')) {
            try {
                $student->notify(new AdmissionSlipSubmitted($slip));
                \Log::info('Admission slip submitted notification sent to student', [
                    'student_id' => $student->id,
                    'slip_id'    => $slip->id,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send admission slip submitted notification to student', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return redirect()->back();
    }
}
