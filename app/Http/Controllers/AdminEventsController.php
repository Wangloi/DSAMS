<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Event;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Endroid\QrCode\Builder\Builder;
use App\Services\StudentNotificationDispatcher;

class AdminEventsController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['attendances.student'])
            ->when($request->search, function ($q, $search) {
                $q->where('event_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->when($request->status, function ($q, $status) {
                $today = now()->toDateString();
                if ($status === 'upcoming') {
                    $q->whereDate('event_date', '>', $today);
                } elseif ($status === 'ongoing') {
                    $q->whereDate('event_date', '=', $today);
                } elseif ($status === 'completed') {
                    $q->whereDate('event_date', '<', $today);
                }
            })
            ->when($request->course, function ($q, $course) {
                $q->whereJsonContains('courses', $course);
            })
            ->when($request->year_level, function ($q, $yearLevel) {
                $q->whereJsonContains('year_levels', $yearLevel);
            })
            // Only include active (non-archived) events
            ->whereNull('archived_at')
            ->orderBy('event_date', 'desc')
            ->orderBy('event_time', 'desc');

        $events = $query->paginate(10);

        $this->attachEligibleStudentsCounts($events);

        // Only return JSON for non-Inertia AJAX requests
        if ($request->ajax() && !$request->header('X-Inertia')) {
            return response()->json([
                'events' => $events->items(),
                'pagination' => [
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                ]
            ]);
        }

        $allEvents = Event::whereNull('archived_at')->get();

        return inertia('admin-dashboard/events/index', [
            'events' => $events->items(),
            'allEvents' => $allEvents,
            'pagination' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
            'filters' => $request->only(['search', 'status', 'course', 'year_level']),
            'courses' => $this->studentCourseOptions(),
            'yearLevels' => $this->studentYearLevelOptions(),
            'totalStudents' => Student::query()->count(),
            'studentCountsByCourseYear' => $this->studentCountsByCourseYear(),
            'announcements' => [],
        ]);
    }

    public function create()
    {
        return inertia('admin-dashboard/events/create', [
            'courses' => $this->studentCourseOptions(),
            'yearLevels' => $this->studentYearLevelOptions(),
            'totalStudents' => Student::query()->count(),
            'studentCountsByCourseYear' => $this->studentCountsByCourseYear(),
            'announcements' => $this->publishedEventAnnouncements(),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->boolean('geofence_enabled')) {
            $request->merge([
                'geofence_latitude' => null,
                'geofence_longitude' => null,
            ]);
        }

        $validated = $request->validate([
            'event_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'courses' => 'nullable|array',
            'courses.*' => 'string',
            'year_levels' => 'nullable|array',
            'year_levels.*' => 'string',
            'location' => 'nullable|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required',
            'registration_end_time' => 'nullable',
            'organizer' => 'required|string|max:255',
            'geofence_enabled' => 'boolean',
            'geofence_latitude' => 'nullable|numeric|required_if:geofence_enabled,1',
            'geofence_longitude' => 'nullable|numeric|required_if:geofence_enabled,1',
            'geofence_radius_m' => 'nullable|integer|required_if:geofence_enabled,1',
            'attendance_type' => 'nullable|string|in:qr_scanner,dynamic_qr',
            'scanner_student_ids' => 'nullable|array',
            'scanner_student_ids.*' => 'string',
        ]);

        $scannerStudentIdsRaw = $validated['scanner_student_ids'] ?? [];
        $scannerStudentIds = array_values(array_unique(array_filter(array_map('strval', $scannerStudentIdsRaw), function ($v) {
            return trim($v) !== '';
        })));

        $event = Event::create([
            'event_name' => $validated['event_name'],
            'description' => $validated['description'] ?? null,
            'courses' => $validated['courses'] ?? [],
            'year_levels' => $validated['year_levels'] ?? [],
            'location' => $validated['location'] ?? 'Campus / Unspecified',
            'event_date' => $validated['event_date'],
            'event_time' => $validated['event_time'],
            'registration_end_time' => $validated['registration_end_time'] ?? null,
            'organizer' => $validated['organizer'],
            'geofence_enabled' => $validated['geofence_enabled'] ?? false,
            'geofence_latitude' => $validated['geofence_latitude'] ?? null,
            'geofence_longitude' => $validated['geofence_longitude'] ?? null,
            'geofence_radius_m' => $validated['geofence_radius_m'] ?? 50,
            'attendance_type' => $validated['attendance_type'] ?? 'qr_scanner',
            'scanner_student_id' => $scannerStudentIds[0] ?? null,
            'scanner_student_ids' => $scannerStudentIds,
        ]);

        // Generate QR code
        $qrCodeData = url("/events/{$event->id}/scan");
        $builder = new Builder();
        $result = $builder->build(
            data: $qrCodeData,
            size: 300,
            margin: 10
        );

        $qrCode = $result->getString();
        $qrCodePath = 'qr-codes/events/' . Str::random(10) . '.png';
        Storage::disk('public')->put($qrCodePath, $qrCode);

        $event->update(['qr_code' => $qrCodePath]);

        // Dispatch notifications to assigned scanner students
        $dispatcher = app(StudentNotificationDispatcher::class);
        $dispatcher->eventCreated($event);
        if (! empty($scannerStudentIds)) {
            $dispatcher->scannerAccessGranted($event, $scannerStudentIds);
        }

        return redirect()->route('admin.events')->with('success', 'Event created successfully!');
    }

    public function show(Event $event)
    {
        $event->load(['attendances.student', 'attendances.student.program']);
        // Ensure latitude/longitude are included even if model hides them
        $event->makeVisible(['geofence_latitude', 'geofence_longitude']);
        return inertia('admin-dashboard/events/show', [
            'event' => $event
        ]);
    }

    public function edit(Event $event)
    {
        return inertia('admin-dashboard/events/edit', [
            'event' => $event,
            'courses' => $this->studentCourseOptions(),
            'yearLevels' => $this->studentYearLevelOptions(),
        ]);
    }

    public function update(Request $request, Event $event)
    {
        if (!$request->boolean('geofence_enabled')) {
            $request->merge([
                'geofence_latitude' => null,
                'geofence_longitude' => null,
            ]);
        }

        $validated = $request->validate([
            'event_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'courses' => 'nullable|array',
            'courses.*' => 'string',
            'year_levels' => 'nullable|array',
            'year_levels.*' => 'string',
            'location' => 'nullable|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required',
            'registration_end_time' => 'nullable',
            'organizer' => 'required|string|max:255',
            'scanner_portal_active' => 'boolean',
            'geofence_enabled' => 'boolean',
            'geofence_latitude' => 'nullable|numeric|required_if:geofence_enabled,1',
            'geofence_longitude' => 'nullable|numeric|required_if:geofence_enabled,1',
            'geofence_radius_m' => 'nullable|integer|required_if:geofence_enabled,1',
            'attendance_type' => 'nullable|string|in:qr_scanner,dynamic_qr',
            'scanner_student_ids' => 'nullable|array',
            'scanner_student_ids.*' => 'string',
        ]);

        if (array_key_exists('registration_end_time', $validated) && $validated['registration_end_time'] !== null) {
            $validated['registration_end_time'] = preg_replace('/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2})?$/', '$1:00', (string) $validated['registration_end_time']);
            $validated['registration_end_time'] = preg_replace('/^(\d{2}:\d{2})$/', '$1:00', (string) $validated['registration_end_time']);
        }

        $geofenceEnabled = (bool) ($validated['geofence_enabled'] ?? false);

        $previousScannerStudentIds = is_array($event->scanner_student_ids) ? $event->scanner_student_ids : [];

        $scannerStudentIdsRaw = $validated['scanner_student_ids'] ?? [];
        $scannerStudentIds = array_values(array_unique(array_filter(array_map('strval', $scannerStudentIdsRaw), function ($v) {
            return trim($v) !== '';
        })));

        $event->update([
            'event_name' => $validated['event_name'],
            'description' => $validated['description'] ?? null,
            'courses' => $validated['courses'] ?? [],
            'year_levels' => $validated['year_levels'] ?? [],
            'location' => $validated['location'] ?? 'Campus / Unspecified',
            'event_date' => $validated['event_date'],
            'event_time' => $validated['event_time'],
            'registration_end_time' => $validated['registration_end_time'] ?? null,
            'organizer' => $validated['organizer'],
            'scanner_portal_active' => (bool) ($validated['scanner_portal_active'] ?? false),
            'geofence_enabled' => $geofenceEnabled,
            'geofence_latitude' => $geofenceEnabled ? ($validated['geofence_latitude'] ?? null) : null,
            'geofence_longitude' => $geofenceEnabled ? ($validated['geofence_longitude'] ?? null) : null,
            'geofence_radius_m' => $geofenceEnabled ? ($validated['geofence_radius_m'] ?? 50) : ($event->geofence_radius_m ?? 50),
            'attendance_type' => $validated['attendance_type'] ?? $event->attendance_type ?? 'qr_scanner',
            'scanner_student_id' => $scannerStudentIds[0] ?? null,
            'scanner_student_ids' => $scannerStudentIds,
        ]);

        // Dispatch notification for newly granted scanner students
        $newlyGrantedScannerIds = array_values(array_diff($scannerStudentIds, $previousScannerStudentIds));
        if (! empty($newlyGrantedScannerIds)) {
            $dispatcher = app(StudentNotificationDispatcher::class);
            $dispatcher->scannerAccessGranted($event, $newlyGrantedScannerIds);
        }

        return redirect()->route('admin.events')->with('success', 'Event updated successfully!');
    }

    public function destroy(Event $event)
    {
        // Delete QR code if exists
        if ($event->qr_code) {
            Storage::disk('public')->delete($event->qr_code);
        }

        $event->delete();

        return redirect()->route('admin.events')->with('success', 'Event deleted successfully!');
    }

    public function archive(Event $event)
    {
        $event->update(['archived_at' => now()]);

        return redirect()->route('admin.events')->with('success', 'Event archived successfully!');
    }

    public function unarchive(Event $event)
    {
        $event->update(['archived_at' => null]);

        return redirect()->route('admin.events')->with('success', 'Event unarchived successfully!');
    }

    public function qrCode(Event $event)
    {
        if (!$event->qr_code) {
            return abort(404, 'QR code not found');
        }
        $qrCodePath = Storage::disk('public')->path($event->qr_code);
        if (!file_exists($qrCodePath)) {
            return abort(404, 'QR code file not found');
        }
        return response()->file($qrCodePath);
    }

    public function archived(Request $request)
    {
        $query = Event::with(['attendances.student'])
            ->when($request->search, function ($q, $search) {
                $q->where('event_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->when($request->status, function ($q, $status) {
                $today = now()->toDateString();
                if ($status === 'upcoming') {
                    $q->whereDate('event_date', '>', $today);
                } elseif ($status === 'ongoing') {
                    $q->whereDate('event_date', '=', $today);
                } elseif ($status === 'completed') {
                    $q->whereDate('event_date', '<', $today);
                }
            })
            ->when($request->course, function ($q, $course) {
                $q->whereJsonContains('courses', $course);
            })
            ->when($request->year_level, function ($q, $yearLevel) {
                $q->whereJsonContains('year_levels', $yearLevel);
            })
            ->whereNotNull('archived_at')
            ->orderBy('event_date', 'desc')
            ->orderBy('event_time', 'desc');

        $events = $query->paginate(10);

        $this->attachEligibleStudentsCounts($events);

        return inertia('admin-dashboard/events/archived', [
            'events' => $events->items(),
            'pagination' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
            'filters' => $request->only(['search', 'status', 'course', 'year_level']),
            'courses' => $this->studentCourseOptions(),
            'yearLevels' => $this->studentYearLevelOptions(),
        ]);
    }

    public function participantMonitoring(Event $event)
    {
        $event->load(['attendances.student', 'attendances.student.program']);

        $attendances = $event->attendances()
            ->with('student', 'student.program')
            ->orderBy('scanned_at', 'desc')
            ->get();

        return inertia('admin-dashboard/events/participant-monitoring', [
            'event' => $event,
            'attendances' => $attendances
        ]);
    }

    public function attendanceAssignment(Event $event)
    {
        $event->load(['attendanceAssignment.student']);
        // Get eligible students based on event criteria
        $eligibleStudents = Student::where(function ($query) use ($event) {
            foreach ($event->courses as $course) {
                $query->orWhere('program', $course);
            }
        })->where(function ($query) use ($event) {
            foreach ($event->year_levels as $yearLevel) {
                $query->orWhere('year_level', $yearLevel);
            }
        })->get();

        return inertia('admin-dashboard/events/attendance-assignment', [
            'event' => $event,
            'eligibleStudents' => $eligibleStudents
        ]);
    }

    public function storeAttendanceAssignment(Request $request, Event $event)
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $assignments = [];
        foreach ($validated['student_ids'] as $studentId) {
            $assignments[] = [
                'student_id' => $studentId,
                'role' => 'scanner',
            ];
        }

        $event->update(['attendance_assignment' => $assignments]);

        return redirect()->route('admin.events.show', $event)->with('success', 'Attendance assignment updated successfully!');
    }

    private function studentCourseOptions(): array
    {
        $normalized = Student::query()
            ->select('course')
            ->distinct()
            ->whereNotNull('course')
            ->where('course', '!=', '')
            ->pluck('course')
            ->map(fn($course) => $this->normalizeCourseIdString((string) $course))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        $raw = $normalized->map(fn(string $c) => [
            'id' => $c,
            'name' => $c,
            'code' => $c,
        ])->all();

        return $this->canonicalizeCourseOptions($raw);
    }

    private function studentYearLevelOptions(): array
    {
        $normalized = Student::query()
            ->select('year_level')
            ->distinct()
            ->whereNotNull('year_level')
            ->where('year_level', '!=', '')
            ->pluck('year_level')
            ->map(fn($yl) => $this->normalizeCourseIdString((string) $yl))
            ->filter()
            ->unique()
            ->sortBy(function ($yearLevel) {
                if (!is_string($yearLevel)) {
                    return 999;
                }
                if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                    return (int) $matches[1];
                }
                return 999;
            })
            ->values();

        $raw = $normalized->map(function ($yl) {
            $y = (string) $yl;
            return [
                'id' => $y,
                'name' => $y,
                'code' => $y,
            ];
        })->values()->all();

        return $this->canonicalizeYearLevelOptions($raw);
    }

    private function attachEligibleStudentsCounts($paginator): void
    {
        $paginator->getCollection()->transform(function (Event $event) {
            $event->setAttribute('eligible_students_count', $event->eligibleStudentsCount());
            return $event;
        });
    }

    private function normalizeCourseIdString(string $value): string
    {
        $value = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $value);
        $value = trim(preg_replace('/\s+/u', ' ', $value));
        return $value;
    }

    private function canonicalizeCourseOptions(array $options): array
    {
        $byBase = [];
        foreach ($options as $opt) {
            $id = $this->normalizeCourseIdString((string) ($opt['id'] ?? ''));
            if ($id === '') {
                continue;
            }
            $name = $this->normalizeCourseIdString((string) ($opt['name'] ?? $id));
            $code = $this->normalizeCourseIdString((string) ($opt['code'] ?? $id));
            $base = strtolower(preg_replace('/\s+program$/i', '', $id));
            $row = ['id' => $id, 'name' => $name, 'code' => $code];
            if (!isset($byBase[$base])) {
                $byBase[$base] = $row;
                continue;
            }
            $byBase[$base] = $this->preferCourseOptionRow($byBase[$base], $row);
        }
        $list = array_values($byBase);
        usort($list, fn($a, $b) => strcmp((string) $a['name'], (string) $b['name']));
        return $list;
    }

    private function preferCourseOptionRow(array $a, array $b): array
    {
        $A = $this->normalizeCourseIdString((string) $a['id']);
        $B = $this->normalizeCourseIdString((string) $b['id']);
        if ($A === $B) {
            return $a;
        }
        $aProg = (bool) preg_match('/program\s*$/i', $A);
        $bProg = (bool) preg_match('/program\s*$/i', $B);
        if ($aProg && !$bProg) {
            return $a;
        }
        if ($bProg && !$aProg) {
            return $b;
        }
        return strlen($A) >= strlen($B) ? $a : $b;
    }

    private function canonicalizeYearLevelOptions(array $options): array
    {
        $seen = [];
        $out = [];
        foreach ($options as $opt) {
            $id = $this->normalizeCourseIdString((string) ($opt['id'] ?? ''));
            if ($id === '') {
                continue;
            }
            $key = strtolower($id);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = [
                'id' => $id,
                'name' => $this->normalizeCourseIdString((string) ($opt['name'] ?? $id)),
                'code' => $this->normalizeCourseIdString((string) ($opt['code'] ?? $id)),
            ];
        }
        return $out;
    }

    private function studentCountsByCourseYear(): array
    {
        return Student::query()
            ->select('course', 'year_level', DB::raw('COUNT(*) as total'))
            ->groupBy('course', 'year_level')
            ->get()
            ->map(fn($row) => [
                'course' => $row->course,
                'year_level' => $row->year_level,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();
    }

    private function publishedEventAnnouncements(): array
    {
        if (!Schema::hasTable('announcements')) {
            return [];
        }
        $columns = Schema::getColumnListing('announcements');
        $query = Announcement::query();
        if (in_array('category', $columns, true)) {
            $query->where('category', 'Event');
        }
        if (in_array('status', $columns, true)) {
            $query->where('status', 'Published');
        }
        return $query->orderBy('created_at', 'desc')->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'title' => $a->title,
                'eventDate' => $a->event_date ?? null,
                'eventTime' => $a->event_time ?? null,
            ];
        })->values()->all();
    }
}

