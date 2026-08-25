import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Gavel,
    MessageSquare,
    PlusCircle,
    Shield,
} from 'lucide-react';
import { useState } from 'react';
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

const ACTION_COLORS: Record<
    DisciplinaryActionType,
    { bg: string; text: string; border: string; dot: string }
> = {
    Warning: {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-900/40',
        dot: 'bg-amber-500',
    },
    Suspension: {
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-900/40',
        dot: 'bg-orange-500',
    },
    Exclusion: {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-900/40',
        dot: 'bg-rose-500',
    },
    Expulsion: {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-800 dark:text-red-400',
        border: 'border-red-200 dark:border-red-900/40',
        dot: 'bg-red-600',
    },
};

const STATUS_BADGE: Record<
    string,
    { className: string; icon: React.ReactNode }
> = {
    Pending: {
        className:
            'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
        icon: <Clock className="mr-0.5 h-3 w-3" />,
    },
    Approved: {
        className:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
        icon: <CheckCircle2 className="mr-0.5 h-3 w-3" />,
    },
    Modified: {
        className:
            'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
        icon: <MessageSquare className="mr-0.5 h-3 w-3" />,
    },
    Overridden: {
        className:
            'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50',
        icon: <Shield className="mr-0.5 h-3 w-3" />,
    },
};

