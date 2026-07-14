-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for dsams
CREATE DATABASE IF NOT EXISTS `dsams` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dsams`;

-- Dumping structure for table dsams.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_created_at_index` (`created_at`),
  KEY `activity_logs_user_type_index` (`user_type`),
  KEY `activity_logs_module_index` (`module`),
  KEY `activity_logs_action_index` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.activity_logs: ~3 rows (approximately)
INSERT INTO `activity_logs` (`id`, `user_name`, `user_type`, `module`, `action`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
	(1, NULL, NULL, 'Authentication', 'Login Failed', 'Admin login failed for email: admin@example.com', NULL, '2026-05-09 19:14:31', '2026-05-09 19:14:31');
INSERT INTO `activity_logs` (`id`, `user_name`, `user_type`, `module`, `action`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
	(2, NULL, NULL, 'Authentication', 'Login Failed', 'Admin login failed for email: admin@example.com', NULL, '2026-05-09 19:14:41', '2026-05-09 19:14:41');
INSERT INTO `activity_logs` (`id`, `user_name`, `user_type`, `module`, `action`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
	(3, NULL, NULL, 'Authentication', 'Login Failed', 'Admin login failed for email: admin@example.com', NULL, '2026-05-09 19:14:58', '2026-05-09 19:14:58');

-- Dumping structure for table dsams.admin_users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.admin_users: ~0 rows (approximately)
INSERT INTO `admin_users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
	(1, 'Administrator', 'admin@example.com', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', NULL, NOW(), NOW());

-- Dumping structure for table dsams.admission_slips
CREATE TABLE IF NOT EXISTS `admission_slips` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned DEFAULT NULL,
  `student_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program_year_level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_issued` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valid_until` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_slips_is_archived_index` (`is_archived`),
  KEY `admission_slips_student_id_index` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.admission_slips: ~0 rows (approximately)
INSERT INTO `admission_slips` (`id`, `student_id`, `student_name`, `program_year_level`, `date_issued`, `case_text`, `reason_text`, `valid_until`, `status`, `is_archived`, `created_at`, `updated_at`) VALUES
	(1, 2, 'LEDDA ACIERTO', 'Hospitality Management Program - 3rd Year', '2025-10-15', 'Medical Emergency', 'Student experienced sudden illness during class', '2025-10-22', 'APPROVED', 0, '2025-10-15 09:30:00', '2025-10-15 10:15:00'),
	(2, 3, 'AGCOPRA ABINES', 'Hospitality Management Program - 3rd Year', '2025-10-14', 'Family Emergency', 'Death in the family requires student to attend funeral', '2025-10-21', 'APPROVED', 0, '2025-10-14 14:20:00', '2025-10-14 15:45:00'),
	(3, 4, 'ABAO ZARATE', 'Hospitality Management Program - 2nd Year', '2025-10-16', 'Dental Appointment', 'Student has scheduled dental surgery', '2025-10-17', 'PENDING', 0, '2025-10-16 08:00:00', '2025-10-16 08:00:00'),
	(4, 8, 'ROA CLARENCE MANUEL', 'Hospitality Management Program - 2nd Year', '2025-10-13', 'Personal Business', 'Student needs to process important documents', '2025-10-15', 'APPROVED', 0, '2025-10-13 11:30:00', '2025-10-13 13:20:00'),
	(5, 9, 'LLIDO AUSTIN BOB', 'Business Administration Program - 3rd Year', '2025-10-12', 'Academic Competition', 'Student representing school in regional competition', '2025-10-14', 'APPROVED', 0, '2025-10-12 07:45:00', '2025-10-12 09:30:00'),
	(6, 10, 'MIGUELA FERNANDO', 'Hospitality Management Program - 4th Year', '2025-10-11', 'Medical Check-up', 'Annual medical examination required', '2025-10-12', 'COMPLETED', 1, '2025-10-11 10:00:00', '2025-10-12 16:30:00'),
	(7, 11, 'DOCUMENTO MILCA', 'Business Administration Program - 1st Year', '2025-10-15', 'Counseling Session', 'Student requested guidance counseling', '2025-10-15', 'PENDING', 0, '2025-10-15 13:15:00', '2025-10-15 13:15:00'),
	(8, 12, 'SALVACION ENJEL', 'Business Administration Program - 4th Year', '2025-10-10', 'Visiting Relatives', 'Family visiting from abroad', '2025-10-12', 'APPROVED', 0, '2025-10-10 09:00:00', '2025-10-10 10:30:00'),
	(9, 13, 'GENSON ANALIZA GRACE', 'Hospitality Management Program - 3rd Year', '2025-10-14', 'Legal Matter', 'Student needs to attend court hearing', '2025-10-16', 'APPROVED', 0, '2025-10-14 08:30:00', '2025-10-14 11:45:00'),
	(10, 14, 'VEGA LOUIZ ARTH', 'Business Administration Program - 3rd Year', '2025-10-15', 'Workshop/Seminar', 'Professional development workshop attendance', '2025-10-16', 'PENDING', 0, '2025-10-15 10:45:00', '2025-10-15 10:45:00');

-- Dumping structure for table dsams.announcements
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Published',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `target_audience` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `views` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.announcements: ~0 rows (approximately)
INSERT INTO `announcements` (`id`, `title`, `content`, `category`, `status`, `is_archived`, `target_audience`, `scheduled_at`, `views`, `created_at`, `updated_at`, `event_date`, `event_time`) VALUES
	(1, 'Welcome to SY 2025-2026', 'Dear Students, Welcome to the new academic year! We are excited to embark on this journey of learning and growth with you. Please check your respective program boards for important schedules and requirements.', 'General', 'Published', 0, 'all', NULL, 245, '2025-09-01 08:00:00', '2025-09-01 08:00:00', NULL, NULL),
	(2, 'Midterm Examination Schedule', 'Midterm examinations will begin on October 25, 2025. Please prepare accordingly and check your individual schedules. Good luck to all students!', 'Academic', 'Published', 0, 'students', NULL, 189, '2025-10-15 10:30:00', '2025-10-15 10:30:00', '2025-10-25', '08:00:00'),
	(3, 'Faculty Development Workshop', 'A professional development workshop on \'Modern Teaching Methodologies\' will be held on October 20, 2025 at the Conference Hall. All faculty members are required to attend.', 'Faculty', 'Published', 0, 'faculty', NULL, 67, '2025-10-10 14:15:00', '2025-10-10 14:15:00', '2025-10-20', '09:00:00'),
	(4, 'Student Council Elections', 'The Student Council elections for the academic year 2025-2026 will be held on November 15, 2025. Interested students may submit their applications to the Student Affairs Office.', 'Events', 'Published', 0, 'students', NULL, 312, '2025-10-12 11:45:00', '2025-10-12 11:45:00', '2025-11-15', '09:00:00'),
	(5, 'IT System Maintenance', 'The DSAMS portal will undergo scheduled maintenance on October 18, 2025 from 10:00 PM to 2:00 AM. Please save your work and log out before the maintenance period.', 'System', 'Published', 0, 'all', NULL, 156, '2025-10-14 16:20:00', '2025-10-14 16:20:00', '2025-10-18', '22:00:00'),
	(6, 'Hospitality Program Accreditation Visit', 'Our Hospitality Management Program will have its accreditation visit on November 5-6, 2025. Students and faculty are requested to cooperate and support this important evaluation.', 'Program', 'Published', 0, 'hm_students', NULL, 98, '2025-10-08 09:30:00', '2025-10-08 09:30:00', '2025-11-05', '08:00:00'),
	(7, 'Research Paper Submission Deadline', 'Reminder: The deadline for submitting research papers for the annual research colloquium is October 30, 2025. Late submissions will not be accepted.', 'Academic', 'Published', 0, 'students', NULL, 87, '2025-10-11 13:00:00', '2025-10-11 13:00:00', '2025-10-30', '17:00:00'),
	(8, 'New Library Resources', 'The library has acquired new digital resources and e-books. Students can now access these materials through the library portal using their student credentials.', 'Facilities', 'Published', 0, 'all', NULL, 234, '2025-10-13 15:45:00', '2025-10-13 15:45:00', NULL, NULL);

-- Dumping structure for table dsams.attendances
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `checked_out_at` timestamp NULL DEFAULT NULL,
  `check_in_latitude` decimal(10,7) DEFAULT NULL,
  `check_in_longitude` decimal(10,7) DEFAULT NULL,
  `check_in_accuracy_m` int unsigned DEFAULT NULL,
  `check_in_distance_m` int unsigned DEFAULT NULL,
  `check_out_latitude` decimal(10,7) DEFAULT NULL,
  `check_out_longitude` decimal(10,7) DEFAULT NULL,
  `check_out_accuracy_m` int unsigned DEFAULT NULL,
  `check_out_distance_m` int unsigned DEFAULT NULL,
  `is_manual_override` tinyint(1) NOT NULL DEFAULT '0',
  `manual_override_by_admin_id` bigint unsigned DEFAULT NULL,
  `manual_override_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manual_override_notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('present','late','excused') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendances_event_id_student_id_unique` (`event_id`,`student_id`),
  KEY `attendances_student_id_foreign` (`student_id`),
  CONSTRAINT `attendances_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendances_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.attendances: ~0 rows (approximately)

-- Dumping structure for table dsams.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.cache: ~0 rows (approximately)

-- Dumping structure for table dsams.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.cache_locks: ~0 rows (approximately)

-- Dumping structure for table dsams.certificates
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `certificate_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `issue_date` date NOT NULL,
  `issued_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_generated` tinyint(1) NOT NULL DEFAULT '0',
  `is_downloaded` tinyint(1) NOT NULL DEFAULT '0',
  `generated_at` timestamp NULL DEFAULT NULL,
  `downloaded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificates_certificate_number_unique` (`certificate_number`),
  KEY `certificates_student_id_foreign` (`student_id`),
  KEY `certificates_event_id_foreign` (`event_id`),
  CONSTRAINT `certificates_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `certificates_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.certificates: ~0 rows (approximately)

-- Dumping structure for table dsams.evaluations
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `event` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_data` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evaluations_event_id_foreign` (`event_id`),
  CONSTRAINT `evaluations_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.evaluations: ~0 rows (approximately)

-- Dumping structure for table dsams.evaluation_responses
CREATE TABLE IF NOT EXISTS `evaluation_responses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `evaluation_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `answers` json NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `evaluation_responses_evaluation_id_student_id_unique` (`evaluation_id`,`student_id`),
  KEY `evaluation_responses_student_id_foreign` (`student_id`),
  CONSTRAINT `evaluation_responses_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluation_responses_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.evaluation_responses: ~0 rows (approximately)

-- Dumping structure for table dsams.events
CREATE TABLE IF NOT EXISTS `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `courses` json DEFAULT NULL,
  `year_levels` json DEFAULT NULL,
  `scanner_student_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scanner_student_ids` json DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `registration_end_time` time DEFAULT NULL,
  `organizer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('upcoming','ongoing','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `qr_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attendance_assignment` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `scanner_portal_active` tinyint(1) NOT NULL DEFAULT '0',
  `geofence_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `geofence_latitude` decimal(10,7) DEFAULT NULL,
  `geofence_longitude` decimal(10,7) DEFAULT NULL,
  `geofence_radius_m` int unsigned NOT NULL DEFAULT '50',
  PRIMARY KEY (`id`),
  KEY `events_status_index` (`status`),
  KEY `events_event_date_index` (`event_date`),
  KEY `events_archived_at_index` (`archived_at`),
  KEY `events_registration_end_time_index` (`registration_end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.events: ~0 rows (approximately)

-- Dumping structure for table dsams.event_program
CREATE TABLE IF NOT EXISTS `event_program` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `program_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_program_event_id_program_id_unique` (`event_id`,`program_id`),
  KEY `event_program_program_id_foreign` (`program_id`),
  CONSTRAINT `event_program_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_program_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.event_program: ~0 rows (approximately)

-- Dumping structure for table dsams.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.failed_jobs: ~0 rows (approximately)

-- Dumping structure for table dsams.found_items
CREATE TABLE IF NOT EXISTS `found_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_found` date NOT NULL,
  `time_found` time NOT NULL,
  `item_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `place_found` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finder_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Storage',
  `claimed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `claimed_at` timestamp NULL DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.found_items: ~0 rows (approximately)

-- Dumping structure for table dsams.incidents
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `incident_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_date` date NOT NULL,
  `incident_time` time NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `students_involved` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `evidence_paths` json DEFAULT NULL,
  `classification` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Minor',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.incidents: ~0 rows (approximately)

-- Dumping structure for table dsams.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.jobs: ~0 rows (approximately)

-- Dumping structure for table dsams.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.job_batches: ~0 rows (approximately)

-- Dumping structure for table dsams.lost_reports
CREATE TABLE IF NOT EXISTS `lost_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_lost` date NOT NULL,
  `time_lost` time DEFAULT NULL,
  `last_seen_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.lost_reports: ~0 rows (approximately)

-- Dumping structure for table dsams.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.migrations: ~26 rows (approximately)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(2, '0001_01_01_000001_create_cache_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(3, '0001_01_01_000002_create_jobs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(4, '2024_05_07_000001_create_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(5, '2025_08_26_100418_add_two_factor_columns_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(6, '2026_01_27_000001_add_student_fields_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(7, '2026_02_12_013844_add_role_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(8, '2026_02_12_013846_create_admin_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(9, '2026_02_12_013847_create_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(10, '2026_02_12_013848_create_program_heads_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(11, '2026_02_20_170000_add_profile_fields_to_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(12, '2026_02_26_000001_add_is_active_to_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(13, '2026_02_26_000002_add_qr_code_path_to_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(14, '2026_03_03_000003_drop_username_from_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(15, '2026_03_03_000004_create_admission_slips_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(16, '2026_03_03_000005_drop_slip_id_from_admission_slips_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(17, '2026_03_05_083530_create_found_items_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(18, '2026_03_05_093500_create_incidents_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(19, '2026_03_05_102335_add_is_archived_to_found_items_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(20, '2026_03_05_102418_add_is_archived_to_incidents_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(21, '2026_03_06_000006_add_is_archived_to_admission_slips_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(22, '2026_03_06_085147_create_evaluations_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(23, '2026_03_06_091523_add_is_archived_to_evaluations_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(24, '2026_03_06_182219_add_archived_at_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(25, '2026_03_06_182551_create_event_program_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(26, '2026_03_06_182635_create_programs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(27, '2026_03_06_184048_add_courses_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(28, '2026_03_06_184730_add_year_levels_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(29, '2026_03_06_191126_create_attendances_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(30, '2026_03_08_004537_add_registration_fields_to_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(31, '2026_03_08_160000_add_evidence_paths_to_incidents_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(32, '2026_03_08_162500_create_lost_reports_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(33, '2026_03_08_181500_create_notifications_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(34, '2026_03_08_181510_add_student_id_to_admission_slips_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(35, '2026_03_08_190000_create_activity_logs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(36, '2026_03_12_020500_add_scanner_student_id_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(37, '2026_03_12_021900_add_scanner_student_ids_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(38, '2026_03_12_050000_add_registration_end_time_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(39, '2026_03_12_120000_add_event_id_to_evaluations_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(40, '2026_03_12_120100_create_evaluation_responses_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(41, '2026_03_13_000101_add_is_archived_to_students_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(42, '2026_03_13_160900_add_scanner_portal_active_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(43, '2026_03_25_033831_create_announcements_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(44, '2026_03_25_150700_add_claim_details_to_found_items_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(45, '2026_03_26_030632_add_event_date_time_to_announcements_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(46, '2026_03_26_064900_add_description_to_evaluations_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(47, '2026_04_08_074900_add_geofence_columns_to_events_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(48, '2026_04_08_075000_add_geotagging_columns_to_attendances_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(49, '2026_04_28_235914_create_certificates_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(50, '2026_05_02_083000_add_dsa_role_to_users_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(51, '2026_05_04_100849_add_department_duration_to_programs_table', 1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(52, '2026_05_04_104909_add_program_id_to_students_table', 1);

-- Dumping structure for table dsams.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint unsigned NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.notifications: ~0 rows (approximately)

-- Dumping structure for table dsams.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.password_reset_tokens: ~0 rows (approximately)

-- Dumping structure for table dsams.programs
CREATE TABLE IF NOT EXISTS `programs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `programs_name_unique` (`name`),
  UNIQUE KEY `programs_code_unique` (`code`),
  KEY `programs_is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.programs: ~0 rows (approximately)
INSERT INTO `programs` (`id`, `name`, `description`, `department`, `duration`, `code`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Hospitality Management Program', 'A comprehensive program focusing on hotel operations, food and beverage management, tourism, and customer service excellence in the hospitality industry.', 'College of Hospitality Management', '4 Years', 'HM', 1, NOW(), NOW()),
	(2, 'Business Administration Program', 'A program designed to develop business leaders with expertise in management, marketing, finance, and entrepreneurship.', 'College of Business Administration', '4 Years', 'BA', 1, NOW(), NOW()),
	(3, 'Criminal Justice Education Program', 'A program preparing students for careers in law enforcement, criminal investigation, and justice system administration.', 'College of Criminal Justice Education', '4 Years', 'CJ', 1, NOW(), NOW()),
	(4, 'Teacher Education Program', 'A comprehensive program training future educators with modern teaching methodologies and subject matter expertise.', 'College of Teacher Education', '4 Years', 'TE', 1, NOW(), NOW()),
	(5, 'Information Technology Program', 'A program focusing on software development, network administration, database management, and IT infrastructure.', 'College of Information Technology', '4 Years', 'IT', 1, NOW(), NOW());

-- Dumping structure for table dsams.program_heads
CREATE TABLE IF NOT EXISTS `program_heads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_heads_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.program_heads: ~0 rows (approximately)
INSERT INTO `program_heads` (`id`, `name`, `email`, `email_verified_at`, `password`, `program`, `remember_token`, `created_at`, `updated_at`) VALUES
	(1, 'Dr. Maria Santos', 'head.hospitality@srcb.edu.ph', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Hospitality Management Program', NULL, NOW(), NOW()),
	(2, 'Prof. John Reyes', 'head.business@srcb.edu.ph', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Business Administration Program', NULL, NOW(), NOW()),
	(3, 'Atty. Lisa Martinez', 'head.criminaljustice@srcb.edu.ph', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Criminal Justice Education Program', NULL, NOW(), NOW()),
	(4, 'Dr. Robert Chen', 'head.teachered@srcb.edu.ph', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Teacher Education Program', NULL, NOW(), NOW()),
	(5, 'Engr. Sarah Johnson', 'head.it@srcb.edu.ph', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Information Technology Program', NULL, NOW(), NOW());

-- Dumping structure for table dsams.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.sessions: ~2 rows (approximately)
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('elZoxFQYdRCxaj8M3Vbq7aQxUAagYqahMLNWdeh6', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiN0FwZm40eUs3amtneXlJNUFaaXlVakx3amZRWUMzUG0xcGtFYUkzTyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7czo3OiJsYW5kaW5nIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1778382899);
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('zzBx3F8M8KyFBmHbNa79P3wjWjaOCk9B7AnlAUnC', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-PH) PowerShell/7.5.5', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNWR1WkZXcFdHMFJmaERsS2xQdTJ3TzVnZVg0WnhjUlNWMHQ2YVBHbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czo3OiJsYW5kaW5nIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1778382764);

-- Dumping structure for table dsams.students
CREATE TABLE IF NOT EXISTS `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Student',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `qr_code_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `entry_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `home_address` text COLLATE utf8mb4_unicode_ci,
  `birthday` date DEFAULT NULL,
  `place_of_birth` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `elementary_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `elementary_year_graduated` int DEFAULT NULL,
  `junior_high_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `junior_high_year_graduated` int DEFAULT NULL,
  `senior_high_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senior_high_year_graduated` int DEFAULT NULL,
  `mother_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_relation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `program_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_email_unique` (`email`),
  UNIQUE KEY `students_student_id_unique` (`student_id`),
  KEY `students_program_id_foreign` (`program_id`),
  CONSTRAINT `students_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.students: ~0 rows (approximately)
INSERT INTO `students` (`id`, `name`, `email`, `email_verified_at`, `password`, `first_name`, `middle_name`, `last_name`, `student_id`, `course`, `year_level`, `role`, `is_active`, `qr_code_path`, `remember_token`, `created_at`, `updated_at`, `entry_status`, `program`, `major`, `home_address`, `birthday`, `place_of_birth`, `religion`, `gender`, `contact_no`, `nationality`, `elementary_school`, `elementary_year_graduated`, `junior_high_school`, `junior_high_year_graduated`, `senior_high_school`, `senior_high_year_graduated`, `mother_name`, `mother_contact`, `father_name`, `father_contact`, `guardian_name`, `guardian_relation`, `guardian_contact`, `is_archived`, `program_id`) VALUES
	(2, 'LEDDA ACIERTO', 'leddaleiladanielle@gmail.com', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'LEILA DANIELLE', NULL, 'LEDDA', '2025-001', 'Hospitality Management Program', '3rd Year', 'Student', 1, NULL, NULL, '2025-10-09 18:14:02', '2025-10-09 18:14:02', 'Old Students', 'Hospitality Management Program', NULL, 'Brgy. 6, Balingasag, Misamis Oriental', '2005-04-17', 'Balingasag, Misamis Oriental', 'Roman Catholic', 'Female', '09759074391', 'Filipino', 'Balingasag Central School', 2017, 'Baliwagan National High School', 2021, 'Baliwagan Senior High School', 2023, 'Liezl Ledda', '09355999154', 'Dante Ledda', '(0905) 734 4617', 'Lei Ann Danielle Ledda', 'Sister', '+63 926 334 1038', 0, NULL),
	(3, 'AGCOPRA ABINES', 'agcopraglenenigma@gmail.com', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'GLEN ENIGMA', NULL, 'AGCOPRA', '2025-002', 'Hospitality Management Program', '3rd Year', 'Student', 1, NULL, NULL, '2025-10-09 18:15:50', '2025-10-09 18:15:50', 'Old Students', 'Hospitality Management Program', NULL, 'Salay, Mis. Or', '2003-01-15', 'Cagayan De Oro City', 'Roman Catholic', 'Male', '9610221370', 'Filipino', 'Fr. Alfeo F. Villanueva Parochial School', 2016, 'Salay National Higb School', 2020, 'St. Rita\'s College Of Balingasag', 2022, 'Jocelyn A. Agcopra', '9610221370', 'Glen B. Agcopra', '9610221370', 'Glen B. Agcopra', 'Father', '9610221370', 0, NULL),
	(4, 'ABAO ZARATE', 'alexamaeabao46@gmail.com', NULL, '$2y$12$8BU72.Gv5ytW6Mav.K3rge19Fw3mFlsezlk17k.axxDzkHJy6Zqi6', 'Alexa Mae', 'Zarate', 'Abao', '2025-003', 'Hospitality Management Program', '2nd Year', 'Student', 1, NULL, NULL, '2025-10-09 18:18:02', '2025-10-09 18:18:02', 'Old Students', 'Hospitality Management Program', NULL, 'Zone1-A Aplaya Jasaan Misamis Oriental', '2006-01-09', 'Aplaya Jasaan Misamis Oriental', 'Roman Catholic', 'Female', '09532609307', 'Filipino', 'Aplaya Elementary School', 2018, 'Aplaya National High School', 2022, 'St. Ignatius Technical College INC.', 2024, 'Anielyn Z. Abao', '09165840529', 'Alexander Abao', 'N/A', 'Anielyn Z. Abao', 'Mother', '09165840529', 0, NULL);

-- Dumping structure for table dsams.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_recovery_codes` text COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role` enum('student','program_head','admin','dsa') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dsams.users: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
