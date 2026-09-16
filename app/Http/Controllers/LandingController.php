<?php

namespace App\Http\Controllers;

use App\Models\AdmissionSlip;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Program;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class LandingController extends Controller
{
    public function index(Request $request)
    {
        $activeGuard = \App\Support\ActiveAuth::resolve($request);
        if ($activeGuard) {
            return redirect(\App\Support\ActiveAuth::backUrl($activeGuard));
        }

        $stats = [
            'totalStudents' => Student::count(),
            'totalEvents' => Event::count(),
            'totalAdmissionSlips' => AdmissionSlip::count(),
            'totalPrograms' => Program::count(),
        ];

        // Fetch the latest event (non-archived)
        $lastEvent = Event::query()
            ->whereNull('archived_at')
            ->orderByDesc('event_date')
            ->orderByDesc('id')
            ->first();

        $activeEventsCount = Event::query()
            ->whereNull('archived_at')
            ->where(function ($q) {
                $q->where('status', '!=', 'Completed')
                  ->where('status', '!=', 'Cancelled')
                  ->orWhereDate('event_date', '>=', now()->toDateString());
            })
            ->count();

        if ($activeEventsCount === 0) {
            $activeEventsCount = Event::query()->whereNull('archived_at')->count();
        }

        $lastEventStats = [
            'id' => null,
            'name' => null,
            'date' => null,
            'attendancePercent' => 98,
            'activeEvents' => $activeEventsCount > 0 ? $activeEventsCount : 24,
            'progressPercent' => 85,
            'scannedCount' => 0,
            'targetAttendees' => 0,
        ];

        if ($lastEvent) {
            $scannedCount = 0;
            $checkedOutCount = 0;
            if (Schema::hasTable('attendances')) {
                $scannedCount = Attendance::query()
                    ->where('event_id', $lastEvent->id)
                    ->where(function ($q) {
                        $q->whereNotNull('scanned_at')
                          ->orWhereNotNull('checked_in_at');
                    })
                    ->count();

                $checkedOutCount = Attendance::query()
                    ->where('event_id', $lastEvent->id)
                    ->whereNotNull('checked_out_at')
                    ->count();
            }

            // Target attendees: expected_attendees or matching course students or total active students
            $targetAttendees = (int) ($lastEvent->expected_attendees ?? 0);
            if ($targetAttendees <= 0 && !empty($lastEvent->courses) && is_array($lastEvent->courses)) {
                $targetAttendees = Student::query()
                    ->whereIn('course', $lastEvent->courses)
                    ->where('is_archived', false)
                    ->count();
            }
            if ($targetAttendees <= 0) {
                $targetAttendees = Student::query()->where('is_archived', false)->count();
            }
            if ($targetAttendees <= 0) {
                $targetAttendees = max($scannedCount, 1);
            }

            // Attendance percent for the last event
            if ($scannedCount > 0 && $targetAttendees > 0) {
                $attendancePercent = min(100, (int) round(($scannedCount / $targetAttendees) * 100));
            } elseif ($lastEvent->present_count && $targetAttendees > 0) {
                $attendancePercent = min(100, (int) round(($lastEvent->present_count / $targetAttendees) * 100));
            } else {
                $attendancePercent = 0;
            }

            // Progress rate: completed check-outs vs check-ins, or scanned vs expected
            if ($scannedCount > 0) {
                if ($checkedOutCount > 0) {
                    $progressPercent = (int) round(($checkedOutCount / $scannedCount) * 100);
                } else {
                    $progressPercent = $attendancePercent;
                }
            } else {
                $progressPercent = 0;
            }

            $lastEventStats = [
                'id' => $lastEvent->id,
                'name' => $lastEvent->event_name,
                'date' => optional($lastEvent->event_date)->format('M d, Y'),
                'attendancePercent' => $attendancePercent,
                'activeEvents' => $activeEventsCount,
                'progressPercent' => $progressPercent,
                'scannedCount' => $scannedCount,
                'targetAttendees' => $targetAttendees,
            ];
        }

        return Inertia::render('landing-page', [
            'isAuthed' => (bool) $activeGuard,
            'canRegister' => Features::enabled(Features::registration()),
            'stats' => $stats,
            'lastEventStats' => $lastEventStats,
        ]);
    }
}
