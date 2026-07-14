<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;

echo "Removing admin roles from students table...\n\n";

// Update students that had admin role back to student role
$adminStudents = [
    'leddaleiladanielle@gmail.com',
    'agcopraglenenigma@gmail.com', 
    'alexamaeabao46@gmail.com'
];

foreach ($adminStudents as $email) {
    $student = Student::where('email', $email)->first();
    
    if ($student) {
        $student->role = 'Student';
        $student->save();
        echo "Updated {$student->name} back to Student role\n";
    } else {
        echo "Student not found: $email\n";
    }
}

echo "\nVerifying no admin roles in students table:\n";
$adminCount = Student::where('role', 'admin')->count();
echo "Students with admin role: $adminCount\n";

if ($adminCount === 0) {
    echo "✅ Successfully removed all admin roles from students table\n";
} else {
    echo "❌ Still have $adminCount students with admin role\n";
}

echo "\nNow the system will only show the 2 admin users from admin_users table.\n";
