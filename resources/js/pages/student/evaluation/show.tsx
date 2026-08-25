import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { studentDashboard, studentEvaluationSubmit } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronLeft,
    ClipboardList,
    Send,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

type Question = {
    id: string;
    type:
        | 'rating'
        | 'multiple_choice'
        | 'checkbox'
        | 'short_text'
        | 'long_text';
    label: string;
    required?: boolean;
    options?: string[];
};

type Evaluation = {
    id: number;
    name: string;
    eventId: number;
    eventLabel: string;
    formData: {
        questions?: Question[];
    };
};

type PageProps = {
    evaluation: Evaluation;
    alreadySubmitted: boolean;
};

export default function StudentEvaluationShow() {
    const { props } = usePage<PageProps>();
    const evaluation = props.evaluation;
    const alreadySubmitted = Boolean(props.alreadySubmitted);

    const questions = useMemo(() => {
        const qs = evaluation?.formData?.questions ?? [];
        return Array.isArray(qs) ? qs : [];
    }, [evaluation]);

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        if (alreadySubmitted) return false;
        for (const q of questions) {
            if (!q.required) continue;
            const v = answers[q.id];
            if (q.type === 'rating') {
                if (!v || Number(v) <= 0) return false;
            } else if (q.type === 'checkbox') {
                if (!Array.isArray(v) || v.length === 0) return false;
            } else {
                if (typeof v !== 'string' || v.trim() === '') return false;
            }
        }
        return questions.length > 0;
    }, [alreadySubmitted, answers, questions]);

    const answeredCount = useMemo(() => {
        let count = 0;
        for (const q of questions) {
            const v = answers[q.id];
            if (q.type === 'rating' && v && Number(v) > 0) count++;
            else if (q.type === 'checkbox' && Array.isArray(v) && v.length > 0)
                count++;
            else if (typeof v === 'string' && v.trim() !== '') count++;
        }
        return count;
    }, [answers, questions]);

    const progressPercentage =
        questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    const toggleCheckbox = (questionId: string, option: string) => {
        setAnswers((p) => {
            const current = p[questionId];
            const list = Array.isArray(current) ? [...current] : [];
            const idx = list.indexOf(option);
            if (idx >= 0) list.splice(idx, 1);
            else list.push(option);
            return { ...p, [questionId]: list };
        });
    };

    const submit = () => {
        if (!canSubmit) {
            Swal.fire({
                icon: 'error',
                title: 'Please complete required fields',
                text: 'Answer all required questions before submitting.',
                confirmButtonColor: '#4f46e5',
            });
            return;
        }

        setSubmitting(true);
        router.post(
            studentEvaluationSubmit(evaluation.id),
            { answers },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Thank you!',
                        text: 'Your evaluation has been submitted.',
                        timer: 2500,
                        showConfirmButton: false,
                    });
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Submission failed',
                        text: 'Please try again.',
                        confirmButtonColor: '#4f46e5',
                    });
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    if (alreadySubmitted) {
        return (
            <>
                <Head title={`Evaluation: ${evaluation.name}`} />
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            All Done!
                        </h2>
                        <p className="mb-8 leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                            You've already submitted the evaluation for <br />
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                {evaluation.name}
                            </span>
                            . Thank you for your valuable feedback!
                        </p>
                        <Button
                            className="h-12 w-full rounded-xl bg-slate-900 font-bold tracking-wide text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            onClick={() => router.visit(studentDashboard())}
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Evaluation: ${evaluation.name}`} />

            <div className="min-h-screen bg-[#f8fafc] pb-24 dark:bg-[#020617]">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-4 pt-8 pb-20">
                    <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[150%] w-[50%] rounded-full bg-white/10 blur-[100px]" />
                    <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[120%] w-[40%] rounded-full bg-sky-300/20 blur-[100px]" />

                    <div className="relative z-10 mx-auto max-w-3xl">
                        <button
                            onClick={() => router.visit(studentDashboard())}
                            className="group mb-8 flex items-center gap-2 text-sm font-bold tracking-wide text-white/80 uppercase transition-colors hover:text-white"
                        >
                            <div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-white/20">
                                <ChevronLeft className="h-4 w-4" />
                            </div>
                            Dashboard
                        </button>

                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-xl">
                                <ClipboardList className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="mb-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                                    {evaluation.name}
                                </h1>
                                <p className="flex items-center gap-2 text-sm font-medium text-blue-100 md:text-base">
                                    <Sparkles className="h-4 w-4 text-sky-300" />
                                    {evaluation.eventLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative z-20 mx-auto -mt-12 max-w-3xl px-4">
                    {/* Progress Bar Card */}
                    <div className="mb-8 flex items-center gap-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 md:p-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="flex-1">
                            <div className="mb-2 flex items-end justify-between">
                                <span className="text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    Progress
                                </span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    {answeredCount} of {questions.length}
                                </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                        {progressPercentage === 100 && (
                            <div className="hidden rounded-full bg-emerald-100 p-2 text-emerald-600 sm:flex dark:bg-emerald-500/20 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        )}
                    </div>

                    {questions.length === 0 ? (
                        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
                            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                No questions available
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                This evaluation form has not been configured
                                yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((q, idx) => {
                                const isAnswered =
                                    answers[q.id] !== undefined &&
                                    answers[q.id] !== '' &&
                                    (!Array.isArray(answers[q.id]) ||
                                        answers[q.id].length > 0);

                                return (
                                    <div
                                        key={q.id}
                                        className={cn(
                                            'group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 md:p-8 dark:bg-slate-900',
                                            isAnswered
                                                ? 'border-indigo-100 shadow-indigo-100/20 dark:border-indigo-900/50'
                                                : 'border-slate-200 dark:border-slate-800',
                                        )}
                                    >
                                        {/* Question Number Badge */}
                                        <div className="mb-6 flex items-start gap-4">
                                            <div
                                                className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors',
                                                    isAnswered
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                                )}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div className="pt-1">
                                                <h3 className="text-lg leading-snug font-bold text-slate-900 dark:text-white">
                                                    {q.label}
                                                    {q.required && (
                                                        <span className="ml-1.5 text-rose-500">
                                                            *
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Input Types */}
                                        <div className="pl-0 md:pl-12">
                                            {/* RATING */}
                                            {q.type === 'rating' && (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (n) => {
                                                            const isSelected =
                                                                Number(
                                                                    answers[
                                                                        q.id
                                                                    ],
                                                                ) === n;
                                                            return (
                                                                <button
                                                                    key={n}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setAnswers(
                                                                            (
                                                                                p,
                                                                            ) => ({
                                                                                ...p,
                                                                                [q.id]: n,
                                                                            }),
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        'flex h-14 max-w-[80px] min-w-[50px] flex-1 transform items-center justify-center rounded-2xl border-2 text-lg font-black transition-all duration-200 hover:scale-105 active:scale-95',
                                                                        isSelected
                                                                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                                                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10',
                                                                    )}
                                                                >
                                                                    {n}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}

                                            {/* MULTIPLE CHOICE (Radio) */}
                                            {q.type === 'multiple_choice' && (
                                                <div className="grid gap-3">
                                                    {(q.options ?? []).map(
                                                        (opt) => {
                                                            const isSelected =
                                                                answers[
                                                                    q.id
                                                                ] === opt;
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setAnswers(
                                                                            (
                                                                                p,
                                                                            ) => ({
                                                                                ...p,
                                                                                [q.id]: opt,
                                                                            }),
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        'group flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200',
                                                                        isSelected
                                                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                                                            : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500/30',
                                                                    )}
                                                                >
                                                                    <span
                                                                        className={cn(
                                                                            'font-medium transition-colors',
                                                                            isSelected
                                                                                ? 'text-indigo-900 dark:text-indigo-100'
                                                                                : 'text-slate-700 dark:text-slate-300',
                                                                        )}
                                                                    >
                                                                        {opt}
                                                                    </span>
                                                                    <div
                                                                        className={cn(
                                                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                                                            isSelected
                                                                                ? 'border-indigo-600'
                                                                                : 'border-slate-300 group-hover:border-indigo-300 dark:border-slate-600',
                                                                        )}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}

                                            {/* CHECKBOX */}
                                            {q.type === 'checkbox' && (
                                                <div className="grid gap-3">
                                                    {(q.options ?? []).map(
                                                        (opt) => {
                                                            const isSelected =
                                                                Array.isArray(
                                                                    answers[
                                                                        q.id
                                                                    ],
                                                                ) &&
                                                                answers[
                                                                    q.id
                                                                ].includes(opt);
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleCheckbox(
                                                                            q.id,
                                                                            opt,
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        'group flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200',
                                                                        isSelected
                                                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                                                            : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500/30',
                                                                    )}
                                                                >
                                                                    <span
                                                                        className={cn(
                                                                            'font-medium transition-colors',
                                                                            isSelected
                                                                                ? 'text-indigo-900 dark:text-indigo-100'
                                                                                : 'text-slate-700 dark:text-slate-300',
                                                                        )}
                                                                    >
                                                                        {opt}
                                                                    </span>
                                                                    <div
                                                                        className={cn(
                                                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                                                                            isSelected
                                                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                : 'border-slate-300 group-hover:border-indigo-300 dark:border-slate-600',
                                                                        )}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}

                                            {/* SHORT TEXT */}
                                            {q.type === 'short_text' && (
                                                <Input
                                                    value={
                                                        typeof answers[q.id] ===
                                                        'string'
                                                            ? answers[q.id]
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        setAnswers((p) => ({
                                                            ...p,
                                                            [q.id]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder="Type your answer here..."
                                                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-base focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50"
                                                />
                                            )}

                                            {/* LONG TEXT */}
                                            {q.type === 'long_text' && (
                                                <Textarea
                                                    value={
                                                        typeof answers[q.id] ===
                                                        'string'
                                                            ? answers[q.id]
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        setAnswers((p) => ({
                                                            ...p,
                                                            [q.id]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder="Share your detailed feedback..."
                                                    rows={4}
                                                    className="resize-y rounded-2xl border-slate-200 bg-slate-50 p-5 text-base leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Submit Bar */}
                {questions.length > 0 && (
                    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200 bg-white/80 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="mx-auto flex max-w-3xl items-center justify-between">
                            <div className="hidden text-sm font-medium text-slate-500 sm:block dark:text-slate-400">
                                {progressPercentage === 100
                                    ? "All questions answered. You're ready to submit!"
                                    : 'Please complete all required fields.'}
                            </div>
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit || submitting}
                                className={cn(
                                    'ml-auto h-14 w-full rounded-2xl px-8 font-black tracking-widest uppercase transition-all duration-300 sm:w-auto',
                                    canSubmit
                                        ? 'bg-indigo-600 text-white hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600',
                                )}
                            >
                                {submitting
                                    ? 'Submitting...'
                                    : 'Submit Evaluation'}
                                {!submitting && (
                                    <Send className="ml-2 h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
