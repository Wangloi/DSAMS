import { Button } from '@/components/ui/button';
import { studentEvaluationShow } from '@/routes';
import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, ClipboardList, ShieldAlert } from 'lucide-react';
import React from 'react';

type PendingEvaluation = {
    id: string | number;
    title: string;
    date?: string;
    statusLabel?: string;
};

export default function PendingEvaluationsGateModal() {
    const page = usePage<SharedData>();
    const pageProps = page.props as Record<string, any>;

    const needsProfileCompletion = !!pageProps.needsProfileCompletion;

    // Get pending evaluations from page props or shared props
    const pendingEvaluations: PendingEvaluation[] =
        (pageProps.evaluations as PendingEvaluation[]) ||
        (pageProps.pendingEvaluations as PendingEvaluation[]) ||
        [];

    // Do not show on evaluation form page so student can complete it
    const isEvaluationPage =
        typeof window !== 'undefined' &&
        window.location.pathname.includes('/student/evaluation/');

    // Only show if not on evaluation page, profile is completed, and there are pending evaluations
    const shouldShow =
        !isEvaluationPage &&
        !needsProfileCompletion &&
        pendingEvaluations.length > 0;

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[95] flex animate-in items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl duration-300 fade-in">
            <div className="relative flex w-full max-w-lg animate-in flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-0 text-center shadow-2xl duration-300 zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                {/* Header with vibrant blue-indigo gradient */}
                <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                    <div className="absolute top-0 right-0 h-48 w-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                            <ClipboardList className="h-8 w-8 text-amber-300 animate-pulse" />
                        </div>
                        <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                            Pending Evaluation Required
                        </h2>
                        <p className="mt-1 text-xs font-medium text-blue-100/80">
                            Action needed before accessing full system features
                        </p>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left dark:border-amber-500/30 dark:bg-amber-500/15">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-xs leading-relaxed font-semibold text-amber-900 dark:text-amber-200">
                                To ensure high-quality student services and fulfill institutional requirements, you must complete your pending event evaluation(s) to unlock access to the system.
                            </p>
                        </div>
                    </div>

                    <div className="mb-2 text-left">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Required Evaluations ({pendingEvaluations.length})
                        </span>
                    </div>

                    <div className="max-h-[35vh] space-y-3 overflow-y-auto pr-1">
                        {pendingEvaluations.map((evaluation) => (
                            <div
                                key={evaluation.id}
                                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                        {evaluation.title}
                                    </p>
                                    {evaluation.date && (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            {evaluation.date}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => {
                                        router.visit(
                                            studentEvaluationShow(evaluation.id),
                                        );
                                    }}
                                    className="h-9 shrink-0 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-black tracking-wider text-white uppercase shadow-md shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
                                >
                                    <span>Start</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                        Office of Student Affairs & Services • Evaluation Clearance
                    </div>
                </div>
            </div>
        </div>
    );
}
