<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AdminUser;
use App\Models\AdmissionSlip;
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
        $admin = AdminUser::query()->first();
        $deanName = $admin?->name ?? 'Rey John N. Bongcas';

        $query = AdmissionSlip::query();
        if (Schema::hasColumn('admission_slips', 'is_archived')) {
            $query->where('is_archived', false);
        }

        $slips = $query->orderByDesc('id')
            ->get([
                'id',
                'student_name',
                'program_year_level',
                'date_issued',
                'case_text',
                'reason_text',
                'valid_until',
                'status',
                'student_id',
                'created_at',
            ]);

        try {
            $slips->each(function ($slip) {
                /** @var AdmissionSlip $slip */
                $slip->append(['slip_count', 'all_time_slip_count', 'monthly_slip_count']);
            });
        } catch (\Throwable $e) {
            Log::warning('Could not compute slip quota accessors: ' . $e->getMessage());
        }

        return Inertia::render('admin-dashboard/admission-slip/index', [
            'slips' => $slips,
            'deanName' => $deanName,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'program_year_level' => ['required', 'string', 'max:255'],
            'date_issued' => ['required', 'string', 'max:255'],
            'case_text' => ['nullable', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        $caseText = trim((string) ($validated['case_text'] ?? ''));
        if ($caseText === '') {
            $caseText = $validated['reason_text'];
        }

        AdmissionSlip::create([
            'student_name' => $validated['student_name'],
            'program_year_level' => $validated['program_year_level'],
            'date_issued' => $validated['date_issued'],
            'case_text' => $caseText,
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
            'case_text' => ['nullable', 'string', 'max:255'],
            'reason_text' => ['required', 'string', 'max:255'],
            'valid_until' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        $caseText = trim((string) ($validated['case_text'] ?? ''));
        if ($caseText === '') {
            $caseText = $validated['reason_text'];
        }

        $admissionSlip->fill([
            'student_name' => $validated['student_name'],
            'program_year_level' => $validated['program_year_level'],
            'date_issued' => $validated['date_issued'],
            'case_text' => $caseText,
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
            'student_name' => ['sometimes', 'required', 'string', 'max:255'],
            'program_year_level' => ['sometimes', 'required', 'string', 'max:255'],
            'date_issued' => ['sometimes', 'required', 'string', 'max:255'],
            'case_text' => ['nullable', 'string', 'max:255'],
            'reason_text' => ['sometimes', 'required', 'string', 'max:255'],
            'valid_until' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:255'],
        ]);

        $oldStatus = $admissionSlip->status;

        $caseText = null;
        if (array_key_exists('case_text', $validated)) {
            $caseText = trim((string) ($validated['case_text'] ?? ''));
            if ($caseText === '' && !empty($validated['reason_text'])) {
                $caseText = $validated['reason_text'];
            }
        }

        $fillData = [];
        if (isset($validated['student_name'])) {
            $fillData['student_name'] = $validated['student_name'];
        }
        if (isset($validated['program_year_level'])) {
            $fillData['program_year_level'] = $validated['program_year_level'];
        }
        if (isset($validated['date_issued'])) {
            $fillData['date_issued'] = $validated['date_issued'];
        }
        if ($caseText !== null) {
            $fillData['case_text'] = $caseText;
        }
        if (isset($validated['reason_text'])) {
            $fillData['reason_text'] = $validated['reason_text'];
        }
        if (isset($validated['valid_until'])) {
            $fillData['valid_until'] = $validated['valid_until'];
        }
        if (isset($validated['status'])) {
            $fillData['status'] = $validated['status'];
        }

        $admissionSlip->fill($fillData);
        $admissionSlip->save();

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Admission Slip', 'Updated', 'Updated admission slip #' . $admissionSlip->id . ' for student ' . $admissionSlip->student_name);
        }

        if (Schema::hasTable('notifications') && !empty($admissionSlip->student_id) && $oldStatus !== $admissionSlip->status) {
            $student = Student::query()->find($admissionSlip->student_id);
            if ($student) {
                $student->notify(new AdmissionSlipStatusUpdated($admissionSlip));
            }
        }

        return redirect()
            ->route('admin.admission-slip')
            ->with('success', 'Admission slip updated successfully.')
            ->setStatusCode(303);
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

    public function approve(Request $request, AdmissionSlip $admissionSlip): RedirectResponse
    {
        try {
            $alreadyProcessed = false;
            \Illuminate\Support\Facades\DB::transaction(function () use ($request, $admissionSlip, &$alreadyProcessed) {
                /** @var AdmissionSlip $lockedSlip */
                $lockedSlip = AdmissionSlip::query()->where('id', $admissionSlip->id)->lockForUpdate()->firstOrFail();

                if ($lockedSlip->status !== 'PENDING') {
                    $alreadyProcessed = true;
                    return;
                }

                $updates = ['status' => 'APPROVED'];
                if ($request->filled('valid_until')) {
                    $updates['valid_until'] = $request->input('valid_until');
                } elseif (empty($lockedSlip->valid_until)) {
                    $updates['valid_until'] = AdmissionSlip::calculateValidUntil(
                        $lockedSlip->reason_text,
                        $lockedSlip->date_issued
                    );
                }
                $lockedSlip->update($updates);

                if (Schema::hasTable('activity_logs')) {
                    $admin = auth()->guard('admin')->user();
                    ActivityLog::logForUser($admin, 'Admission Slip', 'Approved', 'Approved admission slip request #' . $lockedSlip->id . '.');
                }

                if (Schema::hasTable('notifications') && !empty($lockedSlip->student_id)) {
                    $student = Student::query()->find($lockedSlip->student_id);
                    if ($student) {
                        try {
                            $student->notify(new AdmissionSlipStatusUpdated($lockedSlip));
                        } catch (\Throwable $ne) {
                            Log::warning('Failed sending status notification to student: ' . $ne->getMessage());
                        }
                    }
                }
            });

            if ($alreadyProcessed) {
                return redirect()
                    ->route('admin.admission-slip')
                    ->with('warning', 'This admission slip has already been processed.')
                    ->setStatusCode(303);
            }

            return redirect()
                ->route('admin.admission-slip')
                ->with('success', 'Admission slip approved successfully.')
                ->setStatusCode(303);
        } catch (\Throwable $e) {
            Log::error('Admin admission slip approve failure: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()
                ->route('admin.admission-slip')
                ->with('error', 'Failed to approve admission slip due to a server error.')
                ->setStatusCode(303);
        }
    }

    public function reject(AdmissionSlip $admissionSlip): RedirectResponse
    {
        try {
            $alreadyProcessed = false;
            \Illuminate\Support\Facades\DB::transaction(function () use ($admissionSlip, &$alreadyProcessed) {
                /** @var AdmissionSlip $lockedSlip */
                $lockedSlip = AdmissionSlip::query()->where('id', $admissionSlip->id)->lockForUpdate()->firstOrFail();

                if ($lockedSlip->status !== 'PENDING') {
                    $alreadyProcessed = true;
                    return;
                }

                $lockedSlip->update(['status' => 'REJECTED']);

                if (Schema::hasTable('activity_logs')) {
                    $admin = auth()->guard('admin')->user();
                    ActivityLog::logForUser($admin, 'Admission Slip', 'Rejected', 'Rejected admission slip request #' . $lockedSlip->id . '.');
                }

                if (Schema::hasTable('notifications') && !empty($lockedSlip->student_id)) {
                    $student = Student::query()->find($lockedSlip->student_id);
                    if ($student) {
                        try {
                            $student->notify(new AdmissionSlipStatusUpdated($lockedSlip));
                        } catch (\Throwable $ne) {
                            Log::warning('Failed sending status notification to student: ' . $ne->getMessage());
                        }
                    }
                }
            });

            if ($alreadyProcessed) {
                return redirect()
                    ->route('admin.admission-slip')
                    ->with('warning', 'This admission slip has already been processed.')
                    ->setStatusCode(303);
            }

            return redirect()
                ->route('admin.admission-slip')
                ->with('success', 'Admission slip rejected successfully.')
                ->setStatusCode(303);
        } catch (\Throwable $e) {
            Log::error('Admin admission slip reject failure: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()
                ->route('admin.admission-slip')
                ->with('error', 'Failed to reject admission slip due to a server error.')
                ->setStatusCode(303);
        }
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
