<?php

namespace App\Services\Attendance;

use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\Student;
use App\Notifications\EvaluationAvailable;
use Illuminate\Support\Facades\Schema;

class EvaluationGateService
{
    /**
     * Check if the student has pending evaluations for past events before attending a new one.
     */
    public function hasPendingEvaluations(Student $student, Event $event): bool
    {
        $studentProgram = $student->course ?? $student->program;
        if (! $studentProgram) {
            return false;
        }

        return Evaluation::query()
            ->join('events', 'evaluations.event_id', '=', 'events.id')
            ->join('attendances', 'events.id', '=', 'attendances.event_id')
            ->where('attendances.student_id', $student->id)
            ->where('attendances.status', 'present')
            ->where('evaluations.is_active', true)
            ->where('evaluations.is_archived', false)
            ->where('events.event_date', '<', $event->event_date)
            ->whereRaw('LOWER(TRIM(events.organizer)) LIKE ?', ['%'.strtolower($studentProgram).'%'])
            ->whereNotExists(function ($query) use ($student) {
                $query->select(\DB::raw(1))
                    ->from('evaluation_responses')
                    ->whereColumn('evaluation_responses.evaluation_id', 'evaluations.id')
                    ->where('evaluation_responses.student_id', $student->id);
            })
            ->exists();
    }

    /**
     * Trigger evaluation notification for an event once an attendee completes their scan.
     */
    public function triggerEvaluationNotification(Student $student, Event $event): void
    {
        if (! Schema::hasTable('evaluations') || ! Schema::hasTable('notifications')) {
            return;
        }

        /** @var Evaluation|null $evaluation */
        $evaluation = Evaluation::query()
            ->where('event_id', $event->id)
            ->where('is_active', true)
            ->where('is_archived', false)
            ->orderByDesc('id')
            ->first();

        if ($evaluation && Schema::hasTable('evaluation_responses')) {
            $alreadySubmitted = EvaluationResponse::query()
                ->where('evaluation_id', $evaluation->id)
                ->where('student_id', $student->id)
                ->exists();

            if (! $alreadySubmitted) {
                $alreadyNotified = $student
                    ->notifications()
                    ->where('data->type', 'evaluation_available')
                    ->where('data->evaluation_id', $evaluation->id)
                    ->exists();

                if (! $alreadyNotified) {
                    $student->notify(new EvaluationAvailable($evaluation));
                }
            }
        }
    }
}
