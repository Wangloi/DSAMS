<?php

use App\Models\AdminUser;
use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('admins can authenticate using admin login', function () {
    $admin = AdminUser::create([
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this->post('/admin-login', [
        'email' => 'admin@test.com',
        'password' => 'password123',
    ]);

    $this->assertTrue(Auth::guard('admin')->check());
    $response->assertRedirect(route('admin.dashboard'));
});

test('students can authenticate using student login', function () {
    $student = Student::create([
        'student_id' => 'ID-AUTH-001',
        'name' => 'Auth Student',
        'first_name' => 'Auth',
        'last_name' => 'Student',
        'email' => 'student.auth@test.com',
        'course' => 'BSIT',
        'year_level' => '1st Year',
        'program' => 'HED',
        'password' => Hash::make('password123'),
        'status' => 'approved',
        'verification_status' => 'approved',
        'is_active' => true,
    ]);

    $response = $this->post('/student-login', [
        'email' => 'student.auth@test.com',
        'password' => 'password123',
    ]);

    $this->assertTrue(Auth::guard('student')->check());
    $response->assertRedirect(route('student.dashboard'));
});

test('users can not authenticate with invalid password', function () {
    $admin = AdminUser::create([
        'name' => 'Test Admin',
        'email' => 'admin2@test.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this->post('/admin-login', [
        'email' => 'admin2@test.com',
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertFalse(Auth::guard('admin')->check());
});

test('users can logout', function () {
    $admin = AdminUser::create([
        'name' => 'Test Admin',
        'email' => 'admin3@test.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin, 'admin')->post(route('logout'));

    $this->assertFalse(Auth::guard('admin')->check());
    $response->assertRedirect('/');
});