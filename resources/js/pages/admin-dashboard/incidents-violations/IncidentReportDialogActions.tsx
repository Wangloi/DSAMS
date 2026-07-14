import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

type Props = {
    isViewMode: boolean;
    hasInitialValues: boolean;
    onToggleEditMode: () => void;
    onClose: () => void;
    canSubmit: boolean;
    onSubmit: () => void;
    submitLabel: string;
};

export default function IncidentReportDialogActions({
    isViewMode,
    hasInitialValues,
    onToggleEditMode,
    onClose,
    canSubmit,
    onSubmit,
    submitLabel,
}: Props) {
    return (
        <DialogFooter className="border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-6 py-4">
            <div className="flex items-center gap-2">
                {isViewMode && hasInitialValues ? (
                    <Button
                        type="button"
                        variant="default"
                        className="h-10 bg-blue-600 hover:bg-blue-700"
                        onClick={onToggleEditMode}
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                ) : null}
                <Button type="button" variant="outline" className="h-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={onClose}>
                    {isViewMode ? 'Close' : 'Cancel'}
                </Button>
            </div>
            {!isViewMode ? (
                <Button
                    type="button"
                    className="h-10 bg-red-600 hover:bg-red-700"
                    disabled={!canSubmit}
                    onClick={onSubmit}
                >
                    {submitLabel}
                </Button>
            ) : null}
        </DialogFooter>
    );
}
