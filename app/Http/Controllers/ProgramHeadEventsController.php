<?php

namespace App\Http\Controllers;

use App\Models\AdminUser;
use App\Models\Event;
use App\Notifications\ActivityPlanSubmittedAdmin;
use Illuminate\Http\Request;
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

        $events = $this->getEvents($program);

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
            'activity_plan' => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg', 'max:10240'],
        ]);

        // Check for schedule conflict at venue/time
        $conflict = Event::findScheduleConflict($validated['event_date'], $validated['location'], $validated['event_time']);
        if ($conflict) {
            return redirect()->back()->withErrors([
                'location' => "Schedule Conflict! Venue '{$validated['location']}' is already booked on {$validated['event_date']} at {$conflict->event_time} for '{$conflict->event_name}'."
            ])->with('error', "Schedule Conflict Detected! Venue '{$validated['location']}' is already booked on {$validated['event_date']} at {$conflict->event_time} for '{$conflict->event_name}'.");
        }

        $activityPlanPath = null;
        if ($request->hasFile('activity_plan')) {
            $activityPlanPath = $request->file('activity_plan')->store('activity_plans', 'public');
        }

        $organizer = !empty($validated['organizer'])
            ? $validated['organizer']
            : ($program !== '' ? "{$program} Department" : ($programHead->name ?? 'Program Head'));

        $courses = !empty($validated['courses'])
            ? $validated['courses']
            : ($program !== '' ? [$program] : ['All']);

        $requesterLabel = ($programHead->name ?? 'Program Head') . ($program !== '' ? " ({$program})" : '');

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
        ];

        $event = Event::create($eventData);

        // Notify all Admin users about the activity plan schedule request
        if (Schema::hasTable('admin_users')) {
            $admins = AdminUser::all();
            if ($admins->isNotEmpty()) {
                Notification::send($admins, new ActivityPlanSubmittedAdmin($event, $requesterLabel));
            }
        }

        return redirect()->back()->with('success', 'Activity plan schedule request submitted successfully! Pending administrator approval.');
    }

    private function getEvents(string $program): array
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $eventsQuery = Event::query()->whereNull('archived_at');

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
                    'event_date' => $event->event_date?->format('Y-m-d') ?? '',
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