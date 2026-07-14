<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$tables = Schema::getTableListing();

echo "Tables with attendance:\n";
foreach ($tables as $table) {
    if (strpos($table, 'attendance') !== false) {
        echo "- " . $table . "\n";
    }
}

echo "\nAll tables:\n";
foreach ($tables as $table) {
    echo "- " . $table . "\n";
}
