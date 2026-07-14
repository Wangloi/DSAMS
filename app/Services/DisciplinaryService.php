<?php

namespace App\Services;

use App\Models\DisciplinaryAction;
use App\Models\DisciplinaryRule;
use App\Models\Incident;
use App\Models\Student;
use App\Models\Violation;

class DisciplinaryService
{
    public function createIncident(array $data): Incident
    {
        // Step 1: Save incident
        $incident = Incident::create($data);

        // Step 2: For each student involved, evaluate and create disciplinary action
        if (!empty($data['students_involved'])) {
            foreach ($data['students_involved'] as $studentInfo) {
                // Handle both formats: array with id/name or just id/name
                $studentId = is_array($studentInfo) ? ($studentInfo['id'] ?? null) : $studentInfo;

                if ($studentId) {
                    $student = Student::where('student_id', $studentId)->first() ?? Student::find($studentId);

                    if ($student) {
                        $this->evaluateAndCreateDisciplinaryAction($incident, $student);
                    }
                }
            }
        }

        return $incident;
    }

    public function evaluateAndCreateDisciplinaryAction(Incident $incident, Student $student): DisciplinaryAction
    {
        // Step 1: Get violation
        $violation = $incident->violation;

        if (!$violation) {
            // If no violation linked, use classification as fallback
            $defaultAction = $this->getDefaultActionFromClassification($incident->classification);
            return $this->createDisciplinaryAction($incident, $student, $defaultAction, 'No violation linked, using classification');
        }

        // Step 2: Get default action based on violation section
        $recommendedAction = $violation->section;
        $reason = "Default action from violation section: {$violation->section}";

        // Step 3: Evaluate disciplinary rules for this section
        $rules = DisciplinaryRule::active()
            ->where('trigger_section', $violation->section)
            ->get();

        foreach ($rules as $rule) {
            if ($this->evaluateRule($rule, $student, $violation)) {
                $recommendedAction = $rule->result_action;
                $reason = "Rule applied: {$rule->name}";
                break; // Stop at first matching high-priority rule
            }
        }

        // Step 4: Create disciplinary action
        return $this->createDisciplinaryAction($incident, $student, $recommendedAction, $reason);
    }

    protected function evaluateRule(DisciplinaryRule $rule, Student $student, Violation $violation): bool
    {
        $conditions = $rule->conditions;

        if (isset($conditions['same_offense_count'])) {
            // Count same violation in student's history
            $sameOffenseCount = $student->disciplinaryActions()
                ->whereHas('incident', fn($q) => $q->where('violation_id', $violation->id))
                ->count();

            if ($sameOffenseCount >= $conditions['same_offense_count']) {
                return true;
            }
        }

        if (isset($conditions['total_warnings'])) {
            // Count total warning actions in history
            $totalWarnings = $student->disciplinaryActions()
                ->where('final_action', 'Warning')
                ->count();

            if ($totalWarnings >= $conditions['total_warnings']) {
                return true;
            }
        }

        if (isset($conditions['suspension_count'])) {
            $suspensionCount = $student->disciplinaryActions()
                ->where('final_action', 'Suspension')
                ->count();

            if ($suspensionCount >= $conditions['suspension_count']) {
                return true;
            }
        }

        return false;
    }

    protected function getDefaultActionFromClassification(?string $classification): string
    {
        return match ($classification) {
            'Major' => 'Suspension',
            default => 'Warning',
        };
    }

    protected function createDisciplinaryAction(
        Incident $incident,
        Student $student,
        string $recommendedAction,
        string $reason
    ): DisciplinaryAction {
        return DisciplinaryAction::create([
            'incident_id' => $incident->id,
            'student_id' => $student->id,
            'recommended_action' => $recommendedAction,
            'recommendation_reason' => $reason,
            'status' => 'Pending',
            'decision_history' => [
                ['action' => 'Created', 'timestamp' => now()->toISOString(), 'reason' => $reason]
            ],
        ]);
    }

    public function reviewDisciplinaryAction(
        DisciplinaryAction $action,
        string $status,
        ?string $finalAction = null,
        ?string $finalReason = null,
        ?string $remarks = null,
        $reviewedBy
    ): DisciplinaryAction {
        $history = $action->decision_history ?? [];
        $history[] = [
            'action' => $status,
            'timestamp' => now()->toISOString(),
            'reviewed_by' => $reviewedBy,
            'remarks' => $remarks,
        ];

        $action->update([
            'status' => $status,
            'final_action' => $finalAction ?? $action->recommended_action,
            'final_action_reason' => $finalReason,
            'remarks' => $remarks,
            'reviewed_by' => $reviewedBy,
            'reviewed_at' => now(),
            'decision_history' => $history,
        ]);

        return $action;
    }
}
