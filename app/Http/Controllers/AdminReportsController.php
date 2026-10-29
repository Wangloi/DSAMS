<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\EvaluationResponse;
use App\Models\FoundItem;
use App\Models\Incident;
use App\Models\LostReport;
use App\Models\AdmissionSlip;
use App\Models\Event;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminReportsController extends Controller
{
    public function index(Request $request)
    {
        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);

        $counts = [
            'attendance' => 0,
            'case_record' => 0,
            'evaluation' => 0,
            'lost_found' => 0,
            'admission_slip' => 0,
        ];

        if ($start && $end) {
            if (Schema::hasTable('attendances')) {
                $counts['attendance'] = Attendance::query()
                    ->whereNotNull('scanned_at')
                    ->whereBetween('scanned_at', [$start, $end])
                    ->count();
            }

            if (Schema::hasTable('incidents')) {
                $counts['case_record'] = Incident::query()
                    ->where('is_archived', false)
                    ->whereBetween('incident_date', [$start->toDateString(), $end->toDateString()])
                    ->count();
            }

            if (Schema::hasTable('evaluation_responses')) {
                $counts['evaluation'] = EvaluationResponse::query()
                    ->whereBetween('submitted_at', [$start, $end])
                    ->count();
            }

            if (Schema::hasTable('admission_slips')) {
                $counts['admission_slip'] = AdmissionSlip::query()
                    ->where('is_archived', false)
                    ->whereBetween('date_issued', [$start->toDateString(), $end->toDateString()])
                    ->count();
            }

            $lostFoundCount = 0;
            if (Schema::hasTable('found_items')) {
                $lostFoundCount += FoundItem::query()
                    ->whereBetween('created_at', [$start, $end])
                    ->count();
            }
            if (Schema::hasTable('lost_reports')) {
                $lostFoundCount += LostReport::query()
                    ->whereBetween('created_at', [$start, $end])
                    ->count();
            }
            $counts['lost_found'] = $lostFoundCount;
        } else {
            if (Schema::hasTable('attendances')) {
                $counts['attendance'] = Attendance::query()
                    ->whereNotNull('scanned_at')
                    ->count();
            }

            if (Schema::hasTable('incidents')) {
                $counts['case_record'] = Incident::query()
                    ->where('is_archived', false)
                    ->count();
            }

            if (Schema::hasTable('evaluation_responses')) {
                $counts['evaluation'] = EvaluationResponse::query()->count();
            }

            if (Schema::hasTable('admission_slips')) {
                $counts['admission_slip'] = AdmissionSlip::query()
                    ->where('is_archived', false)
                    ->count();
            }

            $lostFoundCount = 0;
            if (Schema::hasTable('found_items')) {
                $lostFoundCount += FoundItem::query()->count();
            }
            if (Schema::hasTable('lost_reports')) {
                $lostFoundCount += LostReport::query()->count();
            }
            $counts['lost_found'] = $lostFoundCount;
        }

        // Calculate comprehensive attendance turnout and percentage across all events in scope
        $attendanceStats = [
            'total_events' => 0,
            'total_expected' => 0,
            'total_attended' => 0,
            'overall_percentage' => 0,
            'events' => [],
        ];

        if (Schema::hasTable('events') && Schema::hasTable('attendances')) {
            $eventsQuery = Event::query()->where('approval_status', 'approved');

            if ($start && $end) {
                $eventsQuery->where(function ($q) use ($start, $end) {
                    $q->whereBetween('event_date', [$start->toDateString(), $end->toDateString()])
                      ->orWhereHas('attendances', function ($aq) use ($start, $end) {
                          $aq->whereBetween('scanned_at', [$start, $end]);
                      });
                });
            }

            $events = $eventsQuery->orderBy('event_date', 'desc')->get();
            $totalExpected = 0;
            $totalAttended = 0;
            $eventsList = [];

            foreach ($events as $event) {
                $capacity = $event->attendanceCapacity();
                $attended = $event->attendances()->whereNotNull('scanned_at')->count();
                $percentage = $capacity > 0 ? round(($attended / $capacity) * 100, 1) : ($attended > 0 ? 100.0 : 0.0);

                $totalExpected += $capacity;
                $totalAttended += $attended;

                $coursesStr = is_array($event->courses) && count($event->courses) > 0
                    ? implode(', ', $event->courses)
                    : 'All Programs';

                $eventsList[] = [
                    'id' => $event->id,
                    'name' => $event->event_name,
                    'date' => $event->event_date,
                    'formatted_date' => $event->event_date ? Carbon::parse($event->event_date)->format('M d, Y') : '—',
                    'time' => $event->event_time ? Carbon::parse($event->event_time)->format('h:i A') : '—',
                    'location' => $event->location ?? 'Campus',
                    'target_programs' => $coursesStr,
                    'expected' => $capacity,
                    'attended' => $attended,
                    'percentage' => $percentage,
                    'status' => $event->status,
                ];
            }

            $overallRate = $totalExpected > 0 ? round(($totalAttended / $totalExpected) * 100, 1) : ($totalAttended > 0 ? 100.0 : 0.0);

            $attendanceStats = [
                'total_events' => count($events),
                'total_expected' => $totalExpected,
                'total_attended' => $totalAttended,
                'overall_percentage' => $overallRate,
                'events' => $eventsList,
            ];
        }

        $recordsLabel = [
            'attendance' => count($attendanceStats['events']) > 0
                ? "{$attendanceStats['overall_percentage']}% Attendance Rate • {$attendanceStats['total_attended']} Attended ({$attendanceStats['total_events']} Events)"
                : '0% Attendance Rate • 0 Events',
            'case_record' => (string) $counts['case_record'] . ' Records',
            'evaluation' => (string) $counts['evaluation'] . ' Records',
            'lost_found' => (string) $counts['lost_found'] . ' Records',
            'admission_slip' => (string) $counts['admission_slip'] . ' Records',
        ];

        return Inertia::render('admin-dashboard/reports/index', [
            'range' => $range,
            'periodLabel' => $periodLabel,
            'recordsLabel' => $recordsLabel,
            'attendanceStats' => $attendanceStats,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $type = (string) $request->query('type', 'attendance');
        if (!in_array($type, ['attendance', 'case_record', 'evaluation', 'lost_found', 'admission_slip'], true)) {
            abort(404);
        }

        $mode = $request->query('mode');
        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);

        $filename = $type . ($mode ? '-' . $mode : '') . '-' . str_replace(' ', '-', strtolower($range)) . '-' . Carbon::now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($type, $start, $end, $mode) {
            $out = fopen('php://output', 'w');
            if (!$out) {
                return;
            }

            $rows = $this->getReportRows($type, $start, $end, $mode);
            $header = $rows['header'];
            $data = $rows['rows'];

            fputcsv($out, $header);
            foreach ($data as $r) {
                fputcsv($out, $r);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function print(Request $request)
    {
        $type = (string) $request->query('type', 'attendance');
        if (!in_array($type, ['attendance', 'case_record', 'evaluation', 'lost_found', 'admission_slip'], true)) {
            abort(404);
        }

        $mode = $request->query('mode');
        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);
        $result = $this->getReportRows($type, $start, $end, $mode);

        $titleByType = [
            'attendance' => 'Attendance Turnout & Participation Report',
            'case_record' => 'Case Record Report',
            'evaluation' => 'Evaluation Report',
            'lost_found' => 'Lost and Found Report',
            'admission_slip' => 'Admission Slip Report',
        ];

        return response()
            ->view('admin.reports.print', [
                'title' => $titleByType[$type] ?? 'Report',
                'periodLabel' => $periodLabel,
                'range' => $range,
                'type' => $type,
                'header' => $result['header'],
                'rows' => $result['rows'],
                'attendanceSummary' => $result['summary'] ?? null,
            ]);
    }

    private function resolveRange(Request $request): array
    {
        $range = (string) $request->query('range', 'all');
        if (!in_array($range, ['all', 'weekly', 'monthly', 'yearly', 'semester', 'custom'], true)) {
            $range = 'all';
        }

        $start = null;
        $end = null;
        $periodLabel = '';

        if ($range === 'all') {
            $start = null;
            $end = null;
            $periodLabel = 'All Scheduled Events - Comprehensive Turnout';
        } elseif ($range === 'weekly') {
            $start = Carbon::now()->startOfWeek();
            $end = Carbon::now()->endOfWeek();
            $periodLabel = 'Weekly Report - ' . Carbon::now()->format('F Y');
        } elseif ($range === 'monthly') {
            $start = Carbon::now()->startOfMonth();
            $end = Carbon::now()->endOfMonth();
            $periodLabel = 'Monthly Report - ' . Carbon::now()->format('F Y');
        } elseif ($range === 'yearly') {
            $start = Carbon::now()->startOfYear();
            $end = Carbon::now()->endOfYear();
            $periodLabel = 'Yearly Report - ' . Carbon::now()->format('Y');
        } elseif ($range === 'custom') {
            $customStart = $request->query('customStartDate');
            $customEnd = $request->query('customEndDate');
            if ($customStart && $customEnd) {
                $start = Carbon::parse($customStart)->startOfDay();
                $end = Carbon::parse($customEnd)->endOfDay();
                $periodLabel = 'Custom Report - ' . $start->format('M d, Y') . ' to ' . $end->format('M d, Y');
            } else {
                $start = Carbon::now()->startOfWeek();
                $end = Carbon::now()->endOfWeek();
                $periodLabel = 'Weekly Report - ' . Carbon::now()->format('F Y');
                $range = 'weekly';
            }
        } else {
            $year = (int) Carbon::now()->format('Y');
            $month = (int) Carbon::now()->format('n');

            if ($month <= 6) {
                $start = Carbon::create($year, 1, 1)->startOfDay();
                $end = Carbon::create($year, 6, 30)->endOfDay();
                $periodLabel = 'By Semester - 2nd Sem AY ' . ($year - 1) . '-' . $year;
            } else {
                $start = Carbon::create($year, 7, 1)->startOfDay();
                $end = Carbon::create($year, 12, 31)->endOfDay();
                $periodLabel = 'By Semester - 1st Sem AY ' . $year . '-' . ($year + 1);
            }
        }

        return [$range, $start, $end, $periodLabel];
    }

    private function getReportRows(string $type, ?Carbon $start, ?Carbon $end, ?string $mode = null): array
    {
        if ($type === 'attendance') {
            if ($mode === 'detailed') {
                $header = ['Scanned At', 'Student ID', 'Student Name', 'Event', 'Status'];
                $rows = [];
                if (Schema::hasTable('attendances')) {
                    $itemsQuery = Attendance::query()
                        ->whereNotNull('scanned_at')
                        ->with([
                            'student:id,name,student_id',
                            'event:id,event_name',
                        ])
                        ->orderByDesc('scanned_at');

                    if ($start && $end) {
                        $itemsQuery->whereBetween('scanned_at', [$start, $end]);
                    }

                    $items = $itemsQuery->limit(2000)->get();

                    foreach ($items as $a) {
                        $rows[] = [
                            optional($a->scanned_at)->toDateTimeString(),
                            (string) (optional($a->student)->student_id ?? ''),
                            (string) (optional($a->student)->name ?? ''),
                            (string) (optional($a->event)->event_name ?? ''),
                            (string) ($a->status ?? ''),
                        ];
                    }
                }
                return ['header' => $header, 'rows' => $rows];
            }

            // Default & Primary: Attendance Turnout Report with Attendance Percentage on all events
            $header = [
                'Event Name',
                'Event Date',
                'Time',
                'Venue',
                'Target Programs',
                'Expected Attendees',
                'Actual Attendees',
                'Attendance Rate (%)',
                'Status',
            ];

            $eventsQuery = Event::query()->where('approval_status', 'approved');

            if ($start && $end) {
                $eventsQuery->where(function ($q) use ($start, $end) {
                    $q->whereBetween('event_date', [$start->toDateString(), $end->toDateString()])
                      ->orWhereHas('attendances', function ($aq) use ($start, $end) {
                          $aq->whereBetween('scanned_at', [$start, $end]);
                      });
                });
            }

            $events = $eventsQuery->orderBy('event_date', 'desc')->get();
            $rows = [];
            $totalExpected = 0;
            $totalAttended = 0;

            foreach ($events as $e) {
                $capacity = $e->attendanceCapacity();
                $attended = $e->attendances()->whereNotNull('scanned_at')->count();
                $percentage = $capacity > 0 ? round(($attended / $capacity) * 100, 1) : ($attended > 0 ? 100.0 : 0.0);

                $totalExpected += $capacity;
                $totalAttended += $attended;

                $coursesStr = is_array($e->courses) && count($e->courses) > 0
                    ? implode(', ', $e->courses)
                    : 'All Programs';

                $formattedDate = $e->event_date ? Carbon::parse($e->event_date)->format('M d, Y') : '—';
                $formattedTime = $e->event_time ? Carbon::parse($e->event_time)->format('h:i A') : '—';

                $rows[] = [
                    (string) $e->event_name,
                    $formattedDate,
                    $formattedTime,
                    (string) ($e->location ?? 'Campus'),
                    $coursesStr,
                    (string) $capacity,
                    (string) $attended,
                    $percentage . '%',
                    ucfirst((string) $e->status),
                ];
            }

            $overallPercentage = $totalExpected > 0
                ? round(($totalAttended / $totalExpected) * 100, 1)
                : ($totalAttended > 0 ? 100.0 : 0.0);

            if (count($events) > 0) {
                $rows[] = [
                    'OVERALL SUMMARY',
                    '',
                    '',
                    '',
                    'Total Events: ' . count($events),
                    (string) $totalExpected,
                    (string) $totalAttended,
                    $overallPercentage . '%',
                    '',
                ];
            }

            return [
                'header' => $header,
                'rows' => $rows,
                'summary' => [
                    'total_events' => count($events),
                    'total_expected' => $totalExpected,
                    'total_attended' => $totalAttended,
                    'overall_percentage' => $overallPercentage,
                ],
            ];
        }

        if ($type === 'case_record') {
            $header = ['Case ID', 'Incident Type', 'Classification', 'Status', 'Incident Date', 'Location', 'Students Involved'];
            $rows = [];
            if (Schema::hasTable('incidents')) {
                $query = Incident::query()->where('is_archived', false);
                if ($start && $end) {
                    $query->whereBetween('incident_date', [$start->toDateString(), $end->toDateString()]);
                }
                $items = $query->orderByDesc('incident_date')
                    ->orderByDesc('id')
                    ->limit(2000)
                    ->get();

                foreach ($items as $i) {
                    $caseId = $i->incident_date ? (Carbon::parse($i->incident_date)->format('Y') . '-' . str_pad((string) $i->id, 3, '0', STR_PAD_LEFT)) : (string) $i->id;
                    $students = is_array($i->students_involved) ? implode(', ', $i->students_involved) : '';
                    $rows[] = [
                        (string) $caseId,
                        (string) ($i->incident_type ?? ''),
                        (string) ($i->classification ?? ''),
                        (string) ($i->status ?? ''),
                        $i->incident_date ? Carbon::parse($i->incident_date)->toDateString() : '',
                        (string) ($i->location ?? ''),
                        (string) $students,
                    ];
                }
            }
            return ['header' => $header, 'rows' => $rows];
        }

        if ($type === 'evaluation') {
            $header = ['Submitted At', 'Evaluation', 'Student ID', 'Student Name'];
            $rows = [];
            if (Schema::hasTable('evaluation_responses')) {
                $query = EvaluationResponse::query()
                    ->with([
                        'evaluation:id,name',
                        'student:id,name,student_id',
                    ]);
                if ($start && $end) {
                    $query->whereBetween('submitted_at', [$start, $end]);
                }
                $items = $query->orderByDesc('submitted_at')
                    ->limit(2000)
                    ->get();

                foreach ($items as $r) {
                    $rows[] = [
                        optional($r->submitted_at)->toDateTimeString(),
                        (string) (optional($r->evaluation)->name ?? ''),
                        (string) (optional($r->student)->student_id ?? ''),
                        (string) (optional($r->student)->name ?? ''),
                    ];
                }
            }
            return ['header' => $header, 'rows' => $rows];
        }

        if ($type === 'admission_slip') {
            $header = ['Date Issued', 'Student Name', 'Program & Year', 'Case Title', 'Reason', 'Valid Until', 'Status'];
            $rows = [];
            if (Schema::hasTable('admission_slips')) {
                $query = AdmissionSlip::query()->where('is_archived', false);
                if ($start && $end) {
                    $query->whereBetween('date_issued', [$start->toDateString(), $end->toDateString()]);
                }
                $items = $query->orderByDesc('date_issued')
                    ->orderByDesc('id')
                    ->limit(2000)
                    ->get();

                foreach ($items as $s) {
                    $rows[] = [
                        $s->date_issued ? Carbon::parse($s->date_issued)->toDateString() : '',
                        (string) ($s->student_name ?? ''),
                        (string) ($s->program_year_level ?? ''),
                        (string) ($s->case_text ?? ''),
                        (string) ($s->reason_text ?? ''),
                        $s->valid_until ? Carbon::parse($s->valid_until)->toDateString() : '',
                        (string) ($s->status ?? ''),
                    ];
                }
            }
            return ['header' => $header, 'rows' => $rows];
        }

        $header = ['Date', 'Type', 'Description', 'Status'];
        $rows = [];

        if (Schema::hasTable('found_items')) {
            $query = FoundItem::query();
            if ($start && $end) {
                $query->whereBetween('created_at', [$start, $end]);
            }
            $items = $query->orderByDesc('created_at')
                ->limit(2000)
                ->get();

            foreach ($items as $i) {
                $rows[] = [
                    optional($i->created_at)->toDateString(),
                    'Found Item',
                    (string) ($i->item_description ?? ''),
                    (string) ($i->status ?? ''),
                ];
            }
        }

        if (Schema::hasTable('lost_reports')) {
            $query = LostReport::query();
            if ($start && $end) {
                $query->whereBetween('created_at', [$start, $end]);
            }
            $items = $query->orderByDesc('created_at')
                ->limit(2000)
                ->get();

            foreach ($items as $i) {
                $rows[] = [
                    optional($i->created_at)->toDateString(),
                    'Lost Report',
                    (string) ($i->item_description ?? ''),
                    (string) ($i->status ?? ''),
                ];
            }
        }

        return ['header' => $header, 'rows' => $rows];
    }
}
