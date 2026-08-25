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

                return [
                    'id' => $incident->id,
                    'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                    'student'   => $firstStudentName,
                    'studentId' => $firstStudentId,
                    'type' => $incident->incident_type,
                    'classification' => $incident->classification,
                    'dateTime' => $dateTime,
                    'status' => $incident->status,
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
    public function updateStatus(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $incident->update(['status' => $validated['status']]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Status Updated', 'Changed incident #'.(string) $incident->id.' status to '.$validated['status']);
        }

        return redirect()->back()->with('success', 'Status updated to '.$validated['status'].'.');
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

        return [
            'id' => $incident->id,
            'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
            'student' => $firstStudentName,
            'studentId' => $firstStudentId,
            'type' => $incident->incident_type,
            'classification' => $incident->classification,
            'dateTime' => $dateTime,
            'status' => $incident->status,
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
                'receivedBy' => $incident->received_by,
                'evidencePaths' => $incident->evidence_paths ?? [],
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
