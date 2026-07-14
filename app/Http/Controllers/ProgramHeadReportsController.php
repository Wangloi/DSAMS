<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Incident;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProgramHeadReportsController extends Controller
{
    public function index(Request $request)
    {
        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);

        $counts = [
            'attendance' => 0,
            'violations' => 0,
        ];

        if ($start && $end && $program !== '') {
            $studentIds = Student::where('course', $program)->pluck('id')->toArray();
            $studentIdsStr = Student::where('course', $program)->pluck('student_id')->toArray();

            if (Schema::hasTable('attendances')) {
                $counts['attendance'] = Attendance::query()
                    ->whereNotNull('scanned_at')
                    ->whereIn('student_id', $studentIds)
                    ->whereBetween('scanned_at', [$start, $end])
                    ->count();
            }

            if (Schema::hasTable('incidents')) {
                $counts['violations'] = Incident::query()
                    ->where('is_archived', false)
                    ->whereBetween('incident_date', [$start->toDateString(), $end->toDateString()])
                    ->get()
                    ->filter(function ($i) use ($studentIdsStr) {
                        return !empty(array_intersect((array)$i->students_involved, $studentIdsStr));
                    })
                    ->count();
            }
        }

        $recordsLabel = [
            'attendance' => (string) $counts['attendance'] . ' Records',
            'violations' => (string) $counts['violations'] . ' Records',
        ];

        return Inertia::render('program-head/reports/index', [
            'range' => $range,
            'periodLabel' => $periodLabel,
            'recordsLabel' => $recordsLabel,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $type = (string) $request->query('type', 'attendance');
        if (!in_array($type, ['attendance', 'violations'], true)) {
            abort(404);
        }

        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);

        $filename = $type . '-' . str_replace(' ', '-', strtolower($range)) . '-' . Carbon::now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($type, $start, $end) {
            $out = fopen('php://output', 'w');
            if (!$out) {
                return;
            }

            $rows = $this->getReportRows($type, $start, $end);
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
        if (!in_array($type, ['attendance', 'violations'], true)) {
            abort(404);
        }

        [$range, $start, $end, $periodLabel] = $this->resolveRange($request);
        $result = $this->getReportRows($type, $start, $end);

        $titleByType = [
            'attendance' => 'Attendance Report',
            'violations' => 'Violation Report',
        ];

        return response()
            ->view('admin.reports.print', [
                'title' => $titleByType[$type] ?? 'Report',
                'periodLabel' => $periodLabel,
                'range' => $range,
                'type' => $type,
                'header' => $result['header'],
                'rows' => $result['rows'],
            ]);
    }

    private function resolveRange(Request $request): array
    {
        $range = (string) $request->query('range', 'weekly');
        if (!in_array($range, ['weekly', 'monthly', 'yearly', 'semester'], true)) {
            $range = 'weekly';
        }

        $start = null;
        $end = null;
        $periodLabel = '';

        if ($range === 'weekly') {
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

    private function getReportRows(string $type, ?Carbon $start, ?Carbon $end): array
    {
        if (!$start || !$end) {
            return ['header' => [], 'rows' => []];
        }

        $programHead = auth()->guard('program_head')->user() ?: auth()->user();
        $program = is_object($programHead) ? (string) ($programHead->program ?? '') : '';

        if ($program === '') {
            return ['header' => [], 'rows' => []];
        }

        $studentIds = Student::where('course', $program)->pluck('id')->toArray();
        $studentIdsStr = Student::where('course', $program)->pluck('student_id')->toArray();

        if ($type === 'attendance') {
            $header = ['Scanned At', 'Student ID', 'Student Name', 'Event', 'Status'];
            $rows = [];
            if (Schema::hasTable('attendances')) {
                $items = Attendance::query()
                    ->whereNotNull('scanned_at')
                    ->whereIn('student_id', $studentIds)
                    ->whereBetween('scanned_at', [$start, $end])
                    ->with([
                        'student:id,name,student_id',
                        'event:id,event_name',
                    ])
                    ->orderByDesc('scanned_at')
                    ->limit(2000)
                    ->get();

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

        if ($type === 'violations') {
            $header = ['Case ID', 'Type', 'Classification', 'Status', 'Date', 'Location', 'Students Involved'];
            $rows = [];
            if (Schema::hasTable('incidents')) {
                $items = Incident::query()
                    ->where('is_archived', false)
                    ->whereBetween('incident_date', [$start->toDateString(), $end->toDateString()])
                    ->get()
                    ->filter(function ($i) use ($studentIdsStr) {
                        return !empty(array_intersect((array)$i->students_involved, $studentIdsStr));
                    })
                    ->sortByDesc('incident_date');

                foreach ($items as $i) {
                    $date = $i->incident_date ? Carbon::parse($i->incident_date) : null;
                    $caseId = $date ? ($date->format('Y') . '-' . str_pad((string) $i->id, 3, '0', STR_PAD_LEFT)) : (string) $i->id;
                    $students = is_array($i->students_involved) ? implode(', ', $i->students_involved) : '';
                    $rows[] = [
                        (string) $caseId,
                        (string) ($i->incident_type ?? ''),
                        (string) ($i->classification ?? ''),
                        (string) ($i->status ?? ''),
                        $date ? $date->toDateString() : '',
                        (string) ($i->location ?? ''),
                        (string) $students,
                    ];
                }
            }
            return ['header' => $header, 'rows' => $rows];
        }

        return ['header' => [], 'rows' => []];
    }
}
