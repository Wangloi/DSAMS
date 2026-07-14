-- SQL Insert Statements for Students
-- Based on student data from STUDENT-INFORMATION-SHEET-Responses

-- First, get the program IDs (these would be assigned after inserting programs)
-- Assuming program IDs: BSBA=1, BCJED=2, BSIT=3

INSERT INTO students (name, email, password, student_id, course, year_level, first_name, middle_name, last_name, role, program_id, is_active, created_at, updated_at) VALUES
('Pauline Valmoria Navales', 'srcbnavalespauline@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-001', 'Business Administration Program', '1st Year', 'Pauline', 'Valmoria', 'Navales', 'Student', 1, 1, NOW(), NOW()),
('John Paul Llagas Alimorin', 'llagasjohn75@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-002', 'Criminal Justice Education Program', '2nd Year', 'John Paul', 'Llagas', 'Alimorin', 'Student', 2, 1, NOW(), NOW()),
('Von Cedric Puaso Miranda', 'goopmint@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-003', 'Information Technology Program', '4th Year', 'Von Cedric', 'Puaso', 'Miranda', 'Student', 3, 1, NOW(), NOW()),
('Ashley Balubo Igot', 'igotashley05@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-004', 'Business Administration Program', '1st Year', 'Ashley', 'Balubo', 'Igot', 'Student', 1, 1, NOW(), NOW()),
('Marvin Ral Cailing', 'marvinral09@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-005', 'Criminal Justice Education Program', '2nd Year', 'Marvin', 'Ral', 'Cailing', 'Student', 2, 1, NOW(), NOW()),
('Eric John Dagaraga De Guia', 'ericjohndeguia04@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-006', 'Criminal Justice Education Program', '2nd Year', 'Eric John', 'Dagaraga', 'De Guia', 'Student', 2, 1, NOW(), NOW()),
('Albazer Hinagdanan Balbangsa', 'balbangsaalbazer@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-007', 'Criminal Justice Education Program', '3rd Year', 'Albazer', 'Hinagdanan', 'Balbangsa', 'Student', 2, 1, NOW(), NOW()),
('Ashley Emperio Actub', 'Actubashley.crim@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-008', 'Criminal Justice Education Program', '4th Year', 'Ashley', 'Emperio', 'Actub', 'Student', 2, 1, NOW(), NOW()),
('Paul Adrian Baseo Moreno', 'paulabuzo-it@srcb.edu.ph', '$2y$10$placeholder_hash', 'SRCB-2025-009', 'Information Technology Program', '4th Year', 'Paul Adrian', 'Baseo', 'Moreno', 'Student', 3, 1, NOW(), NOW()),
('Stephanie Esik Pacaña', 'pacanastephanieesik@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-010', 'Criminal Justice Education Program', '2nd Year', 'Stephanie', 'Esik', 'Pacaña', 'Student', 2, 1, NOW(), NOW()),
('Marlone Pornia De loyola', 'marlonedeloyola@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-011', 'Business Administration Program', '3rd Year', 'Marlone', 'Pornia', 'De loyola', 'Student', 1, 1, NOW(), NOW()),
('Feliph Austine Salazar Khu', 'austinekhu05@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-012', 'Criminal Justice Education Program', '2nd Year', 'Feliph Austine', 'Salazar', 'Khu', 'Student', 2, 1, NOW(), NOW()),
('Michaella Denise Cañeda Ocampo', 'michaellaocampo7@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-013', 'Business Administration Program', '3rd Year', 'Michaella Denise', 'Cañeda', 'Ocampo', 'Student', 1, 1, NOW(), NOW()),
('Ma.flor Caday Ellevera', 'florellevera07@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-014', 'Business Administration Program', '1st Year', 'Ma.flor', 'Caday', 'Ellevera', 'Student', 1, 1, NOW(), NOW()),
('Lovely Heart Suezo Rojas', 'lovelyheartrojas@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-015', 'Criminal Justice Education Program', '2nd Year', 'Lovely Heart', 'Suezo', 'Rojas', 'Student', 2, 1, NOW(), NOW()),
('Jaco Paredes Sinogaya', 'jacosinogaya28@Email.com', '$2y$10$placeholder_hash', 'SRCB-2025-016', 'Criminal Justice Education Program', '2nd Year', 'Jaco', 'Paredes', 'Sinogaya', 'Student', 2, 1, NOW(), NOW()),
('Kate Galamiton Magpulong', 'magpulongkate23@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-017', 'Criminal Justice Education Program', '1st Year', 'Kate', 'Galamiton', 'Magpulong', 'Student', 2, 1, NOW(), NOW()),
('John Russel Aganap Crucio', 'johnimbajohnrusselcrucio@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-018', 'Criminal Justice Education Program', '2nd Year', 'John Russel', 'Aganap', 'Crucio', 'Student', 2, 1, NOW(), NOW()),
('Clint Jonel Rosalada Salo', 'saloclint@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-019', 'Criminal Justice Education Program', '1st Year', 'Clint Jonel', 'Rosalada', 'Salo', 'Student', 2, 1, NOW(), NOW()),
('Mia Elleguera Cagalawan', 'cagalawanmia143@gnail.com', '$2y$10$placeholder_hash', 'SRCB-2025-020', 'Business Administration Program', '3rd Year', 'Mia', 'Elleguera', 'Cagalawan', 'Student', 1, 1, NOW(), NOW()),
('Kiara Brent Ubalde Virtudazo', 'kemvirs804@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-021', 'Criminal Justice Education Program', '3rd Year', 'Kiara Brent', 'Ubalde', 'Virtudazo', 'Student', 2, 1, NOW(), NOW()),
('Diosebel Airose Gerarman Tadlas', 'airosetadlas@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-022', 'Business Administration Program', '2nd Year', 'Diosebel Airose', 'Gerarman', 'Tadlas', 'Student', 1, 1, NOW(), NOW()),
('Thobe Ohiman Amboayan', 'amboayanvenz@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-023', 'Criminal Justice Education Program', '1st Year', 'Thobe', 'Ohiman', 'Amboayan', 'Student', 2, 1, NOW(), NOW()),
('Jenrich Del Puerto', 'jenrich599@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-024', 'Criminal Justice Education Program', '1st Year', 'Jenrich', NULL, 'Del Puerto', 'Student', 2, 1, NOW(), NOW()),
('Ferly Nicole Limbaga De los Santos', 'delossantosferlynicole00@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-025', 'Criminal Justice Education Program', '1st Year', 'Ferly Nicole', 'Limbaga', 'De los Santos', 'Student', 2, 1, NOW(), NOW()),
('Reymark Ecarro Abales', 'reymarkabales376@gmail.com', '$2y$10$placeholder_hash', 'SRCB-2025-026', 'Criminal Justice Education Program', '1st Year', 'Reymark', 'Ecarro', 'Abales', 'Student', 2, 1, NOW(), NOW());

-- Note: The passwords are placeholder hashes. In a real application, you would need to:
-- 1. Generate proper password hashes for each student
-- 2. Either use a default password or extract from the data if available
-- 3. Consider using Laravel's Hash facade to generate proper hashes

-- Example of generating proper password hashes in Laravel:
-- use Illuminate\Support\Facades\Hash;
-- $hashedPassword = Hash::make('defaultPassword123');
