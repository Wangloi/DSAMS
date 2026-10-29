import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    isProcessing?: boolean;
    confirmDisabled?: boolean;
    onConfirm: () => void | Promise<void>;
    children?: React.ReactNode;
}

const variantStyles: Record<
    ConfirmationVariant,
    {
        icon: React.ComponentType<{ className?: string }>;
        iconBg: string;
        confirmButtonClass: string;
        confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    }
> = {
    danger: {
        icon: AlertTriangle,
        iconBg: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/40',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs',
        confirmButtonVariant: 'destructive',
    },
    warning: {
        icon: AlertCircle,
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40',
        confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs',
        confirmButtonVariant: 'default',
    },
    info: {
        icon: Info,
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40',
        confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs',
        confirmButtonVariant: 'default',
    },
    success: {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40',
        confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs',
        confirmButtonVariant: 'default',
    },
};

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    isProcessing = false,
    confirmDisabled = false,
    onConfirm,
    children,
}: ConfirmationDialogProps) {
    const config = variantStyles[variant];
    const IconComponent = config.icon;

    const handleConfirm = async () => {
        if (isProcessing || confirmDisabled) return;
        await onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isProcessing && onOpenChange(val)}>
            <DialogContent
                size="sm"
                preventClose={isProcessing}
                className="gap-5 p-6"
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs ${config.iconBg}`}
                        aria-hidden="true"
                    >
                        <IconComponent className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 space-y-1 pt-0.5">
                        <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {children && <div className="space-y-4 pt-1">{children}</div>}

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                        className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={config.confirmButtonVariant}
                        onClick={handleConfirm}
                        disabled={isProcessing || confirmDisabled}
                        className={`rounded-xl ${config.confirmButtonClass}`}
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmationDialog;
