import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { studentDashboard, studentEvaluationSubmit } from '@/routes';
import { 
    ChevronLeft, 
    ClipboardList, 
    Star, 
    CheckCircle2, 
    Send, 
    Sparkles, 
    AlertCircle,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const answeredCount = useMemo(() => {
        let count = 0;
        for (const q of questions) {
            const v = answers[q.id];
            if (q.type === 'rating' && v && Number(v) > 0) count++;
            else if (q.type === 'checkbox' && Array.isArray(v) && v.length > 0) count++;
            else if (typeof v === 'string' && v.trim() !== '') count++;
        }
        return count;
    }, [answers, questions]);

    const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

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
            }
        );
    };

    if (alreadySubmitted) {
        return (
            <>
                <Head title={`Evaluation: ${evaluation.name}`} />
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-800">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">All Done!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                            You've already submitted the evaluation for <br/><span className="font-bold text-slate-700 dark:text-slate-300">{evaluation.name}</span>. 
                            Thank you for your valuable feedback!
                        </p>
                        <Button 
                            className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold tracking-wide hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" 
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
            
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] pb-24">
                {/* Hero Header */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pb-20 pt-8 px-4 overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[120%] bg-sky-300/20 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="max-w-3xl mx-auto relative z-10">
                        <button 
                            onClick={() => router.visit(studentDashboard())}
                            className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 text-sm font-bold tracking-wide uppercase"
                        >
                            <div className="bg-white/10 group-hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </div>
                            Dashboard
                        </button>

                        <div className="flex flex-col md:flex-row gap-6 md:items-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-xl">
                                <ClipboardList className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                                    {evaluation.name}
                                </h1>
                                <p className="text-blue-100 font-medium text-sm md:text-base flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-sky-300" />
                                    {evaluation.eventLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
                    
                    {/* Progress Bar Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-5 md:p-6 mb-8 border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Progress</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{answeredCount} of {questions.length}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-700 ease-out" 
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                        {progressPercentage === 100 && (
                            <div className="hidden sm:flex bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 p-2 rounded-full">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    {questions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-lg border border-slate-100 dark:border-slate-800">
                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No questions available</h3>
                            <p className="text-slate-500 text-sm mt-2">This evaluation form has not been configured yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && (!Array.isArray(answers[q.id]) || answers[q.id].length > 0);
                                
                                return (
                                    <div 
                                        key={q.id} 
                                        className={cn(
                                            "bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border transition-all duration-300 relative overflow-hidden group",
                                            isAnswered ? "border-indigo-100 dark:border-indigo-900/50 shadow-indigo-100/20" : "border-slate-200 dark:border-slate-800"
                                        )}
                                    >
                                        {/* Question Number Badge */}
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm transition-colors",
                                                isAnswered ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div className="pt-1">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                                    {q.label}
                                                    {q.required && <span className="text-rose-500 ml-1.5">*</span>}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Input Types */}
                                        <div className="pl-0 md:pl-12">
                                            {/* RATING */}
                                            {q.type === 'rating' && (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {[1, 2, 3, 4, 5].map((n) => {
                                                        const isSelected = Number(answers[q.id]) === n;
                                                        return (
                                                            <button
                                                                key={n}
                                                                type="button"
                                                                onClick={() => setAnswers((p) => ({ ...p, [q.id]: n }))}
                                                                className={cn(
                                                                    "h-14 flex-1 min-w-[50px] max-w-[80px] rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all duration-200 transform hover:scale-105 active:scale-95",
                                                                    isSelected 
                                                                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" 
                                                                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10"
                                                                )}
                                                            >
                                                                {n}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* MULTIPLE CHOICE (Radio) */}
                                            {q.type === 'multiple_choice' && (
                                                <div className="grid gap-3">
                                                    {(q.options ?? []).map((opt) => {
                                                        const isSelected = answers[q.id] === opt;
                                                        return (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                                                                className={cn(
                                                                    "w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group",
                                                                    isSelected
                                                                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20"
                                                                        : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500/30"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "font-medium transition-colors",
                                                                    isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {opt}
                                                                </span>
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                                    isSelected ? "border-indigo-600" : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-300"
                                                                )}>
                                                                    {isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* CHECKBOX */}
                                            {q.type === 'checkbox' && (
                                                <div className="grid gap-3">
                                                    {(q.options ?? []).map((opt) => {
                                                        const isSelected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                                        return (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => toggleCheckbox(q.id, opt)}
                                                                className={cn(
                                                                    "w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group",
                                                                    isSelected
                                                                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20"
                                                                        : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500/30"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "font-medium transition-colors",
                                                                    isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {opt}
                                                                </span>
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                                                                    isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-300"
                                                                )}>
                                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* SHORT TEXT */}
                                            {q.type === 'short_text' && (
                                                <Input
                                                    value={typeof answers[q.id] === 'string' ? answers[q.id] : ''}
                                                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                                                    placeholder="Type your answer here..."
                                                    className="h-14 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 focus:ring-2 focus:ring-indigo-500/20 text-base"
                                                />
                                            )}

                                            {/* LONG TEXT */}
                                            {q.type === 'long_text' && (
                                                <Textarea
                                                    value={typeof answers[q.id] === 'string' ? answers[q.id] : ''}
                                                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                                                    placeholder="Share your detailed feedback..."
                                                    rows={4}
                                                    className="resize-y rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Submit Bar */}
                {questions.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        <div className="max-w-3xl mx-auto flex items-center justify-between">
                            <div className="hidden sm:block text-sm font-medium text-slate-500 dark:text-slate-400">
                                {progressPercentage === 100 
                                    ? "All questions answered. You're ready to submit!" 
                                    : "Please complete all required fields."}
                            </div>
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={!canSubmit || submitting}
                                className={cn(
                                    "h-14 px-8 rounded-2xl font-black tracking-widest uppercase transition-all duration-300 ml-auto w-full sm:w-auto",
                                    canSubmit 
                                        ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-1 text-white" 
                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                                )}
                            >
                                {submitting ? 'Submitting...' : 'Submit Evaluation'}
                                {!submitting && <Send className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
