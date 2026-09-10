import React from 'react';
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    Check,
    ClipboardList,
    FileText,
    Users,
} from 'lucide-react';

interface ReportIncidentHeaderProps {
    reportStep: number;
}

export function ReportIncidentHeader({ reportStep }: ReportIncidentHeaderProps) {
    const steps = [
        { label: 'General Info', icon: ClipboardList },
        { label: 'Details', icon: Users },
        { label: 'Narrative & Evidence', icon: FileText },
    ];

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md">
            <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                        <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <DialogHeader className="p-0 text-left">
                        <DialogTitle className="text-xl font-black tracking-tight text-white">
                            Report Incident
                        </DialogTitle>
                        <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/80">
                            Provide details about the incident to create a new report.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Step Indicators */}
                <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-3">
                    {steps.map((s, i) => {
                        const num = i + 1;
                        const isDone = num < reportStep;
                        const isActive = num === reportStep;

                        return (
                            <div
                                key={s.label}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                                    isActive
                                        ? 'bg-white font-bold text-[#1e3a8a] shadow-md'
                                        : isDone
                                          ? 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
                                          : 'bg-white/10 text-blue-100/60'
                                }`}
                            >
                                <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                        isActive
                                            ? 'bg-[#1e3a8a] text-white'
                                            : isDone
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-white/20 text-white'
                                    }`}
                                >
                                    {isDone ? (
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    ) : (
                                        num
                                    )}
                                </div>
                                <div className="hidden min-w-0 sm:block">
                                    <p className="truncate text-[11px] font-bold">
                                        {s.label}
                                    </p>
                                </div>
                                <span className="truncate text-[10px] font-semibold sm:hidden">
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
