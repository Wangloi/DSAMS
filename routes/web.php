<?php

use App\Http\Controllers\LandingController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\StudentRegistrationController;
use App\Http\Controllers\ProgramHeadDashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminManageUsersController;
use App\Http\Controllers\AdminAdmissionSlipController;
use App\Http\Controllers\AdminIncidentsViolationsController;
use App\Http\Controllers\AdminAttendanceController;
use App\Http\Controllers\AdminAnnouncementController;
use App\Http\Controllers\AdminAnalyticsController;
use App\Http\Controllers\AdminReportsController;
use App\Http\Controllers\AdminLostFoundController;
use App\Http\Controllers\AdminEvaluationController;
use App\Http\Controllers\AdminArchiveController;
use App\Http\Controllers\AdminActivityLogController;
use App\Http\Controllers\AdminProgramsController;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\StudentLoginController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\StudentIncidentController;
use App\Http\Controllers\StudentLostFoundController;
use App\Http\Controllers\DSAAdmissionSlipController;
use App\Http\Controllers\StudentEvaluationController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\StudentEventsController;
use App\Http\Controllers\ProgramHeadLoginController;
use App\Http\Controllers\UnifiedLoginController;
use App\Http\Controllers\ProgramHeadEventsController;
use App\Http\Controllers\DynamicAttendanceQrController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Student;

Route::get('/', [LandingController::class, 'index'])->name('landing');

Route::get('/__debug/config', function () {
    return response()->json([
        'database_default' => config('database.default'),
        'env_db_connection' => env('DB_CONNECTION'),
        'env_db_database' => env('DB_DATABASE'),
        'session_driver' => config('session.driver'),
        'session_connection' => config('session.connection'),
        'env_session_connection' => env('SESSION_CONNECTION'),
    ]);
});

Route::get('/features', function () {
    return Inertia::render('landing/features');
})->name('landing.features');

Route::get('/about', function () {
    return Inertia::render('landing/about');
})->name('landing.about');

Route::get('/get-started', function () {
    return Inertia::render('landing/get-started');
})->name('landing.get-started');

// Unified login route
Route::post('/login', [UnifiedLoginController::class, 'login'])->middleware('throttle:login');

// Keep existing login routes for backward compatibility
Route::post('/admin-login', [AdminLoginController::class, 'login'])->middleware('throttle:admin-login');
Route::post('/student-login', [StudentLoginController::class, 'login']);
Route::post('/program-head-login', [ProgramHeadLoginController::class, 'login'])->middleware('throttle:program-head-login');

// Test route to check controllers
Route::get('/test-student-login', function () {
    return 'StudentLoginController exists!';
});

