<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->withoutMiddleware();

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
}
