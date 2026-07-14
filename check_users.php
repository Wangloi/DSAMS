<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking users table:\n\n";

// Check if users table exists
try {
    $users = DB::table('users')->get();
    echo "Users table exists. Total users: " . $users->count() . "\n\n";
    
    if ($users->count() > 0) {
        echo "User roles in database:\n";
        $roles = DB::table('users')->select('role')->distinct()->pluck('role');
        foreach ($roles as $role) {
            $count = DB::table('users')->where('role', $role)->count();
            echo "- $role: $count users\n";
        }
        
        echo "\nAdministrator users:\n";
        $admins = DB::table('users')->where('role', 'admin')->get();
        foreach ($admins as $admin) {
            echo "ID: {$admin->id}, Email: {$admin->email}, Name: {$admin->name}\n";
        }
    }
} catch (Exception $e) {
    echo "Error accessing users table: " . $e->getMessage() . "\n";
}

echo "\n\nChecking students table for admin role:\n";
try {
    $adminStudents = DB::table('students')->where('role', 'admin')->get();
    echo "Students with admin role: " . $adminStudents->count() . "\n";
    
    foreach ($adminStudents as $student) {
        echo "ID: {$student->id}, Email: {$student->email}, Name: {$student->name}\n";
    }
} catch (Exception $e) {
    echo "Error accessing students table: " . $e->getMessage() . "\n";
}
