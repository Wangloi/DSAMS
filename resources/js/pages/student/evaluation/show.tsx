import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { studentDashboard } from '@/routes';
import { studentEvaluationSubmit } from '@/routes';

type Question = {
    id: string;
    type: 'rating' | 'multiple_choice' | 'checkbox' | 'short_text' | 'long_text';
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
                    });
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <>
            <Head title={`Evaluation: ${evaluation.name}`} />
            <div className="min-h-screen bg-[#f3f2f7] py-10 px-4">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="h-2 w-full rounded-t-xl bg-[#673ab7]" />
                    <Card className="w-full rounded-t-none border border-slate-200 shadow-sm">
                        <CardHeader className="space-y-2">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl font-semibold text-slate-900">{evaluation.name}</CardTitle>
                                    <div className="text-sm text-slate-600">{evaluation.eventLabel}</div>
                                    <div className="pt-2 text-xs text-slate-600">
                                        <span className="text-rose-600">*</span> Required
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="h-9" onClick={() => router.visit(studentDashboard())}>
                                    Back to Dashboard
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {alreadySubmitted ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm font-semibold">
                                    You already submitted this evaluation.
                                </div>
                            ) : null}

                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700 text-sm">
                                    No questions configured for this evaluation yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 h-6 w-1 rounded-full bg-[#673ab7]" />
                                                <div className="flex-1 space-y-3">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {idx + 1}. {q.label}{' '}
                                                        {q.required ? <span className="text-rose-600">*</span> : null}
                                                    </div>

                                                    {q.type === 'rating' ? (
                                                        <div className="flex items-center gap-2">
                                                            {[1, 2, 3, 4, 5].map((n) => (
                                                                <button
                                                                    key={n}
                                                                    type="button"
                                                                    disabled={alreadySubmitted}
                                                                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: n }))}
                                                                    className={
                                                                        'h-10 w-10 rounded-md border text-sm font-semibold transition-colors ' +
                                                                        (Number(answers[q.id]) === n
                                                                            ? 'border-[#673ab7] bg-[#673ab7] text-white'
                                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
                                                                    }
                                                                >
                                                                    {n}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : null}

                                                    {q.type === 'multiple_choice' ? (
                                                        <div className="space-y-2">
                                                            {(q.options ?? []).map((opt) => (
                                                                <label key={opt} className="flex items-center gap-3 text-sm text-slate-800">
                                                                    <input
                                                                        type="radio"
                                                                        name={q.id}
                                                                        value={opt}
                                                                        disabled={alreadySubmitted}
                                                                        checked={answers[q.id] === opt}
                                                                        onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : null}

                                                    {q.type === 'checkbox' ? (
                                                        <div className="space-y-2">
                                                            {(q.options ?? []).map((opt) => (
                                                                <label key={opt} className="flex items-center gap-3 text-sm text-slate-800">
                                                                    <input
                                                                        type="checkbox"
                                                                        disabled={alreadySubmitted}
                                                                        checked={Array.isArray(answers[q.id]) ? (answers[q.id] as any[]).includes(opt) : false}
                                                                        onChange={() => toggleCheckbox(q.id, opt)}
                                                                        className="h-4 w-4 rounded"
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : null}

                                                    {q.type === 'short_text' ? (
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`q_${q.id}`} className="sr-only">
                                                                {q.label}
                                                            </Label>
                                                            <Input
                                                                id={`q_${q.id}`}
                                                                value={typeof answers[q.id] === 'string' ? answers[q.id] : ''}
                                                                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                                                                className="h-11"
                                                                disabled={alreadySubmitted}
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {q.type === 'long_text' ? (
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`q_${q.id}`} className="sr-only">
                                                                {q.label}
                                                            </Label>
                                                            <Textarea
                                                                id={`q_${q.id}`}
                                                                value={typeof answers[q.id] === 'string' ? answers[q.id] : ''}
                                                                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                                                                rows={4}
                                                                className="resize-none"
                                                                disabled={alreadySubmitted}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            onClick={submit}
                                            disabled={!canSubmit || submitting}
                                            className="h-11 bg-[#673ab7] text-white hover:bg-[#5e35b1]"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
