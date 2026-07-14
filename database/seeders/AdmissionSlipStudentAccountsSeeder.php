<?php

namespace Database\Seeders;

use App\Models\AdmissionSlip;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdmissionSlipStudentAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = 'password123';
        $studentIdPrefix = 'C230';

        $names = AdmissionSlip::query()
            ->whereNotNull('student_name')
            ->where('student_name', '!=', '')
            ->pluck('student_name')
            ->map(fn ($n) => trim((string) $n))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        if ($names->isEmpty()) {
            return;
        }

        $existingMax = Student::query()
            ->where('student_id', 'like', $studentIdPrefix . '%')
            ->pluck('student_id')
            ->map(function ($id) use ($studentIdPrefix) {
                $id = (string) $id;
                if (!str_starts_with($id, $studentIdPrefix)) return 0;
                $suffix = substr($id, strlen($studentIdPrefix));
                if (!preg_match('/^(\d+)$/', $suffix, $m)) return 0;
                return (int) $m[1];
            })
            ->max() ?? 0;

        $counter = (int) $existingMax;

        foreach ($names as $fullName) {
            $slug = Str::slug($fullName);
            $emailBase = $slug . '@example.com';

            if ($slug === '') {
                continue;
            }

            $email = $emailBase;
            $suffix = 1;
            while (Student::query()->where('email', $email)->exists()) {
                $suffix++;
                $email = $slug . '-' . $suffix . '@example.com';
            }

            $alreadyExists = Student::query()
                ->orWhere('name', $fullName)
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            $counter++;
            $studentId = $studentIdPrefix . str_pad((string) $counter, 4, '0', STR_PAD_LEFT);

            [$firstName, $middleName, $lastName] = $this->splitName($fullName);

            $programYearLevel = AdmissionSlip::query()
                ->where('student_name', $fullName)
                ->whereNotNull('program_year_level')
                ->value('program_year_level');

            [$course, $yearLevel] = $this->parseCourseYearLevel((string) $programYearLevel);

            Student::query()->create([
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make($password),
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'student_id' => $studentId,
                'course' => $course,
                'year_level' => $yearLevel,
                'role' => 'student',
                'is_active' => true,
                'is_archived' => false,
                'entry_status' => $yearLevel,
                'program' => $course,
                'major' => null,
            ]);
        }
    }

    private function parseCourseYearLevel(string $raw): array
    {
        $value = trim($raw);
        if ($value === '') {
            return ['BSIT', '1st Year'];
        }

        $course = $value;
        $year = '1st Year';

        $parts = array_map('trim', explode('-', $value));
        if (count($parts) >= 2) {
            $course = trim($parts[0]);
            $maybeYear = strtolower(trim($parts[count($parts) - 1]));

            if (str_contains($maybeYear, '1st') || $maybeYear === '1') $year = '1st Year';
            else if (str_contains($maybeYear, '2nd') || $maybeYear === '2') $year = '2nd Year';
            else if (str_contains($maybeYear, '3rd') || $maybeYear === '3') $year = '3rd Year';
            else if (str_contains($maybeYear, '4th') || $maybeYear === '4') $year = '4th Year';
        }

        if ($course === '') {
            $course = 'BSIT';
        }

        return [$course, $year];
    }

    private function splitName(string $fullName): array
    {
        $name = trim($fullName);
        if ($name === '') return ['', null, ''];

        if (str_contains($name, ',')) {
            [$last, $rest] = array_map('trim', explode(',', $name, 2));
            $parts = array_values(array_filter(preg_split('/\s+/', $rest ?? '') ?: []));
            $first = (string) ($parts[0] ?? '');
            $middle = count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : (string) ($parts[1] ?? '');
            $middle = trim($middle) === '' ? null : trim($middle);
            return [$first, $middle, $last];
        }

        $parts = array_values(array_filter(preg_split('/\s+/', $name) ?: []));
        if (count($parts) === 1) {
            return [$parts[0], null, $parts[0]];
        }

        $last = array_pop($parts);
        $first = implode(' ', $parts);
        return [$first, null, (string) $last];
    }
}
