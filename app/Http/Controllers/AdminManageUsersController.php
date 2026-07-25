<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\PasswordResetRequest;
use App\Models\Program;
use App\Models\AdminUser;
use App\Models\ProgramHead;
use App\Models\Student;
use Illuminate\Support\Arr;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminManageUsersController extends Controller
{
    public function index(): Response
    {
        $columns = [
            'id',
            'student_id',
            'first_name',
            'middle_name',
            'last_name',
            'name',
            'email',
            'course',
            'year_level',
            'role',
            'is_active',
            'status',
            'verification_status',
            'qr_code_path',
            'entry_status',
            'program',
            'major',
            'home_address',
            'birthday',
            'place_of_birth',
            'religion',
            'gender',
            'contact_no',
            'nationality',
            'elementary_school',
            'elementary_year_graduated',
            'junior_high_school',
            'junior_high_year_graduated',
            'senior_high_school',
            'senior_high_year_graduated',
            'mother_name',
            'mother_contact',
            'father_name',
            'father_contact',
            'guardian_name',
            'guardian_relation',
            'guardian_contact',
            'is_archived',
            'created_at',
            'updated_at',
        ];

        $columns = array_values(array_filter($columns, fn ($col) => Schema::hasColumn('students', $col)));

        $query = Student::query()->orderByDesc('id');

        if (Schema::hasColumn('students', 'is_archived')) {
            $query->where(function ($q) {
                $q->where('is_archived', false)->orWhereNull('is_archived');
            });
        }

        $students = $query
            ->get($columns)
            ->map(function (Student $student) {
                $row = $student->toArray();
                $row['userType'] = 'student';
                // Ensure that 'status' reflects 'verification_status' if that column exists
                if (Schema::hasColumn('students', 'verification_status')) {
                    $row['status'] = $student->verification_status ?? $row['status'] ?? 'pending';
                }
                return $row;
            });

        $programHeads = collect();
        if (Schema::hasTable('program_heads')) {
            $programHeads = ProgramHead::query()
                ->orderByDesc('id')
                ->get(['id', 'name', 'email', 'program', 'created_at', 'updated_at'])
                ->map(function (ProgramHead $ph) {
                    $syntheticId = 1000000000 + (int) $ph->id;
                    return [
                        'id' => $syntheticId,
                        'program_head_id' => (int) $ph->id,
                        'student_id' => 'PH-' . $ph->id,
                        'first_name' => null,
                        'middle_name' => null,
                        'last_name' => null,
                        'name' => $ph->name,
                        'email' => $ph->email,
                        'course' => $ph->program ?? '',
                        'year_level' => '',
                        'role' => 'Program Head',
                        'is_active' => true,
                        'status' => 'approved',
                        'qr_code_path' => null,
                        'entry_status' => null,
                        'program' => $ph->program,
                        'major' => null,
                        'home_address' => null,
                        'birthday' => null,
                        'place_of_birth' => null,
                        'religion' => null,
                        'gender' => null,
                        'contact_no' => null,
                        'nationality' => null,
                        'elementary_school' => null,
                        'elementary_year_graduated' => null,
                        'junior_high_school' => null,
                        'junior_high_year_graduated' => null,
                        'senior_high_school' => null,
                        'senior_high_year_graduated' => null,
                        'mother_name' => null,
                        'mother_contact' => null,
                        'father_name' => null,
                        'father_contact' => null,
                        'guardian_name' => null,
                        'guardian_relation' => null,
                        'guardian_contact' => null,
                        'is_archived' => false,
                        'created_at' => optional($ph->created_at)->toISOString(),
                        'updated_at' => optional($ph->updated_at)->toISOString(),
                        'userType' => 'program_head',
                    ];
                });
        }

        $adminUsers = collect();
        if (Schema::hasTable('admin_users')) {
            $adminUsers = AdminUser::query()
                ->orderByDesc('id')
                ->get(['id', 'name', 'email', 'created_at', 'updated_at'])
                ->map(function (AdminUser $admin) {
                    $syntheticId = 2000000000 + (int) $admin->id;
                    return [
                        'id' => $syntheticId,
                        'admin_user_id' => (int) $admin->id,
                        'student_id' => 'ADMIN-' . $admin->id,
                        'first_name' => null,
                        'middle_name' => null,
                        'last_name' => null,
                        'name' => $admin->name,
                        'email' => $admin->email,
                        'course' => 'System Administration',
                        'year_level' => '',
                        'role' => 'Administrator',
                        'is_active' => true,
                        'status' => 'approved',
                        'qr_code_path' => null,
                        'entry_status' => null,
                        'program' => 'System Administration',
                        'major' => null,
                        'home_address' => null,
                        'birthday' => null,
                        'place_of_birth' => null,
                        'religion' => null,
                        'gender' => null,
                        'contact_no' => null,
                        'nationality' => null,
                        'elementary_school' => null,
                        'elementary_year_graduated' => null,
                        'junior_high_school' => null,
                        'junior_high_year_graduated' => null,
                        'senior_high_school' => null,
                        'senior_high_year_graduated' => null,
                        'mother_name' => null,
                        'mother_contact' => null,
                        'father_name' => null,
                        'father_contact' => null,
                        'guardian_name' => null,
                        'guardian_relation' => null,
                        'guardian_contact' => null,
                        'is_archived' => false,
                        'created_at' => optional($admin->created_at)->toISOString(),
                        'updated_at' => optional($admin->updated_at)->toISOString(),
                        'userType' => 'admin',
                    ];
                });
        }

        $users = $students->concat($programHeads)->concat($adminUsers)->values();

        $programs = Program::withCount('students')
            ->orderBy('name')
            ->get()
            ->map(function ($program) {
                return [
                    'id'           => $program->id,
                    'name'         => $program->name,
                    'code'         => $program->code,
                    'department'   => $program->department ?? 'N/A',
                    'description'  => $program->description ?? '',
                    'duration'     => $program->duration ?? 'N/A',
                    'status'       => $program->is_active ? 'active' : 'inactive',
                    'studentCount' => $program->students_count ?? 0,
                    'createdAt'    => $program->created_at->format('M d, Y'),
                    'updatedAt'    => $program->updated_at->format('M d, Y'),
                ];
            });

        $passwordResetRequests = PasswordResetRequest::orderByDesc('id')->get();

        return Inertia::render('admin-dashboard/manage-users/index', [
            'students' => $users,
            'programs' => $programs,
            'passwordResetRequests' => $passwordResetRequests,
        ]);
    }

    private function storeQrCodePng(string $studentId, string $dataUrl): string
    {
        $prefix = 'data:image/png;base64,';
        if (!str_starts_with($dataUrl, $prefix)) {
            throw new \InvalidArgumentException('Invalid QR code image format.');
        }

        $binary = base64_decode(substr($dataUrl, strlen($prefix)), true);
        if ($binary === false) {
            throw new \InvalidArgumentException('Invalid QR code image data.');
        }

        $fileName = 'qr-codes/student-' . $studentId . '.png';
        Storage::disk('public')->put($fileName, $binary);

        $publicStoragePath = public_path('storage/' . $fileName);
        File::ensureDirectoryExists(dirname($publicStoragePath));
        File::put($publicStoragePath, $binary);

        return $fileName;
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'string', 'max:255', 'unique:students,student_id'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:students,email'],
            'password' => ['required', 'string', 'min:8'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'qr_code_data_url' => ['nullable', 'string'],
            'officer_features' => ['nullable', 'array'],
            'officer_features.*' => ['string'],
        ]);

        $name = trim(implode(' ', array_filter([
            $validated['first_name'],
            $validated['middle_name'] ?? null,
            $validated['last_name'],
        ])));

        $qrCodePath = null;
        if (!empty($validated['qr_code_data_url'])) {
            $qrCodePath = $this->storeQrCodePng($validated['student_id'], $validated['qr_code_data_url']);
        }

        $studentData = [
            'student_id' => $validated['student_id'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'name' => $name,
            'course' => $validated['course'],
            'year_level' => $validated['year_level'],
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
            'status' => 'pending',
            'qr_code_path' => $qrCodePath,
            'officer_features' => $validated['officer_features'] ?? null,
        ];

        if (Schema::hasColumn('students', 'is_archived')) {
            $studentData['is_archived'] = false;
        }

        if (Schema::hasColumn('students', 'verification_status')) {
            $studentData['verification_status'] = 'pending';
        }

        $student = Student::create($studentData);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Created',
                "Created user: {$validated['student_id']} ({$validated['role']})",
                $request,
                null,
                ['student_id' => $validated['student_id'], 'role' => $validated['role'], 'name' => $name]
            );
        }

        return redirect()->route('admin.manage-users')->with('success', 'Student account created successfully.')->setStatusCode(303);
    }

    public function updateStatus(Request $request, Student $student): RedirectResponse
    {
        if (!Schema::hasColumn('students', 'is_active')) {
            return redirect()->back()->with('error', 'Student active status is not available.');
        }

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $student->update([
            'is_active' => (bool) $validated['is_active'],
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Updated',
                'Updated status for student user: ' . (string) $student->student_id
            );
        }

        return redirect()->route('admin.manage-users')->with('success', 'Student status updated successfully.')->setStatusCode(303);
    }

    public function updateApproval(Request $request, Student $student): RedirectResponse
    {
        // Backward-compatible endpoint: keep accepting `status` but persist into both
        // `verification_status` (new) and `status` (legacy) fields for full compatibility.
        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $updateData = [];
        if (Schema::hasColumn('students', 'status')) {
            $updateData['status'] = $validated['status'];
        }
        if (Schema::hasColumn('students', 'verification_status')) {
            $updateData['verification_status'] = $validated['status'];
        }

        if (!empty($updateData)) {
            $student->update($updateData);
        }

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            $oldStatus = $student->getOriginal('verification_status') ?? $student->getOriginal('status');
            $newStatus = $validated['status'];

            ActivityLog::logForUser(
                $admin,
                'User Management',
                $newStatus === 'approved' ? 'Approved' : ($newStatus === 'rejected' ? 'Rejected' : 'Updated'),
                ($newStatus === 'approved' ? 'Approved' : ($newStatus === 'rejected' ? 'Rejected' : 'Updated status for')) . " user: {$student->student_id}",
                $request,
                ['verification_status' => $oldStatus],
                ['verification_status' => $newStatus]
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Student account ' . $validated['status'] . ' successfully.'
        )->setStatusCode(303);
    }


    public function updateLegacy(Request $request): RedirectResponse
    {
        $studentId = $request->input('id');
        if (empty($studentId)) {
            abort(404);
        }

        $student = Student::query()->findOrFail($studentId);

        return $this->update($request, $student);
    }

    public function destroyLegacy(Request $request): RedirectResponse
    {
        $studentId = $request->input('id');
        if (empty($studentId)) {
            abort(404);
        }

        $student = Student::query()->findOrFail($studentId);

        return $this->archive($student);
    }

    public function archive(Student $student): RedirectResponse
    {
        if (!Schema::hasColumn('students', 'is_archived')) {
            return redirect()
                ->route('admin.manage-users')
                ->with('error', 'Archive is not available because the is_archived column is missing in students table.');
        }

        $oldArchived = (bool) ($student->getOriginal('is_archived') ?? false);
        $student->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Archived',
                "Archived user: {$student->student_id}",
                request(),
                ['is_archived' => $oldArchived],
                ['is_archived' => true]
            );
        }

        return redirect()->route('admin.manage-users')->with('success', 'Student archived successfully.')->setStatusCode(303);
    }

    public function unarchive(Student $student): RedirectResponse
    {
        if (!Schema::hasColumn('students', 'is_archived')) {
            return redirect()
                ->route('admin.archive')
                ->with('error', 'Unarchive is not available because the is_archived column is missing in students table.');
        }

        $oldArchived = (bool) ($student->getOriginal('is_archived') ?? false);
        $student->update(['is_archived' => false]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Unarchived',
                "Unarchived user: {$student->student_id}",
                request(),
                ['is_archived' => $oldArchived],
                ['is_archived' => false]
            );
        }

        return redirect()->route('admin.archive')->with('success', 'Student restored successfully.');
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'string', 'max:255', 'unique:students,student_id,' . $student->id],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:students,email,' . $student->id],
            'password' => ['nullable', 'string', 'min:8'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'course' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'qr_code_data_url' => ['nullable', 'string'],
            'officer_features' => ['nullable', 'array'],
            'officer_features.*' => ['string'],
        ]);

        $name = trim(implode(' ', array_filter([
            $validated['first_name'],
            $validated['middle_name'] ?? null,
            $validated['last_name'],
        ])));

        if (!empty($validated['qr_code_data_url'])) {
            $student->qr_code_path = $this->storeQrCodePng($validated['student_id'], $validated['qr_code_data_url']);
        }

        $student->fill([
            'student_id' => $validated['student_id'],
            'email' => $validated['email'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'name' => $name,
            'course' => $validated['course'],
            'year_level' => $validated['year_level'],
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? $student->is_active,
            'officer_features' => $validated['officer_features'] ?? null,
        ]);

        if (!empty($validated['password'])) {
            $student->password = Hash::make($validated['password']);
        }

        $student->save();

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Updated',
                "Updated user: {$student->student_id}",
                $request,
                $student->getOriginal(),
                $student->getAttributes()
            );
        }

        return redirect()->route('admin.manage-users')->with('success', 'Student account updated successfully.')->setStatusCode(303);
    }

    public function destroy(Student $student): RedirectResponse
    {
        return $this->archive($student);
    }

    public function approveProgramHead(Request $request, ProgramHead $programHead): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:approved,rejected,pending'],
        ]);

        // Admin endpoints use request body status; if missing, default to approved.
        $targetStatus = Arr::get($validated, 'status', 'approved');

        $programHead->update([
            'verification_status' => $targetStatus,
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                $targetStatus === 'approved' ? 'Approved' : ($targetStatus === 'rejected' ? 'Rejected' : 'Updated'),
                ($targetStatus === 'approved' ? 'Approved' : ($targetStatus === 'rejected' ? 'Rejected' : 'Updated')) . " program head user: {$programHead->id}",
                $request,
                ['verification_status' => $programHead->getOriginal('verification_status')],
                ['verification_status' => $targetStatus]
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Program head account ' . $targetStatus . ' successfully.'
        )->setStatusCode(303);
    }

    public function rejectProgramHead(Request $request, ProgramHead $programHead): RedirectResponse
    {
        $request->validate([
            'status' => ['sometimes', 'in:approved,rejected,pending'],
        ]);

        $programHead->update([
            'verification_status' => 'rejected',
        ]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Rejected',
                "Rejected program head user: {$programHead->id}",
                $request,
                ['verification_status' => $programHead->getOriginal('verification_status')],
                ['verification_status' => 'rejected']
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Program head account rejected successfully.'
        )->setStatusCode(303);
    }

    public function bulkApproveVerification(Request $request): RedirectResponse
    {
        return $this->bulkSetVerification($request, 'approved');
    }

    public function bulkRejectVerification(Request $request): RedirectResponse
    {
        return $this->bulkSetVerification($request, 'rejected');
    }

    private function bulkSetVerification(Request $request, string $status): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $ids = $validated['ids'];

        // Program head synthetic IDs are 1,000,000,000 + program_heads.id
        $programHeadIds = collect($ids)
            ->filter(fn ($id) => $id >= 1000000000 && $id < 2000000000)
            ->map(fn ($id) => (int) $id - 1000000000)
            ->values();

        // Student synthetic IDs are the actual students.id
        $studentIds = collect($ids)
            ->filter(fn ($id) => $id < 1000000000)
            ->values();

        if ($studentIds->isNotEmpty() && Schema::hasColumn('students', 'verification_status')) {
            Student::query()
                ->whereIn('id', $studentIds->all())
                ->update(['verification_status' => $status]);
        }

        if ($programHeadIds->isNotEmpty() && Schema::hasColumn('program_heads', 'verification_status')) {
            ProgramHead::query()
                ->whereIn('id', $programHeadIds->all())
                ->update(['verification_status' => $status]);
        }

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                $status === 'approved' ? 'Bulk Approved' : 'Bulk Rejected',
                "Bulk set verification to '{$status}' for " . count($ids) . ' records',
                $request,
                ['status' => null, 'ids' => $ids],
                ['status' => $status, 'ids' => $ids]
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Verification updated successfully.'
        )->setStatusCode(303);
    }

    public function bulkActivate(Request $request): RedirectResponse
    {
        return $this->bulkSetStatus($request, true);
    }

    public function bulkDeactivate(Request $request): RedirectResponse
    {
        return $this->bulkSetStatus($request, false);
    }

    private function bulkSetStatus(Request $request, bool $isActive): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $ids = $validated['ids'];

        // Program head synthetic IDs are 1,000,000,000 + program_heads.id
        $programHeadIds = collect($ids)
            ->filter(fn ($id) => $id >= 1000000000 && $id < 2000000000)
            ->map(fn ($id) => (int) $id - 1000000000)
            ->values();

        // Student synthetic IDs are the actual students.id
        $studentIds = collect($ids)
            ->filter(fn ($id) => $id < 1000000000)
            ->values();

        if ($studentIds->isNotEmpty()) {
            Student::query()
                ->whereIn('id', $studentIds->all())
                ->update(['is_active' => $isActive]);
        }

        if ($programHeadIds->isNotEmpty()) {
            ProgramHead::query()
                ->whereIn('id', $programHeadIds->all())
                ->update(['is_active' => $isActive]);
        }

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                $isActive ? 'Bulk Activated' : 'Bulk Deactivated',
                "Bulk set status to '" . ($isActive ? 'Active' : 'Inactive') . "' for " . count($ids) . ' records',
                $request,
                ['status' => null, 'ids' => $ids],
                ['status' => $isActive, 'ids' => $ids]
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Account status updated successfully.'
        )->setStatusCode(303);
    }

    public function bulkSetYearLevel(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'year_level' => ['required', 'string', 'in:1st Year,2nd Year,3rd Year,4th Year,Irregular'],
        ]);

        $ids = $validated['ids'];

        // Student synthetic IDs are the actual students.id
        $studentIds = collect($ids)
            ->filter(fn ($id) => $id < 1000000000)
            ->values();

        if ($studentIds->isNotEmpty()) {
            Student::query()
                ->whereIn('id', $studentIds->all())
                ->update(['year_level' => $validated['year_level']]);
        }

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Bulk Updated Year Level',
                "Bulk set year level to '{$validated['year_level']}' for " . count($studentIds) . ' students',
                $request,
                ['year_level' => null, 'ids' => $studentIds->all()],
                ['year_level' => $validated['year_level'], 'ids' => $studentIds->all()]
            );
        }

        return redirect()->route('admin.manage-users')->with(
            'success',
            'Year level updated successfully.'
        )->setStatusCode(303);
    }


    public function updateProgramHead(Request $request, ProgramHead $programHead): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:program_heads,email,' . $programHead->id],
            'program' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $programHead->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'program' => $validated['program'] ?? null,
        ]);

        if (!empty($validated['password'])) {
            $programHead->password = Hash::make($validated['password']);
        }

        $programHead->save();

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser(
                $admin,
                'User Management',
                'Updated',
                "Updated program head user: {$programHead->email}",
                $request,
                $programHead->getOriginal(),
                $programHead->getAttributes()
            );
        }

        return redirect()->route('admin.manage-users')->with('success', 'Program Head account updated successfully.')->setStatusCode(303);
    }
}
