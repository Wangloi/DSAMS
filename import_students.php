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

// Read the student data file
$file = fopen('STUDENT-INFORMATION-SHEET-Responses (1).txt', 'r');
if (!$file) {
    die("Cannot open the student data file.");
}

// Skip the header lines (first 4 lines)
for ($i = 0; $i < 4; $i++) {
    fgets($file);
}

$studentIdCounter = 5; // Start from ID 5 since we already have 1-4
$hashedPassword = '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6'; // Default password: "password"

echo "Starting student data import...\n";
$importedCount = 0;
$skippedCount = 0;

while (($line = fgets($file)) !== false) {
    $line = trim($line);
    if (empty($line)) continue;

    // Split by tabs
    $fields = explode("\t", $line);
    
    // Skip if we don't have enough fields
    if (count($fields) < 30) {
        echo "Skipping line - insufficient fields: " . substr($line, 0, 50) . "...\n";
        $skippedCount++;
        continue;
    }

    // Extract data from fields
    $timestamp = $fields[0] ?? '';
    
    // Convert timestamp format (MM/DD/YYYY HH:MM:SS to YYYY-MM-DD HH:MM:SS)
    $formattedTimestamp = null;
    if (!empty($timestamp)) {
        // Handle format like "10/9/2025 18:14:02"
        if (preg_match('/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/', $timestamp, $matches)) {
            $month = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $day = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            $hour = $matches[4];
            $minute = $matches[5];
            $second = $matches[6];
            $formattedTimestamp = "$year-$month-$day $hour:$minute:$second";
        }
    }
    $email = $fields[1] ?? '';
    $yearLevel = $fields[2] ?? '';
    $entryStatus = $fields[3] ?? '';
    $program = $fields[4] ?? '';
    $major = $fields[5] ?? '';
    $major2 = $fields[6] ?? '';
    $surname = $fields[7] ?? '';
    $givenName = $fields[8] ?? '';
    $middleName = $fields[9] ?? '';
    $homeAddress = $fields[10] ?? '';
    $birthday = $fields[11] ?? '';
    $placeOfBirth = $fields[12] ?? '';
    $gender = $fields[13] ?? '';
    $contactNumber = $fields[14] ?? '';
    $emailField = $fields[15] ?? '';
    $nationality = $fields[16] ?? '';
    $religion = $fields[17] ?? '';
    $elementarySchool = $fields[18] ?? '';
    $elementaryYear = $fields[19] ?? '';
    $juniorHighSchool = $fields[20] ?? '';
    $juniorHighYear = $fields[21] ?? '';
    $seniorHighSchool = $fields[22] ?? '';
    $seniorHighYear = $fields[23] ?? '';
    $motherName = $fields[24] ?? '';
    $motherContact = $fields[25] ?? '';
    $fatherName = $fields[26] ?? '';
    $fatherContact = $fields[27] ?? '';
    $guardianName = $fields[28] ?? '';
    $guardianRelation = $fields[29] ?? '';
    $guardianContact = $fields[30] ?? '';

    // Clean up data
    $email = strtolower(trim($email));
    $surname = trim($surname);
    $givenName = trim($givenName);
    $middleName = trim($middleName);
    $fullName = trim($surname . ' ' . $givenName . ' ' . $middleName);
    $studentId = '2025-' . str_pad($studentIdCounter, 3, '0', STR_PAD_LEFT);

    // Convert birthday format (MM/DD/YYYY to YYYY-MM-DD)
    $birthdayDb = null;
    if (!empty($birthday) && $birthday !== 'N/A') {
        $dateParts = explode('/', $birthday);
        if (count($dateParts) === 3) {
            $birthdayDb = $dateParts[2] . '-' . str_pad($dateParts[0], 2, '0', STR_PAD_LEFT) . '-' . str_pad($dateParts[1], 2, '0', STR_PAD_LEFT);
        }
    }

    // Clean up year fields (extract only the year number)
    $elementaryYear = preg_replace('/[^0-9]/', '', $elementaryYear);
    $juniorHighYear = preg_replace('/[^0-9]/', '', $juniorHighYear);
    $seniorHighYear = preg_replace('/[^0-9]/', '', $seniorHighYear);

    // Convert to integers or null
    $elementaryYear = !empty($elementaryYear) ? (int)$elementaryYear : null;
    $juniorHighYear = !empty($juniorHighYear) ? (int)$juniorHighYear : null;
    $seniorHighYear = !empty($seniorHighYear) ? (int)$seniorHighYear : null;

    // Check if student already exists
    $checkStmt = $pdo->prepare("SELECT id FROM students WHERE email = ?");
    $checkStmt->execute([$email]);
    
    if ($checkStmt->fetch()) {
        echo "Student already exists: $email - Skipping\n";
        $skippedCount++;
        continue;
    }

    // Insert student record
    try {
        $sql = "INSERT INTO students (
            name, email, email_verified_at, password, first_name, middle_name, last_name,
            student_id, course, year_level, role, is_active, qr_code_path, remember_token,
            created_at, updated_at, entry_status, program, major, home_address, birthday,
            place_of_birth, religion, gender, contact_no, nationality, elementary_school,
            elementary_year_graduated, junior_high_school, junior_high_year_graduated,
            senior_high_school, senior_high_year_graduated, mother_name, mother_contact,
            father_name, father_contact, guardian_name, guardian_relation, guardian_contact,
            is_archived, program_id
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $fullName,
            $email,
            null,
            $hashedPassword,
            $givenName,
            $middleName,
            $surname,
            $studentId,
            $program,
            $yearLevel,
            'Student',
            1,
            null,
            null,
            $formattedTimestamp,
            $formattedTimestamp,
            $entryStatus,
            $program,
            $major,
            $homeAddress,
            $birthdayDb,
            $placeOfBirth,
            $religion,
            $gender,
            $contactNumber,
            $nationality,
            $elementarySchool,
            $elementaryYear,
            $juniorHighSchool,
            $juniorHighYear,
            $seniorHighSchool,
            $seniorHighYear,
            $motherName,
            $motherContact,
            $fatherName,
            $fatherContact,
            $guardianName,
            $guardianRelation,
            $guardianContact,
            0,
            null
        ]);

        echo "Imported: $studentId - $fullName ($email)\n";
        $importedCount++;
        $studentIdCounter++;

    } catch (PDOException $e) {
        echo "Error importing $email: " . $e->getMessage() . "\n";
        $skippedCount++;
    }
}

fclose($file);

echo "\nImport completed!\n";
echo "Successfully imported: $importedCount students\n";
echo "Skipped: $skippedCount students\n";

// Verify import
$totalStmt = $pdo->query("SELECT COUNT(*) as total FROM students");
$total = $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];
echo "Total students in database: $total\n";
?>
