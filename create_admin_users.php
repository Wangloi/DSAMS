<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;
use Illuminate\Support\Facades\Hash;

echo "Creating admin users...\n\n";

// Update first few students to have admin role
$adminStudents = [
    [
        'email' => 'leddaleiladanielle@gmail.com',
        'name' => 'Leila Danielle Acierto Ledda',
        'role' => 'admin'
    ],
    [
        'email' => 'agcopraglenenigma@gmail.com', 
        'name' => 'Glen Enigma Abines Agcopra',
        'role' => 'admin'
    ],
    [
        'email' => 'alexamaeabao46@gmail.com',
        'name' => 'Alexa Mae Zarate Abao', 
        'role' => 'admin'
    ]
];

foreach ($adminStudents as $adminData) {
    $student = Student::where('email', $adminData['email'])->first();
    
    if ($student) {
        $student->role = $adminData['role'];
        $student->save();
        echo "Updated {$student->name} to admin role\n";
    } else {
        echo "Student not found: {$adminData['email']}\n";
    }
}

echo "\nChecking admin users:\n";
$adminCount = Student::where('role', 'admin')->count();
echo "Total admin users: $adminCount\n";

$admins = Student::where('role', 'admin')->get(['id', 'name', 'email', 'student_id', 'role']);
foreach ($admins as $admin) {
    echo "- ID: {$admin->student_id}, Email: {$admin->email}, Name: {$admin->name}\n";
}

echo "\nAdmin users created successfully!\n";
echo "You can now filter by 'Administrator' in the Manage Users page.\n";
