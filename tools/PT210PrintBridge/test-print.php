<?php

$payload = [
    'student_name' => 'Juan Dela Cruz',
    'student_id' => '2026-00123',
    'program' => 'BSIT 3rd Year',
    'case_text' => 'Medical Absence',
    'reason_text' => 'Severe Fever',
    'date' => 'September 21, 2026',
    'valid_until' => 'September 28, 2026',
    'status' => 'APPROVED',
];

$ch = curl_init('http://127.0.0.1:9101/print/admission-slip');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
