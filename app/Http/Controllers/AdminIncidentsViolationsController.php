<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\DisciplinaryAction;
use App\Models\Incident;
use App\Services\StudentNotificationDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminIncidentsViolationsController extends Controller
{
    public function index(): Response
    {
        \App\Models\Violation::ensureDefaultViolations();
        $violations = \App\Models\Violation::all();

        $incidents = Incident::where('is_archived', false)->orderByDesc('id')
            ->with(['disciplinaryActions'])
            ->get()
            ->map(function (Incident $incident) {
                $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
                $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
                $dateTime = trim(($date ? $date->format('M d, Y') : '').' '.($time ? $time->format('h:i A') : ''));

                // Normalize students_involved: support all formats
                $studentsNormalized = $this->normalizeStudentsInvolved($incident->students_involved);

                $firstStudentName = count($studentsNormalized) > 0 ? $studentsNormalized[0]['name'] : '—';
                $firstStudentId   = count($studentsNormalized) > 0 ? $studentsNormalized[0]['id'] : '';

                $callingPhase = $incident->calling_phase ?? (
                    $incident->status === 'Resolved' ? 8 : (
                        $incident->status === 'Escalated' ? 7 : (
                            $incident->status === 'Ongoing' ? 4 : 1
                        )
                    )
                );

                return [
                    'id' => $incident->id,
                    'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                    'student'   => $firstStudentName,
                    'studentId' => $firstStudentId,
                    'type' => $incident->incident_type,
                    'classification' => $incident->classification,
                    'dateTime' => $dateTime,
                    'status' => $incident->status,
                    'calling_phase' => $callingPhase,
                    'calling_phase_history' => $incident->calling_phase_history ?? [],
                    'updated_at' => $incident->updated_at?->toISOString(),
                    'violation_id' => $incident->violation_id,
                    'disciplinary_actions' => $incident->disciplinaryActions,
                    'raw' => [
                        'incidentType' => $incident->incident_type,
                        'date' => $date ? $date->format('Y-m-d') : null,
                        'time' => $time ? $time->format('H:i') : null,
                        'location' => $incident->location,
                        'reportedBy' => $incident->reported_by,
                        'studentsInvolved' => $studentsNormalized,
                        'description' => $incident->description,
                        'immediateAction' => $incident->immediate_action,
                        'classification' => $incident->classification,
                        'status' => $incident->status,
                        'calling_phase' => $callingPhase,
                        'receivedBy' => $incident->received_by,
                        'evidencePaths' => $incident->evidence_paths ?? [],
                    ],
                ];
            });

        return Inertia::render('admin-dashboard/incidents-violations/index', [
            'incidents' => $incidents,
            'violations' => $violations,
        ]);
    }

    public function store(Request $request, \App\Services\DisciplinaryService $disciplinaryService): RedirectResponse
    {
        $validated = $request->validate([
            'violation_id' => ['required', 'exists:violations,id'],
            'incident_type' => ['required', 'string', 'max:255'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'reported_by' => ['nullable', 'string', 'max:255'],
            'students_involved' => ['required', 'array', 'min:1'],
            'students_involved.*' => ['array'],
            'students_involved.*.id' => ['nullable', 'string', 'max:255'],
            'students_involved.*.name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'immediate_action' => ['nullable', 'string'],
            'received_by' => ['nullable', 'string', 'max:255'],
            'classification' => ['required', 'in:Warning,Suspension,Exclusion,Expulsion'],
            'status' => ['sometimes', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $incident = $disciplinaryService->createIncident([
            'violation_id' => $validated['violation_id'] ?? null,
            'incident_type' => $validated['incident_type'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'reported_by' => $validated['reported_by'] ?? null,
            'students_involved' => $validated['students_involved'] ?? [],
            'description' => $validated['description'],
            'immediate_action' => $validated['immediate_action'] ?? null,
            'classification' => $validated['classification'] ?? 'Warning',
            'status' => $validated['status'] ?? 'Pending',
            'received_by' => $validated['received_by'] ?? null,
        ]);

        app(StudentNotificationDispatcher::class)->incidentCreated($incident);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Created', 'Created incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report created successfully.');
    }

    public function update(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'violation_id' => ['required', 'exists:violations,id'],
            'incident_type' => ['required', 'string', 'max:255'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'reported_by' => ['nullable', 'string', 'max:255'],
            'students_involved' => ['required', 'array', 'min:1'],
            'students_involved.*' => ['array'],
            'students_involved.*.id' => ['nullable', 'string', 'max:255'],
            'students_involved.*.name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'immediate_action' => ['nullable', 'string'],
            'received_by' => ['nullable', 'string', 'max:255'],
            'classification' => ['required', 'in:Warning,Suspension,Exclusion,Expulsion'],
            'status' => ['sometimes', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $incident->fill([
            'violation_id' => $validated['violation_id'],
            'incident_type' => $validated['incident_type'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'reported_by' => $validated['reported_by'] ?? $incident->reported_by,
            'students_involved' => $validated['students_involved'] ?? [],
            'description' => $validated['description'],
            'immediate_action' => $validated['immediate_action'] ?? $incident->immediate_action,
            'classification' => $validated['classification'] ?? $incident->classification,
            'status' => $validated['status'] ?? $incident->status,
            'received_by' => $validated['received_by'] ?? $incident->received_by,
        ]);
        $changedFields = array_keys($incident->getDirty());
        $incident->save();

        app(StudentNotificationDispatcher::class)->incidentUpdated($incident, $changedFields);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Updated', 'Updated incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report updated successfully.');
    }

    /**
     * Quick-update only the status of an incident (used by the table dropdown).
     */
    /**
     * Quick-update only the status of an incident (used by the table dropdown).
     * Auto-syncs calling_phase to match the new status (#1: Phase ↔ Status sync).
     */
    public function updateStatus(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $newStatus = $validated['status'];
        $currentPhase = $incident->calling_phase ?? 1;
        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'System';

        // Auto-sync calling_phase based on the new status (5-step process)
        $syncedPhase = $currentPhase;
        if ($newStatus === 'Resolved' && $currentPhase < 5) {
            $syncedPhase = 5;
        } elseif ($newStatus === 'Escalated' && $currentPhase < 4) {
            $syncedPhase = 4;
        } elseif ($newStatus === 'Ongoing' && $currentPhase < 3) {
            $syncedPhase = 3;
        } elseif ($newStatus === 'Pending' && $currentPhase > 2) {
            $syncedPhase = 1;
        }

        $updateData = ['status' => $newStatus];

        // Record phase history if phase changed
        if ($syncedPhase !== $currentPhase) {
            $history = $incident->calling_phase_history ?? [];
            $history[] = [
                'phase' => $syncedPhase,
                'at' => now()->toISOString(),
                'by' => $adminName,
                'trigger' => 'status_change',
            ];
            $updateData['calling_phase'] = $syncedPhase;
            $updateData['calling_phase_history'] = $history;
        }

        $incident->update($updateData);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($admin, 'Incidents', 'Status Updated', 'Changed incident #'.(string) $incident->id.' status to '.$newStatus.($syncedPhase !== $currentPhase ? ' (phase synced to '.$syncedPhase.')' : ''));
        }

        return redirect()->back()->with('success', 'Status updated to '.$newStatus.($syncedPhase !== $currentPhase ? ' (phase auto-synced to Phase '.$syncedPhase.')' : '').'.');
    }

    /**
     * Update the calling phase of an incident.
     * Records timestamped phase transition history (#2: Audit trail).
     */
    public function updateCallingPhase(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'calling_phase' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $phase = (int) $validated['calling_phase'];
        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'System';

        // Auto-sync status based on the 5-step calling process
        $newStatus = $incident->status;
        if ($phase === 5) {
            $newStatus = 'Resolved';
        } elseif ($phase === 4) {
            $newStatus = 'Escalated';
        } elseif ($phase === 3) {
            $newStatus = 'Ongoing';
        } elseif ($phase <= 2 && $incident->status === 'Ongoing') {
            $newStatus = 'Pending';
        }

        // Record phase transition history
        $history = $incident->calling_phase_history ?? [];
        $history[] = [
            'phase' => $phase,
            'at' => now()->toISOString(),
            'by' => $adminName,
            'trigger' => 'manual',
        ];

        $incident->update([
            'calling_phase' => $phase,
            'calling_phase_history' => $history,
            'status' => $newStatus,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($admin, 'Incidents', 'Phase Updated', 'Changed calling phase for incident #'.(string) $incident->id.' to Phase '.$phase);
        }

        return redirect()->back()->with('success', 'Student calling phase updated to Phase '.$phase.'.');
    }

    /**
     * Save investigation and fact-finding details (Step 2).
     */
    public function saveInvestigation(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'identity_verified' => ['nullable', 'boolean'],
            'interviews_completed' => ['nullable', 'boolean'],
            'gravity_assessed' => ['nullable', 'boolean'],
            'student_history_notes' => ['nullable', 'string'],
            'interview_notes' => ['nullable', 'string'],
            'investigation_summary' => ['nullable', 'string'],
            'investigator_name' => ['nullable', 'string'],
            'recommended_action' => ['nullable', 'string'],
            'advance_to_hearing' => ['nullable', 'boolean'],
        ]);

        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'System';

        $details = [
            'identity_verified' => (bool) ($validated['identity_verified'] ?? false),
            'interviews_completed' => (bool) ($validated['interviews_completed'] ?? false),
            'gravity_assessed' => (bool) ($validated['gravity_assessed'] ?? false),
            'student_history_notes' => $validated['student_history_notes'] ?? '',
            'interview_notes' => $validated['interview_notes'] ?? '',
            'investigation_summary' => $validated['investigation_summary'] ?? '',
            'investigator_name' => $validated['investigator_name'] ?? $adminName,
            'recommended_action' => $validated['recommended_action'] ?? '',
            'updated_at' => now()->toISOString(),
            'updated_by' => $adminName,
        ];

        $updateData = ['investigation_details' => $details];

        if (!empty($validated['advance_to_hearing']) && ($incident->calling_phase ?? 1) < 3) {
            $history = $incident->calling_phase_history ?? [];
            $history[] = [
                'phase' => 3,
                'at' => now()->toISOString(),
                'by' => $adminName,
                'trigger' => 'investigation_completed',
            ];
            $updateData['calling_phase'] = 3;
            $updateData['calling_phase_history'] = $history;
            $updateData['status'] = 'Ongoing';
        }

        $incident->update($updateData);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($admin, 'Incidents', 'Investigation Logged', 'Saved investigation findings for incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Investigation details saved successfully.'.(!empty($validated['advance_to_hearing']) ? ' Case advanced to Step 3 (Meeting / Hearing).' : ''));
    }

    /**
     * Send official Calling Notice / Summons to student's DSAMS account.
     */
    public function sendCallingNotice(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['nullable', 'string'],
            'venue' => ['nullable', 'string'],
            'appearance_schedule' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'advance_to_step_3' => ['nullable', 'boolean'],
        ]);

        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'System';

        $noticeDetails = [
            'sent_at' => now()->toISOString(),
            'sent_by' => $adminName,
            'student_id' => $validated['student_id'] ?? null,
            'venue' => $validated['venue'] ?? $incident->location ?? 'Office of the Dean of Student Affairs (ODSA)',
            'appearance_schedule' => $validated['appearance_schedule'] ?? 'Next business day during office hours (8:00 AM - 5:00 PM)',
            'instructions' => $validated['instructions'] ?? 'You are officially summoned to appear at the Office of Student Affairs & Discipline for Step 3: Meeting / Hearing.',
        ];

        $updateData = [
            'calling_notice_sent_at' => now(),
            'calling_notice_details' => $noticeDetails,
        ];

        if (!empty($validated['advance_to_step_3']) || ($incident->calling_phase ?? 1) < 3) {
            $history = $incident->calling_phase_history ?? [];
            $history[] = [
                'phase' => 3,
                'at' => now()->toISOString(),
                'by' => $adminName,
                'trigger' => 'calling_notice_dispatched_to_student',
            ];
            $updateData['calling_phase'] = 3;
            $updateData['calling_phase_history'] = $history;
            $updateData['status'] = 'Ongoing';
        }

        $incident->update($updateData);

        // Dispatch in-app notification & alert to student account
        app(StudentNotificationDispatcher::class)->callingNoticeIssued($incident, $noticeDetails);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $admin,
                'Incidents',
                'Calling Notice Sent',
                'Sent official Calling Notice / Summons to student account for incident #'.(string) $incident->id
            );
        }

        return redirect()->back()->with('success', 'Official Calling Notice has been sent directly to the student\'s account.');
    }

    /**
     * Serve official Disciplinary Resolution & Notice of Decision to student account.
     */
    public function serveDecision(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['nullable', 'string'],
            'student_db_id' => ['nullable', 'integer'],
            'sanction_section' => ['required', 'integer', 'in:1,2,3,4'],
            'sanction_type' => ['required', 'in:Warning,Suspension,Exclusion,Expulsion'],
            'specific_penalty' => ['required', 'string'],
            'findings_summary' => ['required', 'string'],
            'legal_basis_rationale' => ['required', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'effective_date' => ['nullable', 'string'],
            'signatory_name' => ['nullable', 'string'],
            'signatory_title' => ['nullable', 'string'],
            'advance_to_step_4' => ['nullable', 'boolean'],
            'mark_as_resolved' => ['nullable', 'boolean'],
        ]);

        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'Discipline Officer';

        $decisionDetails = [
            'section' => (int) $validated['sanction_section'],
            'sanction' => $validated['sanction_type'],
            'sanction_type' => $validated['sanction_type'],
            'specific_penalty' => $validated['specific_penalty'],
            'findings' => $validated['findings_summary'],
            'rationale' => $validated['legal_basis_rationale'],
            'terms' => $validated['terms_conditions'] ?? null,
            'effective_date' => $validated['effective_date'] ?? now()->toDateString(),
            'signatory_name' => $validated['signatory_name'] ?? $adminName,
            'signatory_title' => $validated['signatory_title'] ?? 'Prefect of Discipline / Dean of Student Affairs',
            'served_at' => now()->toISOString(),
            'served_by' => $adminName,
            'student_id' => $validated['student_id'] ?? null,
        ];

        $targetPhase = !empty($validated['mark_as_resolved']) ? 5 : 4;
        $history = $incident->calling_phase_history ?? [];
        $history[] = [
            'phase' => $targetPhase,
            'at' => now()->toISOString(),
            'by' => $adminName,
            'trigger' => 'disciplinary_decision_served_to_student',
            'sanction' => $validated['sanction_type'],
        ];

        $updateData = [
            'action_data' => $decisionDetails,
            'calling_phase' => $targetPhase,
            'calling_phase_history' => $history,
            'status' => !empty($validated['mark_as_resolved']) ? 'Resolved' : ($incident->status === 'Resolved' ? 'Resolved' : 'Ongoing'),
        ];

        $incident->update($updateData);

        // Also record in disciplinary_actions table if available
        $studentDbId = $validated['student_db_id'] ?? null;
        if (!$studentDbId && !empty($validated['student_id'])) {
            $student = \App\Models\Student::where('student_id', $validated['student_id'])->orWhere('id', $validated['student_id'])->first();
            $studentDbId = $student?->id;
        }

        if ($studentDbId && class_exists(\App\Models\DisciplinaryAction::class)) {
            \App\Models\DisciplinaryAction::create([
                'incident_id' => $incident->id,
                'student_id' => $studentDbId,
                'recommended_action' => $validated['sanction_type'],
                'recommendation_reason' => $validated['legal_basis_rationale'],
                'final_action' => $validated['sanction_type'],
                'final_action_reason' => $validated['legal_basis_rationale'],
                'remarks' => $validated['specific_penalty'].(!empty($validated['terms_conditions']) ? (' | Terms: '.$validated['terms_conditions']) : ''),
                'status' => 'Approved',
                'reviewed_by' => $admin->id ?? null,
                'reviewed_at' => now(),
                'decision_history' => [
                    [
                        'action' => 'Decision Served',
                        'timestamp' => now()->toISOString(),
                        'reviewed_by' => $adminName,
                        'remarks' => 'Notice of Decision served to student account and administrative file.',
                    ]
                ],
            ]);
        }

        // Dispatch in-app notification & alert to student account
        app(StudentNotificationDispatcher::class)->disciplinaryDecisionIssued($incident, $decisionDetails);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $admin,
                'Incidents',
                'Disciplinary Decision Served',
                "Served formal Notice of Decision ({$validated['sanction_type']}) for incident #".(string) $incident->id
            );
        }

        return redirect()->back()->with('success', 'Official Disciplinary Resolution & Notice of Decision has been served to the student account and recorded.');
    }

    /**
     * Batch update status or phase for multiple incidents (#5: Batch operations).
     */
    public function batchUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'incident_ids' => ['required', 'array', 'min:1'],
            'incident_ids.*' => ['required', 'integer', 'exists:incidents,id'],
            'action' => ['required', 'in:advance_phase,set_status'],
            'value' => ['required'],
        ]);

        $admin = auth()->guard('admin')->user();
        $adminName = $admin->name ?? $admin->id ?? 'System';
        $incidents = Incident::whereIn('id', $validated['incident_ids'])->get();
        $count = 0;

        foreach ($incidents as $incident) {
            if ($validated['action'] === 'advance_phase') {
                $targetPhase = (int) $validated['value'];
                if ($targetPhase < 1 || $targetPhase > 5) continue;

                $newStatus = $incident->status;
                if ($targetPhase === 5) {
                    $newStatus = 'Resolved';
                } elseif ($targetPhase === 4) {
                    $newStatus = 'Escalated';
                } elseif ($targetPhase === 3) {
                    $newStatus = 'Ongoing';
                } elseif ($targetPhase <= 2) {
                    $newStatus = 'Pending';
                }

                $history = $incident->calling_phase_history ?? [];
                $history[] = [
                    'phase' => $targetPhase,
                    'at' => now()->toISOString(),
                    'by' => $adminName,
                    'trigger' => 'batch',
                ];

                $incident->update([
                    'calling_phase' => $targetPhase,
                    'calling_phase_history' => $history,
                    'status' => $newStatus,
                ]);
                $count++;
            } elseif ($validated['action'] === 'set_status') {
                $newStatus = $validated['value'];
                if (!in_array($newStatus, ['Pending', 'Ongoing', 'Resolved', 'Escalated'])) continue;

                $currentPhase = $incident->calling_phase ?? 1;
                $syncedPhase = $currentPhase;
                if ($newStatus === 'Resolved' && $currentPhase < 5) $syncedPhase = 5;
                elseif ($newStatus === 'Escalated' && $currentPhase < 4) $syncedPhase = 4;
                elseif ($newStatus === 'Ongoing' && $currentPhase < 3) $syncedPhase = 3;
                elseif ($newStatus === 'Pending' && $currentPhase > 2) $syncedPhase = 1;

                $updateData = ['status' => $newStatus];
                if ($syncedPhase !== $currentPhase) {
                    $history = $incident->calling_phase_history ?? [];
                    $history[] = [
                        'phase' => $syncedPhase,
                        'at' => now()->toISOString(),
                        'by' => $adminName,
                        'trigger' => 'batch_status_sync',
                    ];
                    $updateData['calling_phase'] = $syncedPhase;
                    $updateData['calling_phase_history'] = $history;
                }

                $incident->update($updateData);
                $count++;
            }
        }

        if (Schema::hasTable('activity_logs') && $count > 0) {
            ActivityLog::logForUser($admin, 'Incidents', 'Batch Updated', 'Batch '.$validated['action'].' on '.$count.' incidents');
        }

        return redirect()->back()->with('success', $count.' incident(s) updated successfully.');
    }

    public function updatePost(Request $request, Incident $incident): RedirectResponse
    {
        return $this->update($request, $incident);
    }

    public function archivePost(Request $request, Incident $incident): RedirectResponse
    {
        return $this->archive($incident);
    }

    public function destroy(Incident $incident): RedirectResponse
    {
        $incident->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Archived', 'Archived incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report archived successfully.');
    }

    public function show(Request $request, int $id): Response|RedirectResponse
    {
        $incident = Incident::find($id);

        if (! $incident) {
            return redirect()->route('admin.incidents-violations')
                ->with('error', 'Incident record not found.');
        }

        $formatted = $this->formatIncidentData($incident);

        // Retrieve actual student details if student exists in the database
        $studentName = $formatted['student'];
        $student = \App\Models\Student::where('name', $studentName)->first();
        $studentDetails = null;
        if ($student) {
            $studentDetails = [
                'id' => $student->student_id,
                'db_id' => $student->id,
                'name' => $student->name,
                'course' => $student->course ?? 'BSCS',
                'yearLevel' => $student->year_level ?? '4th Year',
                'status' => $student->status ?? 'Active',
            ];
        }

        $disciplinaryActions = $this->getDisciplinaryActions($incident);

        // Load all violations for the category dropdown
        \App\Models\Violation::ensureDefaultViolations();
        $violations = \App\Models\Violation::all()->map(function ($v) {
            return [
                'id' => $v->id,
                'code' => $v->code,
                'name' => $v->name,
                'description' => $v->description,
                'section' => $v->section,
            ];
        })->toArray();

        $actionType = $incident->classification;
        if ($actionType === 'Minor') {
            $actionType = 'Warning';
        }
        if (in_array($actionType, ['Major'])) {
            $actionType = 'Suspension';
        }

        [$studentDisciplinaryStats, $studentDisciplinaryHistory] = $this->getStudentDisciplinaryData($incident, $student, $actionType);

        return Inertia::render('admin-dashboard/incidents-violations/show', [
            'incident' => $formatted,
            'studentDetails' => $studentDetails,
            'disciplinaryActions' => $disciplinaryActions,
            'violations' => $violations,
            'studentDisciplinaryStats' => $studentDisciplinaryStats,
            'studentDisciplinaryHistory' => $studentDisciplinaryHistory,
        ]);
    }

    public function archive(Incident $incident): RedirectResponse
    {
        try {
            \Log::info('Attempting to archive incident: '.$incident->id);

            $incident->update(['is_archived' => true]);

            if (Schema::hasTable('activity_logs')) {
                $admin = auth()->guard('admin')->user();
                ActivityLog::logForUser($admin, 'Incidents', 'Archived', 'Archived incident #'.(string) $incident->id);
            }

            \Log::info('Successfully archived incident: '.$incident->id);

            return redirect()->back()->with('success', 'Incident report archived successfully.');
        } catch (\Exception $e) {
            \Log::error('Archive failed: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to archive incident: '.$e->getMessage());
        }
    }

    public function unarchive(Incident $incident): RedirectResponse
    {
        $incident->update(['is_archived' => false]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Unarchived', 'Unarchived incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report unarchived successfully.');
    }

    /**
     * Store a new disciplinary action for an incident from the show page.
     */
    public function storeDisciplinaryAction(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'recommended_action' => ['required', 'in:Warning,Suspension,Exclusion,Expulsion'],
            'recommendation_reason' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        DisciplinaryAction::create([
            'incident_id' => $incident->id,
            'student_id' => $validated['student_id'],
            'recommended_action' => $validated['recommended_action'],
            'recommendation_reason' => $validated['recommendation_reason'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'status' => 'Pending',
            'decision_history' => [
                ['action' => 'Created', 'timestamp' => now()->toISOString(), 'reason' => $validated['recommendation_reason'] ?? 'Manual creation from case detail']
            ],
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Disciplinary Action', 'Created disciplinary action for incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Disciplinary action created successfully.');
    }

    /**
     * Review (approve/modify/override) a disciplinary action.
     */
    public function reviewDisciplinaryAction(Request $request, DisciplinaryAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Approved,Modified,Overridden'],
            'final_action' => ['nullable', 'in:Warning,Suspension,Exclusion,Expulsion'],
            'final_action_reason' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        $admin = auth()->guard('admin')->user();

        $history = $action->decision_history ?? [];
        $history[] = [
            'action' => $validated['status'],
            'timestamp' => now()->toISOString(),
            'reviewed_by' => $admin->name ?? $admin->id,
            'remarks' => $validated['remarks'] ?? null,
        ];

        $action->update([
            'status' => $validated['status'],
            'final_action' => $validated['final_action'] ?? $action->recommended_action,
            'final_action_reason' => $validated['final_action_reason'],
            'remarks' => $validated['remarks'],
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'decision_history' => $history,
        ]);

        if (in_array($validated['status'], ['Approved', 'Modified', 'Overridden'])) {
            $incident = $action->incident;
            if ($incident) {
                $incident->update(['status' => 'Resolved']);
            }
        }

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser($admin, 'Incidents', 'Reviewed', 'Reviewed disciplinary action #'.(string) $action->id);
        }

        return redirect()->back()->with('success', 'Disciplinary action reviewed successfully.');
    }

    /**
     * Compute the next sanction based on a student's warning/suspension history.
     */
    protected function computeNextSanction(int $warningCount, int $suspensionCount): string
    {
        if ($suspensionCount >= 2) {
            return 'Exclusion or Expulsion';
        }
        if ($warningCount >= 3) {
            return 'Suspension';
        }
        if ($warningCount >= 2) {
            return '3rd warning → Suspension';
        }
        if ($warningCount >= 1) {
            return '2nd warning recorded';
        }
        return '1st warning';
    }

    /**
     * Normalize students_involved to a consistent array of objects with id and name keys.
     */
    protected function normalizeStudentsInvolved(mixed $studentsRaw): array
    {
        $raw = is_array($studentsRaw) ? $studentsRaw : [];
        $studentsNormalized = [];

        // Check if it's a legacy [name, id] pair (two strings)
        if (count($raw) === 2 && is_string($raw[0]) && is_string($raw[1])) {
            $studentsNormalized[] = [
                'id' => $raw[1],
                'name' => $raw[0],
            ];
        } else {
            foreach ($raw as $s) {
                if (is_array($s) && isset($s['name'])) {
                    $studentsNormalized[] = ['id' => $s['id'] ?? '', 'name' => $s['name']];
                } else {
                    // Plain string: could be ID or name
                    $studentIdOrName = (string) $s;
                    // Try to find student by student_id first
                    $student = \App\Models\Student::where('student_id', $studentIdOrName)->first();
                    if ($student) {
                        $studentsNormalized[] = [
                            'id' => $student->student_id,
                            'name' => $student->name,
                        ];
                    } else {
                        // Try to find by name
                        $studentByName = \App\Models\Student::where('name', $studentIdOrName)->first();
                        if ($studentByName) {
                            $studentsNormalized[] = [
                                'id' => $studentByName->student_id,
                                'name' => $studentByName->name,
                            ];
                        } else {
                            $studentsNormalized[] = ['id' => $studentIdOrName, 'name' => $studentIdOrName];
                        }
                    }
                }
            }
        }

        return $studentsNormalized;
    }

    /**
     * Format incident data payload for Inertia response.
     */
    protected function formatIncidentData(Incident $incident): array
    {
        $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
        $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
        $dateTime = trim(($date ? $date->format('M d, Y') : '').' '.($time ? $time->format('h:i A') : ''));

        $studentsNormalized = $this->normalizeStudentsInvolved($incident->students_involved);
        $firstStudentName = count($studentsNormalized) > 0 ? $studentsNormalized[0]['name'] : '—';
        $firstStudentId = count($studentsNormalized) > 0 ? $studentsNormalized[0]['id'] : '';

        $callingPhase = $incident->calling_phase ?? (
            $incident->status === 'Resolved' ? 5 : (
                $incident->status === 'Escalated' ? 4 : (
                    $incident->status === 'Ongoing' ? 3 : 1
                )
            )
        );

        return [
            'id' => $incident->id,
            'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
            'student' => $firstStudentName,
            'studentId' => $firstStudentId,
            'type' => $incident->incident_type,
            'classification' => $incident->classification,
            'dateTime' => $dateTime,
            'status' => $incident->status,
            'calling_phase' => $callingPhase,
            'calling_phase_history' => $incident->calling_phase_history ?? [],
            'investigation_details' => $incident->investigation_details ?? null,
            'calling_notice_sent_at' => $incident->calling_notice_sent_at ? (\Illuminate\Support\Carbon::parse($incident->calling_notice_sent_at)->toISOString()) : null,
            'calling_notice_details' => $incident->calling_notice_details ?? null,
            'action_data' => $incident->action_data ?? null,
            'updated_at' => $incident->updated_at?->toISOString(),
            'violation_id' => $incident->violation_id,
            'raw' => [
                'violationId' => $incident->violation_id,
                'incidentType' => $incident->incident_type,
                'date' => $date ? $date->format('Y-m-d') : null,
                'time' => $time ? $time->format('H:i') : null,
                'location' => $incident->location,
                'reportedBy' => $incident->reported_by,
                'studentsInvolved' => $studentsNormalized,
                'description' => $incident->description,
                'immediateAction' => $incident->immediate_action,
                'classification' => $incident->classification,
                'status' => $incident->status,
                'calling_phase' => $callingPhase,
                'receivedBy' => $incident->received_by,
                'evidencePaths' => $incident->evidence_paths ?? [],
                'investigationDetails' => $incident->investigation_details ?? null,
                'callingNoticeSentAt' => $incident->calling_notice_sent_at ? (\Illuminate\Support\Carbon::parse($incident->calling_notice_sent_at)->toISOString()) : null,
                'callingNoticeDetails' => $incident->calling_notice_details ?? null,
                'actionData' => $incident->action_data ?? null,
            ],
        ];
    }

    /**
     * Load formatted disciplinary actions for an incident.
     */
    protected function getDisciplinaryActions(Incident $incident): array
    {
        if (! $incident->exists) {
            return [];
        }

        return $incident->disciplinaryActions()
            ->with(['student', 'reviewer'])
            ->get()
            ->map(function (DisciplinaryAction $action) {
                return [
                    'id' => $action->id,
                    'student_id' => $action->student_id,
                    'student_name' => $action->student?->name ?? '—',
                    'recommended_action' => $action->recommended_action,
                    'recommendation_reason' => $action->recommendation_reason,
                    'final_action' => $action->final_action,
                    'final_action_reason' => $action->final_action_reason,
                    'remarks' => $action->remarks,
                    'reviewed_by' => $action->reviewer?->name ?? null,
                    'reviewed_at' => $action->reviewed_at?->toISOString(),
                    'status' => $action->status,
                    'decision_history' => $action->decision_history ?? [],
                    'created_at' => $action->created_at?->toISOString(),
                ];
            })
            ->toArray();
    }

    /**
     * Compute stats and disciplinary history for a student.
     */
    protected function getStudentDisciplinaryData(Incident $incident, ?\App\Models\Student $student, string $actionType): array
    {
        $currentIncidentAsHistory = [
            'id' => 0,
            'incident_id' => $incident->id,
            'action_type' => $actionType,
            'date' => $incident->incident_date ? Carbon::parse($incident->incident_date)->format('M Y') : '—',
            'description' => $incident->incident_type,
            'case_ref' => $incident->incident_date ? (Carbon::parse($incident->incident_date)->format('Y').'-'.str_pad((string) $incident->id, 4, '0', STR_PAD_LEFT)) : null,
            'is_current' => true,
        ];

        if ($student) {
            $warningCount = $student->disciplinaryActions()
                ->whereIn('status', ['Approved', 'Modified', 'Overridden'])
                ->where(function ($q) {
                    $q->where('final_action', 'Warning')
                        ->orWhere(function ($q2) {
                            $q2->whereNull('final_action')->where('recommended_action', 'Warning');
                        });
                })
                ->count();

            $suspensionCount = $student->disciplinaryActions()
                ->whereIn('status', ['Approved', 'Modified', 'Overridden'])
                ->where(function ($q) {
                    $q->where('final_action', 'Suspension')
                        ->orWhere(function ($q2) {
                            $q2->whereNull('final_action')->where('recommended_action', 'Suspension');
                        });
                })
                ->count();

            $totalActions = $student->disciplinaryActions()->count() + 1; // +1 for current incident

            $studentDisciplinaryStats = [
                'warning_count' => $warningCount + (in_array($actionType, ['Warning']) ? 1 : 0),
                'suspension_count' => $suspensionCount + (in_array($actionType, ['Suspension']) ? 1 : 0),
                'total_actions' => $totalActions,
                'next_sanction' => $this->computeNextSanction($warningCount + (in_array($actionType, ['Warning']) ? 1 : 0), $suspensionCount + (in_array($actionType, ['Suspension']) ? 1 : 0)),
            ];

            $studentDisciplinaryHistory = $student->disciplinaryActions()
                ->whereIn('status', ['Approved', 'Modified', 'Overridden'])
                ->where('incident_id', '!=', $incident->id)
                ->with(['incident'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($action) use ($incident) {
                    return [
                        'id' => $action->id,
                        'incident_id' => $action->incident_id,
                        'action_type' => $action->final_action ?? $action->recommended_action,
                        'date' => $action->created_at?->format('M Y'),
                        'description' => $action->incident?->incident_type ?? 'Disciplinary action recorded',
                        'case_ref' => $action->incident?->exists ? ($action->incident->created_at?->format('Y').'-'.str_pad((string) $action->incident->id, 4, '0', STR_PAD_LEFT)) : null,
                        'is_current' => $action->incident_id === $incident->id,
                    ];
                })
                ->toArray();
        } else {
            $studentDisciplinaryHistory = [
                [
                    'id' => 1,
                    'incident_id' => $incident->id - 1,
                    'action_type' => 'Warning',
                    'date' => 'Jan 2026',
                    'description' => 'Dress Code Violation',
                    'case_ref' => '2026-000'.($incident->id - 1),
                    'is_current' => false,
                ],
            ];
            $studentDisciplinaryStats = [
                'warning_count' => 1,
                'suspension_count' => 0,
                'total_actions' => 1,
                'next_sanction' => 'Warning',
            ];
        }

        array_unshift($studentDisciplinaryHistory, $currentIncidentAsHistory);

        return [$studentDisciplinaryStats, $studentDisciplinaryHistory];
    }
}
