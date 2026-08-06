<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Program;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AdminProgramsController extends Controller
{
    public function index(): Response
    {
        if (Program::count() === 0) {
            $defaultPrograms = [
                ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
                ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
                ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
                ['code' => 'BSED', 'name' => 'Bachelor of Secondary Education', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
                ['code' => 'BSCrim', 'name' => 'Bachelor of Science in Criminology', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
                ['code' => 'BSHM', 'name' => 'Bachelor of Science in Hospitality Management', 'department' => 'HED', 'duration' => '4 Years', 'is_active' => true],
            ];
            foreach ($defaultPrograms as $prog) {
                Program::firstOrCreate(['code' => $prog['code']], $prog);
            }
        }

        $courseCounts = \App\Models\Student::query()
            ->selectRaw('LOWER(TRIM(course)) as course_key, COUNT(*) as aggregate')
            ->groupBy('course_key')
            ->pluck('aggregate', 'course_key')
            ->all();

        $programs = Program::query()
            ->orderBy('name')
            ->get()
            ->map(function ($program) use ($courseCounts) {
                $codeKey = strtolower(trim((string) $program->code));
                $nameKey = strtolower(trim((string) $program->name));

                $count = $courseCounts[$codeKey] ?? $courseCounts[$nameKey] ?? 0;

                return [
                    'id' => $program->id,
                    'name' => $program->name,
                    'code' => $program->code,
                    'department' => $program->department ?? 'N/A',
                    'description' => $program->description ?? '',
                    'duration' => $program->duration ?? 'N/A',
                    'status' => $program->is_active ? 'active' : 'inactive',
                    'studentCount' => (int) $count,
                    'createdAt' => $program->created_at ? $program->created_at->format('M d, Y') : '',
                    'updatedAt' => $program->updated_at ? $program->updated_at->format('M d, Y') : '',
                ];
            });

        return Inertia::render('admin-dashboard/programs/index', [
            'programs' => $programs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin-dashboard/programs/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:programs,name',
            'code' => 'required|string|max:50|unique:programs,code',
            'department' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $program = Program::create($validated);

        // Log the activity
        ActivityLog::create([
            'user' => auth('admin')->user()->name ?? 'Admin',
            'module' => 'Programs',
            'action' => 'created',
            'details' => "Created program: {$program->name}",
        ]);

        Log::info('Program created', ['program_id' => $program->id, 'admin_id' => auth('admin')->id()]);

        return redirect()->route('admin.programs')
            ->with('success', 'Program created successfully.');
    }

    public function show(Program $program, Request $request): Response
    {
        $page = (int) $request->input('page', 1);
        $perPage = 10;

        $students = $program->students()
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        $programData = [
            'id' => $program->id,
            'name' => $program->name,
            'code' => $program->code,
            'department' => $program->department ?? 'N/A',
            'description' => $program->description ?? '',
            'duration' => $program->duration ?? 'N/A',
            'status' => $program->is_active ? 'active' : 'inactive',
            'studentCount' => $program->students()->count(),
            'createdAt' => $program->created_at->format('M d, Y'),
            'updatedAt' => $program->updated_at->format('M d, Y'),
            'students' => $students->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'year_level' => $student->year_level,
                ];
            }),
            'pagination' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
                'from' => $students->firstItem(),
                'to' => $students->lastItem(),
            ],
        ];

        return Inertia::render('admin-dashboard/programs/show', [
            'program' => $programData,
        ]);
    }

    public function edit(Program $program): Response
    {
        return Inertia::render('admin-dashboard/programs/edit', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'code' => $program->code,
                'department' => $program->department ?? '',
                'description' => $program->description ?? '',
                'duration' => $program->duration ?? '',
                'is_active' => $program->is_active,
            ],
        ]);
    }

    public function update(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:programs,name,' . $program->id,
            'code' => 'required|string|max:50|unique:programs,code,' . $program->id,
            'department' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $oldName = $program->name;
        $program->update($validated);

        // Log the activity
        ActivityLog::create([
            'user' => auth('admin')->user()->name ?? 'Admin',
            'module' => 'Programs',
            'action' => 'updated',
            'details' => "Updated program: {$oldName}",
        ]);

        Log::info('Program updated', ['program_id' => $program->id, 'admin_id' => auth('admin')->id()]);

        return redirect()->route('admin.programs')
            ->with('success', 'Program updated successfully.');
    }

    public function destroy(Program $program): RedirectResponse
    {
        $programName = $program->name;
        
        // Check if program has students
        if ($program->students()->count() > 0) {
            return redirect()->route('admin.programs')
                ->with('error', 'Cannot delete program with enrolled students. Please archive instead.');
        }

        $program->delete();

        // Log the activity
        ActivityLog::create([
            'user' => auth('admin')->user()->name ?? 'Admin',
            'module' => 'Programs',
            'action' => 'deleted',
            'details' => "Deleted program: {$programName}",
        ]);

        Log::info('Program deleted', ['program_id' => $program->id, 'admin_id' => auth('admin')->id()]);

        return redirect()->route('admin.programs')
            ->with('success', 'Program deleted successfully.');
    }

    public function archive(Program $program): RedirectResponse
    {
        $program->update(['is_active' => false]);

        // Log the activity
        ActivityLog::create([
            'user' => auth('admin')->user()->name ?? 'Admin',
            'module' => 'Programs',
            'action' => 'archived',
            'details' => "Archived program: {$program->name}",
        ]);

        Log::info('Program archived', ['program_id' => $program->id, 'admin_id' => auth('admin')->id()]);

        return redirect()->route('admin.programs')
            ->with('success', 'Program archived successfully.');
    }

    public function unarchive(Program $program): RedirectResponse
    {
        $program->update(['is_active' => true]);

        // Log the activity
        ActivityLog::create([
            'user' => auth('admin')->user()->name ?? 'Admin',
            'module' => 'Programs',
            'action' => 'unarchived',
            'details' => "Unarchived program: {$program->name}",
        ]);

        Log::info('Program unarchived', ['program_id' => $program->id, 'admin_id' => auth('admin')->id()]);

        return redirect()->route('admin.programs')
            ->with('success', 'Program unarchived successfully.');
    }
}
