<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\Student;
use App\Models\ProgramHead;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Student::updateOrCreate(
            ['student_id' => '12345'],
            [
                'name' => 'Student User',
                'email' => 'student@example.com',
                'password' => Hash::make('password'),
                'course' => 'BSIT',
                'year_level' => '1st Year',
            ]
        );

        ProgramHead::updateOrCreate(
            ['email' => 'programhead@example.com'],
            [
                'name' => 'Program Head User',
                'email' => 'programhead@example.com',
                'password' => Hash::make('password'),
                'program' => 'BSED',
            ]
        );

        AdminUser::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
            ]
        );
    }
}
