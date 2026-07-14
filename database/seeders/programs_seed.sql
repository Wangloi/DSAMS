-- SQL Insert Statements for Programs
-- Based on student data from STUDENT-INFORMATION-SHEET-Responses

-- Insert Programs
INSERT INTO programs (name, code, department, description, duration, is_active, created_at, updated_at) VALUES
('Business Administration Program', 'BSBA', 'College of Business', 'Bachelor of Science in Business Administration with major in Financial Management', '4 years', 1, NOW(), NOW()),
('Criminal Justice Education Program', 'BCJED', 'College of Criminal Justice', 'Bachelor of Criminal Justice Education', '4 years', 1, NOW(), NOW()),
('Information Technology Program', 'BSIT', 'College of Information Technology', 'Bachelor of Science in Information Technology', '4 years', 1, NOW(), NOW());

-- Program-Student relationship table (if exists)
-- Note: This assumes there's a program_student pivot table
-- If not, students will be linked through program_id in students table
