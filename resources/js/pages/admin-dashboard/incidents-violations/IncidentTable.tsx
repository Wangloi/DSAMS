import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Archive, ChevronRight, Clock, Gavel, Printer, Search } from 'lucide-react';
import { STUDENT_CALLING_PHASES } from './StudentCallingProcessFlow';
import type { IncidentRow, StatusFilter, TypeFilter } from './types';

type Props = {
    incidents: IncidentRow[];
    typeFilter: TypeFilter;
    statusFilter: StatusFilter;
    searchQuery: string;
    onView?: (incident: IncidentRow) => void;
    onViewDetail?: (incident: IncidentRow) => void;
    onEdit?: (incident: IncidentRow) => void;
    onArchive?: (incident: IncidentRow) => void;
    onStatusChange?: (
        incident: IncidentRow,
        newStatus: IncidentRow['status'],
    ) => void;
    onAdvancePhase?: (incident: IncidentRow) => void;
    onCallStudent?: (incident: IncidentRow) => void;
    onTypeFilterChange: (value: TypeFilter) => void;
    onStatusFilterChange: (value: StatusFilter) => void;
    onSearchChange: (value: string) => void;
    selectedIds?: Set<number>;
    onToggleSelect?: (id: number) => void;
    onToggleSelectAll?: () => void;
};

