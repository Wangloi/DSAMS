<?php

namespace Database\Seeders;

use App\Models\AdmissionSlip;
use App\Models\AdminUser;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Event;
use App\Models\FoundItem;
use App\Models\Incident;
use App\Models\LostReport;
use App\Models\Student;
use App\Notifications\AdmissionSlipStatusUpdated;
use App\Notifications\EvaluationAvailable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CapstoneDefenseDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Admin (for demo login)
        if (Schema::hasTable('admin_users')) {
            AdminUser::query()->firstOrCreate(
                ['email' => 'admin.demo@dsams.test'],
                [
                    'name' => 'Demo Admin',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
        }

        // Students (for demo login)
        $students = [];

        if (Schema::hasTable('students')) {
            $students['C230203'] = Student::query()->firstOrCreate(
                ['student_id' => 'C230203'],
                [
                    'name' => 'Demo Student C230203',
                    'email' => 'c230203@dsams.test',
                    'password' => Hash::make('password'),
                    'course' => 'BSIT',
                    'year_level' => '3rd Year',
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );

            $students['C230204'] = Student::query()->firstOrCreate(
                ['student_id' => 'C230204'],
                [
                    'name' => 'Demo Student C230204',
                    'email' => 'c230204@dsams.test',
                    'password' => Hash::make('password'),
                    'course' => 'BSIT',
                    'year_level' => '2nd Year',
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );

            $students['C230205'] = Student::query()->firstOrCreate(
                ['student_id' => 'C230205'],
                [
                    'name' => 'Demo Student C230205',
                    'email' => 'c230205@dsams.test',
                    'password' => Hash::make('password'),
                    'course' => 'BSCS',
                    'year_level' => '4th Year',
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );

            // Ensure the main demo student can always log in
            $students['C230203']->forceFill([
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ])->save();
        }

        // Announcements
        if (Schema::hasTable('announcements')) {
            Announcement::query()->firstOrCreate(
                ['title' => 'Welcome to DSAMS (Demo Data)'],
                [
                    'content' => 'This announcement is part of the capstone defense demo dataset.',
                    'target_audience' => 'all',
                ]
            );

            Announcement::query()->firstOrCreate(
                ['title' => 'Reminder: Attendance is required'],
                [
                    'content' => 'Please attend your scheduled events and evaluate afterwards.',
                    'target_audience' => 'student',
                ]
            );
        }

        // Events + Attendance
        $events = [];

        if (Schema::hasTable('events')) {
            $events['upcoming'] = Event::query()->firstOrCreate(
                ['event_name' => 'Capstone Defense Orientation (Demo)'],
                [
                    'organizer' => 'College Office',
                    'location' => 'Room 101',
                    'event_date' => now()->addDays(1)->toDateString(),
                    'event_time' => '09:00:00',
                    'expected_attendees' => 50,
                    'description' => 'Orientation for capstone defense process and schedule.',
                    'status' => 'upcoming',
                    'total_attendees' => 0,
                    'present_count' => 0,
                ]
            );

            $events['ongoing'] = Event::query()->firstOrCreate(
                ['event_name' => 'Thesis Consultation Session (Demo)'],
                [
                    'organizer' => 'Faculty Panel',
                    'location' => 'Lab 2',
                    'event_date' => now()->toDateString(),
                    'event_time' => '13:30:00',
                    'expected_attendees' => 20,
                    'description' => 'Consultation session with advisers and panel.',
                    'status' => 'ongoing',
                    'total_attendees' => 0,
                    'present_count' => 0,
                ]
            );

            $events['completed'] = Event::query()->firstOrCreate(
                ['event_name' => 'Capstone Defense Day (Demo)'],
                [
                    'organizer' => 'Capstone Committee',
                    'location' => 'Main Hall',
                    'event_date' => now()->subDays(1)->toDateString(),
                    'event_time' => '10:00:00',
                    'expected_attendees' => 30,
                    'description' => 'Official capstone defense presentations.',
                    'status' => 'completed',
                    'total_attendees' => 0,
                    'present_count' => 0,
                ]
            );
        }

        if (Schema::hasTable('attendances') && !empty($events) && !empty($students)) {
            Attendance::query()->firstOrCreate(
                ['event_id' => $events['completed']->id, 'student_id' => $students['C230203']->id],
                ['status' => 'present', 'checked_in_at' => now()->subDay()]
            );

            Attendance::query()->firstOrCreate(
                ['event_id' => $events['completed']->id, 'student_id' => $students['C230204']->id],
                ['status' => 'late', 'checked_in_at' => now()->subDay()->addMinutes(20)]
            );

            Attendance::query()->firstOrCreate(
                ['event_id' => $events['ongoing']->id, 'student_id' => $students['C230203']->id],
                ['status' => 'present', 'checked_in_at' => now()->subMinutes(15)]
            );

        }

        // Evaluation (linked to completed event) + notify attendees
        if (
            Schema::hasTable('evaluations') &&
            Schema::hasTable('notifications') &&
            Schema::hasColumn('evaluations', 'event_id') &&
            !empty($events) &&
            isset($events['completed'])
        ) {
            $evaluation = Evaluation::query()->firstOrCreate(
                ['name' => 'Capstone Defense Feedback (Demo)'],
                [
                    'event_id' => $events['completed']->id,
                    'event' => trim(implode(' • ', array_filter([
                        $events['completed']->event_name,
                        optional($events['completed']->event_date)->format('Y-m-d'),
                    ]))),
                    'is_active' => true,
                    'is_archived' => false,
                    'form_data' => [
                        'questions' => [
                            [
                                'id' => 'q1',
                                'type' => 'rating',
                                'label' => 'Rate the overall capstone defense experience',
                                'required' => true,
                            ],
                            [
                                'id' => 'q2',
                                'type' => 'multiple_choice',
                                'label' => 'How clear were the evaluation criteria?',
                                'required' => true,
                                'options' => ['Very clear', 'Clear', 'Neutral', 'Unclear', 'Very unclear'],
                            ],
                            [
                                'id' => 'q3',
                                'type' => 'short_text',
                                'label' => 'What should we improve next time?',
                                'required' => false,
                            ],
                            [
                                'id' => 'q4',
                                'type' => 'long_text',
                                'label' => 'Additional comments',
                                'required' => false,
                            ],
                        ],
                    ],
                ]
            );

            if (!empty($students)) {
                foreach (['C230203', 'C230204'] as $sid) {
                    if (isset($students[$sid])) {
                        $students[$sid]->notify(new EvaluationAvailable($evaluation));
                    }
                }
            }
        }

        // Incidents / Violations
        if (Schema::hasTable('incidents')) {
            Incident::query()->firstOrCreate(
                [
                    'incident_type' => 'Dress Code Violation',
                    'incident_date' => now()->subDays(3)->toDateString(),
                    'incident_time' => '08:15:00',
                    'location' => 'Gate 1',
                ],
                [
                    'students_involved' => !empty($students) && isset($students['C230204'])
                        ? [$students['C230204']->name]
                        : ['Demo Student'],
                    'description' => 'Student was reminded about the proper uniform policy.',
                    'classification' => 'Minor',
                    'status' => 'Resolved',
                    'is_archived' => false,
                ]
            );

            Incident::query()->firstOrCreate(
                [
                    'incident_type' => 'Class Disruption',
                    'incident_date' => now()->subDays(2)->toDateString(),
                    'incident_time' => '10:30:00',
                    'location' => 'Room 205',
                ],
                [
                    'students_involved' => !empty($students) && isset($students['C230203'])
                        ? [$students['C230203']->name]
                        : ['Demo Student'],
                    'description' => 'Incident recorded for demo purposes. No real violation.',
                    'classification' => 'Minor',
                    'status' => 'Pending',
                    'is_archived' => false,
                ]
            );
        }

        // Admission Slips
        if (Schema::hasTable('admission_slips')) {
            $demoStudent = $students['C230203'] ?? null;

            $slip1 = AdmissionSlip::query()->firstOrCreate(
                ['id' => 1],
                [
                    'student_id' => $demoStudent?->id,
                    'student_name' => $demoStudent?->name ?? 'Demo Student',
                    'program_year_level' => ($demoStudent?->course ?? 'BSIT') . ' - ' . ($demoStudent?->year_level ?? '3rd Year'),
                    'date_issued' => now()->toDateString(),
                    'case_text' => 'Late Submission (Demo)',
                    'reason_text' => 'Requested admission slip for demo testing.',
                    'valid_until' => now()->addDays(2)->toDateString(),
                    'status' => 'PENDING',
                    'is_archived' => false,
                ]
            );

            $slip2 = AdmissionSlip::query()->firstOrCreate(
                ['id' => 2],
                [
                    'student_id' => $demoStudent?->id,
                    'student_name' => $demoStudent?->name ?? 'Demo Student',
                    'program_year_level' => ($demoStudent?->course ?? 'BSIT') . ' - ' . ($demoStudent?->year_level ?? '3rd Year'),
                    'date_issued' => now()->subDays(1)->toDateString(),
                    'case_text' => 'Missed Class (Demo)',
                    'reason_text' => 'Approved example for demo testing.',
                    'valid_until' => now()->addDays(1)->toDateString(),
                    'status' => 'APPROVED',
                    'is_archived' => false,
                ]
            );

            $slip3 = AdmissionSlip::query()->firstOrCreate(
                ['id' => 3],
                [
                    'student_id' => $demoStudent?->id,
                    'student_name' => $demoStudent?->name ?? 'Demo Student',
                    'program_year_level' => ($demoStudent?->course ?? 'BSIT') . ' - ' . ($demoStudent?->year_level ?? '3rd Year'),
                    'date_issued' => now()->subDays(2)->toDateString(),
                    'case_text' => 'No ID Presented (Demo)',
                    'reason_text' => 'Rejected example for demo testing.',
                    'valid_until' => now()->toDateString(),
                    'status' => 'REJECTED',
                    'is_archived' => false,
                ]
            );

            if (Schema::hasTable('notifications') && $demoStudent) {
                $demoStudent->notify(new AdmissionSlipStatusUpdated($slip2));
                $demoStudent->notify(new AdmissionSlipStatusUpdated($slip3));
            }

            unset($slip1, $slip2, $slip3);
        }

        // Lost & Found
        if (Schema::hasTable('lost_reports')) {
            $studentIdentifier = !empty($students) && isset($students['C230203'])
                ? (string) $students['C230203']->student_id
                : 'C230203';

            LostReport::query()->firstOrCreate(
                [
                    'student_identifier' => $studentIdentifier,
                    'item_description' => 'USB Flash Drive (Black, 32GB) (Demo)',
                    'date_lost' => now()->subDays(5)->toDateString(),
                    'last_seen_location' => 'Library',
                ],
                [
                    'time_lost' => '15:10:00',
                    'contact_info' => '09XX-XXX-XXXX',
                    'image_path' => null,
                    'status' => 'Pending',
                ]
            );
        }

        if (Schema::hasTable('found_items')) {
            FoundItem::query()->firstOrCreate(
                [
                    'date_found' => now()->subDays(4)->toDateString(),
                    'time_found' => '11:05:00',
                    'item_description' => 'Water Bottle (Blue) (Demo)',
                    'place_found' => 'Canteen',
                ],
                [
                    'finder_name' => 'Security Guard',
                    'contact_info' => 'Office Desk',
                    'program' => '—',
                    'year_level' => '—',
                    'image_path' => null,
                    'status' => 'In Storage',
                    'is_archived' => false,
                ]
            );

            FoundItem::query()->firstOrCreate(
                [
                    'date_found' => now()->subDays(2)->toDateString(),
                    'time_found' => '09:40:00',
                    'item_description' => 'Student ID Card (Demo)',
                    'place_found' => 'Room 205',
                ],
                [
                    'finder_name' => 'Demo Student',
                    'contact_info' => null,
                    'program' => 'BSIT',
                    'year_level' => '3rd Year',
                    'image_path' => null,
                    'status' => 'Verification Pending',
                    'is_archived' => false,
                ]
            );
        }

        // Ensure counts look correct (best-effort)
        if (!empty($events)) {
            foreach ($events as $event) {
                if (method_exists($event, 'updateAttendanceCounts')) {
                    try {
                        $event->updateAttendanceCounts();
                    } catch (\Throwable $e) {
                        // ignore for demo seeding
                    }
                }
            }
        }

        unset($events);
        unset($students);

        // Make sure Str is referenced so the import doesn't get optimized away in some setups.
        // (No functional impact.)
        Str::of('demo');
    }
}
