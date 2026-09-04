import { Button } from '@/components/ui/button';
import { RotateCcw, Sparkles } from 'lucide-react';
import EvaluationQuestionEditCard from './EvaluationQuestionEditCard';
import EvaluationQuestionPreviewCard from './EvaluationQuestionPreviewCard';
import type { FormState, Question } from './types';

export default function EvaluationQuestionsSection({
    form,
    previewMode,
    addQuestion,
    moveQuestion,
    duplicateQuestion,
    removeQuestion,
    updateQuestion,
    updateOption,
    addOption,
    removeOption,
    resetToStandard,
}: {
    form: FormState;
    previewMode: boolean;
    addQuestion: (type: Question['type']) => void;
    moveQuestion: (id: string, direction: 'up' | 'down') => void;
    duplicateQuestion: (id: string) => void;
    removeQuestion: (id: string) => void;
    updateQuestion: (id: string, patch: Partial<Question>) => void;
    updateOption: (
        questionId: string,
        optionIndex: number,
        value: string,
    ) => void;
    addOption: (questionId: string) => void;
    removeOption: (questionId: string, optionIndex: number) => void;
    resetToStandard?: () => void;
}) {
    return (
        <div className="space-y-4">
            {/* Standard Template Notice */}
            <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/50 dark:bg-blue-950/30">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-blue-950 dark:text-blue-200">
                            Institutional Standard Evaluation Form
                        </div>
                        <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
                            Preloaded with standard questions: Standard 1 (The Presenter: 1-5 Scale), Standard 2 (Presentation: Yes/No), and Standard 3 (Qualitative Feedback).
                        </p>
                    </div>
                </div>
                {resetToStandard && !previewMode && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetToStandard}
                        className="h-8 shrink-0 gap-1.5 border-blue-300 bg-white text-xs font-semibold text-blue-800 hover:bg-blue-100/50 hover:text-blue-900 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to Standard Form
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Questions ({form.form_data.questions.length}) *
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Customize or add questions if needed
                    </p>
                </div>
                {!previewMode && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion('rating')}
                            className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                            </svg>
                            Rating
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion('multiple_choice')}
                            className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                />
                            </svg>
                            Multiple Choice
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion('checkbox')}
                            className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m-7 9h10a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            Checkbox
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion('short_text')}
                            className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                />
                            </svg>
                            Short Text
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion('long_text')}
                            className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-300"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Long Text
                        </Button>
                    </div>
                )}
            </div>

            {form.form_data.questions.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="mx-auto h-12 w-12 text-slate-400">
                        <svg
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">
                        No questions yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Get started by adding your first question using the
                        buttons above.
                    </p>
                </div>
            ) : previewMode ? (
                <div className="space-y-4">
                    {form.form_data.questions.map((q, idx) => (
                        <EvaluationQuestionPreviewCard
                            key={q.id}
                            q={q}
                            idx={idx}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {form.form_data.questions.map((q, idx) => (
                        <EvaluationQuestionEditCard
                            key={q.id}
                            q={q}
                            idx={idx}
                            totalQuestions={form.form_data.questions.length}
                            moveQuestion={moveQuestion}
                            duplicateQuestion={duplicateQuestion}
                            removeQuestion={removeQuestion}
                            updateQuestion={updateQuestion}
                            updateOption={updateOption}
                            addOption={addOption}
                            removeOption={removeOption}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