const getStatusColor = (status: IncidentRow['status']) => {
    switch (status) {
        case 'Resolved':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'Pending':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
        case 'Ongoing':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'Escalated':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
};

/** Compute days since last phase transition or last update (#3: aging indicator) */
function getDaysInPhase(row: IncidentRow): { days: number; color: string; label: string } {
    let lastDate: string | undefined;

    // Use the latest phase history entry if available
    if (row.calling_phase_history && row.calling_phase_history.length > 0) {
        lastDate = row.calling_phase_history[row.calling_phase_history.length - 1].at;
    } else if (row.updated_at) {
        lastDate = row.updated_at;
    }

    if (!lastDate) return { days: 0, color: 'text-slate-400', label: 'N/A' };

    const diffMs = Date.now() - new Date(lastDate).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (row.status === 'Resolved') {
        return { days, color: 'text-emerald-600 dark:text-emerald-400', label: 'Done' };
    }

    if (days <= 2) {
        return { days, color: 'text-emerald-600 dark:text-emerald-400', label: `${days}d` };
    } else if (days <= 7) {
        return { days, color: 'text-amber-600 dark:text-amber-400', label: `${days}d` };
    } else {
        return { days, color: 'text-rose-600 dark:text-rose-400', label: `${days}d` };
    }
}

export default function IncidentTable({
    incidents,
    typeFilter,
    statusFilter,
    searchQuery,
    onView,
    onViewDetail,
    onEdit,
    onArchive,
    onStatusChange,
    onAdvancePhase,
    onCallStudent,
    onTypeFilterChange,
    onStatusFilterChange,
    onSearchChange,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
}: Props) {
    const hasBatch = Boolean(onToggleSelect && selectedIds);
    const allSelected = hasBatch && incidents.length > 0 && incidents.every((r) => selectedIds!.has(r.id));

    return (
        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                            Incidents & Violations
                        </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search incidents..."
                                className="h-9 w-48 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <Select
                            value={typeFilter}
                            onValueChange={(value) =>
                                onTypeFilterChange(value as TypeFilter)
                            }
                        >
                            <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="suspension">
                                    Suspension
                                </SelectItem>
                                <SelectItem value="exclusion">
                                    Exclusion
                                </SelectItem>
                                <SelectItem value="expulsion">
                                    Expulsion
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={(value) =>
                                onStatusFilterChange(value as StatusFilter)
                            }
                        >
                            <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                <SelectValue
                                    placeholder={
                                        statusFilter === 'all'
                                            ? 'All Status'
                                            : `Status: ${statusFilter}`
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                                <SelectItem value="Resolved">
                                    Resolved
                                </SelectItem>
                                <SelectItem value="Escalated">
                                    Escalated
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                    <table className="w-full min-w-max border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                {hasBatch && (
                                    <th className="w-10 px-3 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={() => onToggleSelectAll?.()}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    #
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Case ID
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Student
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Violation Type
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Classification
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Calling Phase
                                </th>
                                <th className="px-4 py-4 text-center text-[10px] font-bold tracking-wider uppercase">
                                    <Clock className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                                    Age
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {incidents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={hasBatch ? 10 : 9}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 shadow-inner dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-500">
                                                <Gavel className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                                No Incident Records Logged
                                            </h3>
                                            <p className="mt-1 max-w-[280px] text-xs leading-normal text-slate-500 dark:text-slate-400">
                                                All students are currently in
                                                good standing. New incidents
                                                reported will appear in this
                                                registry.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((row, index) => {
                                    const initials = (row.student || 'ST')
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase();

                                    const phaseNum =
                                        row.calling_phase ??
                                        (row.status === 'Resolved'
                                            ? 5
                                            : row.status === 'Escalated'
                                              ? 4
                                              : row.status === 'Ongoing'
                                                ? 3
                                                : 1);
                                    const phaseItem =
                                        STUDENT_CALLING_PHASES.find(
                                            (p) => p.phase === phaseNum,
                                        ) || STUDENT_CALLING_PHASES[0];

                                    const aging = getDaysInPhase(row);
                                    const canAdvance = phaseNum < 5 && row.status !== 'Resolved';

                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => onViewDetail?.(row)}
                                            className={cn(
                                                "cursor-pointer transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-950/15",
                                                hasBatch && selectedIds!.has(row.id) && "bg-blue-50/70 dark:bg-blue-950/20"
                                            )}
                                        >
                                            {hasBatch && (
                                                <td
                                                    className="w-10 px-3 py-4 text-center"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds!.has(row.id)}
                                                        onChange={() => onToggleSelect?.(row.id)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold tracking-tight text-slate-900 uppercase dark:text-white">
                                                {row.caseId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {row.student}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                            ID: {row.studentId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {row.type}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    className={
                                                        row.classification !==
                                                        'Warning'
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }
                                                >
                                                    {row.classification}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${phaseItem.badgeColor}`}
                                                    title={`Phase ${phaseNum}: ${phaseItem.title}`}
                                                >
                                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-current/15 text-[9px] font-black">
                                                        {phaseNum}
                                                    </span>
                                                    <span className="truncate max-w-[110px]">
                                                        {phaseItem.shortLabel}
                                                    </span>
                                                </span>
                                            </td>
                                            {/* #3: Days-in-phase aging indicator */}
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-black ${aging.color}`}
                                                    title={`${aging.days} day(s) in current phase`}
                                                >
                                                    <Clock className="h-3 w-3" />
                                                    {aging.label}
                                                </span>
                                            </td>
                                            <td
                                                className="px-6 py-4"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Select
                                                    value={row.status}
                                                    onValueChange={(val) =>
                                                        onStatusChange?.(
                                                            row,
                                                            val as IncidentRow['status'],
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            'h-7 w-[110px] cursor-pointer rounded-full border-0 px-2.5 text-[10px] font-black tracking-wider uppercase shadow-none transition-all',
                                                            getStatusColor(
                                                                row.status,
                                                            ),
                                                        )}
                                                    >
                                                        <SelectValue
                                                            placeholder={
                                                                row.status
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pending">
                                                            Pending
                                                        </SelectItem>
                                                        <SelectItem value="Ongoing">
                                                            Ongoing
                                                        </SelectItem>
                                                        <SelectItem value="Resolved">
                                                            Resolved
                                                        </SelectItem>
                                                        <SelectItem value="Escalated">
                                                            Escalated
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                    {/* #4: Quick phase advance button */}
                                                    {canAdvance && onAdvancePhase && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                            onClick={() =>
                                                                onAdvancePhase(row)
                                                            }
                                                            aria-label={`Advance to Phase ${phaseNum + 1}`}
                                                            title={`Advance to Phase ${phaseNum + 1}: ${STUDENT_CALLING_PHASES[phaseNum]?.shortLabel ?? 'Next'}`}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {onCallStudent && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-indigo-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                                                            onClick={() =>
                                                                onCallStudent(row)
                                                            }
                                                            aria-label="Call Student (Calling Slip)"
                                                            title="Call Student (Generate Calling Slip)"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {onViewDetail && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                                                            onClick={() =>
                                                                onViewDetail(
                                                                    row,
                                                                )
                                                            }
                                                            aria-label="Disciplinary Case Detail"
                                                            title="Disciplinary Case Detail"
                                                        >
                                                            <Gavel className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {onArchive && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                            onClick={() =>
                                                                onArchive(row)
                                                            }
                                                            aria-label="Archive Incident"
                                                            title="Archive Incident"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
