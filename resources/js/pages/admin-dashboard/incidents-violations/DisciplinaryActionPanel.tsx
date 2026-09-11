import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Gavel,
    PlusCircle,
} from 'lucide-react';
import { useState } from 'react';
import DisciplinaryActionCreateForm from './DisciplinaryActionCreateForm';
import DisciplinaryActionItem from './DisciplinaryActionItem';
import type {
    DisciplinaryActionRecord,
    DisciplinaryActionType,
    StudentDisciplinaryStats,
    Violation,
} from './types';

interface DisciplinaryActionPanelProps {
    incidentId: number;
    studentDbId: number | null; // The actual DB id of the student (students.id)
    disciplinaryActions: DisciplinaryActionRecord[];
    violations: Violation[];
    stats: StudentDisciplinaryStats | null;
}

export default function DisciplinaryActionPanel({
    incidentId,
    studentDbId,
    disciplinaryActions,
    violations,
    stats,
}: DisciplinaryActionPanelProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const handleCreate = (form: {
        recommended_action: DisciplinaryActionType;
        recommendation_reason: string;
        remarks: string;
    }) => {
        if (!studentDbId) return;
        setCreateSubmitting(true);
        router.post(
            `/admin/incidents-violations/${incidentId}/disciplinary-action`,
            {
                student_id: studentDbId,
                recommended_action: form.recommended_action,
                recommendation_reason: form.recommendation_reason || null,
                remarks: form.remarks || null,
            },
            {
                onSuccess: () => {
                    setIsCreating(false);
                    setCreateSubmitting(false);
                },
                onError: () => setCreateSubmitting(false),
            },
        );
    };

    const handleReview = (
        actionId: number,
        form: {
            status: 'Approved' | 'Modified' | 'Overridden';
            final_action: DisciplinaryActionType | '';
            final_action_reason: string;
            remarks: string;
        },
    ) => {
        setReviewSubmitting(true);
        router.post(
            `/admin/disciplinary-action/${actionId}/review`,
            {
                status: form.status,
                final_action: form.final_action || null,
                final_action_reason: form.final_action_reason || null,
                remarks: form.remarks || null,
            },
            {
                onSuccess: () => {
                    setReviewSubmitting(false);
                },
                onError: () => setReviewSubmitting(false),
            },
        );
    };

    return (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
            <CardContent className="p-0">
                {/* Panel Header */}
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-6 pb-4 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-sm">
                            <Gavel className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                Disciplinary Actions
                            </h4>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {disciplinaryActions.length} action
                                {disciplinaryActions.length !== 1 ? 's' : ''}{' '}
                                recorded
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {stats && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {stats.next_sanction}
                            </span>
                        )}
                        {expanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                </button>

                {expanded && (
                    <div className="space-y-4 px-6 pb-6">
                        {/* Warning Count Alert */}
                        {stats && stats.warning_count >= 2 && (
                            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <span className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                                        {stats.warning_count} warning
                                        {stats.warning_count !== 1 ? 's' : ''}{' '}
                                        on record
                                    </span>
                                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                        Next sanction: {stats.next_sanction}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Existing Actions List */}
                        {disciplinaryActions.length > 0 && (
                            <div className="space-y-3">
                                {disciplinaryActions.map((action) => (
                                    <DisciplinaryActionItem
                                        key={action.id}
                                        action={action}
                                        onReview={handleReview}
                                        reviewSubmitting={reviewSubmitting}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {disciplinaryActions.length === 0 && !isCreating && (
                            <div className="px-4 py-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                                    <Gavel className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    No disciplinary actions recorded yet
                                </p>
                                <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    Add a disciplinary action to begin tracking this case
                                </p>
                            </div>
                        )}

                        {/* Create Form */}
                        {isCreating && (
                            <DisciplinaryActionCreateForm
                                violations={violations}
                                stats={stats}
                                studentDbId={studentDbId}
                                onCreate={handleCreate}
                                onCancel={() => setIsCreating(false)}
                                createSubmitting={createSubmitting}
                            />
                        )}

                        {/* Add Action Button */}
                        {!isCreating && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex h-9 w-full items-center gap-1.5 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E3A5F]/20 dark:text-slate-200 dark:hover:bg-[#1E3A5F]/40"
                                onClick={() => setIsCreating(true)}
                                disabled={!studentDbId}
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>Add Disciplinary Action</span>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
