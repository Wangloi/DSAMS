<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProgramHeadViolationsController extends Controller
{
    public function index(): Response
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        // Get all student IDs for this program
        $programStudentIds = Student::query()
            ->where('course', $program)
            ->pluck('student_id')
            ->toArray();

        // Fetch all non-archived incidents and filter them in memory
        $incidents = Incident::where('is_archived', false)->orderByDesc('id')
            ->get()
            ->filter(function (Incident $incident) use ($programStudentIds) {
                if (!is_array($incident->students_involved)) {
                    return false;
                }

                // Normalize and check
                $studentsRaw = $incident->students_involved;
                $involvedStudentIds = [];

                if (count($studentsRaw) === 2 && is_string($studentsRaw[0]) && is_string($studentsRaw[1])) {
                    $involvedStudentIds[] = $studentsRaw[1];
                } else {
                    foreach ($studentsRaw as $s) {
                        if (is_array($s) && isset($s['id'])) {
                            $involvedStudentIds[] = $s['id'];
                        } else {
                            $involvedStudentIds[] = (string) $s;
                        }
                    }
                }

                // Check if any student in the incident belongs to this program
                foreach ($involvedStudentIds as $involvedId) {
                    if (in_array((string) $involvedId, $programStudentIds)) {
                        return true;
                    }
                }

                return false;
            })
            ->values() // Reset array keys after filtering
            ->map(function (Incident $incident) {
                $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;
                $time = $incident->incident_time ? Carbon::parse($incident->incident_time) : null;
                $dateTime = trim(($date ? $date->format('M d, Y') : '') . ' ' . ($time ? $time->format('h:i A') : ''));

                // Normalize students_involved
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
                            $student = Student::where('student_id', $studentIdOrName)->first();
                            if ($student) {
                                $studentsNormalized[] = [
                                    'id' => $student->student_id,
                                    'name' => $student->name
                                ];
                            } else {
                                // Try to find by name
                                $studentByName = Student::where('name', $studentIdOrName)->first();
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
                    'caseId' => $date ? ($date->format('Y') . '-' . str_pad((string) $incident->id, 3, '0', STR_PAD_LEFT)) : (string) $incident->id,
                    'student' => $firstStudentName,
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
            });

        return Inertia::render('program-head/Violations', [
            'incidents' => $incidents,
            'program' => $program,
        ]);
    }
}
