<?php

namespace Database\Seeders;

use App\Models\Incident;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class IncidentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('incidents')) {
            return;
        }

        $students = Student::all();
        $studentNames = $students->pluck('name')->toArray();
        if (empty($studentNames)) {
            $studentNames = ['Dionne S. De Grano', 'Vinn S. Dela Torre', 'Melannie C. Delatado', 'Micaela D. Diamat', 'Yohann Jeym F. Dimacuha'];
        }

        $incidents = [
            [
                'incident_type' => 'Minor Offense',
                'incident_date' => '2026-03-14',
                'incident_time' => '20:24:00',
                'location' => 'Gate 1',
                'students_involved' => [$studentNames[0] ?? 'Dionne S. De Grano'],
                'description' => 'Student was not wearing proper ID upon entry.',
                'classification' => 'Minor',
                'status' => 'Resolved',
            ],
            [
                'incident_type' => 'Smoking inside campus',
                'incident_date' => '2026-03-15',
                'incident_time' => '10:15:00',
                'location' => 'Parking Lot B',
                'students_involved' => [$studentNames[1] ?? 'Vinn S. Dela Torre'],
                'description' => 'Caught smoking in a non-smoking area.',
                'classification' => 'Major',
                'status' => 'Pending',
            ],
            [
                'incident_type' => 'Dress Code Violation',
                'incident_date' => '2026-03-16',
                'incident_time' => '09:00:00',
                'location' => 'Main Building Corridor',
                'students_involved' => [$studentNames[2] ?? 'Melannie C. Delatado'],
                'description' => 'Wearing attire not in accordance with the university dress code.',
                'classification' => 'Minor',
                'status' => 'Ongoing',
            ],
            [
                'incident_type' => 'Incomplete Uniform',
                'incident_date' => '2026-03-17',
                'incident_time' => '14:30:00',
                'location' => 'Gymnasium',
                'students_involved' => [$studentNames[3] ?? 'Micaela D. Diamat'],
                'description' => 'Attending class without proper laboratory uniform.',
                'classification' => 'Minor',
                'status' => 'Resolved',
            ],
            [
                'incident_type' => 'Drunkenness',
                'incident_date' => '2026-03-18',
                'incident_time' => '23:45:00',
                'location' => 'Back Gate',
                'students_involved' => [$studentNames[4] ?? 'Yohann Jeym F. Dimacuha'],
                'description' => 'Reported entering the campus under the influence of alcohol.',
                'classification' => 'Major',
                'status' => 'Escalated',
            ],
            [
                'incident_type' => 'Loitering',
                'incident_date' => '2026-03-19',
                'incident_time' => '15:30:00',
                'location' => 'Student Plaza',
                'students_involved' => [$studentNames[0] ?? 'Axl Jhan L. Dimayuga'],
                'description' => 'Staying in the plaza beyond curfew hours.',
                'classification' => 'Minor',
                'status' => 'Ongoing',
            ],
            [
                'incident_type' => 'Vandalism',
                'incident_date' => '2026-03-20',
                'incident_time' => '11:00:00',
                'location' => 'CR Room 302',
                'students_involved' => ['Mark Anthony S. Rivera'],
                'description' => 'Writing on the walls of the comfort room.',
                'classification' => 'Major',
                'status' => 'Pending',
            ],
            [
                'incident_type' => 'Cheating during Exam',
                'incident_date' => '2026-03-21',
                'incident_time' => '09:45:00',
                'location' => 'Lecture Room 101',
                'students_involved' => ['Janine P. Custodio'],
                'description' => 'Using unauthorized materials during the mid-term examination.',
                'classification' => 'Major',
                'status' => 'Ongoing',
            ],
            [
                'incident_type' => 'Bullying',
                'incident_date' => '2026-03-22',
                'incident_time' => '12:15:00',
                'location' => 'Canteen',
                'students_involved' => ['Renz M. Pantoja'],
                'description' => 'Verbally harassing another student in the canteen area.',
                'classification' => 'Major',
                'status' => 'Escalated',
            ],
            [
                'incident_type' => 'Public Display of Affection',
                'incident_date' => '2026-03-23',
                'incident_time' => '16:50:00',
                'location' => 'Garden Area',
                'students_involved' => ['Lester D. Manalo', 'Rina S. Lopez'],
                'description' => 'Observed engaging in inappropriate PDA within campus premises.',
                'classification' => 'Minor',
                'status' => 'Resolved',
            ],
            [
                'incident_type' => 'Gambling',
                'incident_date' => '2026-03-24',
                'incident_time' => '13:00:00',
                'location' => 'Back of Gym',
                'students_involved' => ['Kevin T. Hernandez'],
                'description' => 'Playing card games for money.',
                'classification' => 'Major',
                'status' => 'Pending',
            ],
            [
                'incident_type' => 'Littering',
                'incident_date' => '2026-03-25',
                'incident_time' => '08:45:00',
                'location' => 'Amphitheater',
                'students_involved' => ['Drei S. Salazar'],
                'description' => 'Disposing of trash improperly after a student gathering.',
                'classification' => 'Minor',
                'status' => 'Resolved',
            ],
        ];

        foreach ($incidents as $data) {
            Incident::create($data);
        }
    }
}
