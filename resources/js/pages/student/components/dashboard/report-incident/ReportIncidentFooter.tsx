import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, ShieldCheck } from 'lucide-react';

interface ReportIncidentFooterProps {
    reportStep: number;
    reportProcessing: boolean;
    isAnonymous?: boolean;
    onBack: () => void;
    onCancel: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export function ReportIncidentFooter({
    reportStep,
    reportProcessing,
    isAnonymous = false,
    onBack,
    onCancel,
    onNext,
    onSubmit,
}: ReportIncidentFooterProps) {
    return (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
                {reportStep > 1 && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        disabled={reportProcessing}
                        onClick={onBack}
                    >
                        Back
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    disabled={reportProcessing}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {reportStep < 3 ? (
                    <Button
                        type="button"
                        className="h-10 rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-5 font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
                        disabled={reportProcessing}
                        onClick={onNext}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        type="button"
                        className={
                            isAnonymous
                                ? 'h-10 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60'
                                : 'h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 font-bold text-white shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                        }
                        disabled={reportProcessing}
                        onClick={onSubmit}
                    >
                        {reportProcessing ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 animate-spin text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span>
                                    {isAnonymous
                                        ? 'Submitting Anonymously...'
                                        : 'Submitting Report...'}
                                </span>
                            </span>
                        ) : isAnonymous ? (
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Submit Anonymously</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Send className="h-4 w-4" />
                                <span>Submit Identified Report</span>
                            </span>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
