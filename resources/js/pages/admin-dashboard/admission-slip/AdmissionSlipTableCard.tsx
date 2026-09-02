import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Archive, Eye, FileText, Search, X } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { SlipRow } from './types';

type Props = {
    pagedSlips: SlipRow[];
    filteredCount: number;
    pageIndex: number;
    setPageIndex: Dispatch<SetStateAction<number>>;
    pageSize: number;
    setPageSize: Dispatch<SetStateAction<number>>;
    printSlip: (s: SlipRow) => void;
    searchQuery?: string;
    setSearchQuery?: Dispatch<SetStateAction<string>>;
    onEdit?: (slip: SlipRow) => void;
    onArchive?: (slip: SlipRow) => void;
    activeTab?: 'all' | 'pending' | 'approved' | 'rejected';
    setActiveTab?: Dispatch<
        SetStateAction<'all' | 'pending' | 'approved' | 'rejected'>
    >;
    viewSlipId?: number | null;
    allSlips?: SlipRow[];
};

function statusBadge(status: string) {
    const normalized = (status || 'PENDING').toUpperCase();
    const cls = [
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-0',
        normalized === 'APPROVED'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : normalized === 'REJECTED'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ].join(' ');
    return <span className={cls}>{normalized}</span>;
}

export default function AdmissionSlipTableCard({
    pagedSlips,
    filteredCount,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    printSlip,
    searchQuery,
    setSearchQuery,
    onEdit,
    onArchive,
    activeTab,
    setActiveTab,
    viewSlipId,
    allSlips = [],
}: Props) {
    const [viewOpen, setViewOpen] = useState(false);
    const [viewingSlip, setViewingSlip] = useState<SlipRow | null>(null);

    useEffect(() => {
        if (viewSlipId) {
            const found = allSlips.find((s) => s.id === viewSlipId);
            if (found) {
                setViewingSlip(found);
                setViewOpen(true);
            }
        }
    }, [viewSlipId, allSlips]);

    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
            {/* VIEW DIALOG */}
            <Dialog
                open={viewOpen}
                onOpenChange={(open) => {
                    setViewOpen(open);
                    if (!open) setViewingSlip(null);
                }}
            >
                <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-2xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
                    <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                        <div className="relative flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                <FileText className="h-8 w-8 text-blue-300" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                    Admission Slip Details
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs font-medium text-blue-100/70">
                                    Review admission slip details before
                                    printing.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-8">
                        {viewingSlip ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Student Name
                                    </span>
                                    <div className="text-slate-850 flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.studentName}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Program / Year
                                    </span>
                                    <div className="text-slate-850 flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.programYear}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Date Issued
                                    </span>
                                    <div className="text-slate-850 flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.dateIssued}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Valid Until
                                    </span>
                                    <div className="text-slate-850 flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.validUntil}
                                    </div>
                                </div>
                                {viewingSlip.caseText && (
                                    <div className="space-y-2 md:col-span-2">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Case / Reason
                                        </span>
                                        <div className="text-slate-850 flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                            {viewingSlip.caseText}
                                        </div>
                                    </div>
                                )}
                                {viewingSlip.reasonText && (
                                    <div className="space-y-2 md:col-span-2">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Details
                                        </span>
                                        <div className="text-slate-850 flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                            {viewingSlip.reasonText}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500">
                                No slip selected
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setViewOpen(false)}
                            className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            Close
                        </Button>
                        <Button
                            disabled={!viewingSlip}
                            onClick={() => {
                                if (viewingSlip) {
                                    router.put(
                                        `/admin/admission-slip/${viewingSlip.id}/approve`,
                                        {},
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                printSlip(viewingSlip);
                                                setViewOpen(false);
                                            },
                                        },
                                    );
                                }
                            }}
                            className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* UNIFIED HEADER */}
            <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/30">
                <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                        Admission Slip List
                    </CardTitle>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total: {filteredCount} slips found
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <Input
                            placeholder="Search admission slips..."
                            className="h-9 w-48 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            value={searchQuery ?? ''}
                            onChange={(e) => {
                                if (!setSearchQuery) return;
                                setSearchQuery(e.target.value);
                                setPageIndex(1);
                            }}
                        />
                    </div>
                    <Select
                        value={activeTab ?? 'all'}
                        onValueChange={(v) => {
                            if (setActiveTab)
                                setActiveTab(
                                    v as
                                        | 'all'
                                        | 'pending'
                                        | 'approved'
                                        | 'rejected',
                                );
                            setPageIndex(1);
                        }}
                    >
                        <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            {/* Active Filter Indicator */}
            {((activeTab && activeTab !== 'all') ||
                (searchQuery && searchQuery.trim())) && (
                <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/80 px-6 py-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        Filtered by:
                    </span>
                    {activeTab && activeTab !== 'all' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 capitalize dark:bg-blue-900/50 dark:text-blue-300">
                            {activeTab}
                        </span>
                    )}
                    {searchQuery && searchQuery.trim() && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            "{searchQuery.trim()}"
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            if (setActiveTab) setActiveTab('all');
                            if (setSearchQuery) setSearchQuery('');
                            setPageIndex(1);
                        }}
                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                </div>
            )}

            {/* TABLE */}
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse text-left text-sm">
                        <thead className="dark:border-slate-850 border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:bg-slate-900/30 dark:text-slate-500">
                            <tr>
                                <th className="w-12 px-6 py-3.5 font-bold">
                                    #
                                </th>
                                <th className="px-6 py-3.5 font-bold">
                                    Student
                                </th>
                                <th className="px-6 py-3.5 font-bold">
                                    Date Issued
                                </th>
                                <th className="px-6 py-3.5 font-bold">
                                    Valid Until
                                </th>
                                <th className="px-6 py-3.5 font-bold">
                                    Status
                                </th>
                                <th className="px-6 py-3.5 text-right font-bold">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {pagedSlips.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-10 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                No admission slips found
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Try adjusting your filters or
                                                search query above
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pagedSlips.map((slip, idx) => {
                                    const initials = slip.studentName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <tr
                                            key={slip.id}
                                            onClick={() => {
                                                setViewingSlip(slip);
                                                setViewOpen(true);
                                            }}
                                            className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-950/15"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                                                {(pageIndex - 1) * pageSize +
                                                    idx +
                                                    1}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {slip.studentName}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                            {slip.programYear}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                {slip.dateIssued}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                {slip.validUntil}
                                            </td>
                                            <td className="px-6 py-4">
                                                {statusBadge(slip.status)}
                                            </td>

                                            <td
                                                className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                        onClick={() => {
                                                            setViewingSlip(
                                                                slip,
                                                            );
                                                            setViewOpen(true);
                                                        }}
                                                        title="View slip"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {onArchive && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                            onClick={() =>
                                                                onArchive(slip)
                                                            }
                                                            title="Archive slip"
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
