import { AlertTriangle, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import type { IncidentRow } from './types';

interface IncidentBatchActionBarProps {
    selectedCount: number;
    pagedRows: IncidentRow[];
    selectedIds: Set<number>;
    onBatchAction: (action: string, value: string) => void;
    onClearSelection: () => void;
}

export default function IncidentBatchActionBar({
    selectedCount,
    pagedRows,
    selectedIds,
    onBatchAction,
    onClearSelection,
}: IncidentBatchActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50/95 px-4 py-3 shadow-md backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/80">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>{selectedCount} case(s) selected</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {/* Advance to next phase */}
                <button
                    type="button"
                    onClick={() => {
                        const phases = pagedRows
                            .filter((r) => selectedIds.has(r.id))
                            .map((r) => r.calling_phase ?? 1);
                        const maxPhase = Math.max(...phases);
                        const target = Math.min(maxPhase + 1, 8);
                        onBatchAction('advance_phase', String(target));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B192C] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-blue-900"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Advance Phase
                </button>

                {/* Set Resolved */}
                <button
                    type="button"
                    onClick={() => onBatchAction('set_status', 'Resolved')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Set Resolved
                </button>

                {/* Set Escalated */}
                <button
                    type="button"
                    onClick={() => onBatchAction('set_status', 'Escalated')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-rose-700"
                >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Set Escalated
                </button>

                {/* Clear Selection */}
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <RotateCcw className="h-3 w-3" />
                    Clear
                </button>
            </div>
        </div>
    );
}
