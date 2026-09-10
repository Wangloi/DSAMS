import React from 'react';
import { Button } from '@/components/ui/button';

interface ReportIncidentFooterProps {
    reportStep: number;
    reportProcessing: boolean;
    onBack: () => void;
    onCancel: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export function ReportIncidentFooter({
    reportStep,
    reportProcessing,
    onBack,
    onCancel,
    onNext,
    onSubmit,
}: ReportIncidentFooterProps) {
    return (
        <div className="dark:border-slate-850 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
                {reportStep > 1 && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={onBack}
                    >
                        Back
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {reportStep < 3 ? (
                    <Button
                        type="button"
                        className="h-10 rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-5 font-bold text-white shadow-md hover:opacity-90"
                        onClick={onNext}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        type="button"
                        className="h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 font-bold text-white shadow-md hover:opacity-90"
                        disabled={reportProcessing}
                        onClick={onSubmit}
                    >
                        {reportProcessing ? 'Processing...' : 'Submit Report'}
                    </Button>
                )}
            </div>
        </div>
    );
}
