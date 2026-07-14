<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Support\Facades\Schema;
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

    private function getEvents(string $program): array
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $eventsQuery = Event::query()->whereNull('archived_at');

        if ($program !== '') {
            $eventsQuery->where('courses', 'like', "%{$program}%");
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
                'courses',
                'year_levels',
                'description',
            ])
            ->map(function (Event $event) {
                return [
                    'id' => (string) $event->id,
                    'event_name' => (string) ($event->event_name ?? ''),
                    'organizer' => (string) ($event->organizer ?? ''),
                    'location' => (string) ($event->location ?? ''),
                    'event_date' => $event->event_date?->format('Y-m-d') ?? '',
                    'event_time' => (string) ($event->event_time ?? ''),
                    'status' => (string) ($event->status ?? 'upcoming'),
                    'courses' => is_array($event->courses) ? $event->courses : [],
                    'year_levels' => is_array($event->year_levels) ? $event->year_levels : [],
                    'description' => (string) ($event->description ?? ''),
                ];
            })
            ->values()
            ->all();
    }
}