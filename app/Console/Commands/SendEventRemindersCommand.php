<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Services\StudentNotificationDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendEventRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:send-reminders {--event= : Specific event ID to send reminder for} {--timeframe= : Force timeframe (today|tomorrow|soon)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send upcoming and same-day event reminder notifications to eligible students';

    /**
     * Execute the console command.
     */
    public function handle(StudentNotificationDispatcher $dispatcher): int
    {
        $specificEventId = $this->option('event');
        $forcedTimeframe = $this->option('timeframe');

        if ($specificEventId) {
            $event = Event::query()->find($specificEventId);
            if (!$event) {
                $this->error("Event with ID {$specificEventId} not found.");
                return self::FAILURE;
            }

            if ($event->archived_at !== null) {
                $this->warn("Event #{$event->id} is archived. Skipping.");
                return self::SUCCESS;
            }

            $timeframe = $forcedTimeframe ?? ($this->determineTimeframe($event));
            $dispatcher->eventReminder($event, $timeframe);
            $this->info("Dispatched '{$timeframe}' reminder for event #{$event->id} ({$event->event_name}).");
            return self::SUCCESS;
        }

        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        // Query active, unarchived, non-completed events happening today or tomorrow
        $events = Event::query()
            ->whereNull('archived_at')
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', '!=', 'completed');
            })
            ->where(function ($query) use ($today, $tomorrow) {
                $query->whereDate('event_date', $today)
                    ->orWhereDate('event_date', $tomorrow);
            })
            ->get();

        if ($events->isEmpty()) {
            $this->info('No upcoming events today or tomorrow requiring reminders.');
            return self::SUCCESS;
        }

        $count = 0;
        foreach ($events as $event) {
            $timeframe = $this->determineTimeframe($event);
            $dispatcher->eventReminder($event, $timeframe);
            $this->line("Sent {$timeframe} reminder for: {$event->event_name} (ID: {$event->id})");
            $count++;
        }

        $this->info("Successfully processed event reminders for {$count} event(s).");
        Log::info("[SendEventRemindersCommand] Processed reminders for {$count} events.");

        return self::SUCCESS;
    }

    private function determineTimeframe(Event $event): string
    {
        if (!$event->event_date) {
            return 'today';
        }

        $eventDate = Carbon::parse($event->event_date)->startOfDay();
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        if ($eventDate->equalTo($today)) {
            return 'today';
        }

        if ($eventDate->equalTo($tomorrow)) {
            return 'tomorrow';
        }

        if ($eventDate->isFuture()) {
            return 'soon';
        }

        return 'today';
    }
}
