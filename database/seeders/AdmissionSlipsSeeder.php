<?php

namespace Database\Seeders;

use App\Models\AdmissionSlip;
use App\Models\Student;
use Illuminate\Database\Seeder;

class AdmissionSlipsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $student = Student::query()->where('email', 'student@example.com')->first();

        $rows = [
            [
                'student_id' => $student?->id,
                'student_name' => $student?->name ?? 'Student User',
                'program_year_level' => ($student?->course ?? 'BSIT') . ' - ' . ($student?->year_level ?? '1st Year'),
                'date_issued' => '2026-03-15',
                'case_text' => 'Late submission of requirements',
                'reason_text' => 'Allowed to enter campus to submit documents at registrar.',
                'valid_until' => '2026-03-16',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => $student?->id,
                'student_name' => $student?->name ?? 'Student User',
                'program_year_level' => ($student?->course ?? 'BSIT') . ' - ' . ($student?->year_level ?? '1st Year'),
                'date_issued' => '2026-03-10',
                'case_text' => 'Uniform violation (missing ID)',
                'reason_text' => 'Temporary pass issued while ID replacement is processed.',
                'valid_until' => '2026-03-10',
                'status' => 'APPROVED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Juan Dela Cruz',
                'program_year_level' => 'BSED - 2nd Year',
                'date_issued' => '2026-03-05',
                'case_text' => 'Minor policy breach',
                'reason_text' => 'Counseling required before re-entry.',
                'valid_until' => '2026-03-05',
                'status' => 'REJECTED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Maria Santos',
                'program_year_level' => 'BSBA - 3rd Year',
                'date_issued' => '2026-02-28',
                'case_text' => 'Forgot gate pass',
                'reason_text' => 'Allowed entry for one day; must present gate pass next time.',
                'valid_until' => '2026-02-28',
                'status' => 'APPROVED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Karl Ryan B. Dela Torre',
                'program_year_level' => 'Information Technology Program - 2nd',
                'date_issued' => '2025-07-10',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-10',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Salvani, Rhomer',
                'program_year_level' => 'Teacher Education Program - 3rd',
                'date_issued' => '2025-07-11',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'BSED-3 ENGLISH',
                'valid_until' => '2025-07-11',
                'status' => 'APPROVED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Lozada, Aldrin',
                'program_year_level' => 'Teacher Education Program - 3rd',
                'date_issued' => '2025-07-11',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'BSED-3 ENGLISH',
                'valid_until' => '2025-07-11',
                'status' => 'REJECTED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Michael John Donguanes',
                'program_year_level' => 'Information Technology Program - 2nd',
                'date_issued' => '2025-07-15',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-15',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Zayas, RT Karel',
                'program_year_level' => 'Information Technology Program - 2nd',
                'date_issued' => '2025-07-17',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-17',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Delos Santos, Crisologo D.',
                'program_year_level' => 'Criminal Justice Education Program - 4th',
                'date_issued' => '2025-07-18',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-18',
                'status' => 'APPROVED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Juken P. Tubal',
                'program_year_level' => 'Information Technology Program - 1st',
                'date_issued' => '2025-07-21',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-21',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Kent Ian V. Perez',
                'program_year_level' => 'Information Technology Program - 1st',
                'date_issued' => '2025-07-21',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-21',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Jessie James N. Yugto',
                'program_year_level' => 'Information Technology Program - 1st',
                'date_issued' => '2025-07-21',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-21',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'Erica Keith C. Pahis',
                'program_year_level' => 'Business Administration Program - 1st',
                'date_issued' => '2025-07-22',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'FM',
                'valid_until' => '2025-07-22',
                'status' => 'APPROVED',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'John Gilmor G. Verana',
                'program_year_level' => 'Hospitality Management Program - 1st',
                'date_issued' => '2025-07-22',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-22',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
            [
                'student_id' => null,
                'student_name' => 'James Anthony N. Buhangin',
                'program_year_level' => 'Hospitality Management Program - 1st',
                'date_issued' => '2025-07-22',
                'case_text' => 'Not wearing school uniform',
                'reason_text' => 'N/A',
                'valid_until' => '2025-07-22',
                'status' => 'PENDING',
                'is_archived' => false,
            ],
        ];

        foreach ($rows as $row) {
            AdmissionSlip::query()->firstOrCreate(
                [
                    'student_name' => $row['student_name'],
                    'date_issued' => $row['date_issued'],
                    'case_text' => $row['case_text'],
                ],
                $row
            );
        }
    }
}
