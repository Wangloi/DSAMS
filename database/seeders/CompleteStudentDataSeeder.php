<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Program;
use App\Models\Student;

class CompleteStudentDataSeeder extends Seeder
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

        // Create all unique programs found in the data
        $programs = [
            [
                'name' => 'Business Administration Program',
                'code' => 'BSBA',
                'department' => 'College of Business',
                'description' => 'Bachelor of Science in Business Administration with majors in Financial Management, Human Resource Management, and Marketing Management',
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
            [
                'name' => 'Hospitality Management Program',
                'code' => 'BSHM',
                'department' => 'College of Hospitality Management',
                'description' => 'Bachelor of Science in Hospitality Management',
                'duration' => '4 years',
                'is_active' => true,
            ],
            [
                'name' => 'Teacher Education Program',
                'code' => 'BSED',
                'department' => 'College of Education',
                'description' => 'Bachelor of Secondary Education with majors in English, Filipino, Science, and Elementary Education',
                'duration' => '4 years',
                'is_active' => true,
            ],
        ];

        $createdPrograms = [];
        foreach ($programs as $programData) {
            $program = Program::create($programData);
            $createdPrograms[$program->code] = $program;
        }

        // Read the student data file
        $filePath = public_path('STUDENT-INFORMATION-SHEET-Responses (1).txt');
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        $students = [];
        $emailsSeen = [];
        $studentCounter = 1;
        
        // Skip header line and process each student
        for ($i = 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;
            
            // Parse tab-separated values
            $fields = explode("\t", $line);
            
            if (count($fields) < 30) continue; // Skip incomplete lines
            
            $timestamp = $fields[0] ?? '';
            $email = $fields[1] ?? '';
            $yearLevel = $fields[2] ?? '';
            $entryStatus = $fields[3] ?? '';
            $programName = $fields[4] ?? '';
            $major = $fields[5] ?? '';
            $major2 = $fields[6] ?? '';
            $surname = $fields[7] ?? '';
            $givenName = $fields[8] ?? '';
            $middleName = $fields[9] ?? '';
            $homeAddress = $fields[10] ?? '';
            $birthday = $fields[11] ?? '';
            $placeOfBirth = $fields[12] ?? '';
            $gender = $fields[13] ?? '';
            $contactNumber = $fields[14] ?? '';
            $emailField = $fields[15] ?? '';
            $nationality = $fields[16] ?? '';
            $religion = $fields[17] ?? '';
            $elementarySchool = $fields[18] ?? '';
            $elementaryYear = $fields[19] ?? '';
            $juniorHighSchool = $fields[20] ?? '';
            $juniorHighYear = $fields[21] ?? '';
            $seniorHighSchool = $fields[22] ?? '';
            $seniorHighYear = $fields[23] ?? '';
            $motherName = $fields[24] ?? '';
            $motherContact = $fields[25] ?? '';
            $fatherName = $fields[26] ?? '';
            $fatherContact = $fields[27] ?? '';
            $guardianName = $fields[28] ?? '';
            $guardianRelation = $fields[29] ?? '';
            $guardianContact = $fields[30] ?? '';

            // Skip if no email or program
            if (empty($email) || empty($programName)) continue;
            
            // Check for duplicate email
            $email = strtolower(trim($email));
            if (isset($emailsSeen[$email])) continue;
            $emailsSeen[$email] = true;

            // Determine program code
            $programCode = $this->getProgramCode($programName);
            if (!$programCode || !isset($createdPrograms[$programCode])) continue;

            // Clean and format birthday
            $formattedBirthday = $this->formatBirthday($birthday);
            
            // Create full name
            $fullName = trim($givenName . ' ' . $middleName . ' ' . $surname);
            $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

            $studentData = [
                'name' => $fullName,
                'email' => strtolower(trim($email)),
                'password' => Hash::make('password123'),
                'student_id' => 'SRCB-2025-' . str_pad($studentCounter, 3, '0', STR_PAD_LEFT),
                'course' => $programName,
                'year_level' => $yearLevel,
                'first_name' => trim($givenName),
                'middle_name' => trim($middleName),
                'last_name' => trim($surname),
                'role' => 'Student',
                'program_id' => $createdPrograms[$programCode]->id,
                'is_active' => true,
                'entry_status' => $entryStatus,
                'program' => $programName,
                'major' => !empty($major) ? $major : null,
                'home_address' => !empty($homeAddress) ? $homeAddress : null,
                'birthday' => $formattedBirthday,
                'place_of_birth' => !empty($placeOfBirth) ? $placeOfBirth : null,
                'religion' => !empty($religion) ? $religion : null,
                'gender' => !empty($gender) ? $gender : null,
                'contact_no' => !empty($contactNumber) ? $contactNumber : null,
                'nationality' => !empty($nationality) ? $nationality : null,
                'elementary_school' => !empty($elementarySchool) ? $elementarySchool : null,
                'elementary_year_graduated' => is_numeric($elementaryYear) ? (int)$elementaryYear : null,
                'junior_high_school' => !empty($juniorHighSchool) ? $juniorHighSchool : null,
                'junior_high_year_graduated' => is_numeric($juniorHighYear) ? (int)$juniorHighYear : null,
                'senior_high_school' => !empty($seniorHighSchool) ? $seniorHighSchool : null,
                'senior_high_year_graduated' => is_numeric($seniorHighYear) ? (int)$seniorHighYear : null,
                'mother_name' => !empty($motherName) ? $motherName : null,
                'mother_contact' => !empty($motherContact) ? $motherContact : null,
                'father_name' => !empty($fatherName) ? $fatherName : null,
                'father_contact' => !empty($fatherContact) ? $fatherContact : null,
                'guardian_name' => !empty($guardianName) ? $guardianName : null,
                'guardian_relation' => !empty($guardianRelation) ? $guardianRelation : null,
                'guardian_contact' => !empty($guardianContact) ? $guardianContact : null,
            ];

            $students[] = $studentData;
            $studentCounter++;
        }

        // Insert students in batches to avoid memory issues
        $batchSize = 50;
        $totalStudents = count($students);
        
        for ($i = 0; $i < $totalStudents; $i += $batchSize) {
            $batch = array_slice($students, $i, $batchSize);
            Student::insert($batch);
        }

        $this->command->info('Complete student data seeded successfully!');
        $this->command->info('Programs created: ' . count($programs));
        $this->command->info('Students created: ' . count($students));
    }

    /**
     * Get program code based on program name
     */
    private function getProgramCode($programName)
    {
        $programMap = [
            'Business Administration Program' => 'BSBA',
            'Criminal Justice Education Program' => 'BCJED',
            'Criminal Justice Education Progran' => 'BCJED', // Handle typo
            'Information Technology Program' => 'BSIT',
            'Hospitality Management Program' => 'BSHM',
            'Teacher Education Program' => 'BSED',
        ];

        return $programMap[$programName] ?? null;
    }

    /**
     * Format birthday to MySQL date format
     */
    private function formatBirthday($birthday)
    {
        if (empty($birthday)) return null;

        // Handle various date formats: M/D/Y, MM/DD/YYYY, etc.
        $date = \DateTime::createFromFormat('m/d/Y', $birthday);
        if ($date === false) {
            // Try other formats
            $date = \DateTime::createFromFormat('n/j/Y', $birthday);
        }
        if ($date === false) {
            // Try Y-m-d format
            $date = \DateTime::createFromFormat('Y-m-d', $birthday);
        }

        return $date ? $date->format('Y-m-d') : null;
    }
}
