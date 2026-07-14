# Database Seed Data Usage Guide

This directory contains seed data for programs and students based on the STUDENT-INFORMATION-SHEET-Responses file.

## Files Created

1. **`programs_seed.sql`** - SQL insert statements for programs only
2. **`students_seed.sql`** - SQL insert statements for students only
3. **`complete_student_data.sql`** - Complete SQL with both programs and students
4. **`ProgramsAndStudentsSeeder.php`** - Laravel seeder class
5. **`README.md`** - This usage guide

## Data Overview

### Programs Created
- **Business Administration Program (BSBA)** - College of Business
- **Criminal Justice Education Program (BCJED)** - College of Criminal Justice  
- **Information Technology Program (BSIT)** - College of Information Technology

### Students Created
- 26 students extracted from the data file
- Complete profile information including:
  - Personal details (name, address, contact, etc.)
  - Academic background (elementary, junior high, senior high)
  - Family information (parents/guardians)
  - Program enrollment details

## Usage Instructions

### Option 1: Using Laravel Seeder (Recommended)

1. **Add the seeder to DatabaseSeeder.php:**
   ```php
   // In database/seeders/DatabaseSeeder.php
   public function run(): void
   {
       $this->call([
           ProgramsAndStudentsSeeder::class,
       ]);
   }
   ```

2. **Run the seeder:**
   ```bash
   php artisan db:seed --class=ProgramsAndStudentsSeeder
   ```

### Option 2: Using Raw SQL Files

1. **Import complete data:**
   ```bash
   mysql -u username -p database_name < database/seeders/complete_student_data.sql
   ```

2. **Or import separately:**
   ```bash
   mysql -u username -p database_name < database/seeders/programs_seed.sql
   mysql -u username -p database_name < database/seeders/students_seed.sql
   ```

## Important Notes

### Passwords
- Default password for all students: `password123`
- **IMPORTANT**: Change passwords in production environment
- Passwords are properly hashed using Laravel's Hash facade

### Data Validation
- Email addresses are validated for uniqueness
- Student IDs are formatted as `SRCB-2025-XXX`
- Program relationships are properly established

### Missing Data
- Some students have incomplete guardian information
- Phone numbers are stored as strings to preserve formatting
- Empty fields are set to NULL in the database

## Customization

### Adding More Students
1. Extract data from additional entries in the source file
2. Follow the same format in the seeder
3. Increment student_id numbers appropriately

### Modifying Programs
1. Update program details in the seeder
2. Ensure program codes match existing data
3. Update department and duration as needed

### Password Changes
```php
// In ProgramsAndStudentsSeeder.php
'password' => Hash::make('your_secure_password'),
```

## Database Schema Requirements

The seeder expects the following database structure:

### Programs Table
- `id` (primary key)
- `name` (string, unique)
- `code` (string, unique)
- `department` (string, nullable)
- `description` (text, nullable)
- `duration` (string, nullable)
- `is_active` (boolean)
- `timestamps`

### Students Table
- `id` (primary key)
- `name` (string)
- `email` (string, unique)
- `password` (string)
- `student_id` (string, unique)
- `course` (string)
- `year_level` (string)
- `first_name`, `middle_name`, `last_name` (string, nullable)
- `role` (string)
- `program_id` (foreign key)
- `is_active` (boolean)
- Plus all profile fields from the registration migration

## Troubleshooting

### Foreign Key Constraints
- Ensure programs are inserted before students
- Check that program_id references exist

### Duplicate Data
- Clear existing data before seeding:
  ```php
  Student::truncate();
  Program::truncate();
  ```

### Migration Issues
- Run migrations before seeding:
  ```bash
  php artisan migrate
  ```

## Security Considerations

1. **Change default passwords** before production deployment
2. **Review student data** for sensitive information
3. **Validate email formats** and contact information
4. **Consider data privacy** requirements for your institution

## Next Steps

1. Test the seeded data in your development environment
2. Verify program-student relationships work correctly
3. Test the Programs page with the new data
4. Update any additional features that depend on this data
