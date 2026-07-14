<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Incident;
use App\Models\AdmissionSlip;
use App\Models\Student;
use App\Models\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class AdminArchiveController extends Controller
{
    public function index()
    {
        $archivedItems = collect();

        // Get archived incidents
        $archivedIncidents = Incident::where('is_archived', true)->get()->map(function ($incident) {
            $date = $incident->incident_date ? Carbon::parse($incident->incident_date) : null;

            return [
                'id' => 'incident_' . $incident->id,
                'type' => 'Incident Report',
                'description' => $incident->incident_type . ': ' . (is_array($incident->students_involved) && count($incident->students_involved) > 0 ? $incident->students_involved[0] : 'Unknown'),
                'dateArchived' => optional($incident->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'lastModified' => optional($incident->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'table' => 'incidents',
                'record_id' => $incident->id,
            ];
        });

        // Get archived evaluations
        $archivedEvaluations = Evaluation::where('is_archived', true)->get()->map(function ($evaluation) {
            return [
                'id' => 'evaluation_' . $evaluation->id,
                'type' => 'Evaluation Form',
                'description' => $evaluation->name . ' (' . $evaluation->event . ')',
                'dateArchived' => optional($evaluation->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'lastModified' => optional($evaluation->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'table' => 'evaluations',
                'record_id' => $evaluation->id,
            ];
        });

        // Get archived admission slips
        $archivedAdmissionSlips = AdmissionSlip::where('is_archived', true)->get()->map(function ($admissionSlip) {
            return [
                'id' => 'admission_slip_' . $admissionSlip->id,
                'type' => 'Admission Slip',
                'description' => $admissionSlip->student_name . ' - ' . $admissionSlip->case_text,
                'dateArchived' => optional($admissionSlip->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'lastModified' => optional($admissionSlip->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'table' => 'admission_slips',
                'record_id' => $admissionSlip->id,
            ];
        });

        // Get archived students
        $archivedStudents = collect();
        if (Schema::hasColumn('students', 'is_archived')) {
            $archivedStudents = Student::where('is_archived', true)->get()->map(function ($student) {
                return [
                    'id' => 'student_' . $student->id,
                    'type' => 'Student Account',
                    'description' => ($student->name ?? 'Unknown') . ' (' . ($student->student_id ?? '') . ')',
                    'dateArchived' => optional($student->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                    'lastModified' => optional($student->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                    'table' => 'students',
                    'record_id' => $student->id,
                ];
            });
        }

        // Get archived events (Attendance Management)
        $archivedEvents = Event::whereNotNull('archived_at')->get()->map(function ($event) {
            return [
                'id' => 'event_' . $event->id,
                'type' => 'Attendance Event',
                'description' => $event->event_name . ' (' . $event->organizer . ')',
                'dateArchived' => optional($event->archived_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'lastModified' => optional($event->updated_at)->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A'),
                'table' => 'events',
                'record_id' => $event->id,
            ];
        });

        $archivedItems = $archivedItems
            ->merge($archivedIncidents)
            ->merge($archivedEvaluations)
            ->merge($archivedAdmissionSlips)
            ->merge($archivedStudents)
            ->merge($archivedEvents)
            ->sortByDesc('dateArchived');

        return Inertia::render('admin-dashboard/archive/index', [
            'archivedItems' => $archivedItems->values(),
        ]);
    }
}
