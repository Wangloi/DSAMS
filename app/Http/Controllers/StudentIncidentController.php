<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Models\Incident;
use App\Models\ProgramHead;
use App\Models\Student;
use App\Notifications\IncidentReportedAdmin;
use App\Notifications\IncidentReportedProgramHead;
use App\Notifications\IncidentReportedStudent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class StudentIncidentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        try {
            $user = auth()->user();
            Log::info('[StudentIncidentController] store called', ['user_id' => $user->id ?? null]);

            $validated = $request->validate([
                'violation_id' => ['nullable', 'exists:violations,id'],
                'incident_type' => ['required', 'string', 'max:255'],
                'incident_date' => ['required', 'date'],
                'incident_time' => ['required', 'date_format:H:i'],
                'location' => ['required', 'string', 'max:255'],
                'reported_by' => ['required', 'string', 'max:255'],
                'students_involved' => ['required', 'array', 'min:1'],
                'students_involved.*' => ['required', 'array:id,name'],
                'students_involved.*.id' => ['required', 'string'],
                'students_involved.*.name' => ['required', 'string'],
                'description' => ['required', 'string'],
                'immediate_action' => ['nullable', 'string'],
                'received_by' => ['nullable', 'string', 'max:255'],
                'classification' => ['sometimes', 'in:Warning,Suspension,Exclusion,Expulsion'],
                'evidences' => ['nullable', 'array', 'max:5'],
                'evidences.*' => ['file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
            ]);
            Log::info('[StudentIncidentController] validation passed', $validated);

            $studentIdentifier = null;
            if (is_object($user) && isset($user->student_id)) {
                $studentIdentifier = $user->student_id;
            } elseif (is_object($user) && isset($user->id)) {
                $studentIdentifier = (string) $user->id;
            }

            $evidencePaths = [];
            $files = $request->file('evidences', []);
            if (is_array($files)) {
                foreach ($files as $file) {
                    if (!$file) continue;
                    $evidencePaths[] = $file->store('incident-evidences', 'public');
                }
            }

            // Students are already an array of objects, let's just use them as is for storage
            $incident = Incident::create([
                'violation_id' => $validated['violation_id'] ?? null,
                'incident_type' => $validated['incident_type'],
                'incident_date' => $validated['incident_date'],
                'incident_time' => $validated['incident_time'],
                'location' => $validated['location'],
                'reported_by' => $validated['reported_by'],
                'students_involved' => $validated['students_involved'],
                'description' => $validated['description'],
                'immediate_action' => $validated['immediate_action'] ?? null,
                'evidence_paths' => $evidencePaths,
                'classification' => $validated['classification'] ?? 'Warning',
                'status' => 'Pending',
                'is_archived' => false,
            ]);

            // ── Send Notifications ──────────────────────────────────────────────
            if (Schema::hasTable('notifications')) {
                $this->sendIncidentNotifications($incident, $user);
            }

            return redirect()->back()->with('success', 'Incident report submitted.');
        } catch (\Exception $e) {
            Log::error('[StudentIncidentController] store failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to submit incident report');
        }
    }

    /**
     * Dispatch notifications for a newly created incident report.
     *
     * Flow:
     *  1. Notify Program Heads whose program matches involved students' course.
     *  2. Notify all Admins.
     *  3. Notify the involved/respondent Students.
     */
    private function sendIncidentNotifications(Incident $incident, $reporter): void
    {
        $studentsInvolved = $incident->students_involved ?? [];
        $reporterName = is_object($reporter) ? ($reporter->name ?? 'A student') : 'A student';

        // Extract student IDs from the array of objects
        $studentIds = collect($studentsInvolved)->pluck('id')->filter()->toArray();

        // Resolve involved student records by student_id
        $involvedStudents = collect();
        if (count($studentIds) > 0 && Schema::hasTable('students')) {
            $involvedStudents = Student::query()
                ->whereIn('student_id', $studentIds)
                ->get();
        }

        // 1. Notify Program Heads whose program matches the involved students' courses
        try {
            $courses = $involvedStudents->pluck('course')->filter()->unique()->values()->all();

            if (count($courses) > 0) {
                $programHeads = ProgramHead::query()
                    ->whereIn('program', $courses)
                    ->get();
            } else {
                // No course info available — notify all program heads as fallback
                $programHeads = ProgramHead::query()->get();
            }

            foreach ($programHeads as $head) {
                try {
                    $head->notify(new IncidentReportedProgramHead($incident));
                } catch (\Exception $e) {
                    Log::error('Failed to send incident notification to program head', [
                        'program_head_id' => $head->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Incident notification sent to program heads', [
                'incident_id' => $incident->id,
                'program_head_count' => $programHeads->count(),
                'courses' => $courses,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify program heads for incident', [
                'error' => $e->getMessage(),
            ]);
        }

        // 2. Notify all Admins
        try {
            $admins = AdminUser::query()->get();

            foreach ($admins as $admin) {
                try {
                    $admin->notify(new IncidentReportedAdmin($incident, $reporterName));
                } catch (\Exception $e) {
                    Log::error('Failed to send incident notification to admin', [
                        'admin_id' => $admin->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Incident notification sent to admins', [
                'incident_id' => $incident->id,
                'admin_count' => $admins->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify admins for incident', [
                'error' => $e->getMessage(),
            ]);
        }

        // 3. Notify the involved/respondent Students

        try {
            foreach ($involvedStudents as $student) {
                try {
                    /** @var Student $student */
                    $student->notify(new IncidentReportedStudent($incident));
                } catch (\Exception $e) {
                    Log::error('Failed to send incident notification to student', [
                        'student_id' => $student->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Incident notification sent to involved students', [
                'incident_id' => $incident->id,
                'student_count' => $involvedStudents->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify students for incident', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
