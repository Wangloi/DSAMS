<?php

namespace App\Http\Controllers;

use App\Models\AdmissionSlip;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DSAAdmissionSlipController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $slips = AdmissionSlip::with('student')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('dsa-dashboard/admission-slip/index', [
            'slips' => $slips,
            'unreadNotifications' => $user->unreadNotifications ?? [],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validate([
            'student_id' => 'required|string|exists:users,student_id',
            'case_text' => 'required|string|max:255',
            'reason_text' => 'required|string|max:255',
            'valid_until' => 'required|date|after:today',
        ]);

        // Find the student
        $student = User::where('student_id', $validated['student_id'])
            ->where('role', 'student')
            ->firstOrFail();

        // Create admission slip
        $admissionSlip = AdmissionSlip::create([
            'student_id' => $student->id,
            'case_text' => $validated['case_text'],
            'reason_text' => $validated['reason_text'],
            'valid_until' => $validated['valid_until'],
            'date_issued' => now()->format('Y-m-d'),
            'status' => 'APPROVED', // DSA-created slips are automatically approved
            'issued_by' => $user->id,
        ]);

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip created successfully');
    }

    public function update(Request $request, AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validate([
            'case_text' => 'required|string|max:255',
            'reason_text' => 'required|string|max:255',
            'valid_until' => 'required|date|after:today',
        ]);

        $admissionSlip->update($validated);

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip updated successfully');
    }

    public function destroy(AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $admissionSlip->delete();

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip deleted successfully');
    }

    public function approve(AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $oldStatus = $admissionSlip->status;
        $admissionSlip->update([
            'status' => 'APPROVED',
            'issued_by' => $user->id,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $user,
                'Admission Slip',
                'Approved',
                "Approved admission slip #{$admissionSlip->id} (was: {$oldStatus})",
                request(),
                ['status' => $oldStatus],
                ['status' => 'APPROVED', 'issued_by' => $user->id]
            );
        }

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip approved successfully');
    }

    public function reject(AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $oldStatus = $admissionSlip->status;
        $admissionSlip->update([
            'status' => 'REJECTED',
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $user,
                'Admission Slip',
                'Rejected',
                "Rejected admission slip #{$admissionSlip->id} (was: {$oldStatus})",
                request(),
                ['status' => $oldStatus],
                ['status' => 'REJECTED']
            );
        }

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip rejected successfully');
    }

    public function archive(AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $admissionSlip->update([
            'archived_at' => now(),
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $user,
                'Admission Slip',
                'Archived',
                "Archived admission slip #{$admissionSlip->id}",
                request(),
                ['archived_at' => null],
                ['archived_at' => now()->toDateTimeString()]
            );
        }

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip archived successfully');
    }

    public function unarchive(AdmissionSlip $admissionSlip)
    {
        $user = Auth::user();
        
        // Ensure only DSA users can access this
        if ($user->role !== 'dsa') {
            abort(403, 'Unauthorized access');
        }

        $admissionSlip->update([
            'archived_at' => null,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $user,
                'Admission Slip',
                'Unarchived',
                "Unarchived admission slip #{$admissionSlip->id}",
                request(),
                ['archived_at' => now()->toDateTimeString()],
                ['archived_at' => null]
            );
        }

        return redirect()->route('dsa.admission-slip')
            ->with('success', 'Admission slip unarchived successfully');
    }
}
