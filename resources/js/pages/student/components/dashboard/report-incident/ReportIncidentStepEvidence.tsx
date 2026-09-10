import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity } from 'lucide-react';
import type { ReportIncidentFormData } from './types';

interface ReportIncidentStepEvidenceProps {
    reportForm: ReportIncidentFormData;
    setReportForm: React.Dispatch<React.SetStateAction<ReportIncidentFormData>>;
    reportErrors: Record<string, string>;
}

export function ReportIncidentStepEvidence({
    reportForm,
    setReportForm,
    reportErrors,
}: ReportIncidentStepEvidenceProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label
                    htmlFor="description"
                    className="font-semibold tracking-wider text-slate-800 uppercase dark:text-slate-200"
                >
                    Narrative of the Incident{' '}
                    <span className="text-red-500">*</span>
                </Label>
                <textarea
                    id="description"
                    value={reportForm.description}
                    onChange={(e) =>
                        setReportForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }))
                    }
                    rows={4}
                    placeholder="Please provide a detailed narrative of the incident..."
                    className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:focus-visible:ring-slate-300"
                    required
                />
                {reportErrors.description && (
                    <p className="text-xs text-red-500">
                        {reportErrors.description}
                    </p>
                )}
            </div>

            <div className="space-y-2.5">
                <Label
                    htmlFor="evidences"
                    className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                >
                    Supporting Evidence
                </Label>
                <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                Upload evidence files
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                                Max 5 files (JPG, PNG, PDF)
                            </p>
                        </div>
                        <Input
                            id="evidences"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) =>
                                setReportForm((prev) => ({
                                    ...prev,
                                    evidences: Array.from(
                                        e.target.files ?? [],
                                    ).slice(0, 5),
                                }))
                            }
                            className="h-10 cursor-pointer border-slate-200 bg-white transition-all file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:text-[10px] file:font-semibold file:text-white file:uppercase hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-800"
                        />
                        {reportForm.evidences.length > 0 && (
                            <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                                {reportForm.evidences.length} files selected
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
