<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPrograms = [
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ['code' => 'BSED', 'name' => 'Bachelor of Secondary Education', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ['code' => 'BSCrim', 'name' => 'Bachelor of Science in Criminology', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ['code' => 'BSHM', 'name' => 'Bachelor of Science in Hospitality Management', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
        ];

        foreach ($defaultPrograms as $prog) {
            Program::firstOrCreate(['code' => $prog['code']], $prog);
        }
    }
}
