import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Filter,
    GraduationCap,
    Layers,
    Printer,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface PrintAttendanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string | number | null;
    eventName?: string;
    eventDate?: string;
    isProgramHead?: boolean;
    userProgram?: string;
    courses?: Array<string | { id: string; name: string; code?: string }>;
    yearLevels?: Array<string | { id: string; name: string; code?: string }>;
    initialProgram?: string;
    initialYearLevel?: string;
    baseUrl?: string;
}

const DEFAULT_PROGRAMS = ['BSIT', 'BSED', 'BEED', 'BSBA', 'BSCRIM', 'BSHM'];
const DEFAULT_YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function PrintAttendanceModal({
    open,
    onOpenChange,
    eventId,
    eventName,
    eventDate,
    isProgramHead: propIsProgramHead,
    userProgram: propUserProgram,
    courses = [],
    yearLevels = [],
    initialProgram = 'all',
    initialYearLevel = 'all',
    baseUrl,
}: PrintAttendanceModalProps) {
    const page = usePage<any>();
    const auth = page.props?.auth;

    // Detect if current user is Program Head
    const isProgramHead =
        propIsProgramHead ??
        (auth?.guard === 'program_head' ||
            auth?.user?.role === 'program_head' ||
            Boolean(page.props?.program));

    const programHeadProgram =
        propUserProgram ||
        page.props?.program ||
        auth?.user?.program ||
        '';

    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all');

    useEffect(() => {
        if (open) {
            if (isProgramHead && programHeadProgram) {
                setSelectedProgram(programHeadProgram);
            } else {
                setSelectedProgram(initialProgram || 'all');
            }
            setSelectedYearLevel(initialYearLevel || 'all');
        }
    }, [open, isProgramHead, programHeadProgram, initialProgram, initialYearLevel]);

    // Normalize program list
    const programOptions = useMemo(() => {
        const list: string[] = [];
        if (Array.isArray(courses) && courses.length > 0) {
            courses.forEach((c) => {
                const name = typeof c === 'string' ? c : (c.name || c.id || c.code || '');
                if (name && !list.includes(name)) list.push(name);
            });
        }
        DEFAULT_PROGRAMS.forEach((dp) => {
            if (!list.includes(dp)) list.push(dp);
        });
        return list.sort();
    }, [courses]);

    // Normalize year levels list
    const yearLevelOptions = useMemo(() => {
        const list: string[] = [];
        if (Array.isArray(yearLevels) && yearLevels.length > 0) {
            yearLevels.forEach((y) => {
                const name = typeof y === 'string' ? y : (y.name || y.id || y.code || '');
                if (name && !list.includes(name)) list.push(name);
            });
        }
        DEFAULT_YEAR_LEVELS.forEach((dyl) => {
            if (!list.includes(dyl)) list.push(dyl);
        });
        return list;
    }, [yearLevels]);

    const handlePrintConfirm = () => {
        if (!eventId) return;

        const effectiveBaseUrl =
            baseUrl ||
            (isProgramHead
                ? `/program-head/attendance/${eventId}/print`
                : `/admin/attendance/${eventId}/print`);

        const params = new URLSearchParams();

        if (!isProgramHead && selectedProgram && selectedProgram !== 'all') {
            params.set('course', selectedProgram);
        }

        if (selectedYearLevel && selectedYearLevel !== 'all') {
            params.set('year_level', selectedYearLevel);
        }

        const finalUrl = params.toString()
            ? `${effectiveBaseUrl}?${params.toString()}`
            : effectiveBaseUrl;

        window.open(finalUrl, '_blank');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="sm" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Print Attendance Sheet</DialogTitle>
                    <DialogDescription>
                        Configure program and year level filters before generating the print sheet
                    </DialogDescription>
                </DialogHeader>

                {/* ── CLEAN MINIMALIST HEADER ── */}
                <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#23509A] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                                <Printer className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Print Attendance Sheet
                                </h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                                    {eventName || 'Attendance Logs'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                            aria-label="Close dialog"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close dialog</span>
                        </button>
                    </div>
                </div>

                {/* Form Controls Body */}
                <div className="space-y-4 p-6 bg-slate-50/50 dark:bg-slate-900/40">
                    {/* Program Head Badge (if program head) */}
                    {isProgramHead ? (
                        <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                            <div className="flex items-center gap-2.5">
                                <GraduationCap className="h-4 w-4 text-[#000D6A] dark:text-blue-400" />
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        Your Assigned Department
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {programHeadProgram || 'Department Scoped'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Admin Program Selector */
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                                <GraduationCap className="h-3.5 w-3.5 text-[#000D6A] dark:text-blue-400" />
                                Select Program / Course
                            </label>
                            <Select
                                value={selectedProgram}
                                onValueChange={setSelectedProgram}
                            >
                                <SelectTrigger aria-label="Select program" className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-medium shadow-2xs focus-visible:ring-[#000D6A] dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                    <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    <SelectItem value="all">
                                        ✨ All Programs (Complete Event)
                                    </SelectItem>
                                    {programOptions.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Filter attendance printout to a specific academic program or print all.
                            </p>
                        </div>
                    )}

                    {/* Year Level Selector (Both Admin & Program Head) */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
                            <Layers className="h-3.5 w-3.5 text-[#000D6A] dark:text-blue-400" />
                            Select Year Level
                        </label>
                        <Select
                            value={selectedYearLevel}
                            onValueChange={setSelectedYearLevel}
                        >
                            <SelectTrigger aria-label="Select year level" className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-medium shadow-2xs focus-visible:ring-[#000D6A] dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                                <SelectValue placeholder="All Year Levels" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                                <SelectItem value="all">
                                    ✨ All Year Levels
                                </SelectItem>
                                {yearLevelOptions.map((yl) => (
                                    <SelectItem key={yl} value={yl}>
                                        {yl}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isProgramHead
                                ? 'Choose a specific year level in your department or print all years.'
                                : 'Filter to a specific year level or print all year levels.'}
                        </p>
                    </div>

                    {/* Preview Badge */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Print Output Scope
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {isProgramHead
                                    ? programHeadProgram || 'Department'
                                    : selectedProgram === 'all'
                                      ? 'All Programs'
                                      : selectedProgram}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {selectedYearLevel === 'all'
                                    ? 'All Year Levels'
                                    : selectedYearLevel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <DialogFooter className="flex items-center justify-end gap-2 border-t border-slate-200/80 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handlePrintConfirm}
                        className="flex items-center gap-1.5 rounded-xl bg-[#23509A] hover:bg-[#1b3f7a] text-xs font-semibold text-white shadow-xs transition-colors"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Generate Print Sheet</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
