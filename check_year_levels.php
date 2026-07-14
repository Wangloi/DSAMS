<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

use App\Models\Student;

$yearLevels = Student::distinct('year_level')->pluck('year_level');

echo "Available year levels:\n";
foreach ($yearLevels as $yearLevel) {
    echo "- " . $yearLevel . "\n";
}
