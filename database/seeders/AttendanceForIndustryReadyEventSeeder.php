<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\Student;
use App\Models\Attendance;
use Carbon\Carbon;

class AttendanceForIndustryReadyEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find the event by name
        $event = Event::where('event_name', 'Industry-Ready Frontend Web Development Seminar Workshop')->first();
        if (! $event) {
            $this->command->error('Event not found.');
            return;
        }

        // Determine eligible courses and year levels from the event (assumes columns courses and year_levels exist)
        $courses = $event->courses ?? [];
        $yearLevels = $event->year_levels ?? [];


        // Build a query for eligible students
        $studentQuery = Student::query();
        if (! empty($courses)) {
            $studentQuery->whereIn('course', $courses);
        }
        if (! empty($yearLevels)) {
            $studentQuery->whereIn('year_level', $yearLevels);
        }


        // Get up to 20 random students
        $students = $studentQuery->inRandomOrder()->limit(20)->get();
        if ($students->isEmpty()) {
            $this->command->error('No eligible students found for the event.');
            return;
        }


        foreach ($students as $student) {

            // Generate realistic check‑in and check‑out times on the event date
            $eventDate = Carbon::parse($event->event_date);
            $checkIn = $eventDate->copy()->addHours(rand(8, 10))->addMinutes(rand(0, 59));
            $checkOut = $checkIn->copy()->addHours(rand(1, 3))->addMinutes(rand(0, 59));

            Attendance::create([
                'event_id' => $event->id,
                'student_id' => $student->id,
                'status' => 'present', // attendance_status
                'checked_in_at' => $checkIn, // time_in
                'checked_out_at' => $checkOut, // time_out
                // optional fields for description
                'location' => 'Main Hall',
            ]);

        }

        $this->command->info('Created attendance records for '.count($students).' students.');
    }
}