Route::post('/logout', function (Request $request) {
    foreach (['web', 'admin', 'student', 'program_head'] as $guard) {
        if (Auth::guard($guard)->check()) {
            Auth::guard($guard)->logout();
        }
    }

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('logout');

Route::post('/student-logout', [StudentLoginController::class, 'logout'])->middleware('auth:student');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('/student-dashboard', [StudentDashboardController::class, 'index'])->middleware(['auth:student', 'approved'])->name('student.dashboard');

Route::get('/student/attendance/scanner-portal/{event}', [StudentAttendanceController::class, 'scannerPortal'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.attendance.scanner-portal');

Route::post('/student/attendance/{event}/scan', [StudentAttendanceController::class, 'scanAttendance'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.attendance.scan');

// Dynamic QR self check-in (student scans the admin's rotating QR)
Route::get('/student/attendance/{event}/dynamic-qr-scan', function (\App\Models\Event $event) {
    $student = auth()->guard('student')->user();
    if (! $student) { abort(403); }
    return \Inertia\Inertia::render('student/attendance/dynamic-qr-scan', [
        'event' => [
            'id'                  => $event->id,
            'name'                => $event->event_name,
            'date'                => optional($event->event_date)->format('Y-m-d'),
            'location'            => $event->location,
            'geofenceEnabled'     => (bool) ($event->geofence_enabled ?? false),
            'geofenceLatitude'    => $event->geofence_latitude,
            'geofenceLongitude'   => $event->geofence_longitude,
            'geofenceRadiusM'     => (int) ($event->geofence_radius_m ?? 50),
            'scannerPortalActive' => (bool) $event->scanner_portal_active,
        ],
    ]);
})->middleware(['auth:student', 'approved'])->name('student.attendance.dynamic-qr-scan');

Route::post('/student/attendance/{event}/dynamic-qr-scan', [StudentAttendanceController::class, 'dynamicQrScan'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.attendance.dynamic-qr-scan.submit');

// Admin: display rotating QR code for projector / monitor
Route::get('/admin/attendance/{event}/dynamic-qr', [DynamicAttendanceQrController::class, 'show'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.dynamic-qr');

// Admin API: generate a fresh short-lived token (polled every 30 s by the QR display page)
Route::get('/admin/attendance/{event}/dynamic-qr/token', [DynamicAttendanceQrController::class, 'token'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.dynamic-qr.token');

Route::get('/student/evaluation/{evaluation}', [StudentEvaluationController::class, 'show'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.evaluation.show');

Route::post('/student/evaluation/{evaluation}', [StudentEvaluationController::class, 'submit'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.evaluation.submit');

Route::get('/student/events/{event}/logs', [StudentEventsController::class, 'logs'])->middleware(['auth:student', 'verified'])->name('student.events.logs');
Route::get('/student/notifications', [App\Http\Controllers\NotificationController::class, 'studentIndex'])->middleware(['auth:student', 'verified'])->name('student.notifications');

Route::get('/student/incidents', function () {
    return redirect()->route('student.dashboard');
})->middleware(['auth:student', 'approved']);

Route::get('/student/students/search', function (Request $request) {
    $query = $request->query('q', '');
    $query = trim($query);

    if ($query === '') {
        return response()->json(['students' => []]);
    }

    $students = Student::query()
        ->where(function ($q) use ($query) {
            $q->where('student_id', 'LIKE', "%{$query}%")
              ->orWhere('name', 'LIKE', "%{$query}%");
        })
        ->select('student_id', 'name')
        ->limit(50)
        ->get()
        ->map(function ($student) {
            return [
                'id' => $student->student_id, // Use student_id as the id
                'name' => $student->name,
            ];
        });

    return response()->json(['students' => $students]);
})->middleware(['auth:student', 'approved'])->name('student.students.search');

Route::post('/student/incidents', [StudentIncidentController::class, 'store'])->middleware(['auth:student', 'approved'])->name('student.incidents.store');

Route::get('/student/admission-slip', function () {
    return Inertia::render('student/admission-slip/index');
})->middleware(['auth:student', 'approved'])->name('student.admission-slip.index');

Route::post('/student/admission-slip', [\App\Http\Controllers\StudentAdmissionSlipController::class, 'store'])
    ->middleware(['auth:student', 'approved'])
    ->name('student.admission-slip.store');





// Lost & Found (disabled for student UI)
// Route::get('/student/lost-found/items', [StudentLostFoundController::class, 'foundItems'])->middleware(['auth:student', 'verified'])->name('student.lost-found.items');
// Route::post('/student/lost-found/{foundItem}/claim', [StudentLostFoundController::class, 'claim'])->middleware(['auth:student', 'verified'])->name('student.lost-found.claim');
// Route::get('/student/lost-found/my-reports', [StudentLostFoundController::class, 'myLostReports'])->middleware(['auth:student', 'verified'])->name('student.lost-found.my-reports');
// Route::post('/student/lost-found/report-lost', [StudentLostFoundController::class, 'storeLostReport'])->middleware(['auth:student', 'verified'])->name('student.lost-found.report-lost');
// Route::post('/student/lost-found/report-found', [StudentLostFoundController::class, 'storeFoundItem'])->middleware(['auth:student', 'verified'])->name('student.lost-found.report-found');

// Student Registration Routes (Modal Only)
Route::post('/student-register/step1', [StudentRegistrationController::class, 'storeStep1'])->name('student.register.step1.store');
Route::post('/student-register/step2', [StudentRegistrationController::class, 'storeStep2'])->name('student.register.step2.store');
Route::post('/student-register/step3', [StudentRegistrationController::class, 'storeStep3'])->name('student.register.step3.store');
Route::post('/student-register/step4', [StudentRegistrationController::class, 'storeStep4'])->name('student.register.step4.store');
Route::post('/student-register/complete', [StudentRegistrationController::class, 'complete'])->name('student.register.complete');
Route::post('/student-register/restart', [StudentRegistrationController::class, 'restart'])->name('student.register.restart');

Route::get('/program-head-dashboard', [ProgramHeadDashboardController::class, 'index'])->middleware(['auth:program_head', 'verified'])->name('program-head.dashboard');
Route::get('/program-head/students', [ProgramHeadDashboardController::class, 'students'])->middleware(['auth:program_head', 'verified'])->name('program-head.students');

Route::post('/program-head/students/bulk/verification/approve', [ProgramHeadDashboardController::class, 'bulkApproveVerification'])->middleware(['auth:program_head', 'verified'])->name('program-head.students.bulk-verification-approve');
Route::post('/program-head/students/bulk/verification/reject', [ProgramHeadDashboardController::class, 'bulkRejectVerification'])->middleware(['auth:program_head', 'verified'])->name('program-head.students.bulk-verification-reject');
Route::post('/program-head/students/bulk/status/activate', [ProgramHeadDashboardController::class, 'bulkActivate'])->middleware(['auth:program_head', 'verified'])->name('program-head.students.bulk-status-activate');
Route::post('/program-head/students/bulk/status/deactivate', [ProgramHeadDashboardController::class, 'bulkDeactivate'])->middleware(['auth:program_head', 'verified'])->name('program-head.students.bulk-status-deactivate');
Route::post('/program-head/students/bulk/year-level', [ProgramHeadDashboardController::class, 'bulkSetYearLevel'])->middleware(['auth:program_head', 'verified'])->name('program-head.students.bulk-year-level');

Route::get('/program-head/attendance', [App\Http\Controllers\ProgramHeadAttendanceController::class, 'index'])->middleware(['auth:program_head', 'verified'])->name('program-head.attendance');
Route::get('/program-head/attendance/{event}/logs', [App\Http\Controllers\ProgramHeadAttendanceController::class, 'logs'])->middleware(['auth:program_head', 'verified'])->name('program-head.attendance.logs');
Route::get('/program-head/attendance/{event}/students', [App\Http\Controllers\ProgramHeadAttendanceController::class, 'studentsByCourse'])->middleware(['auth:program_head', 'verified'])->name('program-head.attendance.students');
Route::get('/program-head/attendance/{event}/print', [App\Http\Controllers\ProgramHeadAttendanceController::class, 'printEvent'])->middleware(['auth:program_head', 'verified'])->name('program-head.attendance.print');
Route::get('/program-head/violations', [App\Http\Controllers\ProgramHeadViolationsController::class, 'index'])->middleware(['auth:program_head', 'verified'])->name('program-head.violations');

// Program Head announcements page disabled.

Route::get('/program-head/reports', [App\Http\Controllers\ProgramHeadReportsController::class, 'index'])->middleware(['auth:program_head', 'verified'])->name('program-head.reports');
Route::get('/program-head/reports/print', [App\Http\Controllers\ProgramHeadReportsController::class, 'print'])->middleware(['auth:program_head', 'verified'])->name('program-head.reports.print');
Route::get('/program-head/reports/export/csv', [App\Http\Controllers\ProgramHeadReportsController::class, 'exportCsv'])->middleware(['auth:program_head', 'verified'])->name('program-head.reports.export.csv');

Route::get('/program-head/reports/attendance', function () {
    return redirect()->route('program-head.reports');
});

Route::get('/program-head/reports/violations', function () {
    return redirect()->route('program-head.reports');
});

Route::get('/program-head/calendar-events', [ProgramHeadEventsController::class, 'index'])->middleware(['auth:program_head', 'verified'])->name('program-head.calendar-events');

Route::get('/program-head/activity-log', function () {
    return Inertia::render('program-head/ActivityLog');
})->middleware(['auth:program_head', 'verified'])->name('program-head.activity-log');

Route::get('/admin/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->middleware('auth:admin')->name('admin.notifications');
Route::get('/admin-dashboard', [AdminDashboardController::class, 'index'])->middleware('auth:admin')->name('admin.dashboard');

Route::get('/admin', function () {
    return redirect()->route('admin.dashboard');
})->middleware('auth:admin')->name('admin.redirect');

Route::get('/admin/manage-users', [AdminManageUsersController::class, 'index'])->middleware('auth:admin')->name('admin.manage-users');
Route::post('/admin/manage-users', [AdminManageUsersController::class, 'store'])->middleware('auth:admin')->name('admin.manage-users.store');
Route::put('/admin/manage-users', [AdminManageUsersController::class, 'updateLegacy'])->middleware('auth:admin')->name('admin.manage-users.update-legacy');
Route::delete('/admin/manage-users', [AdminManageUsersController::class, 'destroyLegacy'])->middleware('auth:admin')->name('admin.manage-users.destroy-legacy');
Route::put('/admin/manage-users/{student}', [AdminManageUsersController::class, 'update'])->middleware('auth:admin')->name('admin.manage-users.update');
Route::match(['put', 'post'], '/admin/manage-users/{student}/status', [AdminManageUsersController::class, 'updateStatus'])->middleware('auth:admin')->name('admin.manage-users.status');
Route::match(['put', 'post'], '/admin/manage-users/{student}/status/approve', [AdminManageUsersController::class, 'updateApproval'])->middleware('auth:admin')->name('admin.manage-users.approve');
Route::match(['put', 'post'], '/admin/manage-users/{student}/archive', [AdminManageUsersController::class, 'archive'])->middleware('auth:admin')->name('admin.manage-users.archive');

// Verification (ProgramHeads + Bulk)
Route::match(['put', 'post'], '/admin/manage-users/program-heads/{programHead}/verification/approve', [AdminManageUsersController::class, 'approveProgramHead'])->middleware('auth:admin')->name('admin.manage-users.program-heads.approve');
Route::match(['put', 'post'], '/admin/manage-users/program-heads/{programHead}/verification/reject', [AdminManageUsersController::class, 'rejectProgramHead'])->middleware('auth:admin')->name('admin.manage-users.program-heads.reject');

Route::post('/admin/manage-users/bulk/verification/approve', [AdminManageUsersController::class, 'bulkApproveVerification'])->middleware('auth:admin')->name('admin.manage-users.bulk-verification-approve');
Route::post('/admin/manage-users/bulk/verification/reject', [AdminManageUsersController::class, 'bulkRejectVerification'])->middleware('auth:admin')->name('admin.manage-users.bulk-verification-reject');
Route::post('/admin/manage-users/bulk/status/activate', [AdminManageUsersController::class, 'bulkActivate'])->middleware('auth:admin')->name('admin.manage-users.bulk-status-activate');
Route::post('/admin/manage-users/bulk/status/deactivate', [AdminManageUsersController::class, 'bulkDeactivate'])->middleware('auth:admin')->name('admin.manage-users.bulk-status-deactivate');
Route::post('/admin/manage-users/bulk/year-level', [AdminManageUsersController::class, 'bulkSetYearLevel'])->middleware('auth:admin')->name('admin.manage-users.bulk-year-level');
Route::match(['put', 'post'], '/admin/manage-users/{student}/unarchive', [AdminManageUsersController::class, 'unarchive'])->middleware('auth:admin')->name('admin.manage-users.unarchive');
Route::delete('/admin/manage-users/{student}', [AdminManageUsersController::class, 'destroy'])->middleware('auth:admin')->name('admin.manage-users.destroy');

Route::put('/admin/program-heads/{programHead}', [AdminManageUsersController::class, 'updateProgramHead'])
    ->middleware('auth:admin')
    ->name('admin.program-heads.update');

// Programs Routes
Route::get('/admin/programs', [AdminProgramsController::class, 'index'])->middleware('auth:admin')->name('admin.programs');
Route::post('/admin/programs', [AdminProgramsController::class, 'store'])->middleware('auth:admin')->name('admin.programs.store');
Route::get('/admin/programs/create', [AdminProgramsController::class, 'create'])->middleware('auth:admin')->name('admin.programs.create');
Route::get('/admin/programs/{program}', [AdminProgramsController::class, 'show'])->middleware('auth:admin')->name('admin.programs.show');
Route::get('/admin/programs/{program}/edit', [AdminProgramsController::class, 'edit'])->middleware('auth:admin')->name('admin.programs.edit');
Route::put('/admin/programs/{program}', [AdminProgramsController::class, 'update'])->middleware('auth:admin')->name('admin.programs.update');
Route::delete('/admin/programs/{program}', [AdminProgramsController::class, 'destroy'])->middleware('auth:admin')->name('admin.programs.destroy');
Route::put('/admin/programs/{program}/archive', [AdminProgramsController::class, 'archive'])->middleware('auth:admin')->name('admin.programs.archive');
Route::put('/admin/programs/{program}/unarchive', [AdminProgramsController::class, 'unarchive'])->middleware('auth:admin')->name('admin.programs.unarchive');

// Events Routes
Route::get('/admin/events', [\App\Http\Controllers\AdminEventsController::class, 'index'])->middleware('auth:admin')->name('admin.events');
Route::post('/admin/events', [\App\Http\Controllers\AdminEventsController::class, 'store'])->middleware('auth:admin')->name('admin.events.store');
Route::get('/admin/events/create', [\App\Http\Controllers\AdminEventsController::class, 'create'])->middleware('auth:admin')->name('admin.events.create');
Route::get('/admin/events/{event}', [\App\Http\Controllers\AdminEventsController::class, 'show'])->middleware('auth:admin')->name('admin.events.show');
Route::get('/admin/events/{event}/edit', [\App\Http\Controllers\AdminEventsController::class, 'edit'])->middleware('auth:admin')->name('admin.events.edit');
Route::put('/admin/events/{event}', [\App\Http\Controllers\AdminEventsController::class, 'update'])->middleware('auth:admin')->name('admin.events.update');
Route::delete('/admin/events/{event}', [\App\Http\Controllers\AdminEventsController::class, 'destroy'])->middleware('auth:admin')->name('admin.events.destroy');
Route::put('/admin/events/{event}/archive', [\App\Http\Controllers\AdminEventsController::class, 'archive'])->middleware('auth:admin')->name('admin.events.archive');
Route::put('/admin/events/{event}/unarchive', [\App\Http\Controllers\AdminEventsController::class, 'unarchive'])->middleware('auth:admin')->name('admin.events.unarchive');
Route::get('/admin/events/{event}/qr-code', [\App\Http\Controllers\AdminEventsController::class, 'qrCode'])->middleware('auth:admin')->name('admin.events.qr-code');
Route::get('/admin/events/{event}/participant-monitoring', [\App\Http\Controllers\AdminEventsController::class, 'participantMonitoring'])->middleware('auth:admin')->name('admin.events.participant-monitoring');
Route::get('/admin/events/{event}/attendance-assignment', [\App\Http\Controllers\AdminEventsController::class, 'attendanceAssignment'])->middleware('auth:admin')->name('admin.events.attendance-assignment');
Route::post('/admin/events/{event}/attendance-assignment', [\App\Http\Controllers\AdminEventsController::class, 'storeAttendanceAssignment'])->middleware('auth:admin')->name('admin.events.attendance-assignment.store');

Route::get('/admin/admission-slip', [AdminAdmissionSlipController::class, 'index'])->middleware('auth:admin')->name('admin.admission-slip');
Route::post('/admin/admission-slip', [AdminAdmissionSlipController::class, 'store'])->middleware('auth:admin')->name('admin.admission-slip.store');
Route::put('/admin/admission-slip', [AdminAdmissionSlipController::class, 'updateLegacy'])->middleware('auth:admin')->name('admin.admission-slip.update-legacy');
Route::delete('/admin/admission-slip', [AdminAdmissionSlipController::class, 'destroyLegacy'])->middleware('auth:admin')->name('admin.admission-slip.destroy-legacy');
Route::put('/admin/admission-slip/{admissionSlip}', [AdminAdmissionSlipController::class, 'update'])->middleware('auth:admin')->name('admin.admission-slip.update');
Route::delete('/admin/admission-slip/{admissionSlip}', [AdminAdmissionSlipController::class, 'destroy'])->middleware('auth:admin')->name('admin.admission-slip.destroy');

Route::put('/admin/admission-slip/{admissionSlip}/archive', [AdminAdmissionSlipController::class, 'archive'])->middleware('auth:admin')->name('admin.admission-slip.archive');
Route::put('/admin/admission-slip/{admissionSlip}/unarchive', [AdminAdmissionSlipController::class, 'unarchive'])->middleware('auth:admin')->name('admin.admission-slip.unarchive');

Route::put('/admin/admission-slip/{admissionSlip}/approve', [AdminAdmissionSlipController::class, 'approve'])->middleware('auth:admin')->name('admin.admission-slip.approve');
Route::put('/admin/admission-slip/{admissionSlip}/reject', [AdminAdmissionSlipController::class, 'reject'])->middleware('auth:admin')->name('admin.admission-slip.reject');

// DSA Admission Slip Routes (DSA-only)
Route::get('/dsa/admission-slip', [DSAAdmissionSlipController::class, 'index'])->middleware('auth:dsa')->name('dsa.admission-slip');
Route::post('/dsa/admission-slip', [DSAAdmissionSlipController::class, 'store'])->middleware('auth:dsa')->name('dsa.admission-slip.store');
Route::put('/dsa/admission-slip/{admissionSlip}', [DSAAdmissionSlipController::class, 'update'])->middleware('auth:dsa')->name('dsa.admission-slip.update');
Route::delete('/dsa/admission-slip/{admissionSlip}', [DSAAdmissionSlipController::class, 'destroy'])->middleware('auth:dsa')->name('dsa.admission-slip.destroy');
Route::put('/dsa/admission-slip/{admissionSlip}/approve', [DSAAdmissionSlipController::class, 'approve'])->middleware('auth:dsa')->name('dsa.admission-slip.approve');
Route::put('/dsa/admission-slip/{admissionSlip}/reject', [DSAAdmissionSlipController::class, 'reject'])->middleware('auth:dsa')->name('dsa.admission-slip.reject');
Route::put('/dsa/admission-slip/{admissionSlip}/archive', [DSAAdmissionSlipController::class, 'archive'])->middleware('auth:dsa')->name('dsa.admission-slip.archive');
Route::put('/dsa/admission-slip/{admissionSlip}/unarchive', [DSAAdmissionSlipController::class, 'unarchive'])->middleware('auth:dsa')->name('dsa.admission-slip.unarchive');

Route::get('/admin/students/lookup', function (Request $request) {
    $studentId = (string) $request->query('student_id', '');
    $studentId = trim($studentId);

    if ($studentId === '') {
        return response()->json(['message' => 'student_id is required'], 422);
    }

    $student = Student::query()->where('student_id', $studentId)->first();
    if (!$student) {
        return response()->json(['message' => 'Student not found'], 404);
    }

    return response()->json([
        'id' => $student->id,
        'student_id' => $student->student_id,
        'name' => $student->name,
        'course' => $student->course,
        'year_level' => $student->year_level,
    ]);
})->middleware('auth:admin')->name('admin.students.lookup');

Route::get('/admin/students/search', function (Request $request) {
    $query = $request->query('q', '');
    $query = trim($query);

    if ($query === '') {
        return response()->json(['students' => []]);
    }

    $students = Student::query()
        ->where(function ($q) use ($query) {
            $q->where('student_id', 'LIKE', "%{$query}%")
              ->orWhere('name', 'LIKE', "%{$query}%");
        })
        ->select('student_id', 'name')
        ->limit(50)
        ->get()
        ->map(function ($student) {
            return [
                'id' => $student->student_id, // Use student_id as the id
                'name' => $student->name,
            ];
        });

    return response()->json(['students' => $students]);
})->middleware('auth:admin')->name('admin.students.search');

Route::get('/admin/incidents-violations', [AdminIncidentsViolationsController::class, 'index'])->middleware('auth:admin')->name('admin.incidents-violations');
Route::get('/admin/incidents-violations/{incident}', [AdminIncidentsViolationsController::class, 'show'])->middleware('auth:admin')->name('admin.incidents-violations.show');
Route::post('/admin/incidents-violations', [AdminIncidentsViolationsController::class, 'store'])->middleware('auth:admin')->name('admin.incidents-violations.store');
Route::match(['put', 'post'], '/admin/incidents-violations/{incident}', [AdminIncidentsViolationsController::class, 'update'])->middleware('auth:admin')->name('admin.incidents-violations.update');
Route::delete('/admin/incidents-violations/{incident}', [AdminIncidentsViolationsController::class, 'destroy'])->middleware('auth:admin')->name('admin.incidents-violations.destroy');
Route::match(['put', 'post'], '/admin/incidents-violations/{incident}/archive', [AdminIncidentsViolationsController::class, 'archive'])->middleware('auth:admin')->name('admin.incidents-violations.archive');
Route::put('/admin/incidents-violations/{incident}/unarchive', [AdminIncidentsViolationsController::class, 'unarchive'])->middleware('auth:admin')->name('admin.incidents-violations.unarchive');

// Disciplinary action routes (from case detail page)
Route::post('/admin/incidents-violations/{incident}/disciplinary-action', [AdminIncidentsViolationsController::class, 'storeDisciplinaryAction'])->middleware('auth:admin')->name('admin.incidents-violations.disciplinary-action.store');
Route::post('/admin/disciplinary-action/{action}/review', [AdminIncidentsViolationsController::class, 'reviewDisciplinaryAction'])->middleware('auth:admin')->name('admin.disciplinary-action.review');

// Put specific routes with parameters first
Route::post('/admin/attendance/{event}/activate-scanner-portal', [AdminAttendanceController::class, 'activateScannerPortal'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.activate-scanner-portal');

Route::get('/admin/attendance/{event}/logs', [AdminAttendanceController::class, 'logs'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.logs');

Route::get('/admin/attendance/{event}/students-by-course', [AdminAttendanceController::class, 'studentsByCourse'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.students-by-course');

// Route::get('/admin/attendance/{event}/manual-override', [AdminManualOverrideController::class, 'index'])
//     ->middleware(['web', 'auth:admin'])
//     ->name('admin.attendance.manual-override.index');

// Route::post('/admin/attendance/{event}/manual-override', [AdminManualOverrideController::class, 'store'])
//     ->middleware(['web', 'auth:admin'])
//     ->name('admin.attendance.manual-override.store');

Route::post('/admin/attendance/{event}/scan', [AdminAttendanceController::class, 'scanAttendance'])
    ->middleware(['web', 'auth:admin'])
    ->name('admin.attendance.scan');
Route::match(['put', 'post'], '/admin/attendance/{event}', [AdminAttendanceController::class, 'update'])->middleware(['web', 'auth:admin'])->name('admin.attendance.update');
Route::delete('/admin/attendance/{event}', [AdminAttendanceController::class, 'destroy'])->middleware(['web', 'auth:admin'])->name('admin.attendance.destroy');
Route::put('/admin/attendance/{event}/archive', [AdminAttendanceController::class, 'archive'])->middleware(['web', 'auth:admin'])->name('admin.attendance.archive');
Route::put('/admin/attendance/{event}/unarchive', [AdminAttendanceController::class, 'unarchive'])->middleware(['web', 'auth:admin'])->name('admin.attendance.unarchive');

// Then put general routes without parameters
Route::get('/admin/attendance', [AdminAttendanceController::class, 'index'])->middleware(['web', 'auth:admin'])->name('admin.attendance');
Route::post('/admin/attendance', [AdminAttendanceController::class, 'store'])->middleware(['web', 'auth:admin'])->name('admin.attendance.store');

// Debug route to check what's being called
Route::match(['get', 'post', 'put', 'delete'], '/admin/attendance/debug', function (Request $request) {
    \Log::info('Debug route called:', [
        'method' => $request->method(),
        'url' => $request->fullUrl(),
        'headers' => $request->headers->all(),
        'body' => $request->all(),
    ]);
    return response()->json(['debug' => 'ok']);
})->middleware(['web', 'auth:admin']);

// Test route to verify delete works
Route::delete('/admin/attendance/test/{id}', function ($id) {
    \Log::info('Test delete route called with ID: ' . $id);
    return response()->json(['message' => 'Test delete successful for ID: ' . $id]);
})->middleware(['web', 'auth:admin']);

// Announcements (disabled for admin UI)
// Route::get('/admin/announcement', [AdminAnnouncementController::class, 'index'])->middleware('auth:admin')->name('admin.announcement');
// Route::post('/admin/announcement', [AdminAnnouncementController::class, 'store'])->middleware('auth:admin')->name('admin.announcement.store');
// Route::get('/admin/announcement/{announcement}', [AdminAnnouncementController::class, 'show'])->middleware('auth:admin')->name('admin.announcement.show');
// Route::match(['put', 'post'], '/admin/announcement/{announcement}', [AdminAnnouncementController::class, 'update'])->middleware('auth:admin')->name('admin.announcement.update');
// Route::match(['put', 'post'], '/admin/announcement/{announcement}/archive', [AdminAnnouncementController::class, 'archive'])->middleware('auth:admin')->name('admin.announcement.archive');
// Route::put('/admin/announcement/{announcement}/unarchive', [AdminAnnouncementController::class, 'unarchive'])->middleware('auth:admin')->name('admin.announcement.unarchive');


Route::get('/admin/analytics', [AdminAnalyticsController::class, 'index'])->middleware('auth:admin')->name('admin.analytics');
Route::get('/admin/analytics/data', [AdminAnalyticsController::class, 'data'])->middleware('auth:admin')->name('admin.analytics.data');

Route::get('/admin/reports', [AdminReportsController::class, 'index'])->middleware('auth:admin')->name('admin.reports');
Route::get('/admin/reports/export/csv', [AdminReportsController::class, 'exportCsv'])->middleware('auth:admin')->name('admin.reports.export.csv');
Route::get('/admin/reports/print', [AdminReportsController::class, 'print'])->middleware('auth:admin')->name('admin.reports.print');

Route::get('/admin/attendance/{event}/print', [AdminAttendanceController::class, 'printEvent'])->middleware('auth:admin')->name('admin.attendance.print-event');

// Lost & Found (disabled for admin UI)
// Route::get('/admin/lost-found', [AdminLostFoundController::class, 'index'])->middleware('auth:admin')->name('admin.lost-found');
// Route::post('/admin/lost-found', [AdminLostFoundController::class, 'store'])->middleware('auth:admin')->name('admin.lost-found.store');
// Route::put('/admin/lost-found/{foundItem}', [AdminLostFoundController::class, 'update'])->middleware('auth:admin')->name('admin.lost-found.update');
// Route::delete('/admin/lost-found/{foundItem}', [AdminLostFoundController::class, 'destroy'])->middleware('auth:admin')->name('admin.lost-found.destroy');
// Route::put('/admin/lost-found/{foundItem}/archive', [AdminLostFoundController::class, 'archive'])->middleware('auth:admin')->name('admin.lost-found.archive');
// Route::put('/admin/lost-found/{foundItem}/unarchive', [AdminLostFoundController::class, 'unarchive'])->middleware('auth:admin')->name('admin.lost-found.unarchive');

Route::get('/evaluation/{evaluation}', function (\App\Models\Evaluation $evaluation) {
    return redirect()->route('student.evaluation.show', ['evaluation' => $evaluation->id]);
})->name('evaluation.show');

Route::get('/admin/evaluation', [AdminEvaluationController::class, 'index'])->middleware('auth:admin')->name('admin.evaluation');
Route::get('/admin/evaluation/{evaluation}', [AdminEvaluationController::class, 'show'])->middleware('auth:admin')->name('admin.evaluation.show');
Route::post('/admin/evaluation/auto-generate', [AdminEvaluationController::class, 'autoGenerate'])->middleware('auth:admin')->name('admin.evaluation.auto-generate');
Route::post('/admin/evaluation', [AdminEvaluationController::class, 'store'])->middleware('auth:admin')->name('admin.evaluation.store');
Route::put('/admin/evaluation/{evaluation}', [AdminEvaluationController::class, 'update'])->middleware('auth:admin')->name('admin.evaluation.update');
Route::post('/admin/evaluation/{evaluation}/delete', [AdminEvaluationController::class, 'destroy'])->middleware('auth:admin')->name('admin.evaluation.destroy');

Route::put('/admin/evaluation/{evaluation}/archive', [AdminEvaluationController::class, 'archive'])->middleware('auth:admin')->name('admin.evaluation.archive');
Route::put('/admin/evaluation/{evaluation}/unarchive', [AdminEvaluationController::class, 'unarchive'])->middleware('auth:admin')->name('admin.evaluation.unarchive');
Route::post('/admin/evaluation/{evaluation}/publish', [AdminEvaluationController::class, 'publish'])->middleware('auth:admin')->name('admin.evaluation.publish');
Route::post('/admin/evaluation/{evaluation}/unpublish', [AdminEvaluationController::class, 'unpublish'])->middleware('auth:admin')->name('admin.evaluation.unpublish');
Route::post('/admin/evaluation/{evaluation}/approve-program', [AdminEvaluationController::class, 'approveNextActivity'])->middleware('auth:admin')->name('admin.evaluation.approve-program');
Route::get('/admin/evaluation/{evaluation}/metrics', [AdminEvaluationController::class, 'metrics'])->middleware('auth:admin')->name('admin.evaluation.metrics');

Route::get('/admin/archive', [AdminArchiveController::class, 'index'])->middleware('auth:admin')->name('admin.archive');

Route::get('/admin/activity-log', [AdminActivityLogController::class, 'index'])->middleware('auth:admin')->name('admin.activity-log');

Route::get('/admin/qr-scanner', function () {
    $eventId = request()->query('event');
    $eventPayload = null;

    if ($eventId) {
        $event = \App\Models\Event::query()->find($eventId);
        if ($event) {
            $scannerPortalActive = true;
            if (Schema::hasColumn('events', 'scanner_portal_active')) {
                $scannerPortalActive = (bool) $event->scanner_portal_active;
            }

            $eventPayload = [
                'id' => (string) $event->id,
                'name' => (string) ($event->event_name ?? ''),
                'date' => optional($event->event_date)->format('Y-m-d') ?: '',
                'timeIn' => (string) ($event->event_time ?? ''),
                'timeEnd' => (string) ($event->registration_end_time ?? ''),
                'location' => (string) ($event->location ?? ''),
                'scannerPortalActive' => $scannerPortalActive,
            ];
        }
    }

    return Inertia::render('admin-dashboard/qr-scanner/index', [
        'event' => $eventPayload,
    ]);
})->middleware('auth:admin')->name('admin.qr-scanner');

Route::get('/login-choice', function () {
    return redirect()->route('login');
})->name('login.choice');

// Certificate routes
Route::get('/student/certificates', [CertificateController::class, 'index'])->middleware('auth:student')->name('student.certificates.index');
Route::get('/student/certificates/available', [CertificateController::class, 'getAvailableCertificates'])->middleware('auth:student')->name('student.certificates.available');
Route::post('/student/certificates/generate/{event}', [CertificateController::class, 'generateCertificate'])->middleware('auth:student')->name('student.certificates.generate');
Route::get('/student/certificates/{certificate}/download', [CertificateController::class, 'downloadCertificate'])->middleware('auth:student')->name('student.certificates.download');

Route::get('/login', function () {
    $alerts = [];
    if (Schema::hasTable('activity_logs')) {
        $alerts = \App\Models\ActivityLog::query()
            ->where('module', 'Security Monitor')
            ->where('action', 'ALERT')
            ->where('ip_address', request()->ip())
            ->where('created_at', '>=', now()->subMinutes(30))
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'module', 'action', 'details', 'created_at', 'old_value', 'new_value'])
            ->map(function ($log) {
                $old = $log->old_value ? json_decode($log->old_value, true) : null;
                return [
                    'id' => $log->id,
                    'module' => $log->module,
                    'action' => $log->action,
                    'details' => $log->details,
                    'timestamp' => $log->created_at?->toDateTimeString(),
                    'recent_count' => $old['recent_count'] ?? null,
                    'window_minutes' => $old['window_minutes'] ?? null,
                ];
            })
            ->values()
            ->all();
    }

    return Inertia::render('auth/login', [
        'canResetPassword' => Features::enabled(Features::resetPasswords()),
        'canRegister' => true,
        'status' => session()->get('status'),
        'securityAlerts' => $alerts,
        'loginBlockedUntil' => session()->get('login_blocked_until'),
    ]);
})->name('login');

// Redirect old login routes to new /login for backward compatibility
Route::get('/student-login', function () {
    return redirect()->route('login');
})->name('student.login');

Route::get('/program-head-login', function () {
    return redirect()->route('login');
})->name('program-head.login');

Route::get('/admin-login', function () {
    return redirect()->route('login');
})->name('admin.login');

use App\Http\Controllers\SecurityAlertController;
Route::get('/api/auth/status/login-block', [\App\Http\Controllers\AuthStatusController::class, 'loginBlock'])->middleware('web');
Route::get('/api/auth/status/scanner-block', [\App\Http\Controllers\AuthStatusController::class, 'scannerBlock'])->middleware('web');
Route::get('/api/security-alerts', [SecurityAlertController::class, 'index'])->middleware('web');

use App\Http\Controllers\NotificationController;
Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
require __DIR__.'/settings.php';
