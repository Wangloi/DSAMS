<?php

use App\Models\AdminUser;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

test('guests are redirected to the login page', function () {
    $this->get('/student-dashboard')->assertRedirect(route('login'));
    $this->get('/admin-dashboard')->assertRedirect(route('login'));
});

test('authenticated students can visit the student dashboard', function () {
    $student = Student::create([
        'student_id' => 'ID-DASH-0001',
        'name' => 'Dashboard Student',
        'first_name' => 'Dashboard',
        'last_name' => 'Student',
        'email' => 'dash.student@example.com',
        'course' => 'BSIT',
        'year_level' => '1st Year',
        'program' => 'HED',
        'password' => Hash::make('password123'),
        'status' => 'approved',
        'verification_status' => 'approved',
        'is_active' => true,
    ]);

    $response = $this->actingAs($student, 'student')
        ->withSession(['active_guard' => 'student'])
        ->get(route('student.dashboard'));

    $response->assertOk();
});

test('authenticated admins can visit the admin dashboard', function () {
    $admin = AdminUser::create([
        'name' => 'Dashboard Admin',
        'email' => 'dash.admin@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->get(route('admin.dashboard'));

    $response->assertOk();
});