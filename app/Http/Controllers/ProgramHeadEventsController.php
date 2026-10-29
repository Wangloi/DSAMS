<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Models\Event;
use App\Notifications\ActivityPlanSubmittedAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProgramHeadEventsController extends Controller
{
    public function index()
    {
        $programHead = auth()->guard('program_head')->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        $events = $this->getEvents($program, $programHead?->id ? (int) $programHead->id : null);

        return Inertia::render('program-head/CalendarEvents', [
            'events' => $events,
            'program' => $program,
        ]);
    }

    public function store(Request $request)
    {
        $programHead = auth()->guard('program_head')->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        $validated = $request->validate([
            'event_name' => ['required', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'event_time' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'courses' => ['nullable', 'array'],
            'year_levels' => ['nullable', 'array'],
            'activity_plan' => ['nullable', 'file', 'extensions:pdf,doc,docx,png,jpg,jpeg', 'max:20480'],
        ]);

        // Check for schedule conflict at venue/time
        $conflict = Event::findScheduleConflict(
            $validated['event_date'],
            $validated['location'],
            $validated['event_time']
        );
        // Venue sharing notice: Concurrent events are permitted at the same venue for attendance tracking.
        if ($conflict) {
            \Illuminate\Support\Facades\Log::info("Program head event '{$validated['event_name']}' sharing venue '{$validated['location']}' with concurrent event '{$conflict->event_name}' on {$validated['event_date']}.");
        }

        try {
            $activityPlanPath = null;
            if ($request->hasFile('activity_plan')) {
                $activityPlanPath = $request->file('activity_plan')->store('activity_plans', 'public');
            }

            $office = is_object($programHead) ? (string) ($programHead->office ?? '') : '';
            $organizer = !empty($validated['organizer'])
                ? $validated['organizer']
                : ($office !== ''
                    ? $office
                    : (strtoupper($program) === 'ALL'
                        ? 'Campus Administration'
                        : ($program !== '' ? "{$program} Department" : ($programHead->name ?? 'Personnel'))));

            $courses = !empty($validated['courses'])
                ? $validated['courses']
                : (strtoupper($program) === 'ALL' || $program === '' ? ['All'] : [$program]);

            $requesterLabel = ($programHead->name ?? 'Personnel') . ($office !== '' ? " ({$office})" : ($program !== '' ? " ({$program})" : ''));

            $eventData = [
                'event_name' => $validated['event_name'],
                'organizer' => $organizer,
                'location' => $validated['location'],
                'event_date' => $validated['event_date'],
                'event_time' => $validated['event_time'],
                'description' => $validated['description'] ?? '',
                'courses' => $courses,
                'year_levels' => $validated['year_levels'] ?? ['1st Year', '2nd Year', '3rd Year', '4th Year'],
                'approval_status' => 'pending',
                'activity_plan_path' => $activityPlanPath,
                'requested_by' => $requesterLabel,
                'created_by_program_head_id' => $programHead?->id ?? Event::currentProgramHeadId(),
            ];

            $event = Event::create($eventData);

            // Notify all Admin users safely
            if (Schema::hasTable('admin_users')) {
                try {
                    $admins = AdminUser::all();
                    if ($admins->isNotEmpty()) {
                        Notification::send($admins, new ActivityPlanSubmittedAdmin($event, $requesterLabel));
                    }
                } catch (\Throwable $notifErr) {
                    \Illuminate\Support\Facades\Log::warning('Activity plan admin notification failed: ' . $notifErr->getMessage());
                }
            }

            return redirect()->back()->with('success', 'Activity plan schedule request submitted successfully! Pending administrator approval.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('ProgramHeadEventsController::store failed: ' . $e->getMessage());
            return redirect()->back()->withErrors([
                'event_name' => 'Failed to submit request: ' . $e->getMessage(),
            ])->with('error', 'Failed to submit request: ' . $e->getMessage());
        }
    }

    private function getEvents(string $program, ?int $programHeadId = null): array
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $eventsQuery = Event::query()->whereNull('archived_at');
        if ($programHeadId !== null && Event::supportsCreatorTracking()) {
            $eventsQuery->createdByProgramHead($programHeadId);
        }

        return $eventsQuery
            ->orderBy('event_date')
            ->orderBy('event_time')
            ->get([
                'id',
                'event_name',
                'organizer',
                'location',
                'event_date',
                'event_time',
                'status',
                'approval_status',
                'activity_plan_path',
                'requested_by',
                'rejection_reason',
                'courses',
                'year_levels',
                'description',
            ])
            ->map(function (Event $event) {
                $lifecycleStatus = Event::deriveLifecycleStatusFromDate($event->event_date);

                return [
                    'id' => (string) $event->id,
                    'event_name' => (string) ($event->event_name ?? ''),
                    'organizer' => (string) ($event->organizer ?? ''),
                    'location' => (string) ($event->location ?? ''),
                    'event_date' => $event->event_date ? Carbon::parse($event->event_date)->format('Y-m-d') : '',
                    'event_time' => (string) ($event->event_time ?? ''),
                    'status' => $lifecycleStatus,
                    'approval_status' => (string) ($event->approval_status ?? 'approved'),
                    'activity_plan_path' => $event->activity_plan_path ? Storage::url($event->activity_plan_path) : null,
                    'requested_by' => (string) ($event->requested_by ?? ''),
                    'rejection_reason' => (string) ($event->rejection_reason ?? ''),
                    'courses' => is_array($event->courses) ? $event->courses : [],
                    'year_levels' => is_array($event->year_levels) ? $event->year_levels : [],
                    'description' => (string) ($event->description ?? ''),
                ];
            })
            ->values()
            ->all();
    }
}