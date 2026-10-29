<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
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
use Illuminate\Validation\ValidationException;

class StudentIncidentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        try {
            $user = auth()->guard('student')->user() ?? auth()->user();
            if (!$user) {
                Log::warning('[StudentIncidentController] Incident report rejected: unauthenticated session attempt');
                throw ValidationException::withMessages([
                    'reported_by' => 'You must be logged in as an authenticated student to submit an incident report.',
                ]);
            }

            Log::info('[StudentIncidentController] store called', [
                'user_id' => $user->id,
                'user_name' => $user->name ?? null,
                'request_keys' => array_keys($request->all()),
            ]);

            // 1. Sanitize violation_id (convert empty string or "null" string to null)
            if ($request->has('violation_id')) {
                $vid = $request->input('violation_id');
                if ($vid === '' || $vid === 'null' || $vid === null) {
                    $request->merge(['violation_id' => null]);
                } else {
                    $request->merge(['violation_id' => (int) $vid]);
                }
            }

            // 2. Normalize incident_time (trim seconds if H:i:s is passed)
            if ($request->filled('incident_time')) {
                $time = (string) $request->input('incident_time');
                if (preg_match('/^(\d{1,2}:\d{2}):\d{2}$/', $time, $matches)) {
                    $request->merge(['incident_time' => $matches[1]]);
                }
            }

            // 3. Server-side reporting identity verification & anti-spoofing enforcement
            $isAnonymous = $request->boolean('is_anonymous');
            $studentId = $user->student_id ?? null;
            $accountInfo = !empty($studentId) ? "{$user->name} ({$studentId})" : $user->name;

            // Prevent users from manually entering another person's identity
            if (!$isAnonymous && $request->filled('reported_by')) {
                $submittedReporter = trim((string) $request->input('reported_by'));
                $normalizedSubmitted = strtolower($submittedReporter);
                $normalizedName = strtolower(trim((string) $user->name));
                $normalizedStudentId = strtolower(trim((string) ($studentId ?? '')));

                $matchesIdentity = str_contains($normalizedSubmitted, $normalizedName)
                    || ($normalizedStudentId !== '' && str_contains($normalizedSubmitted, $normalizedStudentId))
                    || $normalizedSubmitted === 'student';

                if (!$matchesIdentity) {
                    Log::warning('[StudentIncidentController] Identity spoofing attempt blocked', [
                        'auth_user_id' => $user->id,
                        'auth_user_name' => $user->name,
                        'attempted_reported_by' => $submittedReporter,
                    ]);

                    throw ValidationException::withMessages([
                        'reported_by' => 'You cannot report an incident under another person\'s identity. The report must use your authenticated account or be submitted anonymously.',
                    ]);
                }
            }

            // For identified reports, lock to the verified authenticated student account; for anonymous, mask display name
            $finalReportedBy = $isAnonymous ? 'Anonymous Student' : $accountInfo;
            $request->merge(['reported_by' => $finalReportedBy]);

