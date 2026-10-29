import React from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Activity, ShieldCheck, UserCheck } from 'lucide-react';
import type { ReportIncidentFormData } from './types';

interface ReportIncidentStepEvidenceProps {
    reportForm: ReportIncidentFormData;
    setReportForm: React.Dispatch<React.SetStateAction<ReportIncidentFormData>>;
    reportErrors: Record<string, string>;
    clearFieldError?: (key: string) => void;
    setFieldError?: (key: string, error: string) => void;
}

export function ReportIncidentStepEvidence({
    reportForm,
    setReportForm,
    reportErrors,
    clearFieldError,
    setFieldError,
}: ReportIncidentStepEvidenceProps) {
    const isAnonymous = Boolean(reportForm.is_anonymous);

    return (
        <div className="space-y-4">
            {/* Mode Confirmation Banner */}
            {isAnonymous ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/70 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                Submitting Anonymously
                            </span>
                            <Badge className="border-emerald-300 bg-emerald-100 text-[9px] font-black uppercase text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                Protected
                            </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300/90">
                            Your identity will be masked as <strong>Anonymous Student</strong> on administrative incident dockets and notices. Restricted audit info is securely maintained to safeguard system integrity.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                        <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                                Submitting Identified Report
                            </span>
                            <Badge className="border-blue-300 bg-blue-100 text-[9px] font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                Verified Profile
                            </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300/90">
                            Submitting as <strong>{reportForm.reported_by || 'Authenticated Student'}</strong>. Your verified account will be recorded as the reporter on the incident record.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-1.5">
                <Label
                    htmlFor="description"
                    required
                    showRequiredBadge
                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                >
                    Narrative of the Incident
                </Label>
                <Textarea
                    id="description"
                    value={reportForm.description}
                    hasError={!!reportErrors.description}
                    aria-describedby={reportErrors.description ? "description-error" : undefined}
                    onChange={(e) => {
                        setReportForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }));
                        clearFieldError?.('description');
                    }}
                    onBlur={() => {
                        if (!reportForm.description.trim()) {
                            setFieldError?.(
                                'description',
                                'Narrative of the incident is required.',
                            );
                        }
                    }}
                    rows={4}
                    placeholder="Please provide a detailed narrative of the incident..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    required
                />
                <InputError id="description-error" message={reportErrors.description} />
            </div>

            <div className="grid gap-1.5">
                <Label
                    htmlFor="evidences"
                    optional
                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                >
                    Supporting Evidence
                </Label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
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
                <InputError id="evidences-error" message={reportErrors.evidences} />
            </div>
        </div>
    );
}
