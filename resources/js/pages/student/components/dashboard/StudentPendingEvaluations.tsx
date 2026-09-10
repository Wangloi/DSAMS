import React from 'react';
import { Button } from '@/components/ui/button';
import { studentEvaluationShow } from '@/routes';
import { router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import type { EvaluationRow } from './types';

interface StudentPendingEvaluationsProps {
    evaluationRows?: EvaluationRow[];
}

export function StudentPendingEvaluations({
    evaluationRows = [],
}: StudentPendingEvaluationsProps) {
    if (evaluationRows.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/10 shadow-inner">
                    <ClipboardList className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-left">
                    <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase sm:text-base dark:text-white">
                        Action Required: Pending Evaluations
                    </h2>
                    <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                        Complete these forms to support campus improvements
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {evaluationRows.map((evaluation) => (
                    <div
                        key={evaluation.id}
                        className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-amber-200/50 bg-amber-500/[0.02] p-5 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg dark:border-amber-500/20 dark:bg-amber-500/[0.02]"
                    >
                        <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-amber-500/5 blur-xl" />
                        <div className="flex-1 space-y-1.5 pr-4 text-left">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
                                <h3 className="max-w-[280px] truncate text-sm font-black text-slate-800 dark:text-slate-200">
                                    {evaluation.title}
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Event Date:{' '}
                                <span className="font-semibold">
                                    {evaluation.date || 'N/A'}
                                </span>
                            </p>
                        </div>
                        <Button
                            onClick={() =>
                                router.get(
                                    studentEvaluationShow(evaluation.id),
                                )
                            }
                            className="h-9 shrink-0 rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:bg-amber-600 active:scale-95"
                        >
                            Start
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
