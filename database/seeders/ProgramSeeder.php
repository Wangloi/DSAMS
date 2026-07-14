<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Program;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            [
                'name' => 'Bachelor of Science in Information Technology',
                'code' => 'BSIT',
                'description' => 'A program focused on software development, network administration, and IT infrastructure.',
                'is_active' => true,
            ],
            [
                'name' => 'Bachelor of Science in Computer Science',
                'code' => 'BSCS',
                'description' => 'A program focused on theoretical foundations of computing and algorithm design.',
                'is_active' => true,
            ],
            [
                'name' => 'Bachelor of Science in Business Administration',
                'code' => 'BSBA',
                'description' => 'A program focused on business management, marketing, and entrepreneurship.',
                'is_active' => true,
            ],
            [
                'name' => 'Bachelor of Arts in Communication',
                'code' => 'BACOMM',
                'description' => 'A program focused on media studies, public relations, and corporate communication.',
                'is_active' => true,
            ],
            [
                'name' => 'Bachelor of Science in Psychology',
                'code' => 'BSPSYCH',
                'description' => 'A program focused on human behavior, mental processes, and psychological research.',
                'is_active' => true,
            ],
        ];

        foreach ($programs as $program) {
            Program::create($program);
        }
    }
}
