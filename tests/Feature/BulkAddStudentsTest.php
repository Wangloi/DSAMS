<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BulkAddStudentsTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): AdminUser
    {
        return AdminUser::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_can_download_bulk_template_csv_and_xlsx(): void
    {
        $admin = $this->createAdmin();

        $responseCsv = $this->actingAs($admin, 'admin')->get(route('admin.manage-users.bulk-template', ['format' => 'csv']));
        $responseCsv->assertStatus(200);

        $responseXlsx = $this->actingAs($admin, 'admin')->get(route('admin.manage-users.bulk-template', ['format' => 'xlsx']));
        $responseXlsx->assertStatus(200);
    }

    public function test_can_bulk_import_students_with_formatting_and_defaults(): void
    {
        $admin = $this->createAdmin();

        $payload = [
            'rows' => [
                [
                    'Student ID' => 'C230103',
                    'Firstname' => 'Vincent Jay',
                    'Lastname' => 'Abelidas',
                    'Grade/Year Level' => '4th Year',
                    'Section/Course' => 'BSBA',
                    'Department' => 'HED',
                ],
                [
                    'Student ID' => 'ID-C230104',
                    'Firstname' => 'Maria',
                    'Lastname' => 'Santos',
                    'Grade/Year Level' => '1st Year',
                    'Section/Course' => 'BSIT',
                    'Department' => 'HED',
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'admin')->post(route('admin.manage-users.bulk-import'), $payload);

        $response->assertStatus(303);

        // Check student 1 (C230103 -> ID-C230103)
        $student1 = Student::where('student_id', 'ID-C230103')->first();
        $this->assertNotNull($student1);
        $this->assertEquals('Vincent Jay', $student1->first_name);
        $this->assertEquals('Abelidas', $student1->last_name);
        $this->assertEquals('Vincent Jay Abelidas', $student1->name);
        $this->assertEquals('4th Year', $student1->year_level);
        $this->assertEquals('BSBA', $student1->course);
        $this->assertEquals('HED', $student1->program);
        $this->assertNull($student1->email);
        $this->assertEquals('Student', $student1->role);
        $this->assertTrue((bool)$student1->is_active);
        $this->assertEquals('approved', $student1->status);
        $this->assertFalse((bool)$student1->is_archived);
        $this->assertEquals('approved', $student1->verification_status);

        // Check student 2 (ID-C230104 -> ID-C230104)
        $student2 = Student::where('student_id', 'ID-C230104')->first();
        $this->assertNotNull($student2);
        $this->assertEquals('Maria Santos', $student2->name);
    }

    public function test_can_bulk_import_uploaded_file_without_audit_serialization_error(): void
    {
        $admin = $this->createAdmin();

        $csvContent = "Student ID,Firstname,Lastname,Grade/Year Level,Section/Course,Department\n"
            . "C999888,FileUser,Testing,3rd Year,BSIT,HED\n";

        $file = UploadedFile::fake()->createWithContent('students.csv', $csvContent);

        $response = $this->actingAs($admin, 'admin')->post(route('admin.manage-users.bulk-import'), [
            'file' => $file,
        ]);

        $response->assertStatus(303);

        $imported = Student::where('student_id', 'ID-C999888')->first();
        $this->assertNotNull($imported);
        $this->assertEquals('FileUser Testing', $imported->name);
    }

    public function test_skips_duplicate_student_id_firstname_lastname_or_name(): void
    {
        $admin = $this->createAdmin();

        // Create an existing student
        Student::create([
            'student_id' => 'ID-C111111',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'name' => 'John Doe',
            'course' => 'BSIT',
            'year_level' => '1st Year',
            'program' => 'HED',
            'password' => Hash::make('password123'),
        ]);

        $payload = [
            'rows' => [
                // Duplicate Student ID -> should be skipped
                [
                    'Student ID' => 'C111111',
                    'Firstname' => 'UniqueName',
                    'Lastname' => 'UniqueLast',
                    'Grade/Year Level' => '1st Year',
                    'Section/Course' => 'BSIT',
                    'Department' => 'HED',
                ],
                // Duplicate Firstname -> should be skipped
                [
                    'Student ID' => 'C222222',
                    'Firstname' => 'John',
                    'Lastname' => 'Smith',
                    'Grade/Year Level' => '2nd Year',
                    'Section/Course' => 'BSBA',
                    'Department' => 'HED',
                ],
                // Duplicate Lastname -> should be skipped
                [
                    'Student ID' => 'C333333',
                    'Firstname' => 'Alice',
                    'Lastname' => 'Doe',
                    'Grade/Year Level' => '3rd Year',
                    'Section/Course' => 'BEED',
                    'Department' => 'HED',
                ],
                // Entirely New Student -> should be added
                [
                    'Student ID' => 'C444444',
                    'Firstname' => 'Bob',
                    'Lastname' => 'Marley',
                    'Grade/Year Level' => '4th Year',
                    'Section/Course' => 'BSHM',
                    'Department' => 'HED',
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'admin')->post(route('admin.manage-users.bulk-import'), $payload);

        $response->assertStatus(303);

        // Only John Doe (initial) and Bob Marley should exist
        $this->assertEquals(2, Student::count());

        $bob = Student::where('student_id', 'ID-C444444')->first();
        $this->assertNotNull($bob);
        $this->assertEquals('Bob Marley', $bob->name);
    }
}
