import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Question } from './types';

export default function EvaluationQuestionEditCard({
    q,
    idx,
    totalQuestions,
    moveQuestion,
    duplicateQuestion,
    removeQuestion,
    updateQuestion,
    updateOption,
    addOption,
    removeOption,
}: {
    q: Question;
    idx: number;
    totalQuestions: number;
    moveQuestion: (id: string, direction: 'up' | 'down') => void;
    duplicateQuestion: (id: string) => void;
    removeQuestion: (id: string) => void;
    updateQuestion: (id: string, patch: Partial<Question>) => void;
    updateOption: (questionId: string, optionIndex: number, value: string) => void;
    addOption: (questionId: string) => void;
    removeOption: (questionId: string, optionIndex: number) => void;
}) {
    return (
        <div className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex">
                <div className="w-1 bg-[#23509A] group-hover:bg-[#1e4a8a] transition-colors"></div>
                <div className="flex-1 p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Question {idx + 1}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{q.type.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(q.id, 'up')}
                                disabled={idx === 0}
                                className="h-8 w-8 p-0"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(q.id, 'down')}
                                disabled={idx === totalQuestions - 1}
                                className="h-8 w-8 p-0"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateQuestion(q.id)}
                                className="h-8 w-8 p-0"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(q.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question Text *</Label>
                            <Input
                                value={q.label}
                                onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                                placeholder="Enter your question here..."
                                className="text-base dark:bg-slate-700 dark:text-slate-300"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question Type *</Label>
                                <Select
                                    value={q.type}
                                    onValueChange={(v) =>
                                        updateQuestion(q.id, {
                                            type: v as Question['type'],
                                            options:
                                                v === 'multiple_choice' || v === 'checkbox'
                                                    ? Array.isArray(q.options) && q.options.length > 0
                                                        ? q.options
                                                        : ['Option 1']
                                                    : undefined,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rating">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                    />
                                                </svg>
                                                Rating
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="multiple_choice">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                                    />
                                                </svg>
                                                Multiple Choice
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="checkbox">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m-7 9h10a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                Checkboxes
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="short_text">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                    />
                                                </svg>
                                                Short Text
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="long_text">
                                            <div className="flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                Long Text
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 pt-6">
                                <input
                                    id={`required-${q.id}`}
                                    type="checkbox"
                                    checked={Boolean(q.required)}
                                    onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                    className="h-4 w-4 text-[#23509A] focus:ring-[#23509A] border-slate-300 dark:border-slate-600 rounded"
                                />
                                <Label htmlFor={`required-${q.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Required question
                                </Label>
                            </div>
                        </div>

                        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer Options *</Label>
                                <div className="space-y-2">
                                    {(q.options ?? []).map((opt, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                                className="flex-1 dark:bg-slate-700 dark:text-slate-300"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeOption(q.id, i)}
                                                disabled={(q.options ?? []).length <= 1}
                                                className="h-8 w-8 p-0 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(q.id)}
                                    className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                    Add Option
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
