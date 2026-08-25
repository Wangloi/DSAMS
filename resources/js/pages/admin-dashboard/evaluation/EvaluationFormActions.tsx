import { Button } from '@/components/ui/button';
import type { EvaluationForm } from './types';

export default function EvaluationFormActions({
    onClose,
    onSubmit,
    canSubmit,
    isProcessing,
    editingEvaluation,
}: {
    onClose: () => void;
    onSubmit: () => void;
    canSubmit: boolean;
    isProcessing?: boolean;
    editingEvaluation: EvaluationForm | null;
}) {
    return (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
            <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="sm:w-auto dark:border-slate-600 dark:text-slate-300"
            >
                Cancel
            </Button>
            <Button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || isProcessing}
                className="bg-[#23509A] hover:bg-[#1e4a8a] sm:w-auto"
            >
                {isProcessing
                    ? 'Saving...'
                    : editingEvaluation
                      ? 'Update Evaluation'
                      : 'Create Evaluation'}
            </Button>
        </div>
    );
}
