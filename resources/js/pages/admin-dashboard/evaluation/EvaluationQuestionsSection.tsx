import { Button } from '@/components/ui/button';
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
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Questions *
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Add and configure your evaluation questions
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
