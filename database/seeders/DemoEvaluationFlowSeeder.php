<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Event;
use App\Models\Student;
use App\Notifications\EvaluationAvailable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoEvaluationFlowSeeder extends Seeder
{
    public function run(): void
    {
        $targetStudentId = env('DEMO_EVAL_STUDENT_ID', 'C230203');

        $student = Student::query()->where('student_id', $targetStudentId)->first();

        if (!$student) {
            $student = Student::query()->create([
                'name' => 'Demo Student',
                'email' => strtolower($targetStudentId) . '@dsams.test',
                'password' => Hash::make('password'),
                'student_id' => $targetStudentId,
                'course' => 'BSIT',
                'year_level' => '1st Year',
                'email_verified_at' => now(),
            ]);
        } else {
            $student->forceFill([
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ])->save();
        }

        if (Schema::hasTable('announcements')) {
            Announcement::query()->firstOrCreate(
                ['title' => 'Demo Announcement (Evaluation Test)'],
                [
                    'content' => 'This is a demo announcement created by DemoEvaluationFlowSeeder for testing the evaluation feature.',
                    'target_audience' => 'student',
                ]
            );
        }

        $event = Event::query()->firstOrCreate(
            ['event_name' => 'Demo Event (Evaluation Test)'],
            [
                'organizer' => 'DSAMS Demo',
                'location' => 'Main Hall',
                'event_date' => now()->toDateString(),
                'event_time' => now()->format('H:i:s'),
                'expected_attendees' => 1,
                'description' => 'Demo event created for testing attendance + evaluation flow.',
                'status' => 'completed',
                'total_attendees' => 0,
                'present_count' => 0,
            ]
        );

        Attendance::query()->firstOrCreate(
            ['event_id' => $event->id, 'student_id' => $student->id],
            [
                'status' => 'present',
                'checked_in_at' => now(),


            ]
        );

        if (Schema::hasColumn('evaluations', 'event_id')) {
            $evaluation = Evaluation::query()->firstOrCreate(
                ['name' => 'Demo Evaluation (Evaluation Test)'],
                [
                    'event_id' => $event->id,
                    'event' => trim(implode(' • ', array_filter([
                        $event->event_name,
                        optional($event->event_date)->format('Y-m-d'),
                    ]))),
                    'is_active' => true,
                    'is_archived' => false,
                    'form_data' => [
                        'questions' => [
                            [
                                'id' => 'q_rating',
                                'type' => 'rating',
                                'label' => 'Rate the event overall',
                                'required' => true,
                            ],
                            [
                                'id' => 'q_mc',
                                'type' => 'multiple_choice',
                                'label' => 'Which part did you like most?',
                                'required' => true,
                                'options' => ['Speaker', 'Venue', 'Activities', 'Food'],
                            ],
                            [
                                'id' => 'q_short',
                                'type' => 'short_text',
                                'label' => 'One suggestion to improve',
                                'required' => false,
                            ],
                            [
                                'id' => 'q_long',
                                'type' => 'long_text',
                                'label' => 'Other comments',
                                'required' => false,
                            ],
                        ],
                    ],
                ]
            );

            $student->notify(new EvaluationAvailable($evaluation));
        }
    }
}
