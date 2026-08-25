import { adminEvaluationStore, adminEvaluationUpdate } from '@/routes';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import EvaluationFormActions from './EvaluationFormActions';
import EvaluationFormDetails from './EvaluationFormDetails';
import EvaluationFormHeader from './EvaluationFormHeader';
import EvaluationQuestionsSection from './EvaluationQuestionsSection';
import type { EvaluationForm, EventOption, FormState, Question } from './types';

const emptyForm: FormState = {
    name: '',
    description: '',
    eventId: '',
    is_active: false,
    form_data: {
        questions: [],
    },
};

type Props = {
    onClose: () => void;
    editingEvaluation: EvaluationForm | null;
    events: EventOption[];
    initialFormState?: Partial<FormState> | null;
};

export default function EvaluationFormDialog({
    onClose,
    editingEvaluation,
    events,
    initialFormState,
}: Props) {
    const [form, setForm] = useState<FormState>(emptyForm);
    const [previewMode, setPreviewMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const canSubmit = useMemo(() => {
        if (!String(form.name).trim()) return false;
        if (!String(form.eventId).trim()) return false;
        if (
            !Array.isArray(form.form_data.questions) ||
            form.form_data.questions.length === 0
        )
            return false;

        for (const q of form.form_data.questions) {
            if (!String(q.label ?? '').trim()) return false;
            if (
                (q.type === 'multiple_choice' || q.type === 'checkbox') &&
                (!Array.isArray(q.options) || q.options.length === 0)
            )
                return false;
        }

        return true;
    }, [form]);

    useEffect(() => {
        if (editingEvaluation) {
            setForm({
                name: editingEvaluation.name,
                description: editingEvaluation.description ?? '',
                eventId: editingEvaluation.event_id
                    ? String(editingEvaluation.event_id)
                    : '',
                is_active: editingEvaluation.is_active,
                form_data: {
                    questions: Array.isArray(
                        (editingEvaluation as any)?.form_data?.questions,
                    )
                        ? ((editingEvaluation as any).form_data
                              .questions as Question[])
                        : [],
                },
            });
        } else if (initialFormState) {
            setForm({
                name: initialFormState.name ?? '',
                description: initialFormState.description ?? '',
                eventId: initialFormState.eventId ?? '',
                is_active: initialFormState.is_active ?? false,
                form_data: {
                    questions: initialFormState.form_data?.questions ?? [],
                },
            });
        } else {
            setForm(emptyForm);
        }
    }, [editingEvaluation, initialFormState]);

    const onSubmit = () => {
        setIsProcessing(true);
        const data = {
            name: form.name,
            description: form.description,
            eventId: Number(form.eventId),
            form_data: form.form_data,
        };

        if (editingEvaluation) {
            const evaluationId = (editingEvaluation as any)?.id;
            if (!evaluationId) {
                console.error(
                    'EvaluationFormDialog: missing evaluation id for update',
                    editingEvaluation,
                );
                setIsProcessing(false);
                return;
            }

            router.post(
                adminEvaluationUpdate(evaluationId),
                {
                    ...data,
                    _method: 'put',
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onClose();
                    },
                    onFinish: () => {
                        setIsProcessing(false);
                    },
                },
            );
        } else {
            router.post(adminEvaluationStore(), data, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onFinish: () => {
                    setIsProcessing(false);
                },
            });
        }
    };

    const addQuestion = (type: Question['type']) => {
        const id = `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: [
                    ...p.form_data.questions,
                    {
                        id,
                        type,
                        label: '',
                        required: true,
                        options:
                            type === 'multiple_choice' || type === 'checkbox'
                                ? ['Option 1']
                                : undefined,
                    },
                ],
            },
        }));
    };

    const updateQuestion = (id: string, patch: Partial<Question>) => {
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: p.form_data.questions.map((q) =>
                    q.id === id ? { ...q, ...patch } : q,
                ),
            },
        }));
    };

    const duplicateQuestion = (id: string) => {
        setForm((p) => {
            const idx = p.form_data.questions.findIndex((q) => q.id === id);
            if (idx === -1) return p;
            const q = p.form_data.questions[idx];
            const newId = `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            const clone: Question = {
                ...q,
                id: newId,
                label: q.label,
                options: Array.isArray(q.options) ? [...q.options] : undefined,
            };
            const questions = [...p.form_data.questions];
            questions.splice(idx + 1, 0, clone);
            return {
                ...p,
                form_data: {
                    ...p.form_data,
                    questions,
                },
            };
        });
    };

    const moveQuestion = (id: string, direction: 'up' | 'down') => {
        setForm((p) => {
            const idx = p.form_data.questions.findIndex((q) => q.id === id);
            if (idx === -1) return p;
            const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (nextIdx < 0 || nextIdx >= p.form_data.questions.length)
                return p;
            const questions = [...p.form_data.questions];
            const [item] = questions.splice(idx, 1);
            questions.splice(nextIdx, 0, item);
            return {
                ...p,
                form_data: {
                    ...p.form_data,
                    questions,
                },
            };
        });
    };

    const updateOption = (
        questionId: string,
        optionIndex: number,
        value: string,
    ) => {
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: p.form_data.questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const options = Array.isArray(q.options)
                        ? [...q.options]
                        : [];
                    options[optionIndex] = value;
                    return { ...q, options };
                }),
            },
        }));
    };

    const addOption = (questionId: string) => {
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: p.form_data.questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const options = Array.isArray(q.options)
                        ? [...q.options]
                        : [];
                    options.push(`Option ${options.length + 1}`);
                    return { ...q, options };
                }),
            },
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: p.form_data.questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const options = Array.isArray(q.options)
                        ? [...q.options]
                        : [];
                    options.splice(optionIndex, 1);
                    return { ...q, options };
                }),
            },
        }));
    };

    const removeQuestion = (id: string) => {
        setForm((p) => ({
            ...p,
            form_data: {
                ...p.form_data,
                questions: p.form_data.questions.filter((q) => q.id !== id),
            },
        }));
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <EvaluationFormHeader
                onClose={onClose}
                editingEvaluation={editingEvaluation}
                previewMode={previewMode}
                onTogglePreview={() => setPreviewMode((p) => !p)}
            />

            {/* Form Details Card */}
            <EvaluationFormDetails
                form={form}
                onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                events={events}
            />

            {/* Questions Section */}
            <EvaluationQuestionsSection
                form={form}
                previewMode={previewMode}
                addQuestion={addQuestion}
                moveQuestion={moveQuestion}
                duplicateQuestion={duplicateQuestion}
                removeQuestion={removeQuestion}
                updateQuestion={updateQuestion}
                updateOption={updateOption}
                addOption={addOption}
                removeOption={removeOption}
            />

            {/* Form Actions */}
            <EvaluationFormActions
                onClose={onClose}
                onSubmit={onSubmit}
                canSubmit={canSubmit}
                isProcessing={isProcessing}
                editingEvaluation={editingEvaluation}
            />
        </div>
    );
}
