<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\EvaluationResponse;
use App\Models\Event;
use App\Models\FoundItem;
use App\Models\Incident;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        return Inertia::render('AdminDashboard', [
            'user' => auth()->user(),
            'recentActivities' => $this->getRecentActivities(),
            'kpis' => $this->getKpis(),
            'attendanceTrend' => $this->getAttendanceTrend(),
            'violationBreakdown' => $this->getViolationBreakdown(),
            'evaluationRatings' => $this->getEvaluationRatings(),
            'lostFoundStatus' => $this->getLostFoundStatus(),
            'incomingEvents' => $this->getIncomingEvents(),
        ]);
    }

    private function getRecentActivities(): array
    {
        if (!Schema::hasTable('activity_logs')) {
            return [];
        }

        return ActivityLog::query()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function (ActivityLog $log) {
                $userName = (string) ($log->user_name ?? 'Unknown');
                $action = (string) ($log->action ?? '');
                $details = (string) ($log->details ?? '');
                $title = trim($userName . ($action !== '' ? " - {$action}" : ''));
                if ($title === '') {
                    $title = 'Activity';
                }

                return [
                    'id' => (string) $log->id,
                    'module' => (string) ($log->module ?? ''),
                    'title' => $title,
                    'details' => $details,
                    'time' => $log->created_at?->diffForHumans() ?? '',
                    'userType' => (string) ($log->user_type ?? ''),
                ];
            })
            ->values()
            ->all();
    }

    private function getKpis(): array
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $totalEvents = Event::query()->whereNull('archived_at')->count();

        $todayAttendance = 0;
        if (Schema::hasTable('attendances')) {
            $todayAttendance = Attendance::query()
                ->whereNotNull('scanned_at')
                ->whereDate('scanned_at', Carbon::today())
                ->count();
        }

        $activeCases = 0;
        if (Schema::hasTable('incidents')) {
            $activeCases = Incident::query()
                ->where('is_archived', false)
                ->where('status', '!=', 'Resolved')
                ->count();
        }

        $admissionSlips = 0;
        if (Schema::hasTable('admission_slips')) {
            $admissionSlips = \App\Models\AdmissionSlip::where('is_archived', false)->count();
        }

        $evaluationsCount = 0;
        if (Schema::hasTable('evaluations')) {
            $evaluationsCount = Evaluation::where('is_archived', false)->count();
        }

        return [
            ['title' => 'Total Events', 'value' => $totalEvents],
            ['title' => "Today's Attendance", 'value' => $todayAttendance],
            ['title' => 'Active Cases', 'value' => $activeCases],
            ['title' => 'Admission Slips', 'value' => $admissionSlips],
            ['title' => 'Evaluation Surveys', 'value' => $evaluationsCount],
        ];
    }

    private function getAttendanceTrend(): array
    {
        if (!Schema::hasTable('attendances')) {
            return [];
        }

        $attendanceTrend = [];
        $start = Carbon::now()->startOfMonth()->subMonths(5);
        $end = Carbon::now()->endOfMonth();

        $rows = Attendance::query()
            ->selectRaw('DATE_FORMAT(scanned_at, "%Y-%m") as ym, COUNT(*) as c')
            ->whereNotNull('scanned_at')
            ->whereBetween('scanned_at', [$start, $end])
            ->groupBy('ym')
            ->orderBy('ym')
            ->get();

        $byYm = $rows->pluck('c', 'ym');
        for ($i = 0; $i < 6; $i++) {
            $m = (clone $start)->addMonths($i);
            $ym = $m->format('Y-m');
            $attendanceTrend[] = [
                'name' => $m->format('M'),
                'value' => (int) ($byYm[$ym] ?? 0),
            ];
        }

        return $attendanceTrend;
    }

    private function getViolationBreakdown(): array
    {
        if (!Schema::hasTable('incidents')) {
            return [];
        }

        $incidentBase = Incident::query()->where('is_archived', false);
        $warningCases = (clone $incidentBase)->where('classification', 'Warning')->count();
        $suspensionCases = (clone $incidentBase)->where('classification', 'Suspension')->count();
        $exclusionCases = (clone $incidentBase)->where('classification', 'Exclusion')->count();
        $expulsionCases = (clone $incidentBase)->where('classification', 'Expulsion')->count();

        return [
            ['name' => 'Warning', 'value' => $warningCases, 'color' => '#f59e0b'],
            ['name' => 'Suspension', 'value' => $suspensionCases, 'color' => '#3b82f6'],
            ['name' => 'Exclusion', 'value' => $exclusionCases, 'color' => '#8b5cf6'],
            ['name' => 'Expulsion', 'value' => $expulsionCases, 'color' => '#ef4444'],
        ];
    }

    private function getEvaluationRatings(): array
    {
        $evaluationRatings = [
            ['name' => '1★', 'value' => 0],
            ['name' => '2★', 'value' => 0],
            ['name' => '3★', 'value' => 0],
            ['name' => '4★', 'value' => 0],
            ['name' => '5★', 'value' => 0],
        ];

        if (Schema::hasTable('evaluations') && Schema::hasTable('evaluation_responses')) {
            $evaluations = Evaluation::query()->where('is_archived', false)->get(['id', 'form_data']);
            $ratingQuestionIds = [];
            foreach ($evaluations as $evaluation) {
                $qs = is_array($evaluation->form_data) ? ($evaluation->form_data['questions'] ?? []) : [];
                $qs = is_array($qs) ? $qs : [];
                foreach ($qs as $q) {
                    if (!is_array($q)) {
                        continue;
                    }
                    $qid = $q['id'] ?? null;
                    $type = $q['type'] ?? null;
                    if ($qid && $type === 'rating') {
                        $ratingQuestionIds[] = (string) $qid;
                    }
                }
            }
            $ratingQuestionIds = array_values(array_unique($ratingQuestionIds));

            if (count($ratingQuestionIds) > 0) {
                $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
                $responses = EvaluationResponse::query()->get(['answers']);
                foreach ($responses as $response) {
                    $answers = is_array($response->answers) ? $response->answers : [];
                    foreach ($ratingQuestionIds as $qid) {
                        $v = $answers[$qid] ?? null;
                        if ($v === null || $v === '') {
                            continue;
                        }
                        $n = (int) $v;
                        if ($n >= 1 && $n <= 5) {
                            $ratingCounts[$n] += 1;
                        }
                    }
                }

                $evaluationRatings = [
                    ['name' => '1★', 'value' => $ratingCounts[1]],
                    ['name' => '2★', 'value' => $ratingCounts[2]],
                    ['name' => '3★', 'value' => $ratingCounts[3]],
                    ['name' => '4★', 'value' => $ratingCounts[4]],
                    ['name' => '5★', 'value' => $ratingCounts[5]],
                ];
            }
        }

        return $evaluationRatings;
    }

    private function getLostFoundStatus(): array
    {
        if (!Schema::hasTable('found_items')) {
            return [];
        }

        $foundBase = FoundItem::query()->where('is_archived', false);
        $claimedItems = (clone $foundBase)->where('status', 'Claimed')->count();
        $pendingItems = (clone $foundBase)->where('status', 'Verification Pending')->count();
        $unclaimedItems = (clone $foundBase)->whereIn('status', ['In Storage', 'Unclaimed'])->count();

        return [
            ['name' => 'Claimed', 'value' => $claimedItems, 'color' => '#22c55e'],
            ['name' => 'Unclaimed', 'value' => $unclaimedItems, 'color' => '#ef4444'],
            ['name' => 'Pending', 'value' => $pendingItems, 'color' => '#2563eb'],
        ];
    }

    private function getIncomingEvents()
    {
        if (!Schema::hasTable('events')) {
            return [];
        }

        $today = Carbon::today();

        return Event::query()
            ->whereNull('archived_at')
            ->whereDate('event_date', '>=', $today)
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time', 'asc')
            ->limit(6)
            ->get()
            ->map(function ($event) use ($today) {
                $totalAttendees = 0;
                $presentCount = 0;
                
                if (Schema::hasTable('attendances')) {
                    $presentCount = Attendance::where('event_id', $event->id)
                        ->whereNotNull('scanned_at')
                        ->count();
                        
                    $totalAttendees = $event->expected_attendees ?? 0;
                }

                $eventDateStr = $event->event_date ? $event->event_date->format('Y-m-d') : null;
                $status = 'upcoming';
                if ($eventDateStr === $today->format('Y-m-d')) {
                    $status = 'ongoing';
                } elseif ($eventDateStr && $eventDateStr < $today->format('Y-m-d')) {
                    $status = 'completed';
                }

                $formattedTime = '';
                if ($event->event_time) {
                    try {
                        $formattedTime = ' at ' . Carbon::parse($event->event_time)->format('g:i A');
                    } catch (\Exception $e) {
                        $formattedTime = ' at ' . $event->event_time;
                    }
                }

                return [
                    'id' => (string) $event->id,
                    'event' => $event->event_name,
                    'dateTime' => ($event->event_date ? $event->event_date->format('M j, Y') : '') . $formattedTime,
                    'organizer' => $event->organizer,
                    'location' => $event->location,
                    'totalAttendees' => $totalAttendees,
                    'presentCount' => $presentCount,
                    'status' => $event->status ?? $status,
                ];
            });
    }
}
