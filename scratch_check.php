<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Total Students: " . \App\Models\Student::count() . "\n";
echo "Total Attendances: " . \App\Models\Attendance::count() . "\n";
echo "Total Events: " . \App\Models\Event::count() . "\n\n";

$students = \App\Models\Student::take(5)->get();
foreach ($students as $s) {
    $attCount = \App\Models\Attendance::where('student_id', $s->id)->orWhere('student_id', $s->student_id)->count();
    echo "Student ID: {$s->id} | student_id: {$s->student_id} | Name: {$s->name} | Course: {$s->course} | Attendances: {$attCount}\n";
}

echo "\nSample Attendances:\n";
$attendances = \App\Models\Attendance::take(5)->get();
foreach ($attendances as $a) {
    echo "Attendance #{$a->id} | event_id: {$a->event_id} | student_id: {$a->student_id} | status: {$a->status} | scanned_at: {$a->scanned_at}\n";
}
