<?php

use App\Models\Student;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new students can register through step 1', function () {
    $response = $this->postJson(route('student.register.step1.store'), [
        'first_name' => 'John',
        'middle_name' => 'A',
        'last_name' => 'Doe',
        'student_id' => 'ID-2026-TEST',
        'email' => 'newstudent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'entry_status' => '1st Year',
        'program' => 'BSIT',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('students', [
        'email' => 'newstudent@example.com',
        'student_id' => 'ID-2026-TEST',
    ]);
});