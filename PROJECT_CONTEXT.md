# Office of Student Affairs Management System (OSAMS / DSAMS)
## Centralized Project Context & Architecture Reference

> **Last Reviewed:** October 2026  
> **Repository Path:** `c:\laragon\www\DSAMS`  
> **Application Identifier:** `APP_NAME=OSAMS` / `DB_DATABASE=dsams`

---

## 1. Project Overview

The **Office of Student Affairs Management System (OSAMS)** (also referred to historically as **DSAMS** / **GQAMS**) is an enterprise web application designed for collegiate student affairs administration. It automates:

- Academic and campus event tracking with dual-mode QR attendance (scanned student IDs & dynamic rotating projector QR codes).
- GPS-based geofence enforcement using high-precision Haversine calculations.
- Student disciplinary records, violation incident workflows (including multi-phase calling notices and investigation logs).
- Admission slip issuance, tracking, and thermal printer receipt generation (with a strict 3-slip monthly quota).
- Digital event evaluation gating with automated certificate generation upon evaluation completion.
- Multi-guard user management (Super Administrator, Program Heads / Department Personnel, and Students) with device-binding security ("One Device, One Account" anti-proxy policy).
- Real-time in-app notifications supported by an integrated Node.js Socket.IO server.

---

## 2. Technology Stack and Versions

| Layer | Technology | Version / Specification |
|---|---|---|
| **Backend Framework** | Laravel | `12.x` (PHP `^8.2`) |
| **Authentication Core** | Laravel Fortify & Multi-Guard Session | Fortify `^1.30` (2FA enabled) |
| **Frontend Framework** | React | `19.2.0` (with TypeScript `^5.7.2`) |
| **Inertia Protocol** | Inertia.js | `v2.x` (`@inertiajs/react` `^2.3.7`, `inertia-laravel` `^2.0`) |
| **CSS & Design Engine**| Tailwind CSS | **v4.0.0** (`@tailwindcss/vite` `^4.1.11`, `@theme` directives) |
| **Component Primitives**| Radix UI / Headless UI | `@radix-ui/*` primitives, Lucide React icons (`^0.475.0`) |
| **Mapping Engine** | Leaflet | `1.9.4` (using custom tiles & offline support) |
| **Real-time Engine** | Socket.IO | `socket.io-client` `^4.8.3` + Node.js server (`socket-server/`) |
| **QR Code Engine** | ZXing Browser & QRcode | `@zxing/browser` `^0.1.5` & `qrcode` `^1.5.4`, `endroid/qr-code` |
| **Spreadsheets / PDFs**| PhpSpreadsheet & DomPDF / PDFParser| `phpoffice/phpspreadsheet` `^5.7`, `barryvdh/laravel-dompdf` `^3.1` |
| **Testing Suite** | Pest PHP | Pest `^4.3` with `pest-plugin-laravel` `^4.0` |
| **Build & Tooling** | Vite | `7.0.4` with Wayfinder & React Compiler plugin |

---

## 3. System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │               Client Browser                 │
                               │  (React 19 + TypeScript + Inertia.js + Leaflet)│
                               └───────┬──────────────────────────────▲───────┘
                                       │ HTTP / Inertia               │ WebSocket
                                       ▼                              ▼
                 ┌──────────────────────────────────────┐     ┌──────────────────────┐
                 │          Laravel 12 Backend          │     │ Node.js Socket.IO    │
                 │      (PHP 8.2+ on Port 8000)         │     │ Server (socket-server)│
                 ├──────────────────────────────────────┤     └──────────────────────┘
                 │ Multi-Guard Auth (admin, head, stud) │                 ▲
                 │ Geofence Haversine Service           │                 │ Internal
                 │ Attendance Evaluation Gate Service   │─────────────────┘ Realtime Push
                 │ Device-Binding Policy Guard          │
                 │ Thermal Printing Bridge              │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │             MySQL Database           │
                 │   (admin_users, program_heads,       │
                 │    students, attendances, events)    │
                 └──────────────────────────────────────┘
```

The system does not follow a typical single-user table architecture:
1. **Multi-Table Authenticatable Models**: The original `users` table was dropped in migration `2026_02_12_013845`. Three distinct database tables and models handle authentication: `admin_users`, `program_heads`, and `students`.
2. **Unified Routing**: A unified login gateway (`POST /login` via `UnifiedLoginController`) inspects credentials across guards and directs the authenticated user to their respective dashboard.
3. **Dual QR Subsystems**: The system combines hardware/camera barcode scanning of printed Student IDs with a server-cached dynamic rotating QR portal for student self check-in.

---

## 4. Repository Directory Structure

```
c:\laragon\www\DSAMS\
├── app/
│   ├── Http/
│   │   ├── Controllers/            # 47 controllers partitioned by role and domain
│   │   └── Middleware/             # Security headers, auth sync, student approval, role checks
│   ├── Models/                     # 23 Eloquent models (AdminUser, ProgramHead, Student, etc.)
│   ├── Notifications/              # Database & mail notification channels
│   └── Services/
│       ├── Attendance/             # AttendanceScanner, GeofenceValidation, EvaluationGate, Conflicts
│       ├── Auth/                   # DeviceBindingService ("One Device, One Account")
│       └── ThermalPrinterService.php # ESC/POS network & serial printer driver
├── bootstrap/                      # Application bootstrapping & exception handling (bootstrap/app.php)
├── config/                         # Configuration (auth, database, geofence, fortify)
├── database/
│   ├── factories/                  # Model test factories
│   ├── migrations/                 # 88 sequential schema migrations
│   └── seeders/                    # Database seeders (Admin, Program, Disciplinary rules)
├── resources/
│   ├── css/                        # Tailwind CSS v4 setup (@import 'tailwindcss'; @theme)
│   ├── js/
│   │   ├── components/             # Reusable UI widgets, Modals, Scanner overlays, Pickers
│   │   ├── hooks/                  # Custom React hooks (useAppearance, useClipboard, useDeviceUuid)
│   │   ├── layouts/                # AppLayout, AuthLayout, SidebarLayout, HeaderLayout
│   │   ├── pages/
│   │   │   ├── admin-dashboard/    # Admin views (Attendance, Users, Events, Violations, Slips, Evaluations)
│   │   │   ├── auth/               # Login, Password reset, 2FA pages
│   │   │   ├── program-head/       # Department Head views (Attendance, Verification, Reports)
│   │   │   ├── student/            # Student portal (Dashboard, Scanner, Profile, Slips, Evaluations)
│   │   │   └── landing/            # Public marketing, Help, Privacy, Terms, Features
│   │   └── types/                  # TypeScript interface declarations
├── routes/
│   ├── console.php                 # Artisan scheduled commands
│   ├── settings.php                # Profile & security settings routes
│   └── web.php                     # Primary web route definitions (over 1,000 lines)
├── socket-server/                  # Standalone TypeScript Node.js Socket.IO server
└── tests/
    ├── Feature/                    # Pest feature tests (Auth, AutoEvaluation, BulkImport, Dashboard)
    └── Unit/                       # Unit test cases
```

---

## 5. User Roles and Permissions

| Role | Guard | Model | Database Table | Key Capabilities & Boundaries |
|---|---|---|---|---|
| **Administrator** | `admin` | `AdminUser` | `admin_users` | Full system control. Manages all programs, users, events, evaluations, admission slips, incident decisions, system archives, and activity logs. Supports **Admin Handover** with auto-expiration (`handover_expires_at`). |
| **Program Head / Personnel** | `program_head` | `ProgramHead` | `program_heads` | Departmental access scoped to their assigned `program` / `office`. Can create department events, manage department student verification, take attendance, clear attendance flags, and view department violation reports. |
| **Student** | `student` | `Student` | `students` | Accesses personal dashboard, submits admission slips (max 3/mo), answers evaluations, views attendance history, downloads certificates, and scans dynamic QR codes or GPS check-in. |
| **Student Officer** | `student` | `Student` | `students` | A student with designated `officer_features` (e.g. `scanner`) or assigned to an event via `scanner_student_ids`. Can operate the scanner portal for an event without having administrative privileges. |

---

## 6. Authentication and Authorization

### Guard Configuration ([config/auth.php](file:///c:/laragon/www/DSAMS/config/auth.php))
- `admin` -> Driver `session`, Provider `admin_users` (`App\Models\AdminUser`)
- `program_head` -> Driver `session`, Provider `program_heads` (`App\Models\ProgramHead`)
- `student` -> Driver `session`, Provider `students` (`App\Models\Student`)

### Unified Login Flow ([UnifiedLoginController.php](file:///c:/laragon/www/DSAMS/app/Http/Controllers/UnifiedLoginController.php))
1. Student / Staff submits credentials to `POST /login`.
2. The controller tests authentication against `admin_users` (via email), `program_heads` (via email), and `students` (via `email` or `student_id`).
3. If logging in as a student:
   - Validates `status == 'approved'` (handled by `EnsureStudentApproved` middleware).
   - Enforces device binding via `DeviceBindingService` (comparing `device_uuid`).
   - Redirects to `/student-dashboard` or prompts profile completion if mandatory fields are missing.

### Key Middlewares ([bootstrap/app.php](file:///c:/laragon/www/DSAMS/bootstrap/app.php))
- `auth.active:admin,program_head`: Validates that the active session matches either an admin or verified program head.
- `approved`: Ensures student account verification is active before accessing portal features.
- `role`: Role authorization enforcement.
- `SecurityAudit`: Automatically logs suspicious unauthorized accesses and throttling violations.

---

## 7. Feature and Module Inventory

1. **User Management**: Bulk CSV/XLSX import with validation, role assignment, officer permissions, device reset, student verification approval/rejection.
2. **Event Scheduling & Management**: Course and year-level targeting, venue definition, conflict detection, schedule approvals, scanner assignment.
3. **Dual-Mode Attendance Tracking**:
   - Hardware/Camera barcode/QR scan of physical Student ID.
   - Dynamic 30-second rotating QR server token (`DynamicAttendanceQrController`).
   - Direct GPS Geofence Check-in (`StudentAttendanceController@directGeofenceCheckin`).
   - Manual override with logged administrative justification.
   - Mid-session presence verification and anti-cheating flagging.
4. **Geofence Enforcement**: Haversine distance calculations with accuracy error buffer. Configurable per event (default venue lat/long with radial threshold).
5. **Student Disciplinary & Incident Management**:
   - Incident intake, student involvement association (JSON array), classification.
   - Multi-phase calling notices: Phase 1 (Initial Notice), Phase 2 (Follow-up), Phase 3 (Final / Parent Conference).
   - Formal investigation notes, decision serving, and disciplinary actions (Warning, Suspension, Exclusion, Expulsion).
6. **Admission Slips**:
   - Student request submission (reason, subject, date).
   - Strict `MONTHLY_LIMIT = 3` quota calculated dynamically per calendar month.
   - Administrative review, approval/rejection, archiving.
   - Direct thermal slip printing integration (ESC/POS).
7. **Evaluations**:
   - Event-linked evaluation forms with custom or standard rating criteria.
   - Evaluation gating: Enforces evaluation completion before allowing attendance at subsequent events.
   - Metrics aggregation (mean rating, submission counts, sentiment/feedback).
8. **E-Certificates**:
   - Auto-issuance linked to event attendance + evaluation completion.
   - Formatted serial number: `CERT-YYYY-XXXX`.
   - Direct PDF download with embedded digital signatures.
9. **Real-time Notifications**: Socket.IO integration delivering instant alerts on event updates, admission slip approvals, and disciplinary notices.
10. **Archive & Audit**: Soft-deletion/archiving system for events, users, evaluations, incidents, and admission slips; immutable audit trails with 30-day auto-pruning.

---

## 8. Exact File Map for Every Major Module

### Module: Authentication & Device Security
- **Controllers**:
  - `app/Http/Controllers/UnifiedLoginController.php` (Centralized credential resolution)
  - `app/Http/Controllers/StudentLoginController.php` (Legacy student login & logout)
  - `app/Http/Controllers/AdminLoginController.php` (Admin-specific login)
  - `app/Http/Controllers/ProgramHeadLoginController.php` (Department head login)
  - `app/Http/Controllers/ForgotPasswordController.php` & `ResetPasswordController.php` (Multi-guard password resets)
  - `app/Http/Controllers/AuthStatusController.php` (Login block status check)
- **Services**:
  - `app/Services/Auth/DeviceBindingService.php` (UUID tracking, conflict detection, device reset)
  - `app/Services/SecurityMonitor.php` (IP anomaly detection)
- **Frontend Pages**:
  - `resources/js/pages/auth/login.tsx` (Unified login form)
  - `resources/js/pages/auth/forgot-password.tsx` (Password recovery)

### Module: User Management & Registration
- **Controllers**:
  - `app/Http/Controllers/AdminManageUsersController.php` (CRUD, bulk import, status toggling)
  - `app/Http/Controllers/StudentRegistrationController.php` (Public registration step 1)
  - `app/Http/Controllers/StudentProfileController.php` (Post-login student profile completion)
- **Models**:
  - `app/Models/Student.php`
  - `app/Models/AdminUser.php`
  - `app/Models/ProgramHead.php`
- **Frontend Pages**:
  - `resources/js/pages/admin-dashboard/manage-users/index.tsx`
  - `resources/js/pages/auth/register.tsx`
  - `resources/js/components/StudentProfileCompletionModal.tsx`

### Module: Event Management
- **Controllers**:
  - `app/Http/Controllers/AdminEventsController.php` (Event creation, schedule approval, conflicting checks)
  - `app/Http/Controllers/ProgramHeadEventsController.php` (Department-scoped event creation)
  - `app/Http/Controllers/StudentEventsController.php` (Student view of upcoming events)
- **Models**:
  - `app/Models/Event.php` (Over 40KB of logic including conflict detection, scope filters, and eligibility)
  - `app/Models/Program.php`
- **Frontend Pages**:
  - `resources/js/pages/admin-dashboard/events/index.tsx`
  - `resources/js/pages/admin-dashboard/events/create.tsx`
  - `resources/js/pages/admin-dashboard/events/edit.tsx`
  - `resources/js/pages/admin-dashboard/events/participant-monitoring.tsx`

### Module: Attendance, QR & Geofence
- **Controllers**:
  - `app/Http/Controllers/AdminAttendanceController.php` (Session management, log tracking, manual overrides)
  - `app/Http/Controllers/DynamicAttendanceQrController.php` (30-second token rotation generator)
  - `app/Http/Controllers/StudentAttendanceController.php` (Student QR scan & direct GPS check-in)
  - `app/Http/Controllers/ProgramHeadAttendanceController.php` (Department attendance oversight)
- **Services**:
  - `app/Services/Attendance/GeofenceValidationService.php` (Haversine formula & accuracy buffer)
  - `app/Services/Attendance/AttendanceScannerService.php` (Scan validation & conflict engine)
  - `app/Services/Attendance/EvaluationGateService.php` (Blocks attendance if past evaluations are unfinished)
- **Frontend Pages**:
  - `resources/js/pages/admin-dashboard/attendance/scanner-portal.tsx` (Projector rotating QR code)
  - `resources/js/pages/admin-dashboard/qr-scanner/index.tsx` (Camera scanner for physical IDs)
  - `resources/js/pages/student/attendance/dynamic-qr-scan.tsx` (Student scanner camera)

### Module: Incidents, Violations & Discipline
- **Controllers**:
  - `app/Http/Controllers/AdminIncidentsViolationsController.php` (Case logs, calling notice dispatch, decision serving, masked reporter payloads)
  - `app/Http/Controllers/StudentIncidentController.php` (Student incident reporting with anti-spoofing, anonymous submission mode, and identity masking)
  - `app/Http/Controllers/ProgramHeadViolationsController.php` (Department violation viewer with masked reporter protection)
- **Models**:
  - `app/Models/Incident.php`
  - `app/Models/Violation.php`
  - `app/Models/DisciplinaryRule.php`
  - `app/Models/DisciplinaryAction.php`
- **Services**:
  - `app/Services/DisciplinaryService.php`
- **Frontend Pages**:
  - `resources/js/pages/admin-dashboard/incidents-violations/index.tsx`
  - `resources/js/pages/admin-dashboard/incidents-violations/CaseDetailPage.tsx`
  - `resources/js/pages/student/components/dashboard/ReportIncidentModal.tsx` (3-step reporting modal supporting identified vs. anonymous submission cards, locked reporter field, and dynamic submission buttons)
- **Privacy & Security Safeguards**:
  - Dual reporting modes: **Standard Identified Report** (locks `reported_by` to authenticated student) and **Submit Anonymously** (masks `reported_by` as `'Anonymous Student'`).
  - Identity spoofing protection: Client-supplied reporter names that do not match the authenticated student session or anonymous status are rejected on the server.
  - Exposure protection: Reporter identity is masked in admin dockets, program head viewers, respondent student dashboards, and database notifications (`IncidentReportedAdmin`). Confidential audit accountability is securely isolated in `investigation_details['restricted_audit']`.

### Module: Admission Slips & Thermal Printing
- **Controllers**:
  - `app/Http/Controllers/AdminAdmissionSlipController.php` (Admin review & approval)
  - `app/Http/Controllers/StudentAdmissionSlipController.php` (Student requests)
  - `app/Http/Controllers/ThermalPrintController.php` (ESC/POS bridge)
- **Models**:
  - `app/Models/AdmissionSlip.php` (Defines `MONTHLY_LIMIT = 3`)
- **Services**:
  - `app/Services/ThermalPrinterService.php`
- **Frontend Pages**:
  - `resources/js/pages/admin-dashboard/admission-slip/index.tsx`
  - `resources/js/pages/student/admission-slip/index.tsx`

### Module: Evaluations & Certificates
- **Controllers**:
  - `app/Http/Controllers/AdminEvaluationController.php` (Form builder, auto-generation, metrics)
  - `app/Http/Controllers/StudentEvaluationController.php` (Form response submission)
  - `app/Http/Controllers/CertificateController.php` (Certificate generation & PDF stream)
- **Models**:
  - `app/Models/Evaluation.php`
  - `app/Models/EvaluationResponse.php`
  - `app/Models/Certificate.php`
- **Services**:
  - `app/Services/EvaluationAutoGeneratorService.php` (Document parser creating evaluation forms)
  - `app/Services/EvaluationEligibilityService.php`

---

## 9. Routes and Middleware Reference

### Core Route Prefixes
- `/` -> Public landing, marketing, privacy, and terms routes.
- `/admin/*` -> Protected by `auth:admin`. Contains full administrative suite.
- `/program-head/*` -> Protected by `auth:program_head`. Scoped to department programs.
- `/student/*` -> Protected by `auth:student` and `approved`. Student portal actions.
- `/thermal-printer/*` -> Protected by `auth:admin,dsa,web`. Hardware bridge endpoints.

### CSRF Exemption List ([bootstrap/app.php](file:///c:/laragon/www/DSAMS/bootstrap/app.php))
Certain high-frequency barcode scanning and bulk upload routes bypass CSRF to support offline-first or camera scanner loops:
- `admin/manage-users/bulk-import`
- `admin/attendance/*/scan`
- `admin/attendance/*/logs`
- `student/attendance/*/scan`
- `student/attendance/*/dynamic-qr-scan`
- `student/attendance/*/geofence-checkin`

---

## 10. Database Tables, Fields, and Relationships

> [!TIP]
> **Complete Column-by-Column Data Dictionary**: For exhaustive column types, data lengths, constraints (PK/FK/Null), and descriptions for all 22+ tables, refer to [`DATA_DICTIONARY.md`](file:///c:/laragon/www/DSAMS/DATA_DICTIONARY.md).

### Primary Tables
1. **`admin_users`**: `id`, `name`, `email`, `password`, `handover_expires_at`, `created_by_admin_id`, `is_active`, `remember_token`, timestamps.
2. **`program_heads`**: `id`, `name`, `email`, `password`, `program`, `role`, `office`, `verification_status`, timestamps.
3. **`students`**: `id`, `student_id`, `name`, `first_name`, `middle_name`, `last_name`, `email`, `password`, `course`, `year_level`, `role`, `is_active`, `status`, `verification_status`, `qr_code_path`, `is_archived`, `device_uuid`, `device_name`, `officer_features` (JSON), full SIS profile fields (address, parents, emergency contact), timestamps.
4. **`events`**: `id`, `event_name`, `event_date`, `event_time`, `registration_end_time`, `location`, `courses` (JSON), `year_levels` (JSON), `scanner_portal_active`, `geofence_enabled`, `geofence_latitude`, `geofence_longitude`, `geofence_radius_m`, `attendance_type`, `approval_status`, `scanner_student_ids` (JSON), `archived_at`, timestamps.
5. **`attendances`**: `id`, `event_id`, `student_id`, `scanned_at`, `status`, `checked_in_at`, `checked_out_at`, `check_in_latitude`, `check_in_longitude`, `check_in_distance_m`, `check_in_token_id`, `is_manual_override`, `manual_override_reason`, `mid_session_verified_at`, `is_flagged`, `flagged_reason`, timestamps.
6. **`incidents`**: `id`, `violation_id`, `incident_type`, `incident_date`, `incident_time`, `location`, `reported_by`, `students_involved` (JSON), `description`, `evidence_paths` (JSON), `status`, `calling_phase`, `calling_phase_history` (JSON), `investigation_details` (JSON), `calling_notice_sent_at`, `is_archived`, timestamps.
7. **`violations`**: `id`, `code`, `name`, `description`, `section` (Warning, Suspension, Exclusion, Expulsion), `severity`, timestamps.
8. **`admission_slips`**: `id`, `student_id`, `student_name`, `program_year_level`, `date_issued`, `case_text`, `reason_text`, `valid_until`, `status`, `is_archived`, timestamps.
9. **`evaluations`**: `id`, `event_id`, `name`, `description`, `form_data` (JSON of sections and rating questions), `is_active`, `is_archived`, `published_at`, timestamps.
10. **`certificates`**: `id`, `student_id`, `event_id`, `evaluation_id`, `certificate_number`, `title`, `issue_date`, `certificate_file_path`, `is_generated`, timestamps.
11. **`activity_logs`**: `id`, `user_name`, `user_type`, `module`, `action`, `details`, `user_id`, `ip_address`, `user_agent`, `old_value` (JSON), `new_value` (JSON), timestamps.
12. **`audit_logs`**: `id`, `actor_id`, `role`, `target_id`, `action`, `old` (JSON), `new` (JSON), `ip`, `device`, `request_id`, timestamps (Auto-pruned after 30 days).

---

## 11. Core Business Rules and Workflows

### 1. "One Device, One Account" Anti-Proxy Rule
- Handled by `app/Services/Auth/DeviceBindingService.php`.
- Each student's initial login records a client-generated `device_uuid`.
- Any subsequent login attempt from that same physical device using a different student ID is blocked as a proxy violation and logged to `activity_logs`.
- Device switches must be explicitly reset by an Administrator via `POST /admin/manage-users/{student}/reset-device`.

### 2. Dual-Mode QR Attendance Flow
- **Mode A (Student ID QR)**: Printed barcode/QR containing the raw `student_id`. An administrator or student officer opens `/admin/qr-scanner`, camera decodes ID, sends `POST /admin/attendance/{event}/scan`.
- **Mode B (Dynamic Rotating QR)**: The administrator opens `/admin/attendance/{event}/dynamic-qr` on a projector. Every 30 seconds, an opaque random 48-character token is refreshed and stored in Laravel Cache (`DynamicAttendanceQrController`). Students scan this QR code via their phone camera (`/student/attendance/{event}/dynamic-qr-scan`).

### 3. Geofence Distance Validation
- When `geofence_enabled = true` on an event:
- Coordinate checking uses Haversine distance in `GeofenceValidationService.php`.
- Distance allowed = `geofence_radius_m` (default: 50m).
- To prevent false rejections due to mobile GPS drift, a dynamic accuracy buffer is applied:
  $$\text{effective\_distance} = \text{calculated\_distance} - \min(\text{accuracy\_m}, \max(50, \text{radius\_m}))$$

### 4. Admission Slip Monthly Quota
- Governed by `AdmissionSlip::MONTHLY_LIMIT = 3`.
- The system checks non-rejected requests submitted by the student within the current calendar month.
- Printed slips display current slip count (e.g. "Slip 2 of 3").

### 5. Multi-Phase Disciplinary Calling Notice
- Disciplinary cases progress through calling phases:
  - Phase 1: Initial call / notice to student.
  - Phase 2: Second reminder / preliminary investigation.
  - Phase 3: Final call / parent conference / OSA board decision.
- Every phase transition is appended to `calling_phase_history` (JSON).

### 6. Evaluation Gating for Certificates & Subsequent Events
- A student who attended an event cannot receive an e-certificate until they submit their evaluation for that event.
- `EvaluationGateService` also allows administrators to prevent a student from checking in to future events if past required evaluations remain incomplete.

---

## 12. Frontend Conventions & Styling Architecture

- **Tailwind CSS v4 Configuration**: Pure CSS configuration in [resources/css/app.css](file:///c:/laragon/www/DSAMS/resources/css/app.css) using `@theme` and `@custom-variant dark`. No `tailwind.config.js` exists.
- **Color Tokens**: CSS custom properties (`--primary`, `--secondary`, `--background`, `--card`, `--destructive`, `--sidebar-*`).
- **Typography**: Primary font is **Instrument Sans**.
- **Layout Patterns**: Pages wrap in `AppSidebarLayout` or `AppHeaderLayout`.
- **Inertia Dialogs**: Modals, slide-overs, and forms use Radix UI dialog primitives (`@radix-ui/react-dialog`) styled with Tailwind utility classes.

---

## 13. Testing Procedures & Current Coverage

- Test Runner: **Pest PHP** (`./vendor/bin/pest` or `php artisan test`).
- Existing Test Files:
  - `tests/Feature/AutoEvaluationGeneratorTest.php`: Tests document parsing validation and MIME checks.
  - `tests/Feature/BulkAddStudentsTest.php`: Tests CSV/XLSX template download and student bulk creation.
  - `tests/Feature/DashboardTest.php`: Tests authenticated access to role dashboards.
  - `tests/Feature/Auth/*`: Fortify authentication and password reset workflows.
- Execution Command:
  ```powershell
  php artisan test
  ```

---

## 14. Known Issues & Deprecated / Zombie Modules

> [!WARNING]
> **Dropped Tables Alert**:
> In migration `2026_05_18_000001_drop_announcements_and_lost_found_tables.php`, the following tables were intentionally dropped:
> - `announcements`
> - `lost_reports`
> - `found_items`
>
> However, controller files (`AdminAnnouncementController.php`, `AdminLostFoundController.php`, `StudentLostFoundController.php`) and some commented route references still exist in the repository. **Do not attempt to write queries against these three tables without first reintroducing their database migrations.**

---

## 15. Safe Development Guidelines

1. **Never Reintroduce a Single `users` Table**: All authentication must explicitly target `admin_users`, `program_heads`, or `students`.
2. **Never Add `tailwind.config.js`**: All styling changes must be declared inside [resources/css/app.css](file:///c:/laragon/www/DSAMS/resources/css/app.css) using Tailwind v4 syntax.
3. **Preserve Geofence Buffer Calculations**: Modifying the Haversine formula or removing the accuracy buffer in `GeofenceValidationService.php` will immediately result in false-positive geofence rejections for mobile students.
4. **Preserve CSRF Exemptions**: If refactoring scanner or bulk-import routes, ensure they remain in the CSRF exception list in `bootstrap/app.php` to prevent scanner hardware lockouts.
5. **Transactional Integrity & Concurrency Locking**: High-concurrency write operations (attendance scanning, geofence check-ins, admission slip approvals/quota enforcement, incident disciplinary actions, manual overrides, certificate generation) must be enclosed inside `DB::transaction()` with pessimistic row-locking (`->lockForUpdate()`) and handle `QueryException` (1062 duplicate key) cleanly to prevent race conditions and unhandled database errors.

---

## 16. Task-to-File Lookup Index (Section 24)

When working on a specific task or bug, consult this index to immediately find the authoritative files:

| Task / Problem Area | Most Relevant Files to Inspect |
|---|---|
| **Login / Authentication / 2FA** | • `app/Http/Controllers/UnifiedLoginController.php`<br>• `app/Http/Controllers/AuthStatusController.php`<br>• `config/auth.php`<br>• `resources/js/pages/auth/login.tsx` |
| **"One Device" / Device Binding Issues** | • `app/Services/Auth/DeviceBindingService.php`<br>• `app/Http/Controllers/AdminManageUsersController.php` (`resetStudentDevice`)<br>• `resources/js/hooks/useDeviceUuid.ts` |
| **Student Self-Registration & Information Sheet** | • `app/Http/Controllers/StudentRegistrationController.php`<br>• `app/Http/Controllers/StudentProfileController.php`<br>• `resources/js/components/StudentProfileCompletionModal.tsx`<br>• `resources/js/pages/student/information-sheet/index.tsx`<br>• `resources/js/pages/admin-dashboard/manage-users/ViewStudentDialog.tsx` |
| **QR Code Scanner / Camera Issues & High-Traffic Scalability** | • `app/Http/Controllers/AdminAttendanceController.php` (`scanAttendance`)<br>• `app/Services/Attendance/AttendanceScannerService.php`<br>• `database/migrations/2026_10_28_140000_add_performance_indexes_to_attendances_table.php`<br>• `resources/js/pages/admin-dashboard/qr-scanner/index.tsx` |
| **Dynamic Rotating QR Code** | • `app/Http/Controllers/DynamicAttendanceQrController.php`<br>• `resources/js/pages/admin-dashboard/attendance/scanner-portal.tsx`<br>• `resources/js/pages/student/attendance/dynamic-qr-scan.tsx` |
| **GPS / Geofencing / Map Errors** | • `app/Services/Attendance/GeofenceValidationService.php`<br>• `app/Http/Controllers/StudentAttendanceController.php` (`directGeofenceCheckin`)<br>• `resources/js/components/EventGeofenceMap.tsx`<br>• `resources/css/leaflet.css` |
| **Admission Slip Limits & Approvals** | • `app/Models/AdmissionSlip.php`<br>• `app/Http/Controllers/AdminAdmissionSlipController.php`<br>• `app/Http/Controllers/StudentAdmissionSlipController.php`<br>• `resources/js/pages/student/admission-slip/index.tsx` |
| **Thermal Printer Integration** | • `app/Http/Controllers/ThermalPrintController.php`<br>• `app/Services/ThermalPrinterService.php`<br>• `routes/web.php` (`/thermal-printer/*`) |
| **Disciplinary Incidents & Calling Notices** | • `app/Models/Incident.php`<br>• `app/Models/Violation.php`<br>• `app/Http/Controllers/StudentIncidentController.php` (Server identity validation & anonymous masking)<br>• `app/Http/Controllers/AdminIncidentsViolationsController.php`<br>• `resources/js/pages/student/components/dashboard/ReportIncidentModal.tsx`<br>• `resources/js/pages/admin-dashboard/incidents-violations/IncidentReportDialog.tsx` |
| **Evaluations & Gating Rules** | • `app/Models/Evaluation.php`<br>• `app/Services/Attendance/EvaluationGateService.php`<br>• `app/Http/Controllers/AdminEvaluationController.php`<br>• `resources/js/pages/admin-dashboard/evaluation/EvaluationFormDetails.tsx` |
| **Certificate Generation** | • `app/Models/Certificate.php`<br>• `app/Http/Controllers/CertificateController.php`<br>• `resources/js/pages/student/certificates/index.tsx` |
| **Real-Time Push / Socket.IO & Attendance Broadcasts** | • `socket-server/src/index.ts`<br>• `app/Services/RealtimeNotificationService.php` (`broadcastAttendanceScan`)<br>• `resources/js/services/socket.ts` (`joinEventRoom`)<br>• `resources/js/hooks/useNotifications.ts` |
| **Activity & Security Audit Logs** | • `app/Models/ActivityLog.php`<br>• `app/Models/AuditLog.php`<br>• `app/Http/Controllers/AdminActivityLogController.php`<br>• `resources/js/pages/admin-dashboard/activity-log/index.tsx` |
| **Admin Reports & Turnout Percentages** | • `app/Http/Controllers/AdminReportsController.php`<br>• `resources/js/pages/admin-dashboard/reports/index.tsx`<br>• `resources/views/admin/reports/print.blade.php` |
| **WCAG 2.2.1 Timing Adjustability & Session Timeout** | • `app/Http/Controllers/SessionTimeoutController.php`<br>• `resources/js/components/SessionTimeoutModal.tsx`<br>• `resources/js/app.tsx` (`<SessionTimeoutModal />`)<br>• `routes/web.php` (`/api/session/status`, `/api/session/extend`) |
| **Student Event Attendance History** | • `app/Http/Controllers/StudentDashboardController.php` (`history`, `getAttendedEventsHistory`)<br>• `resources/js/pages/student/components/dashboard/StudentEventHistory.tsx`<br>• `resources/js/pages/student/components/dashboard/StudentTimelineEvents.tsx`<br>• `resources/js/routes.ts` (`studentEventHistory`)<br>• `routes/web.php` (`/student/event-history`) |
| **UI Theme / Styling Changes** | • `resources/css/app.css` (Tailwind v4 tokens & theme)<br>• `resources/js/layouts/app/app-sidebar-layout.tsx`<br>• `resources/js/components/ui/*` |
| **Modal & Dialog Design System** | • `resources/js/components/ui/dialog.tsx` (Standardized widths, backdrop blur, elevation, preventClose, red close button)<br>• `resources/js/components/ui/confirmation-dialog.tsx` (Reusable typed alert/confirmation dialog)<br>• `resources/css/app.css` (SweetAlert2 popups & modal form element standardization) |
| **Form Validation & Required Field Indicators** | • `resources/js/components/ui/form-required-notice.tsx`<br>• `resources/js/components/ui/label.tsx`<br>• `resources/js/components/ui/input.tsx`<br>• `resources/js/components/ui/textarea.tsx`<br>• `resources/js/components/ui/select.tsx`<br>• `resources/js/components/input-error.tsx`<br>• `resources/js/lib/formFocusNavigation.ts`<br>• `resources/js/hooks/useFormValidation.ts` |
