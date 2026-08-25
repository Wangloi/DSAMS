import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    adminDashboard,
    adminEvaluation,
    adminEvaluationApproveProgram,
    adminEvaluationPublish,
    adminEvaluationUnpublish,
} from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    Star,
    ThumbsDown,
    ThumbsUp,
    UserRoundCog,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import KpiCards from './components/KpiCards';
import {
    EvaluationForm,
    EvaluationStats,
    EventOption,
    ProgramStatRow,
} from './components/types';

type PageProps = {
    event?: EventOption | null;
    programStats?: ProgramStatRow[];
    completionThreshold?: number;
    primaryEvaluation?: EvaluationForm;
    evaluationStats?: EvaluationStats;
    breadcrumbs?: BreadcrumbItemType[];
};

const breadcrumbs: BreadcrumbItemType[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Evaluation',
        href: adminEvaluation(),
    },
    {
        title: 'Metrics',
        href: '#',
    },
];

export default function AdminEvaluationMetricsPage() {
    const { props } = usePage<PageProps>();
    const primaryEvaluation = props.primaryEvaluation;
    const evaluationStats = props.evaluationStats;
    const programStats = props.programStats ?? [];
    const completionThreshold = props.completionThreshold ?? 85;
    const event = props.event;

    const [commentsTab, setCommentsTab] = useState<
        'all' | 'positive' | 'neutral' | 'negative'
    >('positive');

    const kpis = useMemo(() => {
        const totalResponses = evaluationStats?.totalResponses ?? 0;
        const responseRate = evaluationStats?.responseRate;
        const averageRating = evaluationStats?.averageRating;
        const positiveFeedback = evaluationStats?.sentiments?.positive ?? 0;
        const negativeFeedback = evaluationStats?.sentiments?.negative ?? 0;

        return [
            {
                title: 'Total Responses',
                value: totalResponses,
                change: '',
                accent: 'bg-blue-600',
                icon: UserRoundCog,
            },
            {
                title: 'Response Rate',
                value:
                    responseRate === null || responseRate === undefined
                        ? 'N/A'
                        : `${responseRate}%`,
                change: '',
                accent: 'bg-emerald-600',
                icon: ThumbsUp,
            },
            {
                title: 'Average Rating',
                value:
                    averageRating === null || averageRating === undefined
                        ? 'N/A'
                        : String(averageRating),
                change: '',
                accent: 'bg-amber-500',
                icon: UserRoundCog,
            },
            {
                title: 'Positive Feedback',
                value: positiveFeedback,
                change: '',
                accent: 'bg-emerald-600',
                icon: ThumbsUp,
            },
            {
                title: 'Negative Feedback',
                value: negativeFeedback,
                change: '',
                accent: 'bg-rose-500',
                icon: ThumbsDown,
            },
        ];
    }, [evaluationStats]);

    const ratingSummary = useMemo(
        () => evaluationStats?.ratingSummary ?? [],
        [evaluationStats],
    );
    const sentimentCounts = useMemo(
        () =>
            evaluationStats?.sentiments ?? {
                positive: 0,
                neutral: 0,
                negative: 0,
            },
        [evaluationStats],
    );
    const latestComments = useMemo(() => {
        const comments = evaluationStats?.latestComments ?? [];
        if (commentsTab === 'all') return comments;
        return comments.filter((c) => c.sentiment === commentsTab);
    }, [evaluationStats?.latestComments, commentsTab]);

    const handleApproveProgram = (program: string) => {
        if (!primaryEvaluation) return;
        Swal.fire({
            title: 'Approve next activity?',
            html: `Confirm that at least <strong>${completionThreshold}%</strong> of eligible students in <strong>${program}</strong> have completed the evaluation.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminEvaluationApproveProgram(primaryEvaluation.id),
                    { program },
                    {
                        preserveScroll: true,
                        onSuccess: () =>
                            router.reload({ only: ['programStats'] }),
                    },
                );
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Evaluation Metrics: ${primaryEvaluation?.name || 'Metrics'}`}
            />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                                    <Star className="h-6 w-6 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-sm font-medium text-white/80">
                                        Evaluation Metrics
                                    </div>
                                    <div className="text-xl font-bold">
                                        {primaryEvaluation?.name ||
                                            'Evaluation'}
                                    </div>
                                    {event && (
                                        <div className="text-sm text-white/80">
                                            {event.name} • {event.date}{' '}
                                            {event.time}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {primaryEvaluation &&
                                !primaryEvaluation.is_active ? (
                                    <Button
                                        type="button"
                                        className="h-9 gap-2 bg-emerald-500 hover:bg-emerald-600"
                                        onClick={() => {
                                            Swal.fire({
                                                title: 'Publish evaluation?',
                                                text: 'Eligible students will be notified.',
                                                icon: 'question',
                                                showCancelButton: true,
                                                confirmButtonText: 'Publish',
                                            }).then((r) => {
                                                if (r.isConfirmed) {
                                                    router.post(
                                                        adminEvaluationPublish(
                                                            primaryEvaluation.id,
                                                        ),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            });
                                        }}
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                        Publish
                                    </Button>
                                ) : primaryEvaluation ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                                        onClick={() =>
                                            router.post(
                                                adminEvaluationUnpublish(
                                                    primaryEvaluation.id,
                                                ),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <ThumbsDown className="h-4 w-4" />
                                        Unpublish
                                    </Button>
                                ) : null}
                                <Button
                                    asChild
                                    type="button"
                                    className="h-9 justify-start gap-2 rounded-md bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
                                >
                                    <Link href={adminEvaluation()}>
                                        <ChevronLeft className="h-4 w-4" />
                                        Back
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <KpiCards kpis={kpis} />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                                Rating Distribution
                                            </CardTitle>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                Student rating breakdown
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const avg =
                                            evaluationStats?.averageRating ===
                                                null ||
                                            evaluationStats?.averageRating ===
                                                undefined
                                                ? null
                                                : Number(
                                                      evaluationStats.averageRating,
                                                  );

                                        const ratingCountByStar = new Map<
                                            number,
                                            number
                                        >();
                                        ratingSummary.forEach((r) => {
                                            const m = String(r.label).match(
                                                /(\d+)/,
                                            );
                                            const star = m ? Number(m[1]) : NaN;
                                            if (!Number.isNaN(star))
                                                ratingCountByStar.set(
                                                    star,
                                                    r.value,
                                                );
                                        });

                                        const stars = [5, 4, 3, 2, 1];
                                        const maxCount = Math.max(
                                            1,
                                            ...stars.map(
                                                (s) =>
                                                    ratingCountByStar.get(s) ??
                                                    0,
                                            ),
                                        );

                                        return (
                                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                                <div className="lg:col-span-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                                                        <div className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                            {avg === null
                                                                ? 'N/A'
                                                                : avg.toFixed(
                                                                      2,
                                                                  )}
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-center gap-1">
                                                            {Array.from({
                                                                length: 5,
                                                            }).map((_, i) => {
                                                                const idx =
                                                                    i + 1;
                                                                const filled =
                                                                    avg !==
                                                                        null &&
                                                                    avg >= idx;
                                                                return (
                                                                    <Star
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className={`h-5 w-5 ${
                                                                            filled
                                                                                ? 'fill-amber-400 text-amber-400'
                                                                                : 'text-slate-300 dark:text-slate-600'
                                                                        }`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-6 text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase dark:text-slate-400">
                                                            Average
                                                            <br />
                                                            Evaluation
                                                            <br />
                                                            Rating
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-8">
                                                    <div className="space-y-4">
                                                        {stars.map((s) => {
                                                            const count =
                                                                ratingCountByStar.get(
                                                                    s,
                                                                ) ?? 0;
                                                            const pct =
                                                                (count /
                                                                    maxCount) *
                                                                100;

                                                            return (
                                                                <div
                                                                    key={s}
                                                                    className="grid grid-cols-12 items-center gap-3"
                                                                >
                                                                    <div className="col-span-1 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                        {s}★
                                                                    </div>
                                                                    <div className="col-span-10">
                                                                        <div className="h-10 rounded-xl bg-slate-100 p-2 dark:bg-slate-700">
                                                                            <div
                                                                                className="h-full rounded-lg bg-indigo-500"
                                                                                style={{
                                                                                    width: `${pct}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-1 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                        {count}{' '}
                                                                        Res
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

                        <div className="lg:col-span-1">
                            <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                        Program Completion
                                    </CardTitle>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {completionThreshold}% threshold
                                        required
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {programStats.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                            No program stats available
                                        </div>
                                    ) : (
                                        programStats.map((row) => (
                                            <div
                                                key={row.program}
                                                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {row.program}
                                                    </span>
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {row.submitted}/
                                                        {row.eligible} (
                                                        {row.percent}%)
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                                                    <div
                                                        className={`h-2 rounded-full ${row.meets_threshold ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        style={{
                                                            width: `${Math.min(100, row.percent)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="mt-3">
                                                    {row.approved ? (
                                                        <Badge className="gap-1 bg-emerald-600">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Approved
                                                        </Badge>
                                                    ) : row.meets_threshold ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleApproveProgram(
                                                                    row.program,
                                                                )
                                                            }
                                                        >
                                                            Approve next
                                                            activity
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">
                                                            Below{' '}
                                                            {
                                                                completionThreshold
                                                            }
                                                            % threshold
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                        Latest Comments
                                    </CardTitle>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Student feedback with sentiment analysis
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCommentsTab('positive')
                                        }
                                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                            commentsTab === 'positive'
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        Positive ({sentimentCounts.positive})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCommentsTab('neutral')
                                        }
                                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                            commentsTab === 'neutral'
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        Neutral ({sentimentCounts.neutral})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCommentsTab('negative')
                                        }
                                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                            commentsTab === 'negative'
                                                ? 'bg-rose-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        Negative ({sentimentCounts.negative})
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {latestComments.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                    No comments yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {latestComments.map((comment, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {comment.student}
                                                        </span>
                                                        {comment.rating !==
                                                            null && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {comment.rating.toFixed(
                                                                    1,
                                                                )}
                                                                ★
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            className={
                                                                comment.sentiment ===
                                                                'positive'
                                                                    ? 'bg-emerald-600'
                                                                    : comment.sentiment ===
                                                                        'negative'
                                                                      ? 'bg-rose-600'
                                                                      : 'bg-slate-600'
                                                            }
                                                        >
                                                            {comment.sentiment}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                                        {comment.comment}
                                                    </div>
                                                    {comment.submitted_at && (
                                                        <div className="mt-2 text-xs text-slate-500">
                                                            {new Date(
                                                                comment.submitted_at,
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
