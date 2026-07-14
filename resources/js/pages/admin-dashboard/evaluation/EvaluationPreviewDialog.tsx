import { Eye } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Question = {
    id: string;
    type: 'rating' | 'multiple_choice' | 'checkbox' | 'short_text' | 'long_text';
    label: string;
    required?: boolean;
    options?: string[];
};

type EvaluationForm = {
    id: number;
    name: string;
    event: string;
    event_id?: number | null;
    form_data?: {
        questions?: Question[];
    };
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    evaluation: EvaluationForm | null;
};

export default function EvaluationPreviewDialog({ open, onOpenChange, evaluation }: Props) {
    const questions = useMemo(() => {
        const qs = (evaluation as any)?.form_data?.questions ?? [];
        return Array.isArray(qs) ? qs : [];
    }, [evaluation]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <Eye className="h-5 w-5" />
                        </span>
                        <span className="text-slate-900 dark:text-white">Preview</span>
                        {evaluation ? <span className="text-slate-400 dark:text-slate-500">&gt;</span> : null}
                        {evaluation ? <span className="text-slate-700 dark:text-slate-300">{evaluation.name}</span> : null}
                    </DialogTitle>
                    <DialogDescription>Read-only preview of the evaluation form.</DialogDescription>
                </DialogHeader>

                {!evaluation ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-300">No evaluation selected.</div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="text-base font-semibold text-slate-900 dark:text-white">{evaluation.name}</div>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{evaluation.event}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={evaluation.is_active ? 'secondary' : 'outline'}>
                                        {evaluation.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {questions.length === 0 ? (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-700 dark:text-slate-300">No questions configured.</div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {idx + 1}. {q.label}{' '}
                                            {q.required ? <span className="text-rose-600 dark:text-rose-400">*</span> : null}
                                        </div>

                                        <div className="mt-3">
                                            {q.type === 'rating' ? (
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            disabled
                                                            className="h-10 w-10 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-semibold text-slate-500 dark:text-slate-400"
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {q.type === 'multiple_choice' ? (
                                                <div className="space-y-2">
                                                    {(q.options ?? []).map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <input type="radio" disabled />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {q.type === 'checkbox' ? (
                                                <div className="space-y-2">
                                                    {(q.options ?? []).map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <input type="checkbox" disabled />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : null}

                                            {q.type === 'short_text' ? (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`preview_q_${q.id}`} className="sr-only">
                                                        {q.label}
                                                    </Label>
                                                    <Input id={`preview_q_${q.id}`} disabled className="h-11" placeholder="Short answer text" />
                                                </div>
                                            ) : null}

                                            {q.type === 'long_text' ? (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`preview_q_${q.id}`} className="sr-only">
                                                        {q.label}
                                                    </Label>
                                                    <Textarea
                                                        id={`preview_q_${q.id}`}
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

                        <div className="flex justify-end border-t border-slate-200 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
