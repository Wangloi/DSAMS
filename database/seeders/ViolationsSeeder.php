<?php

namespace Database\Seeders;

use App\Models\DisciplinaryRule;
use App\Models\Violation;
use Illuminate\Database\Seeder;

class ViolationsSeeder extends Seeder
{
    public function run(): void
    {
        // Create Violations
        $violations = [
            ['code' => 'V001', 'name' => 'Tardiness', 'description' => 'Arriving late to class or school events', 'section' => 'Warning'],
            ['code' => 'V002', 'name' => 'Absent without excuse', 'description' => 'Unexcused absence', 'section' => 'Warning'],
            ['code' => 'V003', 'name' => 'Cheating', 'description' => 'Academic dishonesty', 'section' => 'Warning'],
            ['code' => 'V004', 'name' => 'Vandalism', 'description' => 'Destruction of school property', 'section' => 'Suspension'],
            ['code' => 'V005', 'name' => 'Fighting', 'description' => 'Physical altercation', 'section' => 'Suspension'],
            ['code' => 'V006', 'name' => 'Bullying', 'description' => 'Verbal or physical harassment', 'section' => 'Exclusion'],
            ['code' => 'V007', 'name' => 'Theft', 'description' => 'Stealing school or personal property', 'section' => 'Exclusion'],
            ['code' => 'V008', 'name' => 'Drug possession', 'description' => 'Possession of illegal substances', 'section' => 'Expulsion'],
            ['code' => 'V009', 'name' => 'Assault on staff', 'description' => 'Physical attack on school personnel', 'section' => 'Expulsion'],
        ];

        foreach ($violations as $v) {
            Violation::firstOrCreate(['code' => $v['code']], $v);
        }

        // Create Disciplinary Rules
        $rules = [
            [
                'name' => '3 Same Offense Warnings → Suspension',
                'description' => 'Three warnings for same offense lead to suspension',
                'trigger_section' => 'Warning',
                'conditions' => ['same_offense_count' => 3],
                'result_action' => 'Suspension',
                'priority' => 10,
            ],
            [
                'name' => '4 Total Warnings → Suspension',
                'description' => 'Four accumulated warnings lead to suspension',
                'trigger_section' => 'Warning',
                'conditions' => ['total_warnings' => 4],
                'result_action' => 'Suspension',
                'priority' => 5,
            ],
            [
                'name' => 'Second Suspension → Exclusion',
                'description' => 'Second suspension may lead to exclusion',
                'trigger_section' => 'Suspension',
                'conditions' => ['suspension_count' => 1],
                'result_action' => 'Exclusion',
                'priority' => 10,
            ],
        ];

        foreach ($rules as $rule) {
            DisciplinaryRule::firstOrCreate(['name' => $rule['name']], $rule);
        }
    }
}
