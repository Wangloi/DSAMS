<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Program;

echo "Checking program student counts:\n";

$programs = Program::withCount('students')->get();

foreach ($programs as $program) {
    echo "Program: {$program->name}\n";
    echo "Code: {$program->code}\n";
    echo "Student Count: {$program->students_count}\n";
    echo "--------------------------------\n";
    
    // Also check raw student count
    $rawCount = \App\Models\Student::where('program_id', $program->id)->count();
    echo "Raw DB Count: $rawCount\n";
    echo "================================\n\n";
}
