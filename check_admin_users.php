<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking admin_users table:\n\n";

// Check if admin_users table exists
try {
    $columns = DB::select("DESCRIBE admin_users");
    echo "admin_users table exists with columns:\n";
    foreach ($columns as $column) {
        echo "- {$column->Field} ({$column->Type})\n";
    }
    
    echo "\nAdmin users data:\n";
    $admins = DB::table('admin_users')->get();
    echo "Total admin users: " . $admins->count() . "\n\n";
    
    foreach ($admins as $admin) {
        echo "ID: {$admin->id}\n";
        echo "Name: {$admin->name}\n";
        echo "Email: {$admin->email}\n";
        echo "Created: {$admin->created_at}\n";
        echo "------------------------\n";
    }
    
} catch (Exception $e) {
    echo "Error accessing admin_users table: " . $e->getMessage() . "\n";
}