export default function DisciplinaryActionPanel({
    incidentId,
    studentDbId,
    disciplinaryActions,
    violations,
    stats,
}: DisciplinaryActionPanelProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(true);

    // Create form state
    const [createForm, setCreateForm] = useState({
        recommended_action: 'Warning' as DisciplinaryActionType,
        recommendation_reason: '',
        remarks: '',
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    // Review form state
    const [reviewForm, setReviewForm] = useState({
        status: 'Approved' as 'Approved' | 'Modified' | 'Overridden',
        final_action: '' as DisciplinaryActionType | '',
        final_action_reason: '',
        remarks: '',
    });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const handleCreate = () => {
        if (!studentDbId) return;
        setCreateSubmitting(true);
        router.post(
            `/admin/incidents-violations/${incidentId}/disciplinary-action`,
            {
                student_id: studentDbId,
                recommended_action: createForm.recommended_action,
                recommendation_reason: createForm.recommendation_reason || null,
                remarks: createForm.remarks || null,
            },
            {
                onSuccess: () => {
                    setIsCreating(false);
                    setCreateForm({
                        recommended_action: 'Warning',
                        recommendation_reason: '',
                        remarks: '',
                    });
                    setCreateSubmitting(false);
                },
                onError: () => setCreateSubmitting(false),
            },
        );
    };

    const handleReview = (actionId: number) => {
        setReviewSubmitting(true);
        router.post(
            `/admin/disciplinary-action/${actionId}/review`,
            {
                status: reviewForm.status,
                final_action: reviewForm.final_action || null,
                final_action_reason: reviewForm.final_action_reason || null,
                remarks: reviewForm.remarks || null,
            },
            {
                onSuccess: () => {
                    setReviewingId(null);
                    setReviewForm({
                        status: 'Approved',
                        final_action: '',
                        final_action_reason: '',
                        remarks: '',
                    });
                    setReviewSubmitting(false);
                },
                onError: () => setReviewSubmitting(false),
            },
        );
    };

    const categoryOptions: DisciplinaryActionType[] = [
        'Warning',
        'Suspension',
        'Exclusion',
        'Expulsion',
    ];

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
                                {disciplinaryActions.length !== 1
                                    ? 's'
                                    : ''}{' '}
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
                                        {stats.warning_count !== 1
                                            ? 's'
                                            : ''}{' '}
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
                                {disciplinaryActions.map((action) => {
                                    const effectiveAction =
                                        action.final_action ||
                                        action.recommended_action;
                                    const colors =
                                        ACTION_COLORS[effectiveAction];
                                    const statusBadge =
                                        STATUS_BADGE[action.status] ||
                                        STATUS_BADGE.Pending;
                                    const isReviewing =
                                        reviewingId === action.id;

                                    return (
                                        <div
                                            key={action.id}
                                            className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <span
                                                        className={`h-2.5 w-2.5 rounded-full ${colors.dot} mt-0.5 shrink-0`}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={`text-xs font-extrabold ${colors.text}`}
                                                            >
                                                                {
                                                                    effectiveAction
                                                                }
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-black tracking-wide uppercase ${statusBadge.className}`}
                                                            >
                                                                {
                                                                    statusBadge.icon
                                                                }
                                                                {action.status}
                                                            </span>
                                                        </div>
                                                        {action.recommendation_reason && (
                                                            <p className="mt-1 text-[11px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                                                {
                                                                    action.recommendation_reason
                                                                }
                                                            </p>
                                                        )}
                                                        {action.remarks && (
                                                            <p className="dark:text-slate-450 mt-1 text-[10px] font-medium text-slate-500 italic">
                                                                Remarks:{' '}
                                                                {action.remarks}
                                                            </p>
                                                        )}
                                                        {action.reviewed_by && (
                                                            <p className="mt-1.5 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                                                                Reviewed by{' '}
                                                                {
                                                                    action.reviewed_by
                                                                }{' '}
                                                                ·{' '}
                                                                {action.reviewed_at
                                                                    ? new Date(
                                                                          action.reviewed_at,
                                                                      ).toLocaleDateString()
                                                                    : ''}
                                                            </p>
                                                        )}
                                                        <p className="mt-0.5 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                                                            Created{' '}
                                                            {action.created_at
                                                                ? new Date(
                                                                      action.created_at,
                                                                  ).toLocaleDateString()
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {action.status ===
                                                    'Pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 shrink-0 text-[10px] font-bold"
                                                        onClick={() => {
                                                            setReviewingId(
                                                                isReviewing
                                                                    ? null
                                                                    : action.id,
                                                            );
                                                            setReviewForm({
                                                                status: 'Approved',
                                                                final_action:
                                                                    action.recommended_action,
                                                                final_action_reason:
                                                                    '',
                                                                remarks: '',
                                                            });
                                                        }}
                                                    >
                                                        {isReviewing
                                                            ? 'Cancel'
                                                            : 'Review'}
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Review Form (inline) */}
                                            {isReviewing && (
                                                <div className="mt-4 space-y-3 border-t border-slate-200/60 pt-4 dark:border-slate-700/40">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                                Decision
                                                            </label>
                                                            <select
                                                                value={
                                                                    reviewForm.status
                                                                }
                                                                onChange={(e) =>
                                                                    setReviewForm(
                                                                        {
                                                                            ...reviewForm,
                                                                            status: e
                                                                                .target
                                                                                .value as typeof reviewForm.status,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                            >
                                                                <option value="Approved">
                                                                    Approve
                                                                </option>
                                                                <option value="Modified">
                                                                    Modify
                                                                </option>
                                                                <option value="Overridden">
                                                                    Override
                                                                </option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                                Final Action
                                                            </label>
                                                            <select
                                                                value={
                                                                    reviewForm.final_action
                                                                }
                                                                onChange={(e) =>
                                                                    setReviewForm(
                                                                        {
                                                                            ...reviewForm,
                                                                            final_action:
                                                                                e
                                                                                    .target
                                                                                    .value as DisciplinaryActionType,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                            >
                                                                {categoryOptions.map(
                                                                    (c) => (
                                                                        <option
                                                                            key={
                                                                                c
                                                                            }
                                                                            value={
                                                                                c
                                                                            }
                                                                        >
                                                                            {c}
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            Reason
                                                        </label>
                                                        <textarea
                                                            value={
                                                                reviewForm.final_action_reason
                                                            }
                                                            onChange={(e) =>
                                                                setReviewForm({
                                                                    ...reviewForm,
                                                                    final_action_reason:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            rows={2}
                                                            placeholder="Reason for decision..."
                                                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            Remarks
                                                        </label>
                                                        <textarea
                                                            value={
                                                                reviewForm.remarks
                                                            }
                                                            onChange={(e) =>
                                                                setReviewForm({
                                                                    ...reviewForm,
                                                                    remarks:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            rows={2}
                                                            placeholder="Additional remarks..."
                                                            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-[10px] font-bold"
                                                            onClick={() =>
                                                                setReviewingId(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700"
                                                            onClick={() =>
                                                                handleReview(
                                                                    action.id,
                                                                )
                                                            }
                                                            disabled={
                                                                reviewSubmitting
                                                            }
                                                        >
                                                            {reviewSubmitting
                                                                ? 'Submitting...'
                                                                : 'Submit Review'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
                                    Add a disciplinary action to begin tracking
                                    this case
                                </p>
                            </div>
                        )}

                        {/* Create Form */}
                        {isCreating && (
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
                                                recommended_action: e.target
                                                    .value as DisciplinaryActionType,
                                            })
                                        }
                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        {categoryOptions.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Warning count hint */}
                                    {stats &&
                                        createForm.recommended_action ===
                                            'Warning' &&
                                        stats.warning_count >= 2 && (
                                            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-100 px-2 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                                                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                                    Student already has{' '}
                                                    {stats.warning_count}{' '}
                                                    warning(s). Next warning may
                                                    trigger suspension.
                                                </span>
                                            </div>
                                        )}
                                </div>

                                {/* Infraction list based on selected category */}
                                {violations.filter(
                                    (v) =>
                                        v.section ===
                                        createForm.recommended_action,
                                ).length > 0 && (
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                            Related Violations (
                                            {createForm.recommended_action})
                                        </label>
                                        <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                                            {violations
                                                .filter(
                                                    (v) =>
                                                        v.section ===
                                                        createForm.recommended_action,
                                                )
                                                .map((v) => (
                                                    <div
                                                        key={v.id}
                                                        className="border-slate-150 flex items-start gap-2 rounded-lg border bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900/50"
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
                                                                    {
                                                                        v.description
                                                                    }
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
                                                recommendation_reason:
                                                    e.target.value,
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
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                                        onClick={handleCreate}
                                        disabled={
                                            createSubmitting || !studentDbId
                                        }
                                    >
                                        {createSubmitting
                                            ? 'Creating...'
                                            : 'Create Action'}
                                    </Button>
                                </div>
                            </div>
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
