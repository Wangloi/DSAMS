<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;

echo "Checking student login information:\n\n";

$students = Student::select('student_id', 'email', 'name', 'password')->get();

echo "Total students in database: " . $students->count() . "\n\n";
echo "Sample student credentials (password: password123 for all):\n";
echo "=====================================\n";

foreach ($students->take(10) as $student) {
    echo "Student ID: {$student->student_id}\n";
    echo "Email: {$student->email}\n";
    echo "Name: {$student->name}\n";
    echo "-------------------------------------\n";
}
