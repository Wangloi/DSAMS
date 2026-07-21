<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\ProgramEvaluationApproval;
use App\Services\EvaluationAutoGeneratorService;
use App\Services\EvaluationEligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminEvaluationController extends Controller
{
    /**
     * @param Evaluation $evaluation
     */
    public function show(Evaluation $evaluation): Response
    {
        $evaluation->load('eventRecord');

        $responses = EvaluationResponse::query()
            ->where('evaluation_id', $evaluation->id)
            ->with(['student:id,name,student_id'])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->map(function ($response) {
                return [
                    'id' => $response->id,
                    'student' => [
                        'id' => $response->student_id,
                        'name' => $response->student ? (string) ($response->student->name ?? '') : '',
                        'student_id' => $response->student ? (string) ($response->student->student_id ?? '') : '',
                    ],
                    'submitted_at' => optional($response->submitted_at)->toISOString(),
                    'answers' => is_array($response->answers) ? $response->answers : [],
                ];
            })
            ->values()
            ->all();

        $event = $evaluation->eventRecord;
        $programStats = $event
            ? EvaluationEligibilityService::programCompletionStats($event, $evaluation)
            : [];

        return Inertia::render('admin-dashboard/evaluation/show', [
            'evaluation' => $this->formatEvaluation($evaluation),
            'responses' => $responses,
            'programStats' => $programStats,
            'completionThreshold' => ProgramEvaluationApproval::COMPLETION_THRESHOLD,
        ]);
    }

    public function metrics(Evaluation $evaluation): Response
    {
        $evaluation->load('eventRecord');
        $event = $evaluation->eventRecord;

        $responses = EvaluationResponse::query()
            ->where('evaluation_id', $evaluation->id)
            ->with(['student:id,name,student_id'])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        $ratingQuestionIds = [];
        $commentQuestionIds = [];
        $qs = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
        if (is_array($qs)) {
            foreach ($qs as $q) {
                if (!is_array($q)) continue;
                $qid = $q['id'] ?? null;
                $type = $q['type'] ?? null;
                if (!$qid || !$type) continue;
                if ($type === 'rating') $ratingQuestionIds[] = (string)$qid;
                if ($type === 'short_text' || $type === 'long_text') $commentQuestionIds[] = (string)$qid;
            }
        }
        $ratingQuestionIds = array_values(array_unique($ratingQuestionIds));
        $commentQuestionIds = array_values(array_unique($commentQuestionIds));

        $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $responseRatings = [];
        $latestComments = [];

        foreach ($responses as $response) {
            $answers = is_array($response->answers) ? $response->answers : [];
            $ratings = [];
            foreach ($ratingQuestionIds as $qid) {
                $v = $answers[$qid] ?? null;
                if ($v === null || $v === '') continue;
                $n = (int)$v;
                if ($n >= 1 && $n <= 5) {
                    $ratings[] = $n;
                    $ratingCounts[$n] += 1;
                }
            }

            $responseRating = null;
            if (count($ratings) > 0) {
                $responseRating = array_sum($ratings) / count($ratings);
                $responseRatings[] = $responseRating;
            }

            foreach ($commentQuestionIds as $qid) {
                $v = $answers[$qid] ?? null;
                if (!is_string($v) || trim($v) === '') continue;

                $sentiment = 'neutral';
                if ($responseRating !== null) {
                    if ($responseRating >= 4) $sentiment = 'positive';
                    elseif ($responseRating <= 2) $sentiment = 'negative';
                }

                $latestComments[] = [
                    'student' => $response->student ? (string)($response->student->name ?? $response->student->student_id ?? 'Student') : 'Student',
                    'rating' => $responseRating !== null ? round($responseRating, 2) : null,
                    'sentiment' => $sentiment,
                    'comment' => $v,
                    'submitted_at' => optional($response->submitted_at)->toISOString(),
                ];
            }
        }

        $totalResponses = $responses->count();
        $uniqueSubmitters = $responses->pluck('student_id')->unique()->count();
        $eligibleAttendanceCount = $event ? EvaluationEligibilityService::eligibleAttendeeCount($event) : 0;
        $responseRate = null;
        if ($eligibleAttendanceCount > 0) {
            $responseRate = round(($uniqueSubmitters / $eligibleAttendanceCount) * 100, 2);
        }

        $avgRating = null;
        if (count($responseRatings) > 0) {
            $avgRating = round(array_sum($responseRatings) / count($responseRatings), 2);
        }

        $sentimentCounts = ['positive' => 0, 'neutral' => 0, 'negative' => 0];
        foreach ($latestComments as $c) $sentimentCounts[$c['sentiment']] += 1;

        $latestComments = array_slice($latestComments, 0, 10);

        $programStats = $event ? EvaluationEligibilityService::programCompletionStats($event, $evaluation) : [];
        $primaryEvaluation = $evaluation;

        $eventOption = $event ? [
            'id' => $event->id,
            'name' => $event->event_name,
            'date' => optional($event->event_date)->format('Y-m-d'),
            'time' => $event->event_time,
        ] : null;

        return Inertia::render('admin-dashboard/evaluation/metrics', [
            'event' => $eventOption,
            'programStats' => $programStats,
            'completionThreshold' => ProgramEvaluationApproval::COMPLETION_THRESHOLD,
            'primaryEvaluation' => $this->formatEvaluation($primaryEvaluation),
            'evaluationStats' => [
                'totalResponses' => $totalResponses,
                'uniqueSubmitters' => $uniqueSubmitters,
                'attendanceCount' => $eligibleAttendanceCount,
                'responseRate' => $responseRate,
                'averageRating' => $avgRating,
                'ratingSummary' => [
                    ['label' => '1★', 'value' => $ratingCounts[1]],
                    ['label' => '2★', 'value' => $ratingCounts[2]],
                    ['label' => '3★', 'value' => $ratingCounts[3]],
                    ['label' => '4★', 'value' => $ratingCounts[4]],
                    ['label' => '5★', 'value' => $ratingCounts[5]],
                ],
                'sentiments' => $sentimentCounts,
                'latestComments' => $latestComments,
            ],
            'breadcrumbs' => [
                ['name' => 'Admin Dashboard', 'href' => route('admin.dashboard')],
                ['name' => 'Evaluations', 'href' => route('admin.evaluation')],
                ['name' => 'Metrics', 'href' => route('admin.evaluation.metrics', $evaluation)],
            ],
        ]);
    }

    public function index(): Response
    {
        $selectedEventId = request()->query('event_id');
        $selectedEventId = is_numeric($selectedEventId) ? (int) $selectedEventId : null;

        $evaluations = Evaluation::query()
            ->where('is_archived', false)
            ->orderByDesc('id')
            ->get();

        $completedEvents = Event::query()
            ->whereNull('archived_at')
            ->orderByDesc('event_date')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (Event $event) => EvaluationEligibilityService::eventIsCompleted($event))
            ->values();

        $events = $completedEvents
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->event_name,
                    'date' => optional($event->event_date)->format('Y-m-d'),
                    'time' => $event->event_time,
                    'courses' => is_array($event->courses) ? $event->courses : [],
                    'year_levels' => is_array($event->year_levels) ? $event->year_levels : [],
                    'status' => Event::deriveLifecycleStatusFromDate($event->event_date),
                ];
            })
            ->all();

        if (empty($selectedEventId) && count($events) > 0) {
            $selectedEventId = (int) $events[0]['id'];
        }

        $eligibleAttendanceCount = 0;
        $selectedEvent = null;
        if (! empty($selectedEventId)) {
            /** @var Event $selectedEvent */
        $selectedEvent = $completedEvents->firstWhere('id', $selectedEventId);
            if ($selectedEvent) {
                $eligibleAttendanceCount = EvaluationEligibilityService::eligibleAttendeeCount($selectedEvent);
            }
        }

        $evaluationIds = $evaluations
            ->when(! empty($selectedEventId), function ($c) use ($selectedEventId) {
                return $c->where('event_id', $selectedEventId);
            })
            ->pluck('id')
            ->values();

        $responses = collect();
        if ($evaluationIds->count() > 0) {
            $responses = EvaluationResponse::query()
                ->whereIn('evaluation_id', $evaluationIds)
                ->with(['student:id,name,student_id', 'evaluation:id,form_data'])
                ->orderByDesc('submitted_at')
                ->get();
        }

        $ratingQuestionIds = [];
        $commentQuestionIds = [];
        $statsEvaluations = $evaluations;
        if (! empty($selectedEventId)) {
            $statsEvaluations = $statsEvaluations->where('event_id', $selectedEventId);
        }

        foreach ($statsEvaluations as $evaluation) {
            $qs = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
            if (! is_array($qs)) {
                continue;
            }
            foreach ($qs as $q) {
                if (! is_array($q)) {
                    continue;
                }
                $qid = $q['id'] ?? null;
                $type = $q['type'] ?? null;
                if (! $qid || ! $type) {
                    continue;
                }
                if ($type === 'rating') {
                    $ratingQuestionIds[] = (string) $qid;
                }
                if ($type === 'short_text' || $type === 'long_text') {
                    $commentQuestionIds[] = (string) $qid;
                }
            }
        }
        $ratingQuestionIds = array_values(array_unique($ratingQuestionIds));
        $commentQuestionIds = array_values(array_unique($commentQuestionIds));

        $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $responseRatings = [];
        $latestComments = [];

        foreach ($responses as $response) {
            $answers = is_array($response->answers) ? $response->answers : [];
            $ratings = [];
            foreach ($ratingQuestionIds as $qid) {
                $v = $answers[$qid] ?? null;
                if ($v === null || $v === '') {
                    continue;
                }
                $n = (int) $v;
                if ($n >= 1 && $n <= 5) {
                    $ratings[] = $n;
                    $ratingCounts[$n] += 1;
                }
            }

            $responseRating = null;
            if (count($ratings) > 0) {
                $responseRating = array_sum($ratings) / count($ratings);
                $responseRatings[] = $responseRating;
            }

            foreach ($commentQuestionIds as $qid) {
                $v = $answers[$qid] ?? null;
                if (! is_string($v) || trim($v) === '') {
                    continue;
                }

                $sentiment = 'neutral';
                if ($responseRating !== null) {
                    if ($responseRating >= 4) {
                        $sentiment = 'positive';
                    } elseif ($responseRating <= 2) {
                        $sentiment = 'negative';
                    }
                }

                $latestComments[] = [
                    'student' => $response->student ? (
                        (string) ($response->student->name ?? $response->student->student_id ?? 'Student')
                    ) : 'Student',
                    'rating' => $responseRating !== null ? round($responseRating, 2) : null,
                    'sentiment' => $sentiment,
                    'comment' => $v,
                    'submitted_at' => optional($response->submitted_at)->toISOString(),
                ];
            }
        }

        $totalResponses = $responses->count();
        $uniqueSubmitters = $responses->pluck('student_id')->unique()->count();
        $responseRate = null;
        if ($eligibleAttendanceCount > 0) {
            $responseRate = round(($uniqueSubmitters / $eligibleAttendanceCount) * 100, 2);
        }

        $avgRating = null;
        if (count($responseRatings) > 0) {
            $avgRating = round(array_sum($responseRatings) / count($responseRatings), 2);
        }

        $sentimentCounts = ['positive' => 0, 'neutral' => 0, 'negative' => 0];
        foreach ($latestComments as $c) {
            $sentimentCounts[$c['sentiment']] += 1;
        }

        $latestComments = array_slice($latestComments, 0, 10);

        $primaryEvaluation = $statsEvaluations->sortByDesc('id')->first();
        $programStats = [];
        if ($selectedEvent && $primaryEvaluation) {
            $programStats = EvaluationEligibilityService::programCompletionStats($selectedEvent, $primaryEvaluation);
        }

        return Inertia::render('admin-dashboard/evaluation/index', [
            'evaluations' => $evaluations->map(fn ($e) => $this->formatEvaluation($e)),
            'events' => $events,
            'selectedEventId' => $selectedEventId,
            'programStats' => $programStats,
            'completionThreshold' => ProgramEvaluationApproval::COMPLETION_THRESHOLD,
            'evaluationStats' => [
                'totalResponses' => $totalResponses,
                'uniqueSubmitters' => $uniqueSubmitters,
                'attendanceCount' => $eligibleAttendanceCount,
                'responseRate' => $responseRate,
                'averageRating' => $avgRating,
                'ratingSummary' => [
                    ['label' => '1★', 'value' => $ratingCounts[1]],
                    ['label' => '2★', 'value' => $ratingCounts[2]],
                    ['label' => '3★', 'value' => $ratingCounts[3]],
                    ['label' => '4★', 'value' => $ratingCounts[4]],
                    ['label' => '5★', 'value' => $ratingCounts[5]],
                ],
                'sentiments' => $sentimentCounts,
                'latestComments' => $latestComments,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'eventId' => 'required|integer|exists:events,id',
            'form_data' => 'required|array',
        ]);

        $event = Event::query()->find($validated['eventId']);
        if (! $event) {
            return redirect()->back()->with('error', 'Event not found.');
        }

        if (! EvaluationEligibilityService::eventIsCompleted($event)) {
            return redirect()->back()->with('error', 'Evaluations can only be created for completed events (event date must be in the past).');
        }

        $evaluation = Evaluation::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'event_id' => (int) $validated['eventId'],
            'event' => trim(implode(' • ', array_filter([
                $event->event_name,
                optional($event->event_date)->format('Y-m-d'),
            ]))),
            'form_data' => $validated['form_data'] ?? [],
            'is_active' => false,
            'published_at' => null,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Draft Created',
                "Created evaluation draft #{$evaluation->id} for event #{$event->id}",
                request(),
                ['is_active' => null, 'published_at' => null],
                ['is_active' => false, 'published_at' => null]
            );
        }

        return redirect()->back()->with('success', 'Evaluation form saved as draft. Publish it when ready for students.');
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'eventId' => 'required|integer|exists:events,id',
            'form_data' => 'required|array',
        ]);

        $event = Event::query()->find($validated['eventId']);
        if (! $event) {
            return redirect()->back()->with('error', 'Event not found.');
        }

        if (! EvaluationEligibilityService::eventIsCompleted($event)) {
            return redirect()->back()->with('error', 'Evaluations can only be linked to completed events.');
        }

        $evaluation->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $evaluation->description,
            'event_id' => (int) $validated['eventId'],
            'event' => trim(implode(' • ', array_filter([
                $event->event_name,
                optional($event->event_date)->format('Y-m-d'),
            ]))),
            'form_data' => $validated['form_data'] ?? [],
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Updated',
                "Updated evaluation #{$evaluation->id} for event #{$event->id}",
                request(),
                $evaluation->getOriginal(),
                $evaluation->getAttributes()
            );
        }

        return redirect()->back()->with('success', 'Evaluation form updated successfully.');
    }

    public function publish(Evaluation $evaluation): RedirectResponse
    {
        /** @var Event $event */
        $event = $evaluation->eventRecord ?? Event::query()->find($evaluation->event_id);
        if (! $event) {
            return redirect()->back()->with('error', 'Linked event not found.');
        }

        if (! EvaluationEligibilityService::eventIsCompleted($event)) {
            return redirect()->back()->with('error', 'Cannot publish: the event is not yet completed.');
        }

        $wasActive = (bool) $evaluation->is_active;

        $evaluation->update([
            'is_active' => true,
            'published_at' => $evaluation->published_at ?? now(),
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Published',
                "Published evaluation #{$evaluation->id} for event #{$event->id}",
                request(),
                ['is_active' => (bool) $evaluation->getOriginal('is_active'), 'published_at' => $evaluation->getOriginal('published_at')],
                ['is_active' => true, 'published_at' => $evaluation->published_at ?? now()->toDateTimeString()]
            );
        }

        if (! $wasActive) {
            $notified = EvaluationEligibilityService::notifyEligibleStudents($evaluation);
            return redirect()->back()->with('success', "Evaluation published. {$notified} eligible student(s) notified.");
        }

        return redirect()->back()->with('success', 'Evaluation is already published.');
    }

    public function unpublish(Evaluation $evaluation): RedirectResponse
    {
        $oldStatus = (bool) $evaluation->is_active;

        $evaluation->update([
            'is_active' => false,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Unpublished',
                "Unpublished evaluation #{$evaluation->id} (was: " . ($oldStatus ? 'published' : 'inactive') . ")"
            );
        }

        return redirect()->back()->with('success', 'Evaluation unpublished. Students can no longer submit responses.');
    }

    public function approveNextActivity(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $validated = $request->validate([
            'program' => 'required|string|max:120',
        ]);

        $event = $evaluation->eventRecord ?? Event::query()->find($evaluation->event_id);
        if (! $event) {
            return redirect()->back()->with('error', 'Linked event not found.');
        }

        $program = (string) $validated['program'];
        $row = EvaluationEligibilityService::syncProgramApprovalRow($event, $evaluation, $program);

        if (! $row->meetsThreshold()) {
            return redirect()->back()->with(
                'error',
                'At least '.ProgramEvaluationApproval::COMPLETION_THRESHOLD.'% of eligible attendees in this program must complete the evaluation before approving the next activity.',
            );
        }

        $admin = Auth::guard('admin')->user();

        $row->update([
            'approved_for_next_activity' => true,
            'approved_at' => now(),
            'approved_by_admin_id' => $admin?->id,
        ]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                $admin,
                'Evaluation',
                'Approved Next Activity',
                "Approved next activity for program '{$program}' on evaluation #{$evaluation->id} (event #{$event->id})",
                $request,
                $row->getOriginal(),
                $row->getAttributes()
            );
        }

        return redirect()->back()->with('success', "Next activity approved for program: {$program}.");
    }

    public function destroy(Evaluation $evaluation): RedirectResponse
    {
        $oldArchived = (bool) $evaluation->getOriginal('is_archived');
        $evaluation->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Deleted',
                "Archived evaluation #{$evaluation->id} for event #{$evaluation->event_id}",
                request(),
                ['is_archived' => $oldArchived],
                ['is_archived' => true]
            );
        }

        return redirect()->back()->with('success', 'Evaluation form archived successfully.');
    }

    public function archive(Evaluation $evaluation): RedirectResponse
    {
        $oldArchived = (bool) $evaluation->getOriginal('is_archived');
        $evaluation->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Archived',
                "Archived evaluation #{$evaluation->id} for event #{$evaluation->event_id}",
                request(),
                ['is_archived' => $oldArchived],
                ['is_archived' => true]
            );
        }

        return redirect()->back()->with('success', 'Evaluation form archived successfully.');
    }

    public function unarchive(Evaluation $evaluation): RedirectResponse
    {
        $oldArchived = (bool) $evaluation->getOriginal('is_archived');
        $evaluation->update(['is_archived' => false]);

        if (Schema::hasTable('activity_logs')) {
            ActivityLog::logForUser(
                Auth::guard('admin')->user(),
                'Evaluation',
                'Unarchived',
                "Unarchived evaluation #{$evaluation->id} for event #{$evaluation->event_id}",
                request(),
                ['is_archived' => $oldArchived],
                ['is_archived' => false]
            );
        }

        return redirect()->back()->with('success', 'Evaluation form restored successfully.');
    }

    public function autoGenerate(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,docx,xlsx,xls|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $fullPath = $file->getRealPath();

        try {
            $parsedData = EvaluationAutoGeneratorService::extractQuestionsFromFile($fullPath, $extension);
            return response()->json($parsedData);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to parse file: ' . $e->getMessage()
            ], 422);
        }
    }

    private function formatEvaluation(Evaluation $evaluation): array
    {
        return [
            'id' => $evaluation->id,
            'name' => $evaluation->name,
            'description' => $evaluation->description,
            'event' => $evaluation->event,
            'event_id' => $evaluation->event_id,
            'form_data' => $evaluation->form_data ?? [],
            'is_active' => (bool) $evaluation->is_active,
            'is_archived' => (bool) $evaluation->is_archived,
            'published_at' => optional($evaluation->published_at)->toISOString(),
            'created_at' => $evaluation->created_at,
            'updated_at' => $evaluation->updated_at,
        ];
    }
}
