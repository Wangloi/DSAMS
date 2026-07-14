import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from './types';

export default function EvaluationQuestionPreviewCard({
    q,
    idx,
}: {
    q: Question;
    idx: number;
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {idx + 1}. {q.label || 'Untitled question'} {q.required ? <span className="text-rose-600 dark:text-rose-400">*</span> : null}
            </div>
            <div className="mt-3">
                {q.type === 'rating' && (
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
                )}
                {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                        {(q.options ?? []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input type="radio" disabled />
                                <span>{opt || `Option ${i + 1}`}</span>
                            </label>
                        ))}
                    </div>
                )}
                {q.type === 'checkbox' && (
                    <div className="space-y-2">
                        {(q.options ?? []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input type="checkbox" disabled />
                                <span>{opt || `Option ${i + 1}`}</span>
                            </label>
                        ))}
                    </div>
                )}
                {q.type === 'short_text' && (
                    <Input disabled placeholder="Short answer text" className="dark:bg-slate-700 dark:text-slate-300" />
                )}
                {q.type === 'long_text' && (
                    <Textarea disabled rows={4} className="resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400" placeholder="Long answer text" />
                )}
            </div>
        </div>
    );
}
