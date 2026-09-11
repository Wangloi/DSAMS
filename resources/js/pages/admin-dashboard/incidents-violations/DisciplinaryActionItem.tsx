import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, MessageSquare, Shield } from 'lucide-react';
import { useState } from 'react';
import type {
    DisciplinaryActionRecord,
    DisciplinaryActionType,
} from './types';

interface DisciplinaryActionItemProps {
    action: DisciplinaryActionRecord;
    onReview: (
        actionId: number,
        form: {
            status: 'Approved' | 'Modified' | 'Overridden';
            final_action: DisciplinaryActionType | '';
            final_action_reason: string;
            remarks: string;
        },
    ) => void;
    reviewSubmitting: boolean;
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

const CATEGORY_OPTIONS: DisciplinaryActionType[] = [
    'Warning',
    'Suspension',
    'Exclusion',
    'Expulsion',
];

export default function DisciplinaryActionItem({
    action,
    onReview,
    reviewSubmitting,
}: DisciplinaryActionItemProps) {
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        status: 'Approved' as 'Approved' | 'Modified' | 'Overridden',
        final_action: (action.recommended_action || 'Warning') as DisciplinaryActionType | '',
        final_action_reason: '',
        remarks: '',
    });

    const effectiveAction = action.final_action || action.recommended_action;
    const colors = ACTION_COLORS[effectiveAction] || ACTION_COLORS.Warning;
    const statusBadge = STATUS_BADGE[action.status] || STATUS_BADGE.Pending;

    const handleSubmitReview = () => {
        onReview(action.id, reviewForm);
    };

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${colors.dot} mt-0.5 shrink-0`} />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-extrabold ${colors.text}`}>
                                {effectiveAction}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-black tracking-wide uppercase ${statusBadge.className}`}
                            >
                                {statusBadge.icon}
                                {action.status}
                            </span>
                        </div>
                        {action.recommendation_reason && (
                            <p className="mt-1 text-[11px] leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                {action.recommendation_reason}
                            </p>
                        )}
                        {action.remarks && (
                            <p className="mt-1 text-[10px] font-medium text-slate-500 italic dark:text-slate-400">
                                Remarks: {action.remarks}
                            </p>
                        )}
                        {action.reviewed_by && (
                            <p className="mt-1.5 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                                Reviewed by {action.reviewed_by} ·{' '}
                                {action.reviewed_at
                                    ? new Date(action.reviewed_at).toLocaleDateString()
                                    : ''}
                            </p>
                        )}
                        <p className="mt-0.5 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                            Created{' '}
                            {action.created_at
                                ? new Date(action.created_at).toLocaleDateString()
                                : '—'}
                        </p>
                    </div>
                </div>

                {action.status === 'Pending' && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 text-[10px] font-bold"
                        onClick={() => {
                            setIsReviewing(!isReviewing);
                            setReviewForm({
                                status: 'Approved',
                                final_action: action.recommended_action,
                                final_action_reason: '',
                                remarks: '',
                            });
                        }}
                    >
                        {isReviewing ? 'Cancel' : 'Review'}
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
                                value={reviewForm.status}
                                onChange={(e) =>
                                    setReviewForm({
                                        ...reviewForm,
                                        status: e.target.value as typeof reviewForm.status,
                                    })
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="Approved">Approve</option>
                                <option value="Modified">Modify</option>
                                <option value="Overridden">Override</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Final Action
                            </label>
                            <select
                                value={reviewForm.final_action}
                                onChange={(e) =>
                                    setReviewForm({
                                        ...reviewForm,
                                        final_action: e.target.value as DisciplinaryActionType,
                                    })
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                            Reason
                        </label>
                        <textarea
                            value={reviewForm.final_action_reason}
                            onChange={(e) =>
                                setReviewForm({
                                    ...reviewForm,
                                    final_action_reason: e.target.value,
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
                            value={reviewForm.remarks}
                            onChange={(e) =>
                                setReviewForm({
                                    ...reviewForm,
                                    remarks: e.target.value,
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
                            onClick={() => setIsReviewing(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700"
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                        >
                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
