import StudentLayout from '../components/StudentLayout';
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
    Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { StudentDashboardFooter } from '../components/StudentDashboardFooter';

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
                confirmButtonColor: '#0b2d66',
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
                        confirmButtonColor: '#0b2d66',
                    });
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <StudentLayout>
            <Head title={`Evaluation: ${evaluation?.name || 'Form'}`} />

            <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 sm:px-6">
                    {alreadySubmitted ? (
                        <div className="mx-auto mt-12 w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
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
                    ) : (
                        <>
                            {/* Navigation back button */}
                            <button
                                onClick={() => router.visit(studentDashboard())}
                                className="group mb-6 flex items-center gap-2 text-xs font-black tracking-widest text-[#0b2d66] uppercase transition-colors hover:text-[#1e40af] dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <div className="rounded-lg bg-white p-1.5 shadow-sm transition-colors group-hover:bg-slate-100 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                                    <ChevronLeft className="h-4 w-4" />
                                </div>
                                Back to Dashboard
                            </button>

                            {/* PREMIUM HERO CARD FOR EVALUATION INFO */}
                            <div className="group relative mb-8 overflow-hidden rounded-3xl bg-[#0b2d66] p-6 shadow-2xl sm:p-8">
                                <div className="absolute top-0 right-0 h-[300px] w-[300px] translate-x-1/3 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />

                                <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                        <ClipboardList className="h-7 w-7 text-blue-300" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                            {evaluation.name}
                                        </h1>
                                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                                            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                                            {evaluation.eventLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PROGRESS BAR CARD */}
                            <div className="mb-6 flex items-center gap-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-none">
                                <div className="flex-1">
                                    <div className="mb-2 flex items-end justify-between">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Progress
                                        </span>
                                        <span className="text-xs font-black tracking-widest text-[#0b2d66] uppercase dark:text-blue-400">
                                            {answeredCount} of {questions.length} Answered
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-[#0b2d66] to-[#1e40af] transition-all duration-700 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {progressPercentage === 100 && (
                                    <div className="hidden rounded-full bg-emerald-500/10 p-2 text-emerald-500 sm:flex dark:bg-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                )}
                            </div>

                            {questions.length === 0 ? (
                                <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900/40">
                                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        No questions available
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        This evaluation form has not been configured yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
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
                                                    'group relative overflow-hidden rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 sm:p-6 dark:bg-slate-900/40',
                                                    isAnswered
                                                        ? 'border-blue-500/20 shadow-blue-500/5 dark:border-blue-500/10'
                                                        : 'border-slate-200/60 dark:border-slate-800',
                                                )}
                                            >
                                                {/* Question Header */}
                                                <div className="mb-5 flex items-start gap-3.5">
                                                    <div
                                                        className={cn(
                                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors',
                                                            isAnswered
                                                                ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-900/20 dark:bg-blue-600'
                                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                                                        )}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div className="pt-0.5">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                                                            {q.label}
                                                            {q.required && (
                                                                <span className="ml-1.5 text-rose-500">
                                                                    *
                                                                </span>
                                                            )}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {/* Answers Body */}
                                                <div className="sm:pl-10">
                                                    {/* RATING */}
                                                    {q.type === 'rating' && (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {[1, 2, 3, 4, 5].map((n) => {
                                                                const isSelected =
                                                                    Number(answers[q.id]) === n;
                                                                return (
                                                                    <button
                                                                        key={n}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setAnswers((p) => ({
                                                                                ...p,
                                                                                [q.id]: n,
                                                                            }))
                                                                        }
                                                                        className={cn(
                                                                            'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black transition-all duration-200 hover:scale-105 active:scale-95',
                                                                            isSelected
                                                                                ? 'border-[#0b2d66] bg-[#0b2d66] text-white shadow-md shadow-blue-900/20 dark:border-blue-600 dark:bg-blue-600'
                                                                                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-blue-900/30 dark:hover:bg-blue-900/10',
                                                                        )}
                                                                    >
                                                                        {n}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* MULTIPLE CHOICE */}
                                                    {q.type === 'multiple_choice' && (
                                                        <div className="grid gap-2">
                                                            {(q.options ?? []).map((opt) => {
                                                                const isSelected =
                                                                    answers[q.id] === opt;
                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setAnswers((p) => ({
                                                                                ...p,
                                                                                [q.id]: opt,
                                                                            }))
                                                                        }
                                                                        className={cn(
                                                                            'group flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all duration-200',
                                                                            isSelected
                                                                                ? 'border-[#0b2d66] bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-950/20'
                                                                                : 'border-slate-100 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/20 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-950/25',
                                                                        )}
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                'text-xs font-semibold transition-colors sm:text-sm',
                                                                                isSelected
                                                                                    ? 'text-[#0b2d66] dark:text-blue-400'
                                                                                    : 'text-slate-700 dark:text-slate-300',
                                                                            )}
                                                                        >
                                                                            {opt}
                                                                        </span>
                                                                        <div
                                                                            className={cn(
                                                                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                                                                isSelected
                                                                                    ? 'border-[#0b2d66]'
                                                                                    : 'border-slate-300 group-hover:border-blue-400 dark:border-slate-600',
                                                                            )}
                                                                        >
                                                                            {isSelected && (
                                                                                <div className="h-2 w-2 rounded-full bg-[#0b2d66] dark:bg-blue-500" />
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* CHECKBOX */}
                                                    {q.type === 'checkbox' && (
                                                        <div className="grid gap-2">
                                                            {(q.options ?? []).map((opt) => {
                                                                const isSelected =
                                                                    Array.isArray(answers[q.id]) &&
                                                                    answers[q.id].includes(opt);
                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleCheckbox(q.id, opt)
                                                                        }
                                                                        className={cn(
                                                                            'group flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all duration-200',
                                                                            isSelected
                                                                                ? 'border-[#0b2d66] bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-950/20'
                                                                                : 'border-slate-100 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/20 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-950/25',
                                                                        )}
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                'text-xs font-semibold transition-colors sm:text-sm',
                                                                                isSelected
                                                                                    ? 'text-[#0b2d66] dark:text-blue-400'
                                                                                    : 'text-slate-700 dark:text-slate-300',
                                                                            )}
                                                                        >
                                                                            {opt}
                                                                        </span>
                                                                        <div
                                                                            className={cn(
                                                                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                                                                                isSelected
                                                                                    ? 'border-[#0b2d66] bg-[#0b2d66] text-white dark:border-blue-500 dark:bg-blue-500'
                                                                                    : 'border-slate-300 group-hover:border-blue-400 dark:border-slate-600',
                                                                            )}
                                                                        >
                                                                            {isSelected && (
                                                                                <Check className="h-3 w-3" />
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* SHORT TEXT */}
                                                    {q.type === 'short_text' && (
                                                        <Input
                                                            value={
                                                                typeof answers[q.id] === 'string'
                                                                    ? answers[q.id]
                                                                    : ''
                                                            }
                                                            onChange={(e) =>
                                                                setAnswers((p) => ({
                                                                    ...p,
                                                                    [q.id]: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Type your answer here..."
                                                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/30"
                                                        />
                                                    )}

                                                    {/* LONG TEXT */}
                                                    {q.type === 'long_text' && (
                                                        <Textarea
                                                            value={
                                                                typeof answers[q.id] === 'string'
                                                                    ? answers[q.id]
                                                                    : ''
                                                            }
                                                            onChange={(e) =>
                                                                setAnswers((p) => ({
                                                                    ...p,
                                                                    [q.id]: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Share your detailed feedback..."
                                                            rows={3}
                                                            className="resize-y rounded-xl border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/30"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Bottom Submit Bar */}
                {!alreadySubmitted && questions.length > 0 && (
                    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-100 bg-white/90 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                        <div className="mx-auto flex max-w-3xl items-center justify-between">
                            <div className="hidden text-xs font-black tracking-widest text-slate-400 uppercase sm:block">
                                {progressPercentage === 100
                                    ? "All questions answered. Ready to submit!"
                                    : 'Fill in all required fields to submit.'}
                            </div>
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit || submitting}
                                className={cn(
                                    'ml-auto h-12 w-full rounded-xl px-8 text-xs font-black tracking-widest uppercase transition-all duration-300 sm:w-auto',
                                    canSubmit
                                        ? 'bg-[#0b2d66] text-white hover:-translate-y-0.5 hover:bg-[#1e40af] hover:shadow-lg hover:shadow-blue-900/20 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600',
                                )}
                            >
                                {submitting ? 'Submitting...' : 'Submit Evaluation'}
                                {!submitting && <Send className="ml-2 h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                )}

                <StudentDashboardFooter />
        </StudentLayout>
    );
}