            $validated = $request->validate([
                'violation_id' => ['nullable', 'exists:violations,id'],
                'incident_type' => ['required', 'string', 'max:255'],
                'incident_date' => ['required', 'date'],
                'incident_time' => ['required', 'date_format:H:i'],
                'location' => ['required', 'string', 'max:255'],
                'reported_by' => ['required', 'string', 'max:255'],
                'is_anonymous' => ['nullable', 'boolean'],
                'students_involved' => ['required', 'array', 'min:1'],
                'students_involved.*' => ['required', 'array'],
                'students_involved.*.id' => ['nullable', 'string', 'max:255'],
                'students_involved.*.name' => ['required', 'string', 'max:255'],
                'description' => ['required', 'string'],
                'immediate_action' => ['nullable', 'string'],
                'received_by' => ['nullable', 'string', 'max:255'],
                'classification' => ['sometimes', 'in:Warning,Suspension,Exclusion,Expulsion'],
                'evidences' => ['nullable', 'array', 'max:5'],
                'evidences.*' => ['file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
            ]);
            Log::info('[StudentIncidentController] validation passed', [
                'type' => $validated['incident_type'],
                'date' => $validated['incident_date'],
                'is_anonymous' => $isAnonymous,
                'students_count' => count($validated['students_involved']),
            ]);

            $evidencePaths = [];
            $files = $request->file('evidences', []);
            if (is_array($files)) {
                foreach ($files as $file) {
                    if (!$file) continue;
                    $evidencePaths[] = $file->store('incident-evidences', 'public');
                }
            }

            // Normalize students_involved array items to clean associative arrays
            $cleanedStudentsInvolved = array_map(function ($s) {
                if (is_array($s)) {
                    return [
                        'id' => isset($s['id']) ? (string) $s['id'] : '',
                        'name' => isset($s['name']) ? (string) $s['name'] : '',
                    ];
                }
                return [
                    'id' => '',
                    'name' => (string) $s,
                ];
            }, $validated['students_involved']);

            // Formulate restricted audit information
            $reporterAudit = [
                'reporter_guard'       => 'student',
                'reporter_id'          => $user->id,
                'reporter_student_id'  => $studentId,
                'reporter_name'        => $user->name,
                'reporter_email'       => $user->email ?? null,
                'reporter_course'      => $user->course ?? null,
                'is_anonymous'         => $isAnonymous,
                'ip_address'           => $request->ip(),
                'user_agent'           => $request->userAgent(),
                'submitted_at'         => now()->toIso8601String(),
            ];

            $investigationDetails = [
                'is_anonymous'     => $isAnonymous,
                'reporter_privacy' => $isAnonymous ? 'anonymous' : 'identified',
                'restricted_audit' => $reporterAudit,
            ];

            // Use DisciplinaryService to create incident and evaluate rules
            $disciplinaryService = app(\App\Services\DisciplinaryService::class);
            $incident = $disciplinaryService->createIncident([
                'violation_id'          => $validated['violation_id'] ?? null,
                'incident_type'         => $validated['incident_type'],
                'incident_date'         => $validated['incident_date'],
                'incident_time'         => $validated['incident_time'],
                'location'              => $validated['location'],
                'reported_by'           => $finalReportedBy,
                'students_involved'     => $cleanedStudentsInvolved,
                'description'           => $validated['description'],
                'immediate_action'      => $validated['immediate_action'] ?? null,
                'evidence_paths'        => $evidencePaths,
                'classification'        => $validated['classification'] ?? 'Warning',
                'status'                => 'Pending',
                'is_archived'           => false,
                'investigation_details' => $investigationDetails,
            ]);

            // Activity Log
            if ($user && class_exists(ActivityLog::class)) {
                try {
                    ActivityLog::logForUser(
                        $user,
                        'Incidents',
                        'Submitted',
                        ($isAnonymous ? 'Submitted anonymous incident report #' : 'Submitted incident report #') . (string) $incident->id,
                        $request
                    );
                } catch (\Exception $e) {
                    Log::warning('[StudentIncidentController] failed to write ActivityLog: ' . $e->getMessage());
                }
            }

            // ── Send Notifications ──────────────────────────────────────────────
            if (Schema::hasTable('notifications')) {
                $this->sendIncidentNotifications($incident, $user);
            }

            $successMessage = $isAnonymous
                ? 'Anonymous incident report submitted successfully. Your identity remains protected.'
                : 'Incident report submitted successfully.';

            return redirect()->back()->with('success', $successMessage);
        } catch (ValidationException $ve) {
            // Re-throw ValidationException so Inertia receives 422 with field errors
            throw $ve;
        } catch (\Exception $e) {
            Log::error('[StudentIncidentController] store failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to submit incident report: ' . $e->getMessage());
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
        $isAnonymous = !empty($incident->investigation_details['is_anonymous'])
            || strcasecmp(trim((string) $incident->reported_by), 'Anonymous Student') === 0;

        $reporterName = $isAnonymous
            ? 'Anonymous Student'
            : (is_object($reporter) ? ($reporter->name ?? 'A student') : 'A student');

        // Extract student IDs from the array of objects
        $studentIds = collect($studentsInvolved)->pluck('id')->filter()->map(fn($id) => (string) $id)->toArray();

        // Resolve involved student records by student_id or id
        $involvedStudents = collect();
        if (count($studentIds) > 0 && Schema::hasTable('students')) {
            $involvedStudents = Student::query()
                ->where(function ($query) use ($studentIds) {
                    $query->whereIn('student_id', $studentIds)
                          ->orWhereIn('id', $studentIds);
                })
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
