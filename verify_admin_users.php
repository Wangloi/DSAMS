<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\AdminManageUsersController;

echo "Verifying Manage Users controller output...\n\n";

$controller = new AdminManageUsersController();
$response = $controller->index();

$users = $response->props['students'] ?? [];

echo "Total users returned: " . count($users) . "\n\n";

// Count by user type
$counts = [
    'students' => 0,
    'program_heads' => 0,
    'admins' => 0
];

foreach ($users as $user) {
    $userType = $user['userType'] ?? 'student';
    if ($userType === 'admin') {
        $counts['admins']++;
    } elseif ($userType === 'program_head') {
        $counts['program_heads']++;
    } else {
        $counts['students']++;
    }
}

echo "User type breakdown:\n";
echo "- Students: " . $counts['students'] . "\n";
echo "- Program Heads: " . $counts['program_heads'] . "\n";
echo "- Administrators: " . $counts['admins'] . "\n\n";

if ($counts['admins'] === 2) {
    echo "✅ Correct: Showing exactly 2 administrators from admin_users table\n\n";
    echo "Administrator details:\n";
    foreach ($users as $user) {
        if (($user['userType'] ?? 'student') === 'admin') {
            echo "- ID: {$user['student_id']}, Name: {$user['name']}, Email: {$user['email']}\n";
        }
    }
} else {
    echo "❌ Error: Expected 2 administrators, but found " . $counts['admins'] . "\n";
}
