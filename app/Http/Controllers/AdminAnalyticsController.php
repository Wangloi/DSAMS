<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\FoundItem;
use App\Models\Incident;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminAnalyticsController extends Controller
{
    public function index()
    {
        $attendanceDaily = [];
        $attendanceMonthly = [];
        $attendanceWeekly = [];

        $violationDaily = [];
        $violationMonthly = [];
        $violationWeekly = [];
        $violationStats = ['minor' => 0, 'major' => 0];

        $evaluationCounts = [
            ['name' => '1★', 'value' => 0],
            ['name' => '2★', 'value' => 0],
            ['name' => '3★', 'value' => 0],
            ['name' => '4★', 'value' => 0],
            ['name' => '5★', 'value' => 0],
        ];
        $evaluationSummary = [
            'average' => null,
            'respondents' => 0,
            'sentiment' => [
                ['name' => 'Positive', 'value' => 0, 'color' => '#22c55e'],
                ['name' => 'Neutral', 'value' => 0, 'color' => '#f59e0b'],
                ['name' => 'Negative', 'value' => 0, 'color' => '#ef4444'],
            ],
        ];

        $inventory = [
            'total' => 0,
            'breakdown' => [
                ['name' => 'Claimed', 'value' => 0, 'color' => '#66bb6a'],
                ['name' => 'Unclaimed', 'value' => 0, 'color' => '#fbbf24'],
                ['name' => 'Pending Verification', 'value' => 0, 'color' => '#38bdf8'],
            ],
        ];

        if (Schema::hasTable('attendances')) {
            // Daily attendance data (last 7 days)
            $dayStart = Carbon::now()->startOfDay()->subDays(6);
            $dayEnd = Carbon::now()->endOfDay();
            $dailyRows = Attendance::query()
                ->selectRaw('DATE(scanned_at) as date, COUNT(*) as c')
                ->whereNotNull('scanned_at')
                ->whereBetween('scanned_at', [$dayStart, $dayEnd])
                ->groupBy('date')
                ->orderBy('date')
                ->get();
            $dailyByDate = $dailyRows->pluck('c', 'date');
            for ($i = 0; $i < 7; $i++) {
                $d = (clone $dayStart)->addDays($i);
                $date = $d->format('Y-m-d');
                $attendanceDaily[] = [
                    'name' => $d->format('D'),
                    'value' => (int) ($dailyByDate[$date] ?? 0),
                ];
            }

            // Monthly attendance data
            $monthStart = Carbon::now()->startOfMonth()->subMonths(5);
            $monthEnd = Carbon::now()->endOfMonth();
            $monthlyRows = Attendance::query()
                ->selectRaw('DATE_FORMAT(scanned_at, "%Y-%m") as ym, COUNT(*) as c')
                ->whereNotNull('scanned_at')
                ->whereBetween('scanned_at', [$monthStart, $monthEnd])
                ->groupBy('ym')
                ->orderBy('ym')
                ->get();
            $monthlyByYm = $monthlyRows->pluck('c', 'ym');
            for ($i = 0; $i < 6; $i++) {
                $m = (clone $monthStart)->addMonths($i);
                $ym = $m->format('Y-m');
                $attendanceMonthly[] = [
                    'name' => $m->format('M'),
                    'value' => (int) ($monthlyByYm[$ym] ?? 0),
                ];
            }

            // Weekly attendance data
            $weekStart = Carbon::now()->startOfWeek()->subWeeks(5);
            $weekEnd = Carbon::now()->endOfWeek();
            $weeklyRows = Attendance::query()
                ->selectRaw('YEARWEEK(scanned_at, 1) as yw, COUNT(*) as c')
                ->whereNotNull('scanned_at')
                ->whereBetween('scanned_at', [$weekStart, $weekEnd])
                ->groupBy('yw')
                ->orderBy('yw')
                ->get();
            $weeklyByYw = $weeklyRows->pluck('c', 'yw');
            for ($i = 0; $i < 6; $i++) {
                $w = (clone $weekStart)->addWeeks($i);
                $yw = (int) $w->format('oW');
                $attendanceWeekly[] = [
                    'name' => 'W' . (string) ($i + 1),
                    'value' => (int) ($weeklyByYw[$yw] ?? 0),
                ];
            }
        }

        if (Schema::hasTable('incidents')) {
            // Daily violation data (last 7 days)
            $dayStart = Carbon::now()->startOfDay()->subDays(6);
            $dayEnd = Carbon::now()->endOfDay();
            $dailyRows = Incident::query()
                ->selectRaw('DATE(incident_date) as date, classification, COUNT(*) as c')
                ->where('is_archived', false)
                ->whereNotNull('incident_date')
                ->whereBetween('incident_date', [$dayStart, $dayEnd])
                ->groupBy('date', 'classification')
                ->orderBy('date')
                ->get();
            $dailyByDateAndClass = $dailyRows->groupBy('date')->map->pluck('c', 'classification');
            for ($i = 0; $i < 7; $i++) {
                $d = (clone $dayStart)->addDays($i);
                $date = $d->format('Y-m-d');
                $dayData = $dailyByDateAndClass[$date] ?? collect();
                $violationDaily[] = [
                    'name' => $d->format('D'),
                    'minor' => (int) ($dayData['Minor'] ?? 0),
                    'major' => (int) ($dayData['Major'] ?? 0),
                ];
            }

            // Monthly violation data
            $base = Incident::query()->where('is_archived', false);
            $violationStats['minor'] = (clone $base)->where('classification', 'Minor')->count();
            $violationStats['major'] = (clone $base)->where('classification', 'Major')->count();

            $monthStart = Carbon::now()->startOfMonth()->subMonths(5);
            $monthEnd = Carbon::now()->endOfMonth();
            $rows = Incident::query()
                ->selectRaw('DATE_FORMAT(incident_date, "%Y-%m") as ym, classification, COUNT(*) as c')
                ->where('is_archived', false)
                ->whereNotNull('incident_date')
                ->whereBetween('incident_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->groupBy('ym', 'classification')
                ->orderBy('ym')
                ->get();
            $byYm = [];
            foreach ($rows as $r) {
                $ym = (string) ($r->ym ?? '');
                $cls = (string) ($r->classification ?? '');
                if ($ym === '' || $cls === '') continue;
                if (!isset($byYm[$ym])) $byYm[$ym] = ['Minor' => 0, 'Major' => 0];
                if ($cls === 'Minor' || $cls === 'Major') {
                    $byYm[$ym][$cls] = (int) ($r->c ?? 0);
                }
            }

            for ($i = 0; $i < 6; $i++) {
                $m = (clone $monthStart)->addMonths($i);
                $ym = $m->format('Y-m');
                $violationMonthly[] = [
                    'name' => $m->format('M'),
                    'minor' => (int) ($byYm[$ym]['Minor'] ?? 0),
                    'major' => (int) ($byYm[$ym]['Major'] ?? 0),
                ];
            }

            $weekStart = Carbon::now()->startOfWeek()->subWeeks(5);
            $weekEnd = Carbon::now()->endOfWeek();
            $weeklyRows = Incident::query()
                ->selectRaw('YEARWEEK(incident_date, 1) as yw, classification, COUNT(*) as c')
                ->where('is_archived', false)
                ->whereNotNull('incident_date')
                ->whereBetween('incident_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->groupBy('yw', 'classification')
                ->orderBy('yw')
                ->get();
            $byYw = [];
            foreach ($weeklyRows as $r) {
                $yw = (string) ($r->yw ?? '');
                $cls = (string) ($r->classification ?? '');
                if ($yw === '' || $cls === '') continue;
                if (!isset($byYw[$yw])) $byYw[$yw] = ['Minor' => 0, 'Major' => 0];
                if ($cls === 'Minor' || $cls === 'Major') {
                    $byYw[$yw][$cls] = (int) ($r->c ?? 0);
                }
            }

            for ($i = 0; $i < 6; $i++) {
                $w = (clone $weekStart)->addWeeks($i);
                $yw = (string) $w->format('oW');
                $violationWeekly[] = [
                    'name' => 'W' . (string) ($i + 1),
                    'minor' => (int) ($byYw[$yw]['Minor'] ?? 0),
                    'major' => (int) ($byYw[$yw]['Major'] ?? 0),
                ];
            }
        }

        if (Schema::hasTable('evaluations') && Schema::hasTable('evaluation_responses')) {
            // Get date range based on report range parameter or custom dates
            $reportRange = request()->get('reportRange', 'weekly');
            $customStartDate = request()->get('customStartDate');
            $customEndDate = request()->get('customEndDate');
            $startDate = null;
            $endDate = Carbon::now();

            if ($reportRange === 'custom' && $customStartDate && $customEndDate) {
                // Use custom date range
                $startDate = Carbon::parse($customStartDate)->startOfDay();
                $endDate = Carbon::parse($customEndDate)->endOfDay();
            } else {
                // Use preset date ranges
                switch ($reportRange) {
                    case 'daily':
                        $startDate = Carbon::now()->startOfDay()->subDays(6);
                        break;
                    case 'weekly':
                        $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
                        break;
                    case 'monthly':
                        $startDate = Carbon::now()->startOfMonth()->subMonths(5);
                        break;
                    case 'yearly':
                        $startDate = Carbon::now()->startOfYear()->subYears(4);
                        break;
                    case 'semester':
                        $startDate = Carbon::now()->startOfYear()->subYears(2);
                        break;
                    default:
                        $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
                }
            }

            $evaluations = Evaluation::query()->where('is_archived', false)->get(['id', 'form_data']);

            $ratingQuestionIds = [];
            $commentQuestionIds = [];
            foreach ($evaluations as $evaluation) {
                $qs = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
                $qs = is_array($qs) ? $qs : [];
                foreach ($qs as $q) {
                    if (!is_array($q)) continue;
                    $qid = $q['id'] ?? null;
                    $type = $q['type'] ?? null;
                    if (!$qid || !$type) continue;
                    if ($type === 'rating') {
                        $ratingQuestionIds[] = (string) $qid;
                    }
                    if ($type === 'short_text' || $type === 'long_text') {
                        $commentQuestionIds[] = (string) $qid;
                    }
                }
            }
            $ratingQuestionIds = array_values(array_unique($ratingQuestionIds));
            $commentQuestionIds = array_values(array_unique($commentQuestionIds));

            $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
            $responseRatings = [];
            $sentimentCounts = ['positive' => 0, 'neutral' => 0, 'negative' => 0];

            $responses = EvaluationResponse::query()
                ->where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $endDate)
                ->get(['student_id', 'answers', 'created_at']);
            $evaluationSummary['respondents'] = (int) $responses->pluck('student_id')->filter()->unique()->count();

            foreach ($responses as $response) {
                $answers = is_array($response->answers) ? $response->answers : [];
                $ratings = [];

                foreach ($ratingQuestionIds as $qid) {
                    $v = $answers[$qid] ?? null;
                    if ($v === null || $v === '') continue;
                    $n = (int) $v;
                    if ($n >= 1 && $n <= 5) {
                        $ratings[] = $n;
                        $ratingCounts[$n] += 1;
                    }
                }

                $responseRating = null;
                if (count($ratings) > 0) {
                    $responseRating = array_sum($ratings) / count($ratings);
                    $responseRatings[] = $responseRating;
                }

                $hasComment = false;
                foreach ($commentQuestionIds as $qid) {
                    $v = $answers[$qid] ?? null;
                    if (is_string($v) && trim($v) !== '') {
                        $hasComment = true;
                        break;
                    }
                }

                if ($hasComment) {
                    $sentiment = 'neutral';
                    if ($responseRating !== null) {
                        if ($responseRating >= 4) $sentiment = 'positive';
                        elseif ($responseRating <= 2) $sentiment = 'negative';
                    }
                    $sentimentCounts[$sentiment] += 1;
                }
            }

            $evaluationCounts = [
                ['name' => '1★', 'value' => $ratingCounts[1]],
                ['name' => '2★', 'value' => $ratingCounts[2]],
                ['name' => '3★', 'value' => $ratingCounts[3]],
                ['name' => '4★', 'value' => $ratingCounts[4]],
                ['name' => '5★', 'value' => $ratingCounts[5]],
            ];

            if (count($responseRatings) > 0) {
                $evaluationSummary['average'] = round(array_sum($responseRatings) / count($responseRatings), 2);
            }

            $totalSentiments = $sentimentCounts['positive'] + $sentimentCounts['neutral'] + $sentimentCounts['negative'];
            if ($totalSentiments > 0) {
                $evaluationSummary['sentiment'] = [
                    ['name' => 'Positive', 'value' => (int) round(($sentimentCounts['positive'] / $totalSentiments) * 100), 'color' => '#22c55e'],
                    ['name' => 'Neutral', 'value' => (int) round(($sentimentCounts['neutral'] / $totalSentiments) * 100), 'color' => '#f59e0b'],
                    ['name' => 'Negative', 'value' => (int) round(($sentimentCounts['negative'] / $totalSentiments) * 100), 'color' => '#ef4444'],
                ];
            }
        }

        if (Schema::hasTable('found_items')) {
            // Get date range based on report range parameter or custom dates
            $reportRange = request()->get('reportRange', 'weekly');
            $customStartDate = request()->get('customStartDate');
            $customEndDate = request()->get('customEndDate');
            $startDate = null;
            $endDate = Carbon::now();

            if ($reportRange === 'custom' && $customStartDate && $customEndDate) {
                // Use custom date range
                $startDate = Carbon::parse($customStartDate)->startOfDay();
                $endDate = Carbon::parse($customEndDate)->endOfDay();
            } else {
                // Use preset date ranges
                switch ($reportRange) {
                    case 'daily':
                        $startDate = Carbon::now()->startOfDay()->subDays(6);
                        break;
                    case 'weekly':
                        $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
                        break;
                    case 'monthly':
                        $startDate = Carbon::now()->startOfMonth()->subMonths(5);
                        break;
                    case 'yearly':
                        $startDate = Carbon::now()->startOfYear()->subYears(4);
                        break;
                    case 'semester':
                        $startDate = Carbon::now()->startOfYear()->subYears(2);
                        break;
                    default:
                        $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
                }
            }

            $foundBase = FoundItem::query()
                ->where('is_archived', false)
                ->where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $endDate);
            $claimed = (clone $foundBase)->where('status', 'Claimed')->count();
            $pending = (clone $foundBase)->where('status', 'Verification Pending')->count();
            $unclaimed = (clone $foundBase)->whereIn('status', ['In Storage', 'Unclaimed'])->count();
            $total = $claimed + $pending + $unclaimed;
            $inventory = [
                'total' => $total,
                'breakdown' => [
                    ['name' => 'Claimed', 'value' => $claimed, 'color' => '#66bb6a'],
                    ['name' => 'Unclaimed', 'value' => $unclaimed, 'color' => '#fbbf24'],
                    ['name' => 'Pending Verification', 'value' => $pending, 'color' => '#38bdf8'],
                ],
            ];
        }

        return Inertia::render('admin-dashboard/analytics/index', [
            'attendanceDaily' => $attendanceDaily,
            'attendanceMonthly' => $attendanceMonthly,
            'attendanceWeekly' => $attendanceWeekly,
            'violationDaily' => $violationDaily,
            'violationMonthly' => $violationMonthly,
            'violationWeekly' => $violationWeekly,
            'violationStats' => $violationStats,
            'evaluationCounts' => $evaluationCounts,
            'evaluationSummary' => $evaluationSummary,
            'inventory' => $inventory,
        ]);
    }

    public function data()
    {
        $attendanceDaily = [];
        $attendanceMonthly = [];
        $attendanceWeekly = [];

        $violationDaily = [];
        $violationMonthly = [];
        $violationWeekly = [];
        $violationStats = ['minor' => 0, 'major' => 0];

        $evaluationCounts = [
            ['name' => '1★', 'value' => 0],
            ['name' => '2★', 'value' => 0],
            ['name' => '3★', 'value' => 0],
            ['name' => '4★', 'value' => 0],
            ['name' => '5★', 'value' => 0],
        ];
        $evaluationSummary = [
            'average' => null,
            'respondents' => 0,
            'sentiment' => [
                ['name' => 'Positive', 'value' => 0, 'color' => '#22c55e'],
                ['name' => 'Neutral', 'value' => 0, 'color' => '#f59e0b'],
                ['name' => 'Negative', 'value' => 0, 'color' => '#ef4444'],
            ],
        ];

        $inventory = [
            'total' => 0,
            'breakdown' => [
                ['name' => 'Claimed', 'value' => 0, 'color' => '#66bb6a'],
                ['name' => 'Unclaimed', 'value' => 0, 'color' => '#fbbf24'],
                ['name' => 'Pending Verification', 'value' => 0, 'color' => '#38bdf8'],
            ],
        ];

        // Get date range based on report range parameter or custom dates
        $reportRange = request()->get('reportRange', 'weekly');
        $customStartDate = request()->get('customStartDate');
        $customEndDate = request()->get('customEndDate');
        $startDate = null;
        $endDate = Carbon::now();

        if ($reportRange === 'custom' && $customStartDate && $customEndDate) {
            // Use custom date range
            $startDate = Carbon::parse($customStartDate)->startOfDay();
            $endDate = Carbon::parse($customEndDate)->endOfDay();
        } else {
            // Use preset date ranges
            switch ($reportRange) {
                case 'daily':
                    $startDate = Carbon::now()->startOfDay()->subDays(6);
                    break;
                case 'weekly':
                    $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
                    break;
                case 'monthly':
                    $startDate = Carbon::now()->startOfMonth()->subMonths(5);
                    break;
                case 'yearly':
                    $startDate = Carbon::now()->startOfYear()->subYears(4);
                    break;
                case 'semester':
                    $startDate = Carbon::now()->startOfYear()->subYears(2);
                    break;
                default:
                    $startDate = Carbon::now()->startOfWeek()->subWeeks(5);
            }
        }

        if (Schema::hasTable('attendances')) {
            // Daily attendance data (last 7 days)
            if ($reportRange === 'daily') {
                $dayStart = Carbon::now()->startOfDay()->subDays(6);
                $dayEnd = Carbon::now()->endOfDay();
                $dailyRows = Attendance::query()
                    ->selectRaw('DATE(scanned_at) as date, COUNT(*) as c')
                    ->whereNotNull('scanned_at')
                    ->whereBetween('scanned_at', [$dayStart, $dayEnd])
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
                $dailyByDate = $dailyRows->pluck('c', 'date');
                for ($i = 0; $i < 7; $i++) {
                    $d = (clone $dayStart)->addDays($i);
                    $date = $d->format('Y-m-d');
                    $attendanceDaily[] = [
                        'name' => $d->format('D'),
                        'value' => (int) ($dailyByDate[$date] ?? 0),
                    ];
                }
            }

            // Monthly attendance data
            if ($reportRange === 'monthly') {
                $monthStart = Carbon::now()->startOfMonth()->subMonths(5);
                $monthEnd = Carbon::now()->endOfMonth();
                $monthlyRows = Attendance::query()
                    ->selectRaw('DATE_FORMAT(scanned_at, "%Y-%m") as ym, COUNT(*) as c')
                    ->whereNotNull('scanned_at')
                    ->whereBetween('scanned_at', [$monthStart, $monthEnd])
                    ->groupBy('ym')
                    ->orderBy('ym')
                    ->get();
                $monthlyByYm = $monthlyRows->pluck('c', 'ym');
                for ($i = 0; $i < 6; $i++) {
                    $m = (clone $monthStart)->addMonths($i);
                    $ym = $m->format('Y-m');
                    $attendanceMonthly[] = [
                        'name' => $m->format('M'),
                        'value' => (int) ($monthlyByYm[$ym] ?? 0),
                    ];
                }
            }

            // Weekly attendance data
            if ($reportRange === 'weekly') {
                $weekStart = Carbon::now()->startOfWeek()->subWeeks(5);
                $weekEnd = Carbon::now()->endOfWeek();
                $weeklyRows = Attendance::query()
                    ->selectRaw('YEARWEEK(scanned_at, 1) as yw, COUNT(*) as c')
                    ->whereNotNull('scanned_at')
                    ->whereBetween('scanned_at', [$weekStart, $weekEnd])
                    ->groupBy('yw')
                    ->orderBy('yw')
                    ->get();
                $weeklyByYw = $weeklyRows->pluck('c', 'yw');
                for ($i = 0; $i < 6; $i++) {
                    $w = (clone $weekStart)->addWeeks($i);
                    $yw = (int) $w->format('oW');
                    $attendanceWeekly[] = [
                        'name' => 'W' . (string) ($i + 1),
                        'value' => (int) ($weeklyByYw[$yw] ?? 0),
                    ];
                }
            }
        }

        if (Schema::hasTable('incidents')) {
            // Daily violation data (last 7 days)
            if ($reportRange === 'daily') {
                $dayStart = Carbon::now()->startOfDay()->subDays(6);
                $dayEnd = Carbon::now()->endOfDay();
                $dailyRows = Incident::query()
                    ->selectRaw('DATE(incident_date) as date, classification, COUNT(*) as c')
                    ->where('is_archived', false)
                    ->whereNotNull('incident_date')
                    ->whereBetween('incident_date', [$dayStart, $dayEnd])
                    ->groupBy('date', 'classification')
                    ->orderBy('date')
                    ->get();
                $dailyByDateAndClass = $dailyRows->groupBy('date')->map->pluck('c', 'classification');
                for ($i = 0; $i < 7; $i++) {
                    $d = (clone $dayStart)->addDays($i);
                    $date = $d->format('Y-m-d');
                    $dayData = $dailyByDateAndClass[$date] ?? collect();
                    $violationDaily[] = [
                        'name' => $d->format('D'),
                        'minor' => (int) ($dayData['Minor'] ?? 0),
                        'major' => (int) ($dayData['Major'] ?? 0),
                    ];
                }
            }

            // Monthly violation data
            $base = Incident::query()->where('is_archived', false);
            $violationStats['minor'] = (clone $base)->where('classification', 'Minor')->count();
            $violationStats['major'] = (clone $base)->where('classification', 'Major')->count();

            if ($reportRange === 'monthly') {
                $monthStart = Carbon::now()->startOfMonth()->subMonths(5);
                $monthEnd = Carbon::now()->endOfMonth();
                $rows = Incident::query()
                    ->selectRaw('DATE_FORMAT(incident_date, "%Y-%m") as ym, classification, COUNT(*) as c')
                    ->where('is_archived', false)
                    ->whereNotNull('incident_date')
                    ->whereBetween('incident_date', [$monthStart, $monthEnd])
                    ->groupBy('ym', 'classification')
                    ->orderBy('ym')
                    ->get();
                $byYmAndClass = $rows->groupBy('ym')->map->pluck('c', 'classification');
                for ($i = 0; $i < 6; $i++) {
                    $m = (clone $monthStart)->addMonths($i);
                    $ym = $m->format('Y-m');
                    $monthData = $byYmAndClass[$ym] ?? collect();
                    $violationMonthly[] = [
                        'name' => $m->format('M'),
                        'minor' => (int) ($monthData['Minor'] ?? 0),
                        'major' => (int) ($monthData['Major'] ?? 0),
                    ];
                }
            }

            // Weekly violation data
            if ($reportRange === 'weekly') {
                $weekStart = Carbon::now()->startOfWeek()->subWeeks(5);
                $weekEnd = Carbon::now()->endOfWeek();
                $weeklyRows = Incident::query()
                    ->selectRaw('YEARWEEK(incident_date, 1) as yw, classification, COUNT(*) as c')
                    ->where('is_archived', false)
                    ->whereNotNull('incident_date')
                    ->whereBetween('incident_date', [$weekStart, $weekEnd])
                    ->groupBy('yw', 'classification')
                    ->orderBy('yw')
                    ->get();
                $weeklyByYwAndClass = $weeklyRows->groupBy('yw')->map->pluck('c', 'classification');
                for ($i = 0; $i < 6; $i++) {
                    $w = (clone $weekStart)->addWeeks($i);
                    $yw = (int) $w->format('oW');
                    $weekData = $weeklyByYwAndClass[$yw] ?? collect();
                    $violationWeekly[] = [
                        'name' => 'W' . (string) ($i + 1),
                        'minor' => (int) ($weekData['Minor'] ?? 0),
                        'major' => (int) ($weekData['Major'] ?? 0),
                    ];
                }
            }
        }

        if (Schema::hasTable('evaluations') && Schema::hasTable('evaluation_responses')) {
            $evaluations = Evaluation::query()->where('is_archived', false)->get(['id', 'form_data']);

            $ratingQuestionIds = [];
            $commentQuestionIds = [];
            foreach ($evaluations as $evaluation) {
                $qs = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
                $qs = is_array($qs) ? $qs : [];
                foreach ($qs as $q) {
                    if (!is_array($q)) continue;
                    $qid = $q['id'] ?? null;
                    $type = $q['type'] ?? null;
                    if (!$qid || !$type) continue;
                    if ($type === 'rating') {
                        $ratingQuestionIds[] = (string) $qid;
                    }
                    if ($type === 'short_text' || $type === 'long_text') {
                        $commentQuestionIds[] = (string) $qid;
                    }
                }
            }
            $ratingQuestionIds = array_values(array_unique($ratingQuestionIds));
            $commentQuestionIds = array_values(array_unique($commentQuestionIds));

            $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
            $responseRatings = [];
            $sentimentCounts = ['positive' => 0, 'neutral' => 0, 'negative' => 0];

            $responses = EvaluationResponse::query()
                ->where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $endDate)
                ->get(['student_id', 'answers', 'created_at']);
            $evaluationSummary['respondents'] = (int) $responses->pluck('student_id')->filter()->unique()->count();

            foreach ($responses as $response) {
                $answers = is_array($response->answers) ? $response->answers : [];
                $ratings = [];

                foreach ($ratingQuestionIds as $qid) {
                    $v = $answers[$qid] ?? null;
                    if ($v === null || $v === '') continue;
                    $n = (int) $v;
                    if ($n >= 1 && $n <= 5) {
                        $ratings[] = $n;
                        $ratingCounts[$n] += 1;
                    }
                }

                $responseRating = null;
                if (count($ratings) > 0) {
                    $responseRating = array_sum($ratings) / count($ratings);
                    $responseRatings[] = $responseRating;
                }

                $hasComment = false;
                foreach ($commentQuestionIds as $qid) {
                    $v = $answers[$qid] ?? null;
                    if (is_string($v) && trim($v) !== '') {
                        $hasComment = true;
                        break;
                    }
                }

                if ($hasComment) {
                    $sentiment = 'neutral';
                    if ($responseRating !== null) {
                        if ($responseRating >= 4) $sentiment = 'positive';
                        elseif ($responseRating <= 2) $sentiment = 'negative';
                    }
                    $sentimentCounts[$sentiment] += 1;
                }
            }

            $evaluationCounts = [
                ['name' => '1★', 'value' => $ratingCounts[1]],
                ['name' => '2★', 'value' => $ratingCounts[2]],
                ['name' => '3★', 'value' => $ratingCounts[3]],
                ['name' => '4★', 'value' => $ratingCounts[4]],
                ['name' => '5★', 'value' => $ratingCounts[5]],
            ];

            if (count($responseRatings) > 0) {
                $evaluationSummary['average'] = round(array_sum($responseRatings) / count($responseRatings), 2);
            }

            $totalSentiments = $sentimentCounts['positive'] + $sentimentCounts['neutral'] + $sentimentCounts['negative'];
            if ($totalSentiments > 0) {
                $evaluationSummary['sentiment'] = [
                    ['name' => 'Positive', 'value' => (int) round(($sentimentCounts['positive'] / $totalSentiments) * 100), 'color' => '#22c55e'],
                    ['name' => 'Neutral', 'value' => (int) round(($sentimentCounts['neutral'] / $totalSentiments) * 100), 'color' => '#f59e0b'],
                    ['name' => 'Negative', 'value' => (int) round(($sentimentCounts['negative'] / $totalSentiments) * 100), 'color' => '#ef4444'],
                ];
            }
        }

        if (Schema::hasTable('found_items')) {
            $foundBase = FoundItem::query()
                ->where('is_archived', false)
                ->where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $endDate);
            $claimed = (clone $foundBase)->where('status', 'Claimed')->count();
            $pending = (clone $foundBase)->where('status', 'Verification Pending')->count();
            $unclaimed = (clone $foundBase)->whereIn('status', ['In Storage', 'Unclaimed'])->count();
            $total = $claimed + $pending + $unclaimed;
            $inventory = [
                'total' => $total,
                'breakdown' => [
                    ['name' => 'Claimed', 'value' => $claimed, 'color' => '#66bb6a'],
                    ['name' => 'Unclaimed', 'value' => $unclaimed, 'color' => '#fbbf24'],
                    ['name' => 'Pending Verification', 'value' => $pending, 'color' => '#38bdf8'],
                ],
            ];
        }

        return response()->json([
            'attendanceDaily' => $attendanceDaily,
            'attendanceMonthly' => $attendanceMonthly,
            'attendanceWeekly' => $attendanceWeekly,
            'violationDaily' => $violationDaily,
            'violationMonthly' => $violationMonthly,
            'violationWeekly' => $violationWeekly,
            'violationStats' => $violationStats,
            'evaluationCounts' => $evaluationCounts,
            'evaluationSummary' => $evaluationSummary,
            'inventory' => $inventory,
        ]);
    }
}
