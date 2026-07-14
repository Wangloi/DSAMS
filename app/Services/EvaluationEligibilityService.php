<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\ProgramEvaluationApproval;
use App\Models\Student;
use App\Notifications\EvaluationAvailable;
use Illuminate\Support\Facades\Schema;

class EvaluationEligibilityService
{
    /**
     * Event date is before today (completed lifecycle).
     */
    public static function eventIsCompleted(Event $event): bool
    {
        $status = Event::deriveLifecycleStatusFromDate($event->event_date);

        return $status === 'completed';
    }

    /**
     * Present attendees whose course/year match the event targets.
     */
    public static function eligibleAttendeesQuery(Event $event)
    {
        $presentIds = Attendance::query()
            ->where('event_id', $event->id)
            ->where('status', 'present')
            ->pluck('student_id');

        $query = Student::query()->whereIn('id', $presentIds);

        $courses = is_array($event->courses) ? array_filter($event->courses) : [];
        $yearLevels = is_array($event->year_levels) ? array_filter($event->year_levels) : [];

        if (! empty($courses)) {
            $query->whereIn('course', $courses);
        }
        if (! empty($yearLevels)) {
            $query->whereIn('year_level', $yearLevels);
        }

        return $query;
    }

    public static function eligibleAttendeeCount(Event $event): int
    {
        if (! Schema::hasTable('attendances')) {
            return 0;
        }

        return (int) self::eligibleAttendeesQuery($event)->count();
    }

    public static function studentIsEligible(Student $student, Event $event): bool
    {
        if (! Schema::hasTable('attendances')) {
            return false;
        }

        $attended = Attendance::query()
            ->where('event_id', $event->id)
            ->where('student_id', $student->id)
            ->where('status', 'present')
            ->exists();

        if (! $attended) {
            return false;
        }

        $courses = is_array($event->courses) ? array_filter($event->courses) : [];
        $yearLevels = is_array($event->year_levels) ? array_filter($event->year_levels) : [];

        if (! empty($courses) && ! in_array((string) $student->course, $courses, true)) {
            return false;
        }
        if (! empty($yearLevels) && ! in_array((string) $student->year_level, $yearLevels, true)) {
            return false;
        }

        return true;
    }

    public static function studentCanAccessEvaluation(Student $student, Evaluation $evaluation): bool
    {
        if (! $evaluation->is_active || $evaluation->is_archived) {
            return false;
        }

        $event = $evaluation->eventRecord ?? Event::query()->find($evaluation->event_id);
        if (! $event || $event->archived_at !== null) {
            return false;
        }

        if (! self::eventIsCompleted($event)) {
            return false;
        }

        return self::studentIsEligible($student, $event);
    }

    public static function notifyEligibleStudents(Evaluation $evaluation): int
    {
        $event = $evaluation->eventRecord ?? Event::query()->find($evaluation->event_id);
        if (! $event) {
            return 0;
        }

        $students = self::eligibleAttendeesQuery($event)->get();
        $count = 0;

        foreach ($students as $student) {
            if (! method_exists($student, 'notify')) {
                continue;
            }

            if (Schema::hasTable('evaluation_responses')) {
                $already = EvaluationResponse::query()
                    ->where('evaluation_id', $evaluation->id)
                    ->where('student_id', $student->id)
                    ->exists();
                if ($already) {
                    continue;
                }
            }

            $student->notify(new EvaluationAvailable($evaluation));
            $count++;
        }

        return $count;
    }

    /**
     * Per-program completion for chairman rule (85% before next activity).
     *
     * @return array<int, array{program: string, eligible: int, submitted: int, percent: float, meets_threshold: bool, approved: bool}>
     */
    public static function programCompletionStats(Event $event, Evaluation $evaluation): array
    {
        if (! Schema::hasTable('evaluation_responses')) {
            return [];
        }

        $submittedByStudent = EvaluationResponse::query()
            ->where('evaluation_id', $evaluation->id)
            ->pluck('student_id')
            ->flip();

        $attendees = self::eligibleAttendeesQuery($event)->get(['id', 'course']);

        $programs = is_array($event->courses) && count($event->courses) > 0
            ? array_values(array_filter($event->courses))
            : $attendees->pluck('course')->filter()->unique()->values()->all();

        if (empty($programs)) {
            $programs = ['All Programs'];
        }

        $approvals = ProgramEvaluationApproval::query()
            ->where('evaluation_id', $evaluation->id)
            ->get()
            ->keyBy('program');

        $rows = [];

        foreach ($programs as $program) {
            if ($program === 'All Programs') {
                $group = $attendees;
            } else {
                $group = $attendees->where('course', $program);
            }

            $eligible = $group->count();
            $submitted = $group->filter(fn ($s) => $submittedByStudent->has($s->id))->count();
            $percent = $eligible > 0 ? round(($submitted / $eligible) * 100, 2) : 0.0;
            $approval = $approvals->get($program);

            $rows[] = [
                'program' => (string) $program,
                'eligible' => $eligible,
                'submitted' => $submitted,
                'percent' => $percent,
                'meets_threshold' => $eligible > 0 && $percent >= ProgramEvaluationApproval::COMPLETION_THRESHOLD,
                'approved' => (bool) ($approval?->approved_for_next_activity ?? false),
                'approved_at' => optional($approval?->approved_at)->toIso8601String(),
            ];
        }

        return $rows;
    }

    public static function syncProgramApprovalRow(Event $event, Evaluation $evaluation, string $program): ProgramEvaluationApproval
    {
        $stats = collect(self::programCompletionStats($event, $evaluation))
            ->firstWhere('program', $program);

        $eligible = (int) ($stats['eligible'] ?? 0);
        $submitted = (int) ($stats['submitted'] ?? 0);
        $percent = (float) ($stats['percent'] ?? 0);

        return ProgramEvaluationApproval::query()->updateOrCreate(
            [
                'evaluation_id' => $evaluation->id,
                'program' => $program,
            ],
            [
                'event_id' => $event->id,
                'eligible_count' => $eligible,
                'submitted_count' => $submitted,
                'completion_percent' => $percent,
            ],
        );
    }

    public static function issueEvaluationCertificate(Student $student, Evaluation $evaluation): ?Certificate
    {
        if (! Schema::hasTable('certificates')) {
            return null;
        }

        $event = $evaluation->eventRecord ?? Event::query()->find($evaluation->event_id);
        if (! $event) {
            return null;
        }

        $existingCertificate = Certificate::query()
            ->where('student_id', $student->id)
            ->where('evaluation_id', $evaluation->id)
            ->first();

        if ($existingCertificate) {
            return $existingCertificate;
        }

        return Certificate::create([
            'student_id' => $student->id,
            'event_id' => $event->id,
            'evaluation_id' => $evaluation->id,
            'certificate_number' => Certificate::generateCertificateNumber(),
            'certificate_type' => 'evaluation_completion',
            'title' => 'Certificate of Evaluation Completion',
            'description' => 'This certifies that the student has completed the evaluation for '.$event->event_name,
            'issue_date' => now(),
            'issued_by' => 'Department of Student Affairs',
            'signature_name' => 'DSA Director',
            'signature_title' => 'Director, Student Affairs',
            'is_generated' => false,
        ]);
    }
}
