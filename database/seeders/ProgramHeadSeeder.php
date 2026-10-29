<?php

namespace Database\Seeders;

use App\Models\ProgramHead;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class ProgramHeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $name = env('SEED_PROGRAM_HEAD_NAME', 'Prof. Maria Santos');
        $email = env('SEED_PROGRAM_HEAD_EMAIL', 'programhead@example.com');
        $password = env('SEED_PROGRAM_HEAD_PASSWORD', 'password');
        $program = env('SEED_PROGRAM_HEAD_PROGRAM', 'BSIT');
        $office = env('SEED_PROGRAM_HEAD_OFFICE', 'College of Computer Studies');

        $data = [
            'name' => $name,
            'email_verified_at' => now(),
            'password' => Hash::make($password),
            'program' => $program,
            'verification_status' => 'approved',
        ];

        if (Schema::hasColumn('program_heads', 'role')) {
            $data['role'] = 'Program Head';
        }

        if (Schema::hasColumn('program_heads', 'office')) {
            $data['office'] = $office;
        }

        $head = ProgramHead::updateOrCreate(
            ['email' => $email],
            $data
        );

        $this->command?->info("Program Head seeded successfully: {$head->email} (Password: {$password}, Program: {$program})");
    }
}
