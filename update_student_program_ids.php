<?php
require_once 'vendor/autoload.php';

// Database connection
$host = 'localhost';
$dbname = 'dsams';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

echo "Updating student program IDs...\n";

// Program mapping based on program names
$programMapping = [
    'Hospitality Management Program' => 1,
    'Business Administration Program' => 2,
    'Criminal Justice Education Program' => 3,
    'Teacher Education Program' => 4,
    'Information Technology Program' => 5
];

$updatedCount = 0;

foreach ($programMapping as $programName => $programId) {
    echo "Updating students in: $programName (ID: $programId)\n";
    
    // Update students with this program name
    $stmt = $pdo->prepare("UPDATE students SET program_id = ? WHERE program = ?");
    $result = $stmt->execute([$programId, $programName]);
    
    $affected = $stmt->rowCount();
    $updatedCount += $affected;
    
    echo "Updated $affected students\n";
}

echo "\nTotal students updated: $updatedCount\n";

// Verify the updates
echo "\nVerification:\n";
$verifyStmt = $pdo->query("
    SELECT p.name as program_name, COUNT(s.id) as student_count 
    FROM programs p 
    LEFT JOIN students s ON p.id = s.program_id 
    GROUP BY p.id, p.name 
    ORDER BY p.id
");

while ($row = $verifyStmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['program_name'] . ": " . $row['student_count'] . " students\n";
}

// Check for any students still without program_id
$nullCheck = $pdo->query("SELECT COUNT(*) as count FROM students WHERE program_id IS NULL");
$nullCount = $nullCheck->fetch(PDO::FETCH_ASSOC)['count'];

if ($nullCount > 0) {
    echo "\nWarning: $nullCount students still have NULL program_id\n";
    
    // Show some examples of unmatched programs
    $unmatchedStmt = $pdo->query("
        SELECT DISTINCT program, COUNT(*) as count 
        FROM students 
        WHERE program_id IS NULL 
        GROUP BY program 
        LIMIT 10
    ");
    
    echo "Unmatched programs:\n";
    while ($row = $unmatchedStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- " . $row['program'] . ": " . $row['count'] . " students\n";
    }
} else {
    echo "\nAll students have been successfully assigned to programs!\n";
}
?>
