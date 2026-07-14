<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

use App\Models\Student;

$courses = Student::distinct('course')->pluck('course');

echo "Available courses:\n";
foreach ($courses as $course) {
    echo "- " . $course . "\n";
}
