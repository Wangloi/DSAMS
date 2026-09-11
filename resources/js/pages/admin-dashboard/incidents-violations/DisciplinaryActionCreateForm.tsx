import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type {
    DisciplinaryActionType,
    StudentDisciplinaryStats,
    Violation,
} from './types';

interface DisciplinaryActionCreateFormProps {
    violations: Violation[];
    stats: StudentDisciplinaryStats | null;
    studentDbId: number | null;
    onCreate: (form: {
        recommended_action: DisciplinaryActionType;
        recommendation_reason: string;
        remarks: string;
    }) => void;
    onCancel: () => void;
    createSubmitting: boolean;
}

const CATEGORY_OPTIONS: DisciplinaryActionType[] = [
    'Warning',
    'Suspension',
    'Exclusion',
    'Expulsion',
];

export default function DisciplinaryActionCreateForm({
    violations,
    stats,
    studentDbId,
    onCreate,
    onCancel,
    createSubmitting,
}: DisciplinaryActionCreateFormProps) {
    const [createForm, setCreateForm] = useState({
        recommended_action: 'Warning' as DisciplinaryActionType,
        recommendation_reason: '',
        remarks: '',
    });

    const handleSubmit = () => {
        onCreate(createForm);
    };

    const relatedViolations = violations.filter(
        (v) => v.section === createForm.recommended_action,
    );

    return (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/10">
            <h5 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                New Disciplinary Action
            </h5>

            <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    Category
                </label>
                <select
                    value={createForm.recommended_action}
                    onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            recommended_action: e.target.value as DisciplinaryActionType,
                        })
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                {/* Warning count hint */}
                {stats &&
                    createForm.recommended_action === 'Warning' &&
                    stats.warning_count >= 2 && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-100 px-2 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                Student already has {stats.warning_count} warning(s). Next warning may trigger suspension.
                            </span>
                        </div>
                    )}
            </div>

            {/* Infraction list based on selected category */}
            {relatedViolations.length > 0 && (
                <div>
                    <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        Related Violations ({createForm.recommended_action})
                    </label>
                    <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                        {relatedViolations.map((v) => (
                            <div
                                key={v.id}
                                className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900/50"
                            >
                                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                <div className="min-w-0">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {v.code}
                                    </span>
                                    <span className="ml-1 font-medium text-slate-500 dark:text-slate-400">
                                        – {v.name}
                                    </span>
                                    {v.description && (
                                        <p className="mt-0.5 text-[10px] leading-snug font-medium text-slate-400 dark:text-slate-500">
                                            {v.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    Reason
                </label>
                <textarea
                    value={createForm.recommendation_reason}
                    onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            recommendation_reason: e.target.value,
                        })
                    }
                    rows={2}
                    placeholder="Describe the reason for this action..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
            </div>

            <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    Remarks (optional)
                </label>
                <textarea
                    value={createForm.remarks}
                    onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            remarks: e.target.value,
                        })
                    }
                    rows={2}
                    placeholder="Additional remarks..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-bold"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    className="h-8 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={createSubmitting || !studentDbId}
                >
                    {createSubmitting ? 'Creating...' : 'Create Action'}
                </Button>
            </div>
        </div>
    );
}
