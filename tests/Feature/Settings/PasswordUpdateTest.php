<?php

use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;

test('password update page is displayed', function () {
    $admin = AdminUser::create([
        'name' => 'Admin Pass',
        'email' => 'admin.pass@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->get(route('user-password.edit'));

    $response->assertOk();
});

test('password can be updated', function () {
    $admin = AdminUser::create([
        'name' => 'Admin Pass',
        'email' => 'admin.pass@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password123',
            'password' => 'New-password123',
            'password_confirmation' => 'New-password123',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-password.edit'));

    expect(Hash::check('New-password123', $admin->refresh()->password))->toBeTrue();
});

test('correct password must be provided to update password', function () {
    $admin = AdminUser::create([
        'name' => 'Admin Pass',
        'email' => 'admin.pass@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin, 'admin')
        ->withSession(['active_guard' => 'admin'])
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('user-password.edit'));
});

test('student can update password without special characters', function () {
    $student = \App\Models\Student::create([
        'student_id' => 'STU-PASS-001',
        'name' => 'Student Pass',
        'first_name' => 'Student',
        'last_name' => 'Pass',
        'email' => 'student.pass@example.com',
        'course' => 'BSIT',
        'year_level' => '1st Year',
        'program' => 'HED',
        'password' => Hash::make('oldpassword123'),
        'status' => 'approved',
        'verification_status' => 'approved',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($student, 'student')
        ->withSession(['active_guard' => 'student'])
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'oldpassword123',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-password.edit'));

    expect(Hash::check('newpassword123', $student->refresh()->password))->toBeTrue();
});