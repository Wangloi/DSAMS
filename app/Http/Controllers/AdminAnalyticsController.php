<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\FoundItem;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $dates = $this->getDateRange($request);
        
        $attendance = $this->getAttendanceData();
        $violations = $this->getViolationData();
        $evaluations = $this->getEvaluationData($dates['startDate'], $dates['endDate']);
        $inventory = $this->getInventoryData($dates['startDate'], $dates['endDate']);

        return Inertia::render('admin-dashboard/analytics/index', [
            'attendanceDaily' => $attendance['daily'],
            'attendanceMonthly' => $attendance['monthly'],
            'attendanceWeekly' => $attendance['weekly'],
            'violationDaily' => $violations['daily'],
            'violationMonthly' => $violations['monthly'],
            'violationWeekly' => $violations['weekly'],
            'violationStats' => $violations['stats'],
            'evaluationCounts' => $evaluations['counts'],
            'evaluationSummary' => $evaluations['summary'],
            'inventory' => $inventory,
        ]);
    }

    public function data(Request $request)
    {
        $reportRange = $request->input('reportRange', 'weekly');
        $dates = $this->getDateRange($request);

        $attendance = $this->getAttendanceData($reportRange);
        $violations = $this->getViolationData($reportRange);
        $evaluations = $this->getEvaluationData($dates['startDate'], $dates['endDate']);
        $inventory = $this->getInventoryData($dates['startDate'], $dates['endDate']);

        return response()->json([
            'attendanceDaily' => $attendance['daily'],
            'attendanceMonthly' => $attendance['monthly'],
            'attendanceWeekly' => $attendance['weekly'],
            'violationDaily' => $violations['daily'],
            'violationMonthly' => $violations['monthly'],
            'violationWeekly' => $violations['weekly'],
            'violationStats' => $violations['stats'],
            'evaluationCounts' => $evaluations['counts'],
            'evaluationSummary' => $evaluations['summary'],
            'inventory' => $inventory,
        ]);
    }

    private function getDateRange(Request $request): array
    {
        $reportRange = $request->input('reportRange', 'weekly');
        $customStartDate = $request->input('customStartDate');
        $customEndDate = $request->input('customEndDate');
        $startDate = null;
        $endDate = Carbon::now();

        if ($reportRange === 'custom' && $customStartDate && $customEndDate) {
            $startDate = Carbon::parse($customStartDate)->startOfDay();
            $endDate = Carbon::parse($customEndDate)->endOfDay();
        } else {
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

        return ['startDate' => $startDate, 'endDate' => $endDate];
    }

    private function getAttendanceData(?string $reportRange = null): array
    {
        $daily = [];
        $monthly = [];
        $weekly = [];

        if (!Schema::hasTable('attendances')) {
            return compact('daily', 'monthly', 'weekly');
        }

        // Daily
        if ($reportRange === null || $reportRange === 'daily') {
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
                $daily[] = [
                    'name' => $d->format('D'),
                    'value' => (int) ($dailyByDate[$date] ?? 0),
                ];
            }
        }

        // Monthly
        if ($reportRange === null || $reportRange === 'monthly') {
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
                $monthly[] = [
                    'name' => $m->format('M'),
                    'value' => (int) ($monthlyByYm[$ym] ?? 0),
                ];
            }
        }

        // Weekly
        if ($reportRange === null || $reportRange === 'weekly') {
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
                $weekly[] = [
                    'name' => 'W' . (string) ($i + 1),
                    'value' => (int) ($weeklyByYw[$yw] ?? 0),
                ];
            }
        }

        return compact('daily', 'monthly', 'weekly');
    }

    private function getViolationData(?string $reportRange = null): array
    {
        $daily = [];
        $monthly = [];
        $weekly = [];
        $stats = ['minor' => 0, 'major' => 0, 'warning' => 0, 'suspension' => 0, 'exclusion' => 0, 'expulsion' => 0];

        if (!Schema::hasTable('incidents')) {
            return compact('daily', 'monthly', 'weekly', 'stats');
        }

        $base = Incident::query()->where('is_archived', false);
        $stats['warning'] = (clone $base)->where('classification', 'Warning')->count();
        $stats['suspension'] = (clone $base)->where('classification', 'Suspension')->count();
        $stats['exclusion'] = (clone $base)->where('classification', 'Exclusion')->count();
        $stats['expulsion'] = (clone $base)->where('classification', 'Expulsion')->count();

        // Daily
        if ($reportRange === null || $reportRange === 'daily') {
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
                $daily[] = [
                    'name' => $d->format('D'),
                    'warning' => (int) ($dayData['Warning'] ?? 0),
                    'suspension' => (int) ($dayData['Suspension'] ?? 0),
                    'exclusion' => (int) ($dayData['Exclusion'] ?? 0),
                    'expulsion' => (int) ($dayData['Expulsion'] ?? 0),
                ];
            }
        }

        // Monthly
        if ($reportRange === null || $reportRange === 'monthly') {
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
            
            $byYmAndClass = [];
            foreach ($rows as $r) {
                $ym = (string) ($r->ym ?? '');
                $cls = (string) ($r->classification ?? '');
                if ($ym === '' || $cls === '') continue;
                if (!isset($byYmAndClass[$ym])) $byYmAndClass[$ym] = [];
                $byYmAndClass[$ym][$cls] = (int) ($r->c ?? 0);
            }
            
            for ($i = 0; $i < 6; $i++) {
                $m = (clone $monthStart)->addMonths($i);
                $ym = $m->format('Y-m');
                $monthData = $byYmAndClass[$ym] ?? [];
                $monthly[] = [
                    'name' => $m->format('M'),
                    'warning' => (int) ($monthData['Warning'] ?? 0),
                    'suspension' => (int) ($monthData['Suspension'] ?? 0),
                    'exclusion' => (int) ($monthData['Exclusion'] ?? 0),
                    'expulsion' => (int) ($monthData['Expulsion'] ?? 0),
                ];
            }
        }

        // Weekly
        if ($reportRange === null || $reportRange === 'weekly') {
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

            $byYwAndClass = [];
            foreach ($weeklyRows as $r) {
                $yw = (string) ($r->yw ?? '');
                $cls = (string) ($r->classification ?? '');
                if ($yw === '' || $cls === '') continue;
                if (!isset($byYwAndClass[$yw])) $byYwAndClass[$yw] = [];
                $byYwAndClass[$yw][$cls] = (int) ($r->c ?? 0);
            }

            for ($i = 0; $i < 6; $i++) {
                $w = (clone $weekStart)->addWeeks($i);
                $yw = (string) $w->format('oW');
                $weekData = $byYwAndClass[$yw] ?? [];
                $weekly[] = [
                    'name' => 'W' . (string) ($i + 1),
                    'warning' => (int) ($weekData['Warning'] ?? 0),
                    'suspension' => (int) ($weekData['Suspension'] ?? 0),
                    'exclusion' => (int) ($weekData['Exclusion'] ?? 0),
                    'expulsion' => (int) ($weekData['Expulsion'] ?? 0),
                ];
            }
        }

        return compact('daily', 'monthly', 'weekly', 'stats');
    }

    private function getEvaluationData(?Carbon $startDate, ?Carbon $endDate): array
    {
        $counts = [
            ['name' => '1★', 'value' => 0],
            ['name' => '2★', 'value' => 0],
            ['name' => '3★', 'value' => 0],
            ['name' => '4★', 'value' => 0],
            ['name' => '5★', 'value' => 0],
        ];
        $summary = [
            'average' => null,
            'respondents' => 0,
            'sentiment' => [
                ['name' => 'Positive', 'value' => 0, 'color' => '#22c55e'],
                ['name' => 'Neutral', 'value' => 0, 'color' => '#f59e0b'],
                ['name' => 'Negative', 'value' => 0, 'color' => '#ef4444'],
            ],
        ];

        if (!Schema::hasTable('evaluations') || !Schema::hasTable('evaluation_responses')) {
            return compact('counts', 'summary');
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

        $responsesQuery = EvaluationResponse::query();
        if ($startDate) {
            $responsesQuery->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $responsesQuery->where('created_at', '<=', $endDate);
        }
        $responses = $responsesQuery->get(['student_id', 'answers', 'created_at']);
        
        $summary['respondents'] = (int) $responses->pluck('student_id')->filter()->unique()->count();

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

        $counts = [
            ['name' => '1★', 'value' => $ratingCounts[1]],
            ['name' => '2★', 'value' => $ratingCounts[2]],
            ['name' => '3★', 'value' => $ratingCounts[3]],
            ['name' => '4★', 'value' => $ratingCounts[4]],
            ['name' => '5★', 'value' => $ratingCounts[5]],
        ];

        if (count($responseRatings) > 0) {
            $summary['average'] = round(array_sum($responseRatings) / count($responseRatings), 2);
        }

        $totalSentiments = $sentimentCounts['positive'] + $sentimentCounts['neutral'] + $sentimentCounts['negative'];
        if ($totalSentiments > 0) {
            $summary['sentiment'] = [
                ['name' => 'Positive', 'value' => (int) round(($sentimentCounts['positive'] / $totalSentiments) * 100), 'color' => '#22c55e'],
                ['name' => 'Neutral', 'value' => (int) round(($sentimentCounts['neutral'] / $totalSentiments) * 100), 'color' => '#f59e0b'],
                ['name' => 'Negative', 'value' => (int) round(($sentimentCounts['negative'] / $totalSentiments) * 100), 'color' => '#ef4444'],
            ];
        }

        return compact('counts', 'summary');
    }

    private function getInventoryData(?Carbon $startDate, ?Carbon $endDate): array
    {
        $inventory = [
            'total' => 0,
            'breakdown' => [
                ['name' => 'Claimed', 'value' => 0, 'color' => '#66bb6a'],
                ['name' => 'Unclaimed', 'value' => 0, 'color' => '#fbbf24'],
                ['name' => 'Pending Verification', 'value' => 0, 'color' => '#38bdf8'],
            ],
        ];

        if (!Schema::hasTable('found_items')) {
            return $inventory;
        }

        $foundBase = FoundItem::query()->where('is_archived', false);
        if ($startDate) {
            $foundBase->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $foundBase->where('created_at', '<=', $endDate);
        }

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

        return $inventory;
    }
}
