import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    adminDashboard,
    adminEvaluation,
    adminEvaluationApproveProgram,
    adminEvaluationPublish,
    adminEvaluationUnpublish,
} from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, Eye, Send, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';

type Question = {
    id: string;
    type: 'rating' | 'multiple_choice' | 'short_text' | 'long_text';
    label: string;
    required?: boolean;
    options?: string[];
};

type Evaluation = {
    id: number;
    name: string;
    event: string;
    event_id?: number | null;
    form_data?: {
        questions?: Question[];
    };
    is_active: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
};

type ResponseItem = {
    id: number;
    student: {
        id: number;
        name: string;
        student_id: string;
    };
    submitted_at: string | null;
    answers: Record<string, any>;
};

type ProgramStatRow = {
    program: string;
    eligible: number;
    submitted: number;
    percent: number;
    meets_threshold: boolean;
    approved: boolean;
    approved_at?: string | null;
};

type PageProps = {
    evaluation: Evaluation;
    responses?: ResponseItem[];
    programStats?: ProgramStatRow[];
    completionThreshold?: number;
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
        title: 'Preview',
        href: '#',
    },
];

export default function AdminEvaluationShowPage() {
    const { props } = usePage<PageProps>();
    const evaluation = props.evaluation;
    const responses = props.responses ?? [];
    const programStats = props.programStats ?? [];
    const completionThreshold = props.completionThreshold ?? 85;

    const questions = useMemo(() => {
        const qs = evaluation?.form_data?.questions ?? [];
        return Array.isArray(qs) ? qs : [];
    }, [evaluation]);

    const summaryByQuestion = useMemo(() => {
        const summaries: Record<
            string,
            {
                totalAnswers: number;
                ratingCounts?: Array<{ label: string; value: number }>;
                ratingAverage?: number | null;
                optionCounts?: Array<{ label: string; value: number }>;
                textAnswers?: string[];
            }
        > = {};

        for (const q of questions) {
            const totalAnswers = responses.reduce((acc, r) => {
                const v = (r.answers ?? {})[q.id];
                if (v === null || v === undefined || v === '') return acc;
                return acc + 1;
            }, 0);

            if (q.type === 'rating') {
                const counts = [1, 2, 3, 4, 5].map((n) => ({
                    label: `${n}`,
                    value: 0,
                }));
                const values: number[] = [];

                for (const r of responses) {
                    const v = (r.answers ?? {})[q.id];
                    const n =
                        typeof v === 'number'
                            ? v
                            : parseInt(String(v ?? ''), 10);
                    if (Number.isFinite(n) && n >= 1 && n <= 5) {
                        counts[n - 1].value += 1;
                        values.push(n);
                    }
                }

                summaries[q.id] = {
                    totalAnswers,
                    ratingCounts: counts,
                    ratingAverage:
                        values.length > 0
                            ? Number(
                                  (
                                      values.reduce((a, b) => a + b, 0) /
                                      values.length
                                  ).toFixed(2),
                              )
                            : null,
                };
                continue;
            }

            if (q.type === 'multiple_choice') {
                const options = Array.isArray(q.options) ? q.options : [];
                const optionMap = new Map<string, number>();
                for (const opt of options) optionMap.set(opt, 0);

                for (const r of responses) {
                    const v = (r.answers ?? {})[q.id];
                    if (v === null || v === undefined || v === '') continue;
                    const key = String(v);
                    optionMap.set(key, (optionMap.get(key) ?? 0) + 1);
                }

                summaries[q.id] = {
                    totalAnswers,
                    optionCounts: Array.from(optionMap.entries()).map(
                        ([label, value]) => ({ label, value }),
                    ),
                };
                continue;
            }

            if (q.type === 'short_text' || q.type === 'long_text') {
                const textAnswers: string[] = [];
                for (const r of responses) {
                    const v = (r.answers ?? {})[q.id];
                    if (v === null || v === undefined) continue;
                    const s = String(v).trim();
                    if (!s) continue;
                    textAnswers.push(s);
                }

                summaries[q.id] = {
                    totalAnswers,
                    textAnswers,
                };
                continue;
            }

            summaries[q.id] = { totalAnswers };
        }

        return summaries;
    }, [questions, responses]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Evaluation Preview: ${evaluation.name}`} />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                                    <Eye className="h-6 w-6 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-sm font-medium text-white/80">
                                        Evaluation
                                    </div>
                                    <Breadcrumb>
                                        <BreadcrumbList className="text-white/80">
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="text-white/80">
                                                    Preview
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="text-white/40" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="text-white">
                                                    {evaluation.name}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                    <div className="text-sm text-white/80">
                                        Read-only preview for admins
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {!evaluation.is_active ? (
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
                                                            evaluation.id,
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
                                        <Send className="h-4 w-4" />
                                        Publish
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                                        onClick={() =>
                                            router.post(
                                                adminEvaluationUnpublish(
                                                    evaluation.id,
                                                ),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Unpublish
                                    </Button>
                                )}
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

                    <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                        <CardHeader className="space-y-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base text-slate-800 dark:text-white">
                                        {evaluation.name}
                                    </CardTitle>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {evaluation.event}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            evaluation.is_active
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                    >
                                        {evaluation.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                    {evaluation.is_archived ? (
                                        <Badge variant="destructive">
                                            Archived
                                        </Badge>
                                    ) : null}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    No questions configured for this evaluation.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {questions.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {idx + 1}. {q.label}{' '}
                                                {q.required ? (
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        *
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-3">
                                                {q.type === 'rating' ? (
                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4, 5].map(
                                                            (n) => (
                                                                <button
                                                                    key={n}
                                                                    type="button"
                                                                    disabled
                                                                    className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                                >
                                                                    {n}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : null}

                                                {q.type ===
                                                'multiple_choice' ? (
                                                    <div className="space-y-2">
                                                        {(q.options ?? []).map(
                                                            (opt) => (
                                                                <label
                                                                    key={opt}
                                                                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        disabled
                                                                    />
                                                                    <span>
                                                                        {opt}
                                                                    </span>
                                                                </label>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : null}

                                                {q.type === 'short_text' ? (
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`q_${q.id}`}
                                                            className="sr-only"
                                                        >
                                                            {q.label}
                                                        </Label>
                                                        <Input
                                                            id={`q_${q.id}`}
                                                            disabled
                                                            className="h-11"
                                                            placeholder="Short answer text"
                                                        />
                                                    </div>
                                                ) : null}

                                                {q.type === 'long_text' ? (
                                                    <div className="grid gap-2">
                                                        <Label
                                                            htmlFor={`q_${q.id}`}
                                                            className="sr-only"
                                                        >
                                                            {q.label}
                                                        </Label>
                                                        <Textarea
                                                            id={`q_${q.id}`}
                                                            disabled
                                                            rows={4}
                                                            className="resize-none"
                                                            placeholder="Long answer text"
                                                        />
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {programStats.length > 0 ? (
                        <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-800 dark:text-white">
                                    Program completion ({completionThreshold}%
                                    before next activity)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                {programStats.map((row) => (
                                    <div
                                        key={row.program}
                                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {row.program}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {row.submitted}/{row.eligible} (
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
                                                    Approved for next activity
                                                </Badge>
                                            ) : row.meets_threshold ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        Swal.fire({
                                                            title: 'Approve next activity?',
                                                            html: `Program: <strong>${row.program}</strong>`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                        }).then((r) => {
                                                            if (r.isConfirmed) {
                                                                router.post(
                                                                    adminEvaluationApproveProgram(
                                                                        evaluation.id,
                                                                    ),
                                                                    {
                                                                        program:
                                                                            row.program,
                                                                    },
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Approve next activity
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    Below {completionThreshold}%
                                                    threshold
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base text-slate-800 dark:text-white">
                                Summary
                            </CardTitle>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                {responses.length} response(s)
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    No questions configured for this evaluation.
                                </div>
                            ) : responses.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    No responses yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, idx) => {
                                        const summary = summaryByQuestion[q.id];
                                        return (
                                            <div
                                                key={q.id}
                                                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {idx + 1}. {q.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {summary?.totalAnswers ??
                                                            0}{' '}
                                                        answer(s)
                                                    </div>
                                                </div>

                                                {q.type === 'rating' &&
                                                summary?.ratingCounts ? (
                                                    <div className="mt-3 grid gap-3">
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                                            Average:{' '}
                                                            {summary.ratingAverage ===
                                                                null ||
                                                            summary.ratingAverage ===
                                                                undefined
                                                                ? 'N/A'
                                                                : summary.ratingAverage}
                                                        </div>
                                                        <div className="h-40">
                                                            <ResponsiveContainer
                                                                width="100%"
                                                                height="100%"
                                                            >
                                                                <BarChart
                                                                    data={
                                                                        summary.ratingCounts
                                                                    }
                                                                    margin={{
                                                                        top: 10,
                                                                        right: 16,
                                                                        left: 0,
                                                                        bottom: 10,
                                                                    }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" />
                                                                    <XAxis dataKey="label" />
                                                                    <YAxis
                                                                        allowDecimals={
                                                                            false
                                                                        }
                                                                    />
                                                                    <Tooltip />
                                                                    <Bar
                                                                        dataKey="value"
                                                                        fill="#2563eb"
                                                                        radius={[
                                                                            6,
                                                                            6,
                                                                            0,
                                                                            0,
                                                                        ]}
                                                                    />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {q.type === 'multiple_choice' &&
                                                summary?.optionCounts ? (
                                                    <div className="mt-3 h-40">
                                                        <ResponsiveContainer
                                                            width="100%"
                                                            height="100%"
                                                        >
                                                            <BarChart
                                                                data={
                                                                    summary.optionCounts
                                                                }
                                                                layout="vertical"
                                                                margin={{
                                                                    top: 10,
                                                                    right: 16,
                                                                    left: 24,
                                                                    bottom: 10,
                                                                }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis
                                                                    type="number"
                                                                    allowDecimals={
                                                                        false
                                                                    }
                                                                />
                                                                <YAxis
                                                                    type="category"
                                                                    dataKey="label"
                                                                    width={140}
                                                                />
                                                                <Tooltip />
                                                                <Bar
                                                                    dataKey="value"
                                                                    fill="#16a34a"
                                                                    radius={[
                                                                        0, 6, 6,
                                                                        0,
                                                                    ]}
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : null}

                                                {(q.type === 'short_text' ||
                                                    q.type === 'long_text') &&
                                                summary?.textAnswers ? (
                                                    <div className="mt-3 space-y-2">
                                                        {summary.textAnswers
                                                            .length === 0 ? (
                                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                No responses.
                                                            </div>
                                                        ) : (
                                                            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                                                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                                                    {summary.textAnswers.map(
                                                                        (
                                                                            t,
                                                                            i,
                                                                        ) => (
                                                                            <li
                                                                                key={`${q.id}_${i}`}
                                                                                className="p-3 text-xs text-slate-700 dark:text-slate-300"
                                                                            >
                                                                                {
                                                                                    t
                                                                                }
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Responses table removed as per request */}
                </div>
            </div>
        </AdminLayout>
    );
}
