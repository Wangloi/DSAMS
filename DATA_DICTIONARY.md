# OSAMS / DSAMS Database Data Dictionary

This data dictionary provides a comprehensive reference for every database table in the **OSAMS / DSAMS** application, derived directly from the application's migration history, active schema definitions, and model configurations.

> **Last Reviewed:** October 2026  
> **Repository Path:** `c:\laragon\www\DSAMS`  
> **Database:** MySQL (`DB_DATABASE=dsams`)

---

## Table of Contents
1. [User & Access Control](#1-user--access-control)
   - [`admin_users`](#table-admin_users)
   - [`program_heads`](#table-program_heads)
   - [`students`](#table-students)
   - [`password_reset_requests`](#table-password_reset_requests)
2. [Academic Programs & Events](#2-academic-programs--events)
   - [`programs`](#table-programs)
   - [`events`](#table-events)
   - [`event_program`](#table-event_program)
3. [Attendance & Geolocation](#3-attendance--geolocation)
   - [`attendances`](#table-attendances)
4. [Disciplinary & Incident Management](#4-disciplinary--incident-management)
   - [`incidents`](#table-incidents)
   - [`violations`](#table-violations)
   - [`disciplinary_rules`](#table-disciplinary_rules)
   - [`disciplinary_actions`](#table-disciplinary_actions)
5. [Admission Slips](#5-admission-slips)
   - [`admission_slips`](#table-admission_slips)
6. [Evaluations & E-Certificates](#6-evaluations--e-certificates)
   - [`evaluations`](#table-evaluations)
   - [`evaluation_responses`](#table-evaluation_responses)
   - [`program_evaluation_approvals`](#table-program_evaluation_approvals)
   - [`certificates`](#table-certificates)
7. [Logs & System Notifications](#7-logs--system-notifications)
   - [`activity_logs`](#table-activity_logs)
   - [`audit_logs`](#table-audit_logs)
   - [`app_notifications`](#table-app_notifications)
   - [`notifications`](#table-notifications)
8. [Framework & System Tables](#8-framework--system-tables)
   - [`sessions`](#table-sessions), [`cache`](#table-cache), [`jobs`](#table-jobs), [`failed_jobs`](#table-failed_jobs)

---

## 1. User & Access Control

### Table: `admin_users`
**Description:** Stores system administrators, student affairs officers, and administrative staff accounts with support for temporary account handovers.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key identifier |
| `name` | `VARCHAR` | 255 | NOT NULL | Full name of administrator |
| `email` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Login and recovery email address |
| `email_verified_at` | `TIMESTAMP` | - | NULL | Verification timestamp of the administrator email |
| `password` | `VARCHAR` | 255 | NOT NULL | Bcrypt hashed account password |
| `handover_expires_at`| `TIMESTAMP` | - | NULL | Temporary account takeover expiry timestamp |
| `is_active` | `TINYINT(1)` | 1 | DEFAULT `1` | Soft toggle for administrator account access |
| `created_by_admin_id`| `BIGINT UNSIGNED` | 20 | NULL | ID of the administrator who created/delegated this account |
| `two_factor_secret` | `TEXT` | - | NULL | Fortify 2FA encryption secret |
| `two_factor_recovery_codes` | `TEXT` | - | NULL | Fortify emergency backup 2FA recovery codes |
| `two_factor_confirmed_at` | `TIMESTAMP` | - | NULL | Timestamp when 2FA was confirmed |
| `remember_token` | `VARCHAR` | 100 | NULL | Persistent login session token |
| `created_at` | `TIMESTAMP` | - | NULL | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

### Table: `program_heads`
**Description:** Department chairpersons, college deans, and academic personnel with program-scoped permissions.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key identifier |
| `name` | `VARCHAR` | 255 | NOT NULL | Full name of the program head / personnel |
| `email` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Institutional email address for authentication |
| `email_verified_at` | `TIMESTAMP` | - | NULL | Email verification timestamp |
| `password` | `VARCHAR` | 255 | NOT NULL | Bcrypt hashed account password |
| `program` | `VARCHAR` | 255 | NULL | Academic program code (e.g., `BSIT`, `BSBA`, `BSHM`) |
| `role` | `VARCHAR` | 255 | DEFAULT `'Program Head'` | Role designation (e.g., `Program Head`, `Personnel`, `Dean`) |
| `office` | `VARCHAR` | 255 | NULL | Department office location (e.g., `IT Department`, `HED Office`) |
| `verification_status`| `VARCHAR` | 50 | DEFAULT `'approved'` | Administrative verification state (`pending`, `approved`, `rejected`) |
| `two_factor_secret` | `TEXT` | - | NULL | Fortify 2FA encryption secret |
| `two_factor_recovery_codes` | `TEXT` | - | NULL | Fortify emergency backup 2FA recovery codes |
| `two_factor_confirmed_at` | `TIMESTAMP` | - | NULL | Timestamp when 2FA was confirmed |
| `remember_token` | `VARCHAR` | 100 | NULL | Persistent session token |
| `created_at` | `TIMESTAMP` | - | NULL | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

### Table: `students`
**Description:** Student master records containing institutional identification, credentials, SIS profile, device binding, and officer permissions.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Internal primary key |
| `student_id` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Institutional Student ID number (e.g., `C230103`) |
| `name` | `VARCHAR` | 255 | NOT NULL | Full combined display name |
| `first_name` | `VARCHAR` | 255 | NULL | Student first name |
| `middle_name` | `VARCHAR` | 255 | NULL | Student middle name |
| `last_name` | `VARCHAR` | 255 | NULL | Student surname |
| `email` | `VARCHAR` | 255 | **UNIQUE**, NULL | Student email address |
| `email_verified_at` | `TIMESTAMP` | - | NULL | Email verification timestamp |
| `password` | `VARCHAR` | 255 | NOT NULL | Bcrypt hashed login password |
| `course` | `VARCHAR` | 255 | NOT NULL | Enrolled program/degree code (e.g., `BSIT`) |
| `year_level` | `VARCHAR` | 255 | NOT NULL | Academic year level (`1st Year`, `2nd Year`, `3rd Year`, `4th Year`) |
| `entry_status` | `VARCHAR` | 255 | NULL | Registration status (`Freshman`, `Transferee`, `Returnee`, `Old Student`) |
| `program` | `VARCHAR` | 255 | NULL | Full program description |
| `major` | `VARCHAR` | 255 | NULL | Major specialization (if applicable) |
| `program_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `programs.id`, NULL | Foreign key reference to primary program entity |
| `role` | `VARCHAR` | 255 | DEFAULT `'student'` | Access role (`student`, `officer`) |
| `is_active` | `TINYINT(1)` | 1 | DEFAULT `1` | Account active state |
| `status` | `VARCHAR` | 50 | DEFAULT `'approved'` | Academic status (`approved`, `suspended`, `inactive`) |
| `verification_status`| `VARCHAR` | 50 | DEFAULT `'approved'` | Enrollment verification status (`pending`, `approved`, `rejected`) |
| `qr_code_path` | `VARCHAR` | 255 | NULL | Relative storage path to cached student ID QR PNG |
| `device_uuid` | `VARCHAR` | 255 | NULL | Hardware/browser UUID bound to this account (Anti-proxy) |
| `device_name` | `VARCHAR` | 255 | NULL | User agent or friendly device name |
| `officer_features` | `JSON` | - | NULL | Array of officer capabilities (e.g., `["scanner"]`) |
| `allowed_features` | `JSON` | - | NULL | Granular feature privileges granted to this student |
| `academic_year_started`| `VARCHAR` | 50 | NULL | Academic year of admission (e.g., `2023-2024`) |
| `is_archived` | `TINYINT(1)` | 1 | DEFAULT `0` | Archive flag for graduated/transferred students |
| `home_address` | `TEXT` | - | NULL | Permanent residential address |
| `birthday` | `DATE` | - | NULL | Date of birth |
| `place_of_birth` | `VARCHAR` | 255 | NULL | City/Municipality of birth |
| `religion` | `VARCHAR` | 255 | NULL | Religious affiliation |
| `gender` | `VARCHAR` | 50 | NULL | Gender (`Male`, `Female`) |
| `contact_no` | `VARCHAR` | 50 | NULL | Mobile contact phone number |
| `nationality` | `VARCHAR` | 100 | NULL | Citizenship |
| `elementary_school` | `VARCHAR` | 255 | NULL | Elementary school graduated from |
| `elementary_year_graduated`| `INT` | 11 | NULL | Elementary completion graduation year |
| `junior_high_school`| `VARCHAR` | 255 | NULL | Junior High School name |
| `junior_high_year_graduated`| `INT` | 11 | NULL | Junior High graduation year |
| `senior_high_school`| `VARCHAR` | 255 | NULL | Senior High School name |
| `senior_high_year_graduated`| `INT` | 11 | NULL | Senior High graduation year |
| `mother_name` | `VARCHAR` | 255 | NULL | Mother's full name |
| `mother_contact` | `VARCHAR` | 50 | NULL | Mother's emergency contact number |
| `father_name` | `VARCHAR` | 255 | NULL | Father's full name |
| `father_contact` | `VARCHAR` | 50 | NULL | Father's emergency contact number |
| `guardian_name` | `VARCHAR` | 255 | NULL | Legal guardian full name |
| `guardian_relation` | `VARCHAR` | 100 | NULL | Relationship to guardian |
| `guardian_contact` | `VARCHAR` | 50 | NULL | Guardian contact phone number |
| `remember_token` | `VARCHAR` | 100 | NULL | Persistent session token |
| `created_at` | `TIMESTAMP` | - | NULL | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Profile update timestamp |

---

### Table: `password_reset_requests`
**Description:** Tracks in-system password reset requests submitted by users across guards awaiting administrator resolution.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key identifier |
| `email` | `VARCHAR` | 255 | NOT NULL | Email address requesting recovery |
| `user_type` | `VARCHAR` | 255 | NOT NULL | Guard target (`admin`, `program_head`, `student`) |
| `status` | `VARCHAR` | 50 | DEFAULT `'pending'` | Status (`pending`, `approved`, `rejected`) |
| `resolved_at` | `TIMESTAMP` | - | NULL | Timestamp when administrator processed the request |
| `created_at` | `TIMESTAMP` | - | NULL | Submission timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Status update timestamp |

---

## 2. Academic Programs & Events

### Table: `programs`
**Description:** College academic programs, departments, and course degree offerings.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `code` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Program abbreviation (e.g., `BSIT`, `BSBA`) |
| `name` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Full degree name |
| `description` | `TEXT` | - | NULL | Program curriculum overview |
| `department` | `VARCHAR` | 255 | NULL | College department (e.g., `HED`, `College of Computing`) |
| `duration` | `VARCHAR` | 255 | NULL | Standard completion duration (e.g., `4 Years`) |
| `is_active` | `TINYINT(1)` | 1 | DEFAULT `1` | Active curriculum flag |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `events`
**Description:** Campus events, seminars, assemblies, geofence definitions, and attendance configuration.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `event_name` | `VARCHAR` | 255 | NOT NULL | Title of the event or activity |
| `organizer` | `VARCHAR` | 255 | NOT NULL | Sponsoring department, club, or council |
| `location` | `VARCHAR` | 255 | NOT NULL | Venue name / campus area description |
| `event_date` | `DATE` | - | NOT NULL | Date of the scheduled event |
| `event_time` | `TIME` | - | NOT NULL | Event start time (Time-In begins) |
| `registration_end_time`| `TIME` | - | NULL | Cut-off time for event check-in |
| `description` | `TEXT` | - | NULL | Detailed event description and objectives |
| `expected_attendees` | `INT` | 11 | NULL | Projected target attendance quota |
| `total_attendees` | `INT` | 11 | DEFAULT `0` | Running count of recorded participants |
| `present_count` | `INT` | 11 | DEFAULT `0` | Running count of on-time attendees |
| `status` | `ENUM` | `'upcoming'`, `'ongoing'`, `'completed'` | DEFAULT `'upcoming'` | Execution lifecycle state |
| `courses` | `JSON` | - | NULL | Target programs (e.g. `["BSIT", "BSBA"]`) |
| `year_levels` | `JSON` | - | NULL | Target year levels (e.g. `["1st Year", "2nd Year"]`) |
| `attendance_type` | `VARCHAR` | 50 | DEFAULT `'both'` | Mode: `'both'` (In/Out), `'time_in'`, `'time_out'` |
| `scanner_portal_active`| `TINYINT(1)` | 1 | DEFAULT `0` | Flag enabling dynamic rotating QR generation |
| `scanner_student_ids`| `JSON` | - | NULL | Array of student IDs permitted to operate scanners |
| `geofence_enabled` | `TINYINT(1)` | 1 | DEFAULT `0` | Enforces GPS venue radius validation |
| `geofence_latitude` | `DECIMAL` | 10,8 | NULL | Center latitude coordinate of event venue |
| `geofence_longitude`| `DECIMAL` | 11,8 | NULL | Center longitude coordinate of event venue |
| `geofence_radius_m` | `INT` | 11 | DEFAULT `50` | Allowed radius threshold in meters |
| `approval_status` | `VARCHAR` | 50 | DEFAULT `'approved'` | Approval status (`approved`, `pending`, `rejected`) |
| `rejection_reason` | `TEXT` | - | NULL | Reason provided if schedule was declined |
| `created_by_program_head_id`| `BIGINT UNSIGNED` | 20 | NULL | ID of ProgramHead who created the event |
| `archived_at` | `TIMESTAMP` | - | NULL | Event archive timestamp |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `event_program`
**Description:** Many-to-many pivot table associating events with eligible academic programs.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `event_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `events.id`, CASCADE | Associated event ID |
| `program_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `programs.id`, CASCADE | Associated academic program ID |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

## 3. Attendance & Geolocation

### Table: `attendances`
**Description:** Individual student attendance records with dual check-in/out timestamps, GPS coordinates, dynamic QR tokens, and manual overrides.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `event_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `events.id`, CASCADE | Event being attended |
| `student_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `students.id`, CASCADE | Student attending |
| `scanned_at` | `TIMESTAMP` | - | NOT NULL | Raw timestamp of initial scan |
| `status` | `VARCHAR` | 50 | DEFAULT `'present'` | Attendance status (`present`, `late`, `excused`) |
| `checked_in_at` | `TIMESTAMP` | - | NULL | Validated Time-In timestamp |
| `checked_out_at` | `TIMESTAMP` | - | NULL | Validated Time-Out timestamp |
| `check_in_latitude` | `DECIMAL` | 10,8 | NULL | GPS latitude captured during Time-In |
| `check_in_longitude`| `DECIMAL` | 11,8 | NULL | GPS longitude captured during Time-In |
| `check_in_accuracy_m`| `DECIMAL` | 8,2 | NULL | Mobile device GPS accuracy reading (meters) |
| `check_in_distance_m`| `DECIMAL` | 8,2 | NULL | Calculated Haversine distance from venue |
| `check_in_token_id` | `VARCHAR` | 64 | NULL | Opaque server cache token from dynamic QR |
| `check_in_user_agent`| `TEXT` | - | NULL | Client browser/device user agent |
| `check_out_latitude`| `DECIMAL` | 10,8 | NULL | GPS latitude captured during Time-Out |
| `check_out_longitude`| `DECIMAL` | 11,8 | NULL | GPS longitude captured during Time-Out |
| `check_out_accuracy_m`| `DECIMAL` | 8,2 | NULL | Mobile device GPS accuracy at check-out |
| `check_out_distance_m`| `DECIMAL` | 8,2 | NULL | Haversine distance from venue at check-out |
| `location` | `VARCHAR` | 255 | NULL | Text description of capture location |
| `is_manual_override`| `TINYINT(1)` | 1 | DEFAULT `0` | True if record was manually entered by admin |
| `manual_override_by_admin_id`| `BIGINT UNSIGNED` | 20 | NULL | Administrator ID who approved manual entry |
| `manual_override_reason`| `VARCHAR` | 255 | NULL | Justification (e.g., `Camera failure`, `Medical`) |
| `manual_override_notes` | `TEXT` | - | NULL | Supplemental administrative notes |
| `mid_session_verified_at`| `TIMESTAMP` | - | NULL | Mid-event presence verification timestamp |
| `is_flagged` | `TINYINT(1)` | 1 | DEFAULT `0` | Anti-cheating / suspicious location flag |
| `flagged_reason` | `VARCHAR` | 255 | NULL | Reason for flag (e.g. `Geofence breach`) |
| `flag_cleared_by_admin_id`| `BIGINT UNSIGNED`| 20 | NULL | Administrator who cleared the flag |
| `flag_cleared_at` | `TIMESTAMP` | - | NULL | Timestamp flag was cleared |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

## 4. Disciplinary & Incident Management

### Table: `violations`
**Description:** Codified catalog of student handbook offenses and classification tiers.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `code` | `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Offense code (e.g., `VIO-001`, `DRESS-01`) |
| `name` | `VARCHAR` | 255 | NOT NULL | Title of the violation |
| `description` | `TEXT` | - | NULL | Handbook clause definition |
| `section` | `ENUM` | `'Warning'`, `'Suspension'`, `'Exclusion'`, `'Expulsion'` | NOT NULL | Severity classification level |
| `deleted_at` | `TIMESTAMP` | - | NULL | Soft delete timestamp |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

### Table: `incidents`
**Description:** Formal student disciplinary cases, investigation reports, calling notices, and case progression.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `violation_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `violations.id`, NULL | Associated violation catalog rule |
| `incident_type` | `VARCHAR` | 255 | NOT NULL | Incident category / title |
| `incident_date` | `DATE` | - | NOT NULL | Date offense was committed |
| `incident_time` | `TIME` | - | NOT NULL | Time offense occurred |
| `location` | `VARCHAR` | 255 | NOT NULL | Campus location of occurrence |
| `reported_by` | `VARCHAR` | 255 | NULL | Reporting staff member or officer |
| `students_involved`| `JSON` | - | NULL | Array of involved student IDs or names |
| `description` | `TEXT` | - | NOT NULL | Full factual description of incident |
| `immediate_action`| `TEXT` | - | NULL | Containment or immediate intervention taken |
| `evidence_paths` | `JSON` | - | NULL | Array of uploaded evidence file paths |
| `classification` | `VARCHAR` | 255 | DEFAULT `'Minor'` | Classification tier (`Minor`, `Major`, `Severe`) |
| `status` | `VARCHAR` | 255 | DEFAULT `'Pending'` | Status (`Pending`, `Under Investigation`, `Resolved`) |
| `calling_phase` | `VARCHAR` | 50 | DEFAULT `'Phase 1'` | Calling phase: `Phase 1`, `Phase 2`, `Phase 3` |
| `calling_phase_history`| `JSON` | - | NULL | Log of transitions between calling phases |
| `investigation_details`| `JSON` | - | NULL | Hearing dates, witness statements, panel notes |
| `calling_notice_sent_at`| `TIMESTAMP` | - | NULL | Timestamp of latest notice dispatched |
| `calling_notice_details`| `JSON` | - | NULL | Notice copy, recipient details, scheduled appearance |
| `received_by` | `VARCHAR` | 255 | NULL | Recipient acknowledging receipt |
| `is_archived` | `TINYINT(1)` | 1 | DEFAULT `0` | Archive status |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

### Table: `disciplinary_rules`
**Description:** Automated escalation logic mapping repeated violations to severe penalties.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `name` | `VARCHAR` | 255 | NOT NULL | Rule identifier / title |
| `description` | `TEXT` | - | NULL | Rule explanation |
| `trigger_section` | `ENUM` | `'Warning'`, `'Suspension'`, `'Exclusion'`, `'Expulsion'` | NOT NULL | Starting severity tier |
| `conditions` | `JSON` | - | NOT NULL | Escalation condition (e.g. `{"same_offense_count": 3}`) |
| `result_action` | `ENUM` | `'Warning'`, `'Suspension'`, `'Exclusion'`, `'Expulsion'` | NOT NULL | Resulting escalated penalty |
| `priority` | `INT` | 11 | DEFAULT `0` | Order of rule evaluation |
| `is_active` | `TINYINT(1)` | 1 | DEFAULT `1` | Active state flag |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Modification timestamp |

---

### Table: `disciplinary_actions`
**Description:** Decisions rendered on incident cases, tracking recommended vs. final approved penalties.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `incident_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `incidents.id`, CASCADE | Parent incident case |
| `student_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `students.id`, CASCADE | Punished student |
| `recommended_action`| `ENUM`| `'Warning'`, `'Suspension'`, `'Exclusion'`, `'Expulsion'` | NOT NULL | Recommended penalty |
| `recommendation_reason`| `TEXT` | - | NULL | Justification for recommendation |
| `final_action` | `ENUM`| `'Warning'`, `'Suspension'`, `'Exclusion'`, `'Expulsion'` | NULL | Final penalty approved by OSA board |
| `final_action_reason`| `TEXT` | - | NULL | Rationale for final decision |
| `remarks` | `TEXT` | - | NULL | Special directives (e.g. `Community service 20hrs`) |
| `reviewed_by` | `BIGINT UNSIGNED` | 20 | **FK** -> `admin_users.id`, NULL | Reviewing administrator ID |
| `reviewed_at` | `TIMESTAMP` | - | NULL | Review timestamp |
| `status` | `ENUM` | `'Pending'`, `'Approved'`, `'Modified'`, `'Overridden'` | DEFAULT `'Pending'` | Approval status |
| `decision_history` | `JSON` | - | NULL | Audit log of decision edits |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Modification timestamp |

---

## 5. Admission Slips

### Table: `admission_slips`
**Description:** Student readmission requests for class absences subject to the strict monthly limit (`MONTHLY_LIMIT = 3`).

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `student_id` | `BIGINT UNSIGNED` | 20 | NULL | Associated student ID |
| `student_name` | `VARCHAR` | 255 | NOT NULL | Full student name |
| `program_year_level`| `VARCHAR` | 255 | NOT NULL | Program and year (e.g., `BSIT - 3rd Year`) |
| `date_issued` | `VARCHAR` | 255 | NOT NULL | Formatted date of issuance |
| `case_text` | `VARCHAR` | 255 | NOT NULL | Absence category (e.g., `Illness`, `Family Emergency`) |
| `reason_text` | `VARCHAR` | 255 | NOT NULL | Detailed reason submitted by student |
| `valid_until` | `VARCHAR` | 255 | NULL | Validity end date for classroom presentation |
| `status` | `VARCHAR` | 50 | DEFAULT `'PENDING'` | Status: `'PENDING'`, `'APPROVED'`, `'REJECTED'` |
| `is_archived` | `TINYINT(1)` | 1 | DEFAULT `0` | Archive status |
| `created_at` | `TIMESTAMP` | - | NULL | Submission timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Review timestamp |

---

## 6. Evaluations & E-Certificates

### Table: `evaluations`
**Description:** Digital evaluation survey forms linked to events with rating questions.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `event_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `events.id`, NULL | Associated event |
| `name` | `VARCHAR` | 255 | NOT NULL | Evaluation title |
| `description` | `TEXT` | - | NULL | Evaluation directions/instructions |
| `event` | `VARCHAR` | 255 | NOT NULL | Legacy plain text event name |
| `qr_code_path` | `VARCHAR` | 255 | NULL | Storage path to evaluation form QR code |
| `form_data` | `JSON` | - | NULL | Question schema (sections, Likert scales, open prompts) |
| `is_active` | `TINYINT(1)` | 1 | DEFAULT `1` | Form availability toggle |
| `published_at` | `TIMESTAMP` | - | NULL | Timestamp when published to students |
| `is_archived` | `TINYINT(1)` | 1 | DEFAULT `0` | Archive flag |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Last modification timestamp |

---

### Table: `evaluation_responses`
**Description:** Individual student answers to event evaluation forms.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `evaluation_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `evaluations.id`, CASCADE | Parent evaluation form |
| `student_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `students.id`, CASCADE | Student submitting responses |
| `answers` | `JSON` | - | NOT NULL | Submitted answer mapping (ratings, feedback text) |
| `submitted_at` | `TIMESTAMP` | - | NOT NULL | Current timestamp on submission |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `program_evaluation_approvals`
**Description:** Tracks department-level evaluation completion quotas required before clearance for subsequent activities.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `event_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `events.id`, CASCADE | Target event |
| `evaluation_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `evaluations.id`, CASCADE | Target evaluation |
| `program` | `VARCHAR` | 120 | NOT NULL | Program code being monitored |
| `eligible_count` | `INT UNSIGNED` | 10 | DEFAULT `0` | Count of program attendees eligible |
| `submitted_count` | `INT UNSIGNED` | 10 | DEFAULT `0` | Completed response count |
| `completion_percent`| `DECIMAL` | 5,2 | DEFAULT `0.00` | Current percentage rate (`submitted / eligible * 100`) |
| `approved_for_next_activity`| `TINYINT(1)`| 1 | DEFAULT `0` | Clearance toggle for future activities |
| `approved_at` | `TIMESTAMP` | - | NULL | Timestamp of clearance |
| `approved_by_admin_id`| `BIGINT UNSIGNED`| 20 | **FK** -> `admin_users.id`, NULL | Approving administrator ID |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `certificates`
**Description:** E-Certificates issued to students following verified attendance and evaluation completion.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `student_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `students.id`, CASCADE | Certificate recipient |
| `event_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `events.id`, CASCADE | Attended event |
| `evaluation_id` | `BIGINT UNSIGNED` | 20 | **FK** -> `evaluations.id`, NULL | Associated evaluation prerequisite |
| `certificate_number`| `VARCHAR` | 255 | **UNIQUE**, NOT NULL | Serial code (Format: `CERT-YYYY-XXXX`) |
| `certificate_type`| `VARCHAR` | 40 | DEFAULT `'participation'` | Type (e.g., `'participation'`, `'completion'`, `'merit'`) |
| `title` | `VARCHAR` | 255 | NOT NULL | Certificate title |
| `description` | `TEXT` | - | NULL | Body text / commendation |
| `issue_date` | `DATE` | - | NOT NULL | Official date of issuance |
| `issued_by` | `VARCHAR` | 255 | NOT NULL | Office or institution authority |
| `signature_name` | `VARCHAR` | 255 | NOT NULL | Signatory full name |
| `signature_title`| `VARCHAR` | 255 | NOT NULL | Signatory official position |
| `certificate_file_path`| `VARCHAR` | 255 | NULL | Storage path to generated PDF |
| `is_generated` | `TINYINT(1)` | 1 | DEFAULT `0` | Generation status |
| `is_downloaded` | `TINYINT(1)` | 1 | DEFAULT `0` | Download tracking flag |
| `generated_at` | `TIMESTAMP` | - | NULL | Generation timestamp |
| `downloaded_at` | `TIMESTAMP` | - | NULL | First download timestamp |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

## 7. Logs & System Notifications

### Table: `activity_logs`
**Description:** High-level administrative and security event logs shown in system audit dashboards.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `user_name` | `VARCHAR` | 255 | NULL | Display name of actor |
| `user_type` | `VARCHAR` | 255 | NULL | Actor guard (`admin`, `student`, `program_head`) |
| `user_id` | `BIGINT UNSIGNED` | 20 | NULL | ID of actor |
| `module` | `VARCHAR` | 255 | NOT NULL | System module (e.g., `User Management`, `Attendance`) |
| `action` | `VARCHAR` | 255 | NOT NULL | Performed action (`Created`, `Updated`, `Deleted`, `ALERT`) |
| `details` | `TEXT` | - | NULL | Descriptive summary of change |
| `ip_address` | `VARCHAR` | 255 | NULL | Client IP address |
| `user_agent` | `TEXT` | - | NULL | Browser / device header |
| `old_value` | `JSON` | - | NULL | Previous state before edit |
| `new_value` | `JSON` | - | NULL | New state after edit |
| `created_at` | `TIMESTAMP` | - | NULL | Log timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Modification timestamp |

---

### Table: `audit_logs`
**Description:** Low-level, immutable system change log with a 30-day auto-pruning policy.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `actor_id` | `BIGINT UNSIGNED` | 20 | NULL | ID of acting user |
| `role` | `VARCHAR` | 255 | NULL | Acting user's role |
| `target_id` | `BIGINT UNSIGNED` | 20 | NULL | ID of modified entity |
| `action` | `VARCHAR` | 255 | NOT NULL | Action executed |
| `old` | `JSON` | - | NULL | Pre-change attributes |
| `new` | `JSON` | - | NULL | Post-change attributes |
| `ip` | `VARCHAR` | 255 | NULL | Remote IP address |
| `device` | `VARCHAR` | 255 | NULL | User device / client |
| `request_id` | `VARCHAR` | 255 | NULL | Unique HTTP request correlation UUID |
| `created_at` | `TIMESTAMP` | - | NULL | Event timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `app_notifications`
**Description:** Real-time push notifications routed across multiple authenticatable models via Socket.IO.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `user_id` | `BIGINT UNSIGNED` | 20 | NULL | Target recipient ID |
| `user_type` | `VARCHAR` | 255 | DEFAULT `'App\Models\User'` | Target morph class (`AdminUser`, `ProgramHead`, `Student`) |
| `type` | `VARCHAR` | 255 | DEFAULT `'general'` | Alert category (`event`, `slip`, `violation`, `general`) |
| `title` | `VARCHAR` | 255 | NOT NULL | Short notification title |
| `message` | `TEXT` | - | NOT NULL | Detailed notification message |
| `related_id` | `VARCHAR` | 255 | NULL | ID of associated model |
| `related_type` | `VARCHAR` | 255 | NULL | Class name of associated model |
| `is_read` | `TINYINT(1)` | 1 | DEFAULT `0` | Read state flag |
| `meta_data` | `JSON` | - | NULL | Action URL or payload data |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

### Table: `notifications`
**Description:** Standard Laravel framework database notification channel table.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `CHAR` | 36 | **PK** | UUID notification identifier |
| `type` | `VARCHAR` | 255 | NOT NULL | Notification class name |
| `notifiable_type`| `VARCHAR` | 255 | NOT NULL | Morph target class |
| `notifiable_id` | `BIGINT UNSIGNED` | 20 | NOT NULL | Morph target ID |
| `data` | `TEXT` | - | NOT NULL | Serialized notification payload |
| `read_at` | `TIMESTAMP` | - | NULL | Read timestamp |
| `created_at` | `TIMESTAMP` | - | NULL | Creation timestamp |
| `updated_at` | `TIMESTAMP` | - | NULL | Update timestamp |

---

## 8. Framework & System Tables

### Table: `sessions`
**Description:** Server-side database session store when `SESSION_DRIVER=database`.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `VARCHAR` | 255 | **PK** | Unique session token |
| `user_id` | `BIGINT UNSIGNED` | 20 | NULL | Authenticated user ID (if logged in) |
| `ip_address` | `VARCHAR` | 45 | NULL | Remote IPv4/IPv6 address |
| `user_agent` | `TEXT` | - | NULL | Browser User-Agent header |
| `payload` | `LONGTEXT` | - | NOT NULL | Encrypted session values and CSRF tokens |
| `last_activity` | `INT` | 11 | NOT NULL | Unix timestamp of latest request |

---

### Table: `cache` & `cache_locks`
**Description:** Database caching engine for short-lived dynamic QR tokens and throttles.

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `key` | `VARCHAR` | 255 | **PK** | Unique cache key |
| `value` | `MEDIUMTEXT`| - | NOT NULL | Serialized cache data |
| `expiration` | `INT` | 11 | NOT NULL | Expiration Unix timestamp |

---

### Table: `jobs` & `failed_jobs`
**Description:** Background queue listener storage (`php artisan queue:listen`).

| Column Name | Data Type | Length / Values | Constraints | Description |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 20 | **PK**, Auto Increment | Primary key |
| `queue` | `VARCHAR` | 255 | NOT NULL | Target queue name (e.g. `default`) |
| `payload` | `LONGTEXT` | - | NOT NULL | Serialized queued job class and arguments |
| `attempts` | `TINYINT UNSIGNED`| 3 | NOT NULL | Execution attempt counter |
| `reserved_at` | `INT UNSIGNED` | 10 | NULL | Lock reservation timestamp |
| `available_at`| `INT UNSIGNED` | 10 | NOT NULL | Timestamp when job is ready to run |
| `created_at` | `INT UNSIGNED` | 10 | NOT NULL | Enqueue timestamp |

---

> [!NOTE]
> As documented in [PROJECT_CONTEXT.md](file:///c:/laragon/www/DSAMS/PROJECT_CONTEXT.md#14-known-issues--deprecated--zombie-modules), the `announcements`, `found_items`, and `lost_reports` tables were removed from the active database in migration `2026_05_18_000001_drop_announcements_and_lost_found_tables.php`. They are excluded from this active data dictionary.
