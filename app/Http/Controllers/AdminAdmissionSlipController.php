<?php

namespace App\Http\Controllers;

use App\Models\AdmissionSlip;
use App\Models\ActivityLog;
use App\Models\Student;
use App\Notifications\AdmissionSlipStatusUpdated;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminAdmissionSlipController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin-dashboard/admission-slip/index', [
            'slips' => AdmissionSlip::query()
                ->where('is_archived', false)
                ->orderByDesc('id')
                ->get([
                    'id',
                    'student_name',
                    'program_year_level',
                    'date_issued',
                    'case_text',
                    'reason_text',
                    'valid_until',
                    'status',
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'program_year_level' => ['required', 'string', 'max:255'],
            'date_issued' => ['required', 'string', 'max:255'],
            'case_text' => ['required', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        AdmissionSlip::create([
            'student_name' => $validated['student_name'],
            'program_year_level' => $validated['program_year_level'],
            'date_issued' => $validated['date_issued'],
            'case_text' => $validated['case_text'],
            'reason_text' => $validated['reason_text'],
            'valid_until' => $validated['valid_until'],
            'status' => $validated['status'] ?? 'PENDING',
        ]);

        return redirect()->route('admin.admission-slip');
    }

    public function updateLegacy(Request $request): RedirectResponse
    {
        $id = $request->input('id');
        if (empty($id)) {
            abort(404);
        }

        $admissionSlip = AdmissionSlip::query()->findOrFail($id);

        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'program_year_level' => ['required', 'string', 'max:255'],
            'date_issued' => ['required', 'string', 'max:255'],
            'case_text' => ['required', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        $admissionSlip->fill([
            'student_name' => $validated['student_name'],
            'program_year_level' => $validated['program_year_level'],
            'date_issued' => $validated['date_issued'],
            'case_text' => $validated['case_text'],
            'reason_text' => $validated['reason_text'],
            'valid_until' => $validated['valid_until'],
            'status' => $validated['status'] ?? $admissionSlip->status,
        ]);
        $admissionSlip->save();

        return redirect()->route('admin.admission-slip');
    }

    public function update(Request $request, AdmissionSlip $admissionSlip): RedirectResponse
    {
        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'program_year_level' => ['required', 'string', 'max:255'],
            'date_issued' => ['required', 'string', 'max:255'],
            'case_text' => ['required', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        $admissionSlip->fill([
            'student_name' => $validated['student_name'],
            'program_year_level' => $validated['program_year_level'],
            'date_issued' => $validated['date_issued'],
            'case_text' => $validated['case_text'],
            'reason_text' => $validated['reason_text'],
            'valid_until' => $validated['valid_until'],
            'status' => $validated['status'] ?? $admissionSlip->status,
        ]);
        $admissionSlip->save();

        return redirect()->route('admin.admission-slip');
    }

    public function destroy(AdmissionSlip $admissionSlip): RedirectResponse
    {
        $admissionSlip->update(['is_archived' => true]);

        return redirect()->route('admin.admission-slip');
    }

    public function archive(AdmissionSlip $admissionSlip): RedirectResponse
    {
        $admissionSlip->update(['is_archived' => true]);

        return redirect()
            ->route('admin.admission-slip')
            ->with('success', 'Admission slip archived successfully.')
            ->setStatusCode(303);
    }

    public function unarchive(AdmissionSlip $admissionSlip): RedirectResponse
    {
        $admissionSlip->update(['is_archived' => false]);

        return redirect()
            ->route('admin.admission-slip')
            ->with('success', 'Admission slip unarchived successfully.')
            ->setStatusCode(303);
    }

    public function approve(AdmissionSlip $admissionSlip): RedirectResponse
    {
        $admissionSlip->update(['status' => 'APPROVED']);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Admission Slip', 'Approved', 'Approved admission slip request.');
        }

        if (Schema::hasTable('notifications') && !empty($admissionSlip->student_id)) {
            $student = Student::query()->find($admissionSlip->student_id);
            if ($student) {
                $student->notify(new AdmissionSlipStatusUpdated($admissionSlip));
            }
        }

        return redirect()
            ->route('admin.admission-slip')
            ->with('success', 'Admission slip approved successfully.')
            ->setStatusCode(303);
    }

    public function reject(AdmissionSlip $admissionSlip): RedirectResponse
    {
        $admissionSlip->update(['status' => 'REJECTED']);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Admission Slip', 'Rejected', 'Rejected admission slip request.');
        }

        if (Schema::hasTable('notifications') && !empty($admissionSlip->student_id)) {
            $student = Student::query()->find($admissionSlip->student_id);
            if ($student) {
                $student->notify(new AdmissionSlipStatusUpdated($admissionSlip));
            }
        }

        return redirect()
            ->route('admin.admission-slip')
            ->with('success', 'Admission slip rejected successfully.')
            ->setStatusCode(303);
    }

    public function destroyLegacy(Request $request): RedirectResponse
    {
        $id = $request->input('id');
        if (empty($id)) {
            abort(404);
        }

        $slip = AdmissionSlip::query()->findOrFail($id);
        $slip->delete();

        return redirect()->route('admin.admission-slip');
    }
}
