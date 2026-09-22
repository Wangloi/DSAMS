import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Archive, Check, ChevronDown, Eye, FileText, Pencil, Printer, Search, Settings2, X } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { formatLastNameFirst } from '@/lib/utils';
import Swal from 'sweetalert2';
import ThermalPrinterModal from '@/components/ThermalPrinterModal';
import { thermalPrinterClient, type PrinterHealth } from '@/services/thermalPrinterClient';
import type { SlipRow } from './types';

type Props = {
    pagedSlips: SlipRow[];
    filteredCount: number;
    pageIndex: number;
    setPageIndex: Dispatch<SetStateAction<number>>;
    pageSize: number;
    setPageSize: Dispatch<SetStateAction<number>>;
    printSlip: (s: SlipRow, deanName?: string) => void;
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
    const { props: pageProps } = usePage<any>();
    const deanName = pageProps.deanName || pageProps.auth?.user?.name || 'Rey John N. Bongcas';

    const [viewOpen, setViewOpen] = useState(false);
    const [viewingSlip, setViewingSlip] = useState<SlipRow | null>(null);
    const [printerModalOpen, setPrinterModalOpen] = useState(false);
    const [isPrintingThermal, setIsPrintingThermal] = useState(false);

    useEffect(() => {
        if (viewSlipId) {
            const found = allSlips.find((s) => s.id === viewSlipId);
            if (found) {
                setViewingSlip(found);
                setViewOpen(true);
            }
        }
    }, [viewSlipId, allSlips]);

    const [printerHealth, setPrinterHealth] = useState<PrinterHealth | null>(null);

    useEffect(() => {
        if (viewOpen || printerModalOpen) {
            thermalPrinterClient.checkHealth().then(setPrinterHealth);
        }
    }, [viewOpen, printerModalOpen]);

    const handlePrintThermal = async () => {
        if (!viewingSlip) return;
        setIsPrintingThermal(true);
        try {
            const res = await thermalPrinterClient.printAdmissionSlip({
                studentName: viewingSlip.studentName,
                program: viewingSlip.programYear,
                caseText: viewingSlip.caseText,
                reasonText: viewingSlip.reasonText,
                date: viewingSlip.dateIssued,
                validUntil: viewingSlip.validUntil,
                status: viewingSlip.status,
                deanName: deanName,
                slipId: viewingSlip.id,
            });

            if (res.success) {
                Swal.fire({
                    title: 'Printing on PT-210...',
                    text: `Admission Slip #${viewingSlip.id} sent to printer.`,
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false,
                });

                // Approve in background if pending
                if (viewingSlip.status !== 'APPROVED') {
                    const role = (pageProps as any)?.auth?.user?.role;
                    const endpoint =
                        role === 'dsa'
                            ? `/dsa/admission-slip/${viewingSlip.id}/approve`
                            : `/admin/admission-slip/${viewingSlip.id}/approve`;

                    router.put(endpoint, {}, { preserveScroll: true });
                }
                setViewOpen(false);
            } else {
                Swal.fire({
                    title: 'Thermal Printer Issue',
                    text: res.message,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Open Printer Setup',
                    cancelButtonText: 'Use Screen Print',
                }).then((r) => {
                    if (r.isConfirmed) {
                        setPrinterModalOpen(true);
                    } else if (r.dismiss === Swal.DismissReason.cancel) {
                        printSlip(viewingSlip, deanName);
                    }
                });
            }
        } finally {
            setIsPrintingThermal(false);
        }
    };

    const handleBrowserPrint = () => {
        if (!viewingSlip) return;
        printSlip(viewingSlip, deanName);

        if (viewingSlip.status !== 'APPROVED') {
            const role = (pageProps as any)?.auth?.user?.role;
            const endpoint =
                role === 'dsa'
                    ? `/dsa/admission-slip/${viewingSlip.id}/approve`
                    : `/admin/admission-slip/${viewingSlip.id}/approve`;

            router.put(
                endpoint,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setViewOpen(false);
                    },
                },
            );
        } else {
            setViewOpen(false);
        }
    };

    const handleApprove = () => {
        if (!viewingSlip) return;
        const role = (pageProps as any)?.auth?.user?.role;
        const endpoint =
            role === 'dsa'
                ? `/dsa/admission-slip/${viewingSlip.id}/approve`
                : `/admin/admission-slip/${viewingSlip.id}/approve`;

        router.put(
            endpoint,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        title: 'Approved!',
                        text: `Admission Slip #${viewingSlip.id} has been approved.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setViewOpen(false);
                },
            },
        );
    };

    const handleReject = () => {
        if (!viewingSlip) return;
        const role = (pageProps as any)?.auth?.user?.role;
        const endpoint =
            role === 'dsa'
                ? `/dsa/admission-slip/${viewingSlip.id}/reject`
                : `/admin/admission-slip/${viewingSlip.id}/reject`;

        Swal.fire({
            title: 'Reject Request?',
            text: `Are you sure you want to reject Admission Slip #${viewingSlip.id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Reject',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    endpoint,
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                title: 'Rejected',
                                text: `Admission Slip #${viewingSlip.id} has been rejected.`,
                                icon: 'info',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                            setViewOpen(false);
                        },
                    },
                );
            }
        });
    };

    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
            {/* THERMAL PRINTER SETTINGS MODAL */}
            <ThermalPrinterModal
                open={printerModalOpen}
                onOpenChange={setPrinterModalOpen}
            />

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
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                    <FileText className="h-8 w-8 text-blue-300" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                        Admission Slip Details
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 text-xs font-medium text-blue-100/70">
                                        Review student request details and approve or print admission pass.
                                    </DialogDescription>
                                </div>
                            </div>
                            {viewingSlip && (
                                <div className="shrink-0 bg-white/10 rounded-full px-3 py-1 border border-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                                    {viewingSlip.status || 'PENDING'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-8">
                        {viewingSlip ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Student Name
                                    </span>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.studentName}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Program / Year
                                    </span>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.programYear}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Date Issued
                                    </span>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.dateIssued}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Valid Until
                                    </span>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                        {viewingSlip.validUntil}
                                    </div>
                                </div>
                                {viewingSlip.caseText && (
                                    <div className="space-y-2 md:col-span-2">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Case / Reason
                                        </span>
                                        <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                                            {viewingSlip.caseText}
                                        </div>
                                    </div>
                                )}
                                {viewingSlip.reasonText && (
                                    <div className="space-y-2 md:col-span-2">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Details
                                        </span>
                                        <div className="flex min-h-[48px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
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

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-5 dark:border-slate-800 dark:bg-slate-900/50">
                        {/* Option 1 Left: Approve & Reject Action Buttons */}
                        <div className="flex items-center gap-2">
                            {viewingSlip && viewingSlip.status !== 'APPROVED' ? (
                                <>
                                    <Button
                                        type="button"
                                        onClick={handleApprove}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
                                    >
                                        <Check className="h-4 w-4" />
                                        Approve
                                    </Button>

                                    {viewingSlip.status !== 'REJECTED' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleReject}
                                            className="inline-flex items-center gap-1.5 rounded-xl border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Reject
                                        </Button>
                                    )}
                                </>
                            ) : viewingSlip?.status === 'APPROVED' ? (
                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <Check className="h-3.5 w-3.5" />
                                    Approved
                                </div>
                            ) : null}
                        </div>

                        {/* Option 1 Right: Clear action buttons */}
                        <div className="flex items-center justify-end gap-2.5">
                            {onEdit && viewingSlip && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const slipToEdit = viewingSlip;
                                        setViewOpen(false);
                                        onEdit(slipToEdit);
                                    }}
                                    className="rounded-xl border-amber-200 bg-amber-50/60 px-4 text-xs font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                                    title="Edit admission slip details"
                                >
                                    <Pencil className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    Edit Slip
                                </Button>
                            )}

                            {/* PRINT TYPE DROPDOWN */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        disabled={!viewingSlip || isPrintingThermal}
                                        className="rounded-xl bg-blue-600 px-5 text-xs font-black tracking-wider text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
                                    >
                                        <Printer className="mr-1.5 h-4 w-4" />
                                        {isPrintingThermal ? 'Printing...' : 'Print Slip'}
                                        <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-80" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                    <DropdownMenuItem
                                        onClick={handlePrintThermal}
                                        className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-blue-50 focus:bg-blue-50 dark:hover:bg-blue-950/40 dark:focus:bg-blue-950/40"
                                    >
                                        <Printer className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    PT-210 Thermal Print
                                                </span>
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        printerHealth?.status === 'online' && printerHealth.configured
                                                            ? 'bg-emerald-500 animate-pulse'
                                                            : 'bg-amber-500'
                                                    }`}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                58mm Bluetooth pass slip
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleBrowserPrint}
                                        className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                                    >
                                        <FileText className="mt-0.5 h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                Browser / PDF Print
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Standard document / PDF save
                                            </span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                                    <DropdownMenuItem
                                        onClick={() => setPrinterModalOpen(true)}
                                        className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                                    >
                                        <Settings2 className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                PT-210 Setup & Config
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {printerHealth?.status === 'online' && printerHealth.configured
                                                    ? `Connected (${printerHealth.port})`
                                                    : 'Configure COM port & test bridge'}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setViewOpen(false)}
                                className="rounded-xl px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                Close
                            </Button>
                        </div>
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
                        <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
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
                        <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
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
                                                            {formatLastNameFirst(slip.studentName)}
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
                                                    {/* 1. Eye (View Details) */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                        onClick={() => {
                                                            setViewingSlip(slip);
                                                            setViewOpen(true);
                                                        }}
                                                        title="View slip details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {/* 2. Edit (Edit Admission Slip) */}
                                                    {onEdit && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-amber-600 transition-all duration-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                                                            onClick={() =>
                                                                onEdit(slip)
                                                            }
                                                            title="Edit admission slip"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* 3. Archive */}
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
