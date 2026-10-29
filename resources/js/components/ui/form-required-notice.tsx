import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormRequiredNoticeProps {
    message?: string;
    className?: string;
    variant?: 'subtle' | 'badge' | 'callout';
}

/**
 * Standard Form Required Instruction banner / badge.
 * Informs users of required fields across forms and dialogs in DSAMS.
 */
export function FormRequiredNotice({
    message = 'Fields marked with * or Required must be completed.',
    className,
    variant = 'subtle',
}: FormRequiredNoticeProps) {
    if (variant === 'callout') {
        return (
            <div
                role="note"
                className={cn(
                    'flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
                    className
                )}
            >
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="font-medium">{message}</span>
            </div>
        );
    }

    return (
        <div
            role="note"
            className={cn(
                'flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400',
                className
            )}
        >
            <span className="inline-flex items-center gap-1 rounded-md border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                <span className="text-red-500 font-black" aria-hidden="true">*</span> Required
            </span>
            <span>{message}</span>
        </div>
    );
}

export default FormRequiredNotice;
