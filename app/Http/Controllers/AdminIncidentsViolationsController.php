<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Incident;
use App\Services\StudentNotificationDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminIncidentsViolationsController extends Controller
{
    public function index(): Response
    {
        $violations = \App\Models\Violation::all();

        $incidents = Incident::where('is_archived', false)->orderByDesc('id')
            ->with(['disciplinaryActions'])
            ->get()
            ->map(function (Incident $incident) {
                $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
                $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
                $dateTime = trim(($date ? $date->format('M d, Y') : '').' '.($time ? $time->format('h:i A') : ''));

                // Normalize students_involved: support all formats
                $studentsRaw = is_array($incident->students_involved) ? $incident->students_involved : [];
                $studentsNormalized = [];
                
                // Check if it's a legacy [name, id] pair (two strings)
                if (count($studentsRaw) === 2 && is_string($studentsRaw[0]) && is_string($studentsRaw[1])) {
                    $studentsNormalized[] = [
                        'id' => $studentsRaw[1],
                        'name' => $studentsRaw[0]
                    ];
                } else {
                    foreach ($studentsRaw as $s) {
                        if (is_array($s) && isset($s['name'])) {
                            $studentsNormalized[] = ['id' => $s['id'] ?? '', 'name' => $s['name']];
                        } else {
                            // Plain string: could be ID or name
                            $studentIdOrName = (string) $s;
                            // Try to find student by student_id first
                            $student = \App\Models\Student::where('student_id', $studentIdOrName)->first();
                            if ($student) {
                                $studentsNormalized[] = [
                                    'id' => $student->student_id,
                                    'name' => $student->name
                                ];
                            } else {
                                // Try to find by name
                                $studentByName = \App\Models\Student::where('name', $studentIdOrName)->first();
                                if ($studentByName) {
                                    $studentsNormalized[] = [
                                        'id' => $studentByName->student_id,
                                        'name' => $studentByName->name
                                    ];
                                } else {
                                    $studentsNormalized[] = ['id' => $studentIdOrName, 'name' => $studentIdOrName];
                                }
                            }
                        }
                    }
                }

                $firstStudentName = count($studentsNormalized) > 0 ? $studentsNormalized[0]['name'] : '—';
                $firstStudentId   = count($studentsNormalized) > 0 ? $studentsNormalized[0]['id'] : '';

                return [
                    'id' => $incident->id,
                    'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                    'student'   => $firstStudentName,
                    'studentId' => $firstStudentId,
                    'type' => $incident->incident_type,
                    'classification' => $incident->classification,
                    'dateTime' => $dateTime,
                    'status' => $incident->status,
                    'violation_id' => $incident->violation_id,
                    'disciplinary_actions' => $incident->disciplinaryActions,
                    'raw' => [
                        'incidentType' => $incident->incident_type,
                        'date' => $date ? $date->format('Y-m-d') : null,
                        'time' => $time ? $time->format('H:i') : null,
                        'location' => $incident->location,
                        'reportedBy' => $incident->reported_by,
                        'studentsInvolved' => $studentsNormalized,
                        'description' => $incident->description,
                        'immediateAction' => $incident->immediate_action,
                        'classification' => $incident->classification,
                        'status' => $incident->status,
                        'receivedBy' => $incident->received_by,
                    ],
                ];
            });

        return Inertia::render('admin-dashboard/incidents-violations/index', [
            'incidents' => $incidents,
            'violations' => $violations,
        ]);
    }

    public function store(Request $request, \App\Services\DisciplinaryService $disciplinaryService): RedirectResponse
    {
        $validated = $request->validate([
            'violation_id' => ['required', 'exists:violations,id'],
            'incident_type' => ['required', 'string', 'max:255'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'reported_by' => ['nullable', 'string', 'max:255'],
            'students_involved' => ['required', 'array', 'min:1'],
            'students_involved.*' => ['array'],
            'students_involved.*.id' => ['nullable', 'string', 'max:255'],
            'students_involved.*.name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'immediate_action' => ['nullable', 'string'],
            'received_by' => ['nullable', 'string', 'max:255'],
            'classification' => ['required', 'in:Major,Minor'],
            'status' => ['sometimes', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $incident = $disciplinaryService->createIncident([
            'violation_id' => $validated['violation_id'] ?? null,
            'incident_type' => $validated['incident_type'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'reported_by' => $validated['reported_by'] ?? null,
            'students_involved' => $validated['students_involved'] ?? [],
            'description' => $validated['description'],
            'immediate_action' => $validated['immediate_action'] ?? null,
            'classification' => $validated['classification'] ?? 'Minor',
            'status' => $validated['status'] ?? 'Pending',
            'received_by' => $validated['received_by'] ?? null,
        ]);

        app(StudentNotificationDispatcher::class)->incidentCreated($incident);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Created', 'Created incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report created successfully.');
    }

    public function update(Request $request, Incident $incident): RedirectResponse
    {
        $validated = $request->validate([
            'violation_id' => ['required', 'exists:violations,id'],
            'incident_type' => ['required', 'string', 'max:255'],
            'incident_date' => ['required', 'date'],
            'incident_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'reported_by' => ['nullable', 'string', 'max:255'],
            'students_involved' => ['required', 'array', 'min:1'],
            'students_involved.*' => ['array'],
            'students_involved.*.id' => ['nullable', 'string', 'max:255'],
            'students_involved.*.name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'immediate_action' => ['nullable', 'string'],
            'received_by' => ['nullable', 'string', 'max:255'],
            'classification' => ['required', 'in:Major,Minor'],
            'status' => ['sometimes', 'in:Ongoing,Pending,Resolved,Escalated'],
        ]);

        $incident->fill([
            'violation_id' => $validated['violation_id'],
            'incident_type' => $validated['incident_type'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'reported_by' => $validated['reported_by'] ?? $incident->reported_by,
            'students_involved' => $validated['students_involved'] ?? [],
            'description' => $validated['description'],
            'immediate_action' => $validated['immediate_action'] ?? $incident->immediate_action,
            'classification' => $validated['classification'] ?? $incident->classification,
            'status' => $validated['status'] ?? $incident->status,
            'received_by' => $validated['received_by'] ?? $incident->received_by,
        ]);
        $changedFields = array_keys($incident->getDirty());
        $incident->save();

        app(StudentNotificationDispatcher::class)->incidentUpdated($incident, $changedFields);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Updated', 'Updated incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report updated successfully.');
    }

    public function updatePost(Request $request, Incident $incident): RedirectResponse
    {
        return $this->update($request, $incident);
    }

    public function archivePost(Request $request, Incident $incident): RedirectResponse
    {
        return $this->archive($incident);
    }

    public function destroy(Incident $incident): RedirectResponse
    {
        $incident->update(['is_archived' => true]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Archived', 'Archived incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report archived successfully.');
    }

    public function show(Request $request, int $id): Response|RedirectResponse
    {
        $incident = Incident::find($id);

        if (! $incident) {
            // Reconstruct seed data in DB format so page works for seed rows
            $seedMocks = [
                1 => [
                    'id' => 1,
                    'incident_date' => '2026-03-14',
                    'incident_time' => '20:24:00',
                    'students_involved' => ['Dionne S. De Grano', '2024-0001'],
                    'incident_type' => 'Minor Offense',
                    'classification' => 'Minor',
                    'status' => 'Resolved',
                    'location' => 'Main Campus',
                    'reported_by' => 'Dean Marcus Aurelius',
                    'description' => 'Incident reported involving Dionne S. De Grano. Investigation resolved.',
                    'immediate_action' => 'Verbal warning issued.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
                2 => [
                    'id' => 2,
                    'incident_date' => '2026-03-15',
                    'incident_time' => '10:15:00',
                    'students_involved' => ['Vinn S. Dela Torre', '2024-0002'],
                    'incident_type' => 'Smoking inside campus',
                    'classification' => 'Major',
                    'status' => 'Pending',
                    'location' => 'Main Lobby',
                    'reported_by' => 'Guard Santos',
                    'description' => 'Caught smoking on campus premises behind the gymnasium.',
                    'immediate_action' => 'Confiscated items, referred to guidance.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
                3 => [
                    'id' => 3,
                    'incident_date' => '2026-03-16',
                    'incident_time' => '09:00:00',
                    'students_involved' => ['Melannie C. Delatado', '2024-0003'],
                    'incident_type' => 'Dress Code Violation',
                    'classification' => 'Minor',
                    'status' => 'Ongoing',
                    'location' => 'University Gate',
                    'reported_by' => 'Guard Valenzuela',
                    'description' => 'Not wearing proper school uniform/dress code policy.',
                    'immediate_action' => 'Noted in student record.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
                4 => [
                    'id' => 4,
                    'incident_date' => '2026-03-17',
                    'incident_time' => '11:30:00',
                    'students_involved' => ['Micaela D. Diamat', '2024-0005'],
                    'incident_type' => 'Dress Code Violation',
                    'classification' => 'Minor',
                    'status' => 'Pending',
                    'location' => 'University Gate',
                    'reported_by' => 'Guard Valenzuela',
                    'description' => 'Wearing unauthorized footwear on campus.',
                    'immediate_action' => 'Warning issued.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
                5 => [
                    'id' => 5,
                    'incident_date' => '2026-03-18',
                    'incident_time' => '14:00:00',
                    'students_involved' => ['Jian R. Diaz', '2024-0008'],
                    'incident_type' => 'Public Display of Affection',
                    'classification' => 'Minor',
                    'status' => 'Resolved',
                    'location' => 'Student Lounge',
                    'reported_by' => 'Prof. Tech',
                    'description' => 'Report of inappropriate public display of affection.',
                    'immediate_action' => 'Verbal warning issued.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
                6 => [
                    'id' => 6,
                    'incident_date' => '2026-03-19',
                    'incident_time' => '13:00:00',
                    'students_involved' => ['Julian Valerius', '20-4492-BSCS'],
                    'incident_type' => 'Unauthorized System Access & Data Breach',
                    'classification' => 'Major',
                    'status' => 'Ongoing',
                    'location' => 'Computer Lab 3',
                    'reported_by' => 'Lab Instructor',
                    'description' => 'Incident occurred involving unauthorized entry into the academic records server via exploited administrative credentials. Breach resulted in the alteration of three transcript records.',
                    'immediate_action' => 'Immediate suspension pending investigation.',
                    'received_by' => 'Dean Marcus Aurelius',
                ],
            ];

            $seedId = (int) $id;
            if (isset($seedMocks[$seedId])) {
                $mockData = $seedMocks[$seedId];
                $incident = new Incident();
                $incident->id = $mockData['id'];
                $incident->incident_date = $mockData['incident_date'];
                $incident->incident_time = $mockData['incident_time'];
                $incident->students_involved = $mockData['students_involved'];
                $incident->incident_type = $mockData['incident_type'];
                $incident->classification = $mockData['classification'];
                $incident->status = $mockData['status'];
                $incident->location = $mockData['location'];
                $incident->reported_by = $mockData['reported_by'];
                $incident->description = $mockData['description'];
                $incident->immediate_action = $mockData['immediate_action'];
                $incident->received_by = $mockData['received_by'];
            } else {
                return redirect()->route('admin.incidents-violations')
                    ->with('error', 'Incident record not found.');
            }
        }

        $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
        $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
        $dateTime = trim(($date ? $date->format('M d, Y') : '').' '.($time ? $time->format('h:i A') : ''));

        // Normalize students_involved: support all formats
        $studentsRaw = is_array($incident->students_involved) ? $incident->students_involved : [];
        $studentsNormalized = [];
        
        // Check if it's a legacy [name, id] pair (two strings)
        if (count($studentsRaw) === 2 && is_string($studentsRaw[0]) && is_string($studentsRaw[1])) {
            $studentsNormalized[] = [
                'id' => $studentsRaw[1],
                'name' => $studentsRaw[0]
            ];
        } else {
            foreach ($studentsRaw as $s) {
                if (is_array($s) && isset($s['name'])) {
                    $studentsNormalized[] = ['id' => $s['id'] ?? '', 'name' => $s['name']];
                } else {
                    // Plain string: could be ID or name
                    $studentIdOrName = (string) $s;
                    // Try to find student by student_id first
                    $student = \App\Models\Student::where('student_id', $studentIdOrName)->first();
                    if ($student) {
                        $studentsNormalized[] = [
                            'id' => $student->student_id,
                            'name' => $student->name
                        ];
                    } else {
                        // Try to find by name
                        $studentByName = \App\Models\Student::where('name', $studentIdOrName)->first();
                        if ($studentByName) {
                            $studentsNormalized[] = [
                                'id' => $studentByName->student_id,
                                'name' => $studentByName->name
                            ];
                        } else {
                            $studentsNormalized[] = ['id' => $studentIdOrName, 'name' => $studentIdOrName];
                        }
                    }
                }
            }
        }

        $firstStudentName = count($studentsNormalized) > 0 ? $studentsNormalized[0]['name'] : '—';
        $firstStudentId   = count($studentsNormalized) > 0 ? $studentsNormalized[0]['id'] : '';

        $formatted = [
            'id' => $incident->id,
            'caseId' => $date ? ($date->format('Y').'-'.str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
            'student'   => $firstStudentName,
            'studentId' => $firstStudentId,
            'type' => $incident->incident_type,
            'classification' => $incident->classification,
            'dateTime' => $dateTime,
            'status' => $incident->status,
            'raw' => [
                'incidentType' => $incident->incident_type,
                'date' => $date ? $date->format('Y-m-d') : null,
                'time' => $time ? $time->format('H:i') : null,
                'location' => $incident->location,
                'reportedBy' => $incident->reported_by,
                'studentsInvolved' => $studentsNormalized,
                'description' => $incident->description,
                'immediateAction' => $incident->immediate_action,
                'classification' => $incident->classification,
                'status' => $incident->status,
                'receivedBy' => $incident->received_by,
            ],
        ];

        // Retrieve actual student details if student exists in the database
        $studentName = $formatted['student'];
        $student = \App\Models\Student::where('name', $studentName)->first();
        $studentDetails = null;
        if ($student) {
            $studentDetails = [
                'id' => $student->student_id,
                'name' => $student->name,
                'course' => $student->course ?? 'BSCS',
                'yearLevel' => $student->year_level ?? '4th Year',
                'status' => $student->status ?? 'Active',
            ];
        }

        return Inertia::render('admin-dashboard/incidents-violations/show', [
            'incident' => $formatted,
            'studentDetails' => $studentDetails,
        ]);
    }

    public function archive(Incident $incident): RedirectResponse
    {
        try {
            \Log::info('Attempting to archive incident: '.$incident->id);

            $incident->update(['is_archived' => true]);

            if (Schema::hasTable('activity_logs')) {
                $admin = auth()->guard('admin')->user();
                ActivityLog::logForUser($admin, 'Incidents', 'Archived', 'Archived incident #'.(string) $incident->id);
            }

            \Log::info('Successfully archived incident: '.$incident->id);

            return redirect()->back()->with('success', 'Incident report archived successfully.');
        } catch (\Exception $e) {
            \Log::error('Archive failed: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to archive incident: '.$e->getMessage());
        }
    }

    public function unarchive(Incident $incident): RedirectResponse
    {
        $incident->update(['is_archived' => false]);

        if (Schema::hasTable('activity_logs')) {
            $admin = auth()->guard('admin')->user();
            ActivityLog::logForUser($admin, 'Incidents', 'Unarchived', 'Unarchived incident #'.(string) $incident->id);
        }

        return redirect()->back()->with('success', 'Incident report unarchived successfully.');
    }
}
