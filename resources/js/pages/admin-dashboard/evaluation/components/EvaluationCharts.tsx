import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star, TrendingUp } from 'lucide-react';
import { EvaluationForm, EvaluationStats, ProgramStatRow } from './types';

interface EvaluationChartsProps {
    commentsTab: 'all' | 'positive' | 'neutral' | 'negative';
    setCommentsTab: (tab: 'all' | 'positive' | 'neutral' | 'negative') => void;
    sentimentCounts: { positive: number; neutral: number; negative: number };
    evaluationStats?: EvaluationStats;
    ratingSummary: Array<{ label: string; value: number }>;
    programStats: ProgramStatRow[];
    completionThreshold: number;
    primaryEvaluation: EvaluationForm | null;
    handleApproveProgram: (evaluation: EvaluationForm, program: string) => void;
}

export default function EvaluationCharts({
    commentsTab,
    setCommentsTab,
    sentimentCounts,
    evaluationStats,
    ratingSummary,
    programStats,
    completionThreshold,
    primaryEvaluation,
    handleApproveProgram,
}: EvaluationChartsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
                <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Comments Overview</CardTitle>
                                <div className="text-sm text-slate-600 dark:text-slate-400">Sentiment analysis and rating distribution</div>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCommentsTab('positive')}
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                        commentsTab === 'positive'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Positive ({sentimentCounts.positive})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommentsTab('neutral')}
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                        commentsTab === 'neutral'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Neutral ({sentimentCounts.neutral})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommentsTab('negative')}
                                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                        commentsTab === 'negative'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Negative ({sentimentCounts.negative})
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const avg =
                                evaluationStats?.averageRating === null || evaluationStats?.averageRating === undefined
                                    ? null
                                    : Number(evaluationStats.averageRating);

                            const ratingCountByStar = new Map<number, number>();
                            ratingSummary.forEach((r) => {
                                const m = String(r.label).match(/(\d+)/);
                                const star = m ? Number(m[1]) : NaN;
                                if (!Number.isNaN(star)) ratingCountByStar.set(star, r.value);
                            });

                            const stars = [5, 4, 3, 2, 1];
                            const maxCount = Math.max(1, ...stars.map((s) => ratingCountByStar.get(s) ?? 0));

                            return (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#0B192C]/50">
                                            <div className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                {avg === null ? 'N/A' : avg.toFixed(2)}
                                            </div>
                                            <div className="mt-3 flex items-center justify-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => {
                                                    const idx = i + 1;
                                                    const filled = avg !== null && avg >= idx;
                                                    return (
                                                        <Star
                                                            key={idx}
                                                            className={`h-5 w-5 ${
                                                                filled
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'text-slate-300 dark:text-slate-600'
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                                Average
                                                <br />
                                                Evaluation
                                                <br />
                                                Rating
                                            </div>
                                            <div className="mt-6 flex justify-center">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    <TrendingUp className="h-4 w-4" />
                                                    Good Standing
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8">
                                        <div className="space-y-4">
                                            {stars.map((s) => {
                                                const count = ratingCountByStar.get(s) ?? 0;
                                                const pct = (count / maxCount) * 100;

                                                return (
                                                    <div key={s} className="grid grid-cols-12 items-center gap-3">
                                                        <div className="col-span-1 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            {s}★
                                                        </div>
                                                        <div className="col-span-10">
                                                            <div className="h-10 rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                                                                <div
                                                                    className="h-full rounded-lg bg-indigo-500"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            {count} Res
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <Card className="border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Program completion ({completionThreshold}% rule)
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Chairman: approve next activity per program after threshold is met.
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {programStats.length === 0 ? (
                            <p className="text-sm text-slate-500">Select a completed event with a published evaluation to view program stats.</p>
                        ) : (
                            programStats.map((row) => (
                                <div
                                    key={row.program}
                                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{row.program}</span>
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {row.submitted}/{row.eligible} ({row.percent}%)
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className={`h-2 rounded-full ${row.meets_threshold ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${Math.min(100, row.percent)}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        {row.approved ? (
                                            <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Clearance Granted
                                            </Badge>
                                        ) : row.meets_threshold && primaryEvaluation ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => handleApproveProgram(primaryEvaluation, row.program)}
                                            >
                                                Grant Clearance
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-500">Needs {completionThreshold}% completion</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Participation Metrics</div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Participants</div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{evaluationStats?.attendanceCount ?? 0}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Response Rate</div>
                            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {evaluationStats?.responseRate === null || evaluationStats?.responseRate === undefined
                                    ? 'N/A'
                                    : `${evaluationStats.responseRate}%`}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Unique Submitters</div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{evaluationStats?.uniqueSubmitters ?? 0}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Satisfaction Rate</div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(() => {
                            const basedOnRatings =
                                evaluationStats?.averageRating === null || evaluationStats?.averageRating === undefined
                                    ? null
                                    : Math.round((evaluationStats.averageRating / 5) * 100);

                            const positiveFeedback =
                                evaluationStats?.sentiments &&
                                evaluationStats.sentiments.positive +
                                    evaluationStats.sentiments.neutral +
                                    evaluationStats.sentiments.negative >
                                    0
                                    ? Math.round(
                                          (evaluationStats.sentiments.positive /
                                              (evaluationStats.sentiments.positive +
                                                  evaluationStats.sentiments.neutral +
                                                  evaluationStats.sentiments.negative)) *
                                              100,
                                      )
                                    : 0;

                            return (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Based on Ratings</div>
                                            <div className="text-xs font-semibold text-slate-900 dark:text-white">{basedOnRatings === null ? 'N/A' : `${basedOnRatings}%`}</div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                            <div
                                                className="h-2 rounded-full bg-indigo-500"
                                                style={{ width: `${basedOnRatings === null ? 0 : basedOnRatings}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Positive Feedback</div>
                                            <div className="text-xs font-semibold text-slate-900 dark:text-white">{positiveFeedback}%</div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${positiveFeedback}%` }} />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evaluation Criteria</div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Content Quality</div>
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">EXCELLENT</div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className="h-2 w-[78%] rounded-full bg-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Speaker Engagement</div>
                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">GOOD</div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className="h-2 w-[62%] rounded-full bg-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Time Management</div>
                                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">AVERAGE</div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className="h-2 w-[55%] rounded-full bg-amber-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Q&A Session</div>
                                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">IMPROVABLE</div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className="h-2 w-[40%] rounded-full bg-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
