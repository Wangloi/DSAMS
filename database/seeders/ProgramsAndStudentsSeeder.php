<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Program;
use App\Models\Student;

class ProgramsAndStudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing data
        Student::truncate();
        Program::truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create Programs
        $programs = [
            [
                'name' => 'Business Administration Program',
                'code' => 'BSBA',
                'department' => 'College of Business',
                'description' => 'Bachelor of Science in Business Administration with major in Financial Management',
                'duration' => '4 years',
                'is_active' => true,
            ],
            [
                'name' => 'Criminal Justice Education Program',
                'code' => 'BCJED',
                'department' => 'College of Criminal Justice',
                'description' => 'Bachelor of Criminal Justice Education',
                'duration' => '4 years',
                'is_active' => true,
            ],
            [
                'name' => 'Information Technology Program',
                'code' => 'BSIT',
                'department' => 'College of Information Technology',
                'description' => 'Bachelor of Science in Information Technology',
                'duration' => '4 years',
                'is_active' => true,
            ],
        ];

        $createdPrograms = [];
        foreach ($programs as $programData) {
            $program = Program::create($programData);
            $createdPrograms[$program->code] = $program;
        }

        // Create Students
        $students = [
            [
                'name' => 'Pauline Valmoria Navales',
                'email' => 'srcbnavalespauline@gmail.com',
                'password' => Hash::make('password123'), // Change this in production
                'student_id' => 'SRCB-2025-001',
                'course' => 'Business Administration Program',
                'year_level' => '1st Year',
                'first_name' => 'Pauline',
                'middle_name' => 'Valmoria',
                'last_name' => 'Navales',
                'role' => 'Student',
                'program_id' => $createdPrograms['BSBA']->id,
                'is_active' => true,
                'entry_status' => 'Freshman',
                'program' => 'Business Administration Program',
                'major' => 'Financial Management',
                'home_address' => 'Side - A - Lower, Talusan, Balingasag, Misamis Oriental',
                'birthday' => '2006-04-22',
                'place_of_birth' => 'Cagayan Provincial Hospital',
                'religion' => 'Roman Catholic',
                'gender' => 'Female',
                'contact_no' => '09362144722',
                'nationality' => 'Filipino',
                'elementary_school' => 'Talusan elementary school',
                'elementary_year_graduated' => 2019,
                'junior_high_school' => 'St. Rita\'s College of Balingasag',
                'junior_high_year_graduated' => 2023,
                'senior_high_school' => 'St. Rita\'s College of Balingasag',
                'senior_high_year_graduated' => 2025,
                'mother_name' => 'Maricel Navales',
                'mother_contact' => '09539125484',
                'father_name' => 'Rodelion Navales',
                'father_contact' => '09361358247',
                'guardian_name' => 'Maricel Navales',
                'guardian_relation' => 'Mother',
                'guardian_contact' => '09539125484',
            ],
            [
                'name' => 'John Paul Llagas Alimorin',
                'email' => 'llagasjohn75@gmail.com',
                'password' => Hash::make('password123'), // Change this in production
                'student_id' => 'SRCB-2025-002',
                'course' => 'Criminal Justice Education Program',
                'year_level' => '2nd Year',
                'first_name' => 'John Paul',
                'middle_name' => 'Llagas',
                'last_name' => 'Alimorin',
                'role' => 'Student',
                'program_id' => $createdPrograms['BCJED']->id,
                'is_active' => true,
                'entry_status' => 'Transferee',
                'program' => 'Criminal Justice Education Program',
                'major' => null,
                'home_address' => 'Zone 5, Linggangao, Balingasag, Misamis Oriental',
                'birthday' => '2006-10-04',
                'place_of_birth' => 'Balingasag, Misamis Oriental',
                'religion' => 'Roman Catholic',
                'gender' => 'Male',
                'contact_no' => '09526308104',
                'nationality' => 'Filipino',
                'elementary_school' => 'Balingasag Central School',
                'elementary_year_graduated' => 2017,
                'junior_high_school' => 'St. Peter\'s College of Misamis Oriental Inc',
                'junior_high_year_graduated' => 2022,
                'senior_high_school' => 'St. Peter\'s College of Misamis Oriental Inc',
                'senior_high_year_graduated' => 2024,
                'mother_name' => 'Cynthia Alimorin',
                'mother_contact' => '09554324272',
                'father_name' => 'Marcelino Alimorin',
                'father_contact' => '090651234578',
                'guardian_name' => 'Anastacia Llagas',
                'guardian_relation' => 'Grandma',
                'guardian_contact' => '09526308104',
            ],
            [
                'name' => 'Von Cedric Puaso Miranda',
                'email' => 'goopmint@gmail.com',
                'password' => Hash::make('password123'), // Change this in production
                'student_id' => 'SRCB-2025-003',
                'course' => 'Information Technology Program',
                'year_level' => '4th Year',
                'first_name' => 'Von Cedric',
                'middle_name' => 'Puaso',
                'last_name' => 'Miranda',
                'role' => 'Student',
                'program_id' => $createdPrograms['BSIT']->id,
                'is_active' => true,
                'entry_status' => 'Old Students',
                'program' => 'Information Technology Program',
                'major' => null,
                'home_address' => 'Zone 5 San Isidro',
                'birthday' => '2003-03-19',
                'place_of_birth' => 'Cagayan de Oro',
                'religion' => 'Roman Catholic',
                'gender' => 'Male',
                'contact_no' => '09670286638',
                'nationality' => 'Filipino',
                'elementary_school' => 'Bulua Central School',
                'elementary_year_graduated' => 2016,
                'junior_high_school' => 'Bulua National High School',
                'junior_high_year_graduated' => 2020,
                'senior_high_school' => 'Informatics Computer Institute',
                'senior_high_year_graduated' => 2022,
                'mother_name' => 'Marivic Miranda',
                'mother_contact' => '09061638379',
                'father_name' => 'Elvis Miranda',
                'father_contact' => null,
                'guardian_name' => null,
                'guardian_relation' => null,
                'guardian_contact' => null,
            ],
            [
                'name' => 'Ashley Balubo Igot',
                'email' => 'igotashley05@gmail.com',
                'password' => Hash::make('password123'), // Change this in production
                'student_id' => 'SRCB-2025-004',
                'course' => 'Business Administration Program',
                'year_level' => '1st Year',
                'first_name' => 'Ashley',
                'middle_name' => 'Balubo',
                'last_name' => 'Igot',
                'role' => 'Student',
                'program_id' => $createdPrograms['BSBA']->id,
                'is_active' => true,
                'entry_status' => 'Freshman',
                'program' => 'Business Administration Program',
                'major' => 'Financial Management',
                'home_address' => 'P-7 BAGAAY, BALIWAGAN, BALINGASAG, MIS.OR',
                'birthday' => '2006-10-05',
                'place_of_birth' => 'BAGAAY BALIWAGAN BALINGASAG MIS.OR',
                'religion' => 'CATHOLIC',
                'gender' => 'Female',
                'contact_no' => '09066667884',
                'nationality' => 'FILIPINO',
                'elementary_school' => 'BAGAAY ELEMENTARY SCHOOL',
                'elementary_year_graduated' => 2018,
                'junior_high_school' => 'BALIWAGAN NATIONAL HIGH SCHOOL',
                'junior_high_year_graduated' => 2023,
                'senior_high_school' => 'LITTLE ME ACADEMY',
                'senior_high_year_graduated' => 2025,
                'mother_name' => 'ANNIE IGOT',
                'mother_contact' => '09066667884',
                'father_name' => 'WILFREDO IGOT',
                'father_contact' => '09750864443',
                'guardian_name' => 'ANNIE IGOT',
                'guardian_relation' => 'MOTHER',
                'guardian_contact' => '09066667884',
            ],
            [
                'name' => 'Marvin Ral Cailing',
                'email' => 'marvinral09@gmail.com',
                'password' => Hash::make('password123'), // Change this in production
                'student_id' => 'SRCB-2025-005',
                'course' => 'Criminal Justice Education Program',
                'year_level' => '2nd Year',
                'first_name' => 'Marvin',
                'middle_name' => 'Ral',
                'last_name' => 'Cailing',
                'role' => 'Student',
                'program_id' => $createdPrograms['BCJED']->id,
                'is_active' => true,
                'entry_status' => 'Old Students',
                'program' => 'Criminal Justice Education Program',
                'major' => null,
                'home_address' => 'Binitinan Balingasag Mis.Or',
                'birthday' => '2006-04-06',
                'place_of_birth' => 'Binitinan Balingasag Mis.Or',
                'religion' => 'Roman Catholic',
                'gender' => 'Male',
                'contact_no' => '09975181357',
                'nationality' => 'Filipino',
                'elementary_school' => 'Binitinan Elementary School',
                'elementary_year_graduated' => 2018,
                'junior_high_school' => 'Baliwagan National High School',
                'junior_high_year_graduated' => 2021,
                'senior_high_school' => 'Baliwagan Senior High School',
                'senior_high_year_graduated' => 2023,
                'mother_name' => 'Charita Cailing',
                'mother_contact' => '09558530978',
                'father_name' => 'Anatolio Cailing',
                'father_contact' => null,
                'guardian_name' => null,
                'guardian_relation' => null,
                'guardian_contact' => null,
            ],
        ];

        // Insert students in batches to avoid memory issues
        foreach ($students as $studentData) {
            Student::create($studentData);
        }

        $this->command->info('Programs and Students seeded successfully!');
        $this->command->info('Programs created: ' . count($programs));
        $this->command->info('Students created: ' . count($students));
    }
}
