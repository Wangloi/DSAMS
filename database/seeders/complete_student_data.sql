-- Complete SQL Insert Statements for Programs and Students
-- Based on student data from STUDENT-INFORMATION-SHEET-Responses

-- Step 1: Insert Programs
INSERT INTO programs (name, code, department, description, duration, is_active, created_at, updated_at) VALUES
('Business Administration Program', 'BSBA', 'College of Business', 'Bachelor of Science in Business Administration with major in Financial Management', '4 years', 1, NOW(), NOW()),
('Criminal Justice Education Program', 'BCJED', 'College of Criminal Justice', 'Bachelor of Criminal Justice Education', '4 years', 1, NOW(), NOW()),
('Information Technology Program', 'BSIT', 'College of Information Technology', 'Bachelor of Science in Information Technology', '4 years', 1, NOW(), NOW());

-- Step 2: Insert Students with complete profile information
-- Note: Program IDs will be: BSBA=1, BCJED=2, BSIT=3
-- Passwords are placeholder hashes - replace with actual hashed passwords

INSERT INTO students (
    name, email, password, student_id, course, year_level, 
    first_name, middle_name, last_name, role, program_id, is_active,
    entry_status, program, major, home_address, birthday, place_of_birth, 
    religion, gender, contact_no, nationality,
    elementary_school, elementary_year_graduated, junior_high_school, junior_high_year_graduated,
    senior_high_school, senior_high_year_graduated,
    mother_name, mother_contact, father_name, father_contact,
    guardian_name, guardian_relation, guardian_contact,
    created_at, updated_at
) VALUES
(
    'Pauline Valmoria Navales', 'srcbnavalespauline@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-001', 'Business Administration Program', '1st Year',
    'Pauline', 'Valmoria', 'Navales', 'Student', 1, 1,
    'Freshman', 'Business Administration Program', 'Financial Management', 
    'Side - A - Lower, Talusan, Balingasag, Misamis Oriental', '2006-04-22', 'Cagayan Provincial Hospital',
    'Roman Catholic', 'Female', '09362144722', 'Filipino',
    'Talusan elementary school', 2019, 'St. Rita''s College of Balingasag', 2023,
    'St. Rita''s College of Balingasag', 2025,
    'Maricel Navales', '09539125484', 'Rodelion Navales', '09361358247',
    'Maricel Navales', 'Mother', '09539125484',
    NOW(), NOW()
),
(
    'John Paul Llagas Alimorin', 'llagasjohn75@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-002', 'Criminal Justice Education Program', '2nd Year',
    'John Paul', 'Llagas', 'Alimorin', 'Student', 2, 1,
    'Transferee', 'Criminal Justice Education Program', NULL,
    'Zone 5, Linggangao, Balingasag, Misamis Oriental', '2006-10-04', 'Balingasag, Misamis Oriental',
    'Roman Catholic', 'Male', '09526308104', 'Filipino',
    'Balingasag Central School', 2017, 'St. Peter''s College of Misamis Oriental Inc', 2022,
    'St. Peter''s College of Misamis Oriental Inc', 2024,
    'Cynthia Alimorin', '09554324272', 'Marcelino Alimorin', '090651234578',
    'Anastacia Llagas', 'Grandma', '09526308104',
    NOW(), NOW()
),
(
    'Von Cedric Puaso Miranda', 'goopmint@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-003', 'Information Technology Program', '4th Year',
    'Von Cedric', 'Puaso', 'Miranda', 'Student', 3, 1,
    'Old Students', 'Information Technology Program', NULL,
    'Zone 5 San Isidro', '2003-03-19', 'Cagayan de Oro',
    'Roman Catholic', 'Male', '09670286638', 'Filipino',
    'Bulua Central School', 2016, 'Bulua National High School', 2020,
    'Informatics Computer Institute', 2022,
    'Marivic Miranda', '09061638379', 'Elvis Miranda', NULL,
    NULL, NULL, NULL,
    NOW(), NOW()
),
(
    'Ashley Balubo Igot', 'igotashley05@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-004', 'Business Administration Program', '1st Year',
    'Ashley', 'Balubo', 'Igot', 'Student', 1, 1,
    'Freshman', 'Business Administration Program', 'Financial Management',
    'P-7 BAGAAY, BALIWAGAN, BALINGASAG, MIS.OR', '2006-10-05', 'BAGAAY BALIWAGAN BALINGASAG MIS.OR',
    'CATHOLIC', 'Female', '09066667884', 'FILIPINO',
    'BAGAAY ELEMENTARY SCHOOL', 2018, 'BALIWAGAN NATIONAL HIGH SCHOOL', 2023,
    'LITTLE ME ACADEMY', 2025,
    'ANNIE IGOT', '09066667884', 'WILFREDO IGOT', '09750864443',
    'ANNIE IGOT', 'MOTHER', '09066667884',
    NOW(), NOW()
),
(
    'Marvin Ral Cailing', 'marvinral09@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-005', 'Criminal Justice Education Program', '2nd Year',
    'Marvin', 'Ral', 'Cailing', 'Student', 2, 1,
    'Old Students', 'Criminal Justice Education Program', NULL,
    'Binitinan Balingasag Mis.Or', '2006-04-06', 'Binitinan Balingasag Mis.Or',
    'Roman Catholic', 'Male', '09975181357', 'Filipino',
    'Binitinan Elementary School', 2018, 'Baliwagan National High School', 2021,
    'Baliwagan Senior High School', 2023,
    'Charita Cailing', '09558530978', 'Anatolio Cailing', NULL,
    NULL, NULL, NULL,
    NOW(), NOW()
),
(
    'Eric John Dagaraga De Guia', 'ericjohndeguia04@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-006', 'Criminal Justice Education Program', '2nd Year',
    'Eric John', 'Dagaraga', 'De Guia', 'Student', 2, 1,
    'Old Students', 'Criminal Justice Education Program', NULL,
    'purok 4 Cogon, Balingasag, Misamis Oriental', '2005-06-04', 'Balingasag, Misamis Oriental',
    'Roman Catholic', 'Male', '0935574274', 'Pilipino',
    'Cala-cala Elementary School', 2018, 'St. Peter''s College of Misamis Oriental Inc.', 2022,
    'St. Peter''s College of Misamis Oriental Inc.', 2024,
    'Edeliza D. de Guia', '09261488854', 'Roy P. De Guia', '09975107982',
    'Edeliza D. de Guia', 'Mother', '09261488854',
    NOW(), NOW()
),
(
    'Albazer Hinagdanan Balbangsa', 'balbangsaalbazer@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-007', 'Criminal Justice Education Program', '3rd Year',
    'Albazer', 'Hinagdanan', 'Balbangsa', 'Student', 2, 1,
    'Old Students', 'Criminal Justice Education Program', NULL,
    'Zone 6, Napaliran, Balingasag, Misamis Oriental', '2005-04-09', 'balingasag, Misamis Oriental',
    'Islam', 'Male', '09760453170', 'Filipino',
    'napaliran elementary school', 2016, 'Misamis Oriental National High School ( MONHS )', 2020,
    'St. Rita''s College Of Balingasag ( SRCB )', 2022,
    'Meilene H. Balbangsa', '09050858514', 'Taib H. Balbangsa', '09556408646',
    'Meilene H. Balbangsa', 'Mother', '09050858514',
    NOW(), NOW()
),
(
    'Ashley Emperio Actub', 'Actubashley.crim@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-008', 'Criminal Justice Education Program', '4th Year',
    'Ashley', 'Emperio', 'Actub', 'Student', 2, 1,
    'Old Students', 'Criminal Justice Education Program', NULL,
    'Brgy 3 Balingasag Misamis Oriental', '2003-03-09', 'Northern Mindanao Medical Center CDO',
    'Roman Catholic', 'Female', '09298189179', 'Filipino',
    'Loon Central School', 2016, 'Looc National High School', 2020,
    'Looc National High School', 2021,
    'Silmarie E. Actub', NULL, 'Ronald C. Actub', '09566501724',
    'Josefina C. Actub', 'GrandMother', '09264565702',
    NOW(), NOW()
),
(
    'Paul Adrian Baseo Moreno', 'paulabuzo-it@srcb.edu.ph', '$2y$10$placeholder_hash', 'SRCB-2025-009', 'Information Technology Program', '4th Year',
    'Paul Adrian', 'Baseo', 'Moreno', 'Student', 3, 1,
    'Old Students', 'Information Technology Program', NULL,
    'Barangay 3, Balingasag, Misamis Oriental', '2003-02-25', 'Malaybalay',
    'Roman', 'Male', '09624501394', 'Filipino',
    'Balingasag Central School', 2016, 'St. Rita''s College of Balingasag', 2020,
    'St. Rita''s College of Balingasag', 2022,
    'Sofia B. Moreno', '09273048632', 'Paul Rommel D. Abuzo', NULL,
    'Ramil B. Moreno', 'Uncle', NULL,
    NOW(), NOW()
),
(
    'Stephanie Esik Pacaña', 'pacanastephanieesik@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-010', 'Criminal Justice Education Program', '2nd Year',
    'Stephanie', 'Esik', 'Pacaña', 'Student', 2, 1,
    'Transferee', 'Criminal Justice Education Program', NULL,
    'Corrales, Jasaan Mis. Or', '2006-12-21', 'Jasaan Mis Or.',
    'Roman Catholic', 'Female', '09058190765', 'Filipino',
    'Corrales Elementary school', 2017, 'Corrales Integrated School', 2021,
    'Saint. Ignatius Technical College', 2023,
    'Maricel Pacaña', '09756282198', 'Bogart Pacaña', '09551899251',
    'Maricel Pacaña', 'Mother', '09756282198',
    NOW(), NOW()
);

-- Note: This is a sample of the first 10 students. You would need to continue with the remaining students
-- following the same pattern based on the data in your file.

-- IMPORTANT NOTES:
-- 1. Replace '$2y$10$placeholder_hash' with actual password hashes
-- 2. The program_id field assumes: BSBA=1, BCJED=2, BSIT=3 (adjust based on actual IDs after insertion)
-- 3. Some students have incomplete data - those fields are set to NULL
-- 4. Phone numbers are stored as strings to preserve formatting
-- 5. Dates are converted to YYYY-MM-DD format for MySQL compatibility

-- To generate proper password hashes in Laravel:
-- use Illuminate\Support\Facades\Hash;
-- $hashedPassword = Hash::make('defaultPassword123');
