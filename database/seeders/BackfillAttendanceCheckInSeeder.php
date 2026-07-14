<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Attendance;
use App\Models\Event;

class BackfillAttendanceCheckInSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all attendance records missing a check‑in time
        $attendances = Attendance::whereNull('checked_in_at')->get();

        foreach ($attendances as $attendance) {
            // Load the related event to use its date and time as a base
            $event = Event::find($attendance->event_id);
            if (! $event) {
                $this->command->error("Event ID {$attendance->event_id} not found for attendance ID {$attendance->id}");
                continue;
            }

            // Build a base datetime from the event_date and event_time
            $eventDateTime = Carbon::parse($event->event_date . ' ' . $event->event_time);

            // Generate a realistic check‑in time within the event window (e.g., +0‑2 hours)
            $checkIn = $eventDateTime->copy()->addHours(rand(0, 2))->addMinutes(rand(0, 59));
            // Generate a check‑out time 1‑3 hours after check‑in
            $checkOut = $checkIn->copy()->addHours(rand(1, 3))->addMinutes(rand(0, 59));

            // Update the attendance record
            $attendance->checked_in_at = $checkIn;
            $attendance->checked_out_at = $checkOut;
            $attendance->status = 'present'; // ensure status reflects a valid attendance
            $attendance->save();
        }

        $this->command->info('Backfilled checked_in_at and checked_out_at for ' . $attendances->count() . ' attendance records.');
    }
}
