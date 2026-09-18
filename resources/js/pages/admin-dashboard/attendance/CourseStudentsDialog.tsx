import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { formatLastNameFirst } from '@/lib/utils';
import type { StudentByCourseRow } from './types';

interface CourseStudentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCourse: string;
    rows: StudentByCourseRow[];
    loading: boolean;
    error: string | null;
}

export default function CourseStudentsDialog({
    open,
    onOpenChange,
    selectedCourse,
    rows,
    loading,
    error,
}: CourseStudentsDialogProps) {
    const [yearFilter, setYearFilter] = useState<string>('all');

    const filteredRows = (
        yearFilter === 'all'
            ? rows
            : rows.filter((row) => {
                  const raw = String(row.year_level ?? '').toLowerCase();
                  return raw.includes(yearFilter.toLowerCase());
              })
    ).slice().sort((a, b) => {
        const nameA = formatLastNameFirst(a.name).toLowerCase();
        const nameB = formatLastNameFirst(b.name).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const scannedCount = rows.filter((r) => r.scanned).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-[96vw] !max-w-6xl overflow-hidden bg-white p-0 dark:bg-slate-900">
                <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <DialogTitle className="text-base font-semibold text-slate-800 dark:text-white">
                                {selectedCourse
                                    ? `Students - ${selectedCourse}`
                                    : 'Students'}
                            </DialogTitle>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                All students in this course for the selected event.
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <span className="h-2 w-2 rounded-full bg-[#23509A]" />
                                {rows.length.toLocaleString()} Students
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                {scannedCount.toLocaleString()} Scanned
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-6">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Year Level
                        </div>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-[220px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Loading students...
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Student ID</th>
                                            <th className="px-5 py-3 font-medium">Name</th>
                                            <th className="px-5 py-3 font-medium">Year</th>
                                            <th className="px-5 py-3 text-right font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredRows.length > 0 ? (
                                            filteredRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white">
                                                        {row.student_id || '—'}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                                                        {formatLastNameFirst(row.name)}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                                                        {row.year_level || '—'}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        {row.scanned ? (
                                                            <span
                                                                className={
                                                                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ' +
                                                                    (row.status === 'late'
                                                                        ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400'
                                                                        : 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400')
                                                                }
                                                            >
                                                                {row.status || 'scanned'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                                                not scanned
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-5 py-6 text-center text-sm text-slate-600 dark:text-slate-400"
                                                >
                                                    No students found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
