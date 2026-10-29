<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$s = \App\Models\Student::find(501);
echo $s ? json_encode($s->only(['id', 'student_id', 'email', 'name', 'status', 'verification_status', 'home_address'])) : "Student 501 not found locally\n";
