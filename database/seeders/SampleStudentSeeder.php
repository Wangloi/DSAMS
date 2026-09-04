<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleStudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bsitProgram = Program::where('code', 'BSIT')->first();

        Student::updateOrCreate(
            ['student_id' => '2024-0001'],
            [
                'name'                       => 'Juan Dela Cruz',
                'first_name'                 => 'Juan',
                'middle_name'                => 'Protacio',
                'last_name'                  => 'Dela Cruz',
                'email'                      => 'student@dsams.test',
                'email_verified_at'          => now(),
                'password'                   => Hash::make('password123'),
                'student_id'                 => '2024-0001',
                'course'                     => 'BS Information Technology',
                'year_level'                 => '3rd Year',
                'program_id'                 => $bsitProgram ? $bsitProgram->id : 1,
                'program'                    => 'Bachelor of Science in Information Technology',
                'major'                      => 'Information Technology',
                'role'                       => 'Student',
                'status'                     => 'approved',
                'verification_status'        => 'approved',
                'is_active'                  => true,
                'is_archived'                => false,
                'entry_status'               => 'Old Student',

                // Personal Information (Complete SIS)
                'home_address'               => 'Purok 3, Barangay Hermano, Balingasag, Misamis Oriental',
                'birthday'                   => '2003-08-15',
                'place_of_birth'             => 'Balingasag, Misamis Oriental',
                'religion'                   => 'Roman Catholic',
                'gender'                     => 'Male',
                'contact_no'                 => '09171234567',
                'nationality'                => 'Filipino',

                // Academic Background
                'elementary_school'          => 'Balingasag Central Elementary School',
                'elementary_year_graduated'  => 2015,
                'junior_high_school'         => 'St. Rita\'s College of Balingasag Junior High',
                'junior_high_year_graduated' => 2019,
                'senior_high_school'         => 'St. Rita\'s College of Balingasag Senior High (TVL-ICT)',
                'senior_high_year_graduated' => 2021,

                // Family Background
                'mother_name'                => 'Maria Clara Dela Cruz',
                'mother_contact'             => '09179876543',
                'father_name'                => 'Jose Protacio Dela Cruz',
                'father_contact'             => '09179876544',
                'guardian_name'              => 'Maria Clara Dela Cruz',
                'guardian_relation'          => 'Mother',
                'guardian_contact'           => '09179876543',
            ]
        );
    }
}
