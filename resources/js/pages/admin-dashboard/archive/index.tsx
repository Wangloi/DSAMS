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
import {
    adminAdmissionSlipUnarchive,
    adminArchive,
    adminAttendanceUnarchive,
    adminEvaluationUnarchive,
    adminIncidentsViolationsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Archive as ArchiveIcon,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminArchive(),
    },
    {
        title: 'Archive',
        href: adminArchive(),
    },
];

type ArchiveRow = {
    id: string;
    type: string;
    description: string;
    dateArchived: string;
    lastModified: string;
    table: string;
    record_id: number;
};

type PageProps = {
    archivedItems: ArchiveRow[];
    errors?: Record<string, string>;
};

export default function AdminArchivePage() {
    const { props } = usePage<PageProps>();
    const archivedItems = props.archivedItems ?? [];
    const flash = (props as any)?.flash as
        | { success?: string; error?: string }
        | undefined;

    useEffect(() => {
        const message = String(flash?.success ?? '').trim();
        if (!message) return;

        void Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false,
        });
    }, [flash?.success]);

    useEffect(() => {
        const message = String(flash?.error ?? '').trim();
        if (!message) return;

        void Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }, [flash?.error]);

    const [typeFilter, setTypeFilter] = useState<'all' | 'reports'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'last_7' | 'last_30'>(
        'all',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, dateFilter, searchQuery]);

    const stats = useMemo(() => {
        const archivedRecords = archivedItems.length;
        const archivedReports = archivedItems.filter((r) =>
            r.type.toLowerCase().includes('report'),
        ).length;

        return {
            archivedRecords,
            archivedReports,
        };
    }, [archivedItems]);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesType = (r: ArchiveRow) => {
            if (typeFilter === 'all') return true;
            const raw = r.type.toLowerCase();
            if (typeFilter === 'reports') return raw.includes('report');
            return true;
        };

        const matchesDate = (_r: ArchiveRow) => {
            if (dateFilter === 'all') return true;
            return true;
        };

        const matchesSearch = (r: ArchiveRow) => {
            if (!q) return true;
            const haystack = [
                r.id,
                r.type,
                r.description,
                r.dateArchived,
                r.lastModified,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return archivedItems.filter(
            (r) => matchesType(r) && matchesDate(r) && matchesSearch(r),
        );
    }, [archivedItems, dateFilter, searchQuery, typeFilter]);

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredRows.slice(startIndex, endIndex);
    }, [filteredRows, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredRows.length / pageSize);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const handleUnarchive = (item: ArchiveRow) => {
        Swal.fire({
            title: 'Unarchive item?',
            text: `This will restore "${item.description}" to its original location.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unarchive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                const recordId = Number((item as any)?.record_id);
                if (!recordId || Number.isNaN(recordId)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cannot restore item',
                        text: 'This archived record is missing a valid ID.',
                    });
                    return;
                }

                if (item.table === 'incidents') {
                    const url = adminIncidentsViolationsUnarchive(recordId);
                    if (!url) return;
                    router.put(
                        url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                void Swal.fire({
                                    icon: 'success',
                                    title: 'Unarchived',
                                    text: 'Incident has been restored successfully.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    router.reload({ only: ['archivedItems'] });
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Restore failed',
                                    text: 'Unable to restore this incident. Please try again.',
                                });
                            },
                        },
                    );
                } else if (item.table === 'evaluations') {
                    const url = adminEvaluationUnarchive(recordId);
                    if (!url) return;
                    router.put(
                        url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                void Swal.fire({
                                    icon: 'success',
                                    title: 'Unarchived',
                                    text: 'Evaluation form has been restored successfully.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    router.reload({ only: ['archivedItems'] });
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Restore failed',
                                    text: 'Unable to restore this evaluation form. Please try again.',
                                });
                            },
                        },
                    );
                } else if (item.table === 'admission_slips') {
                    const url = adminAdmissionSlipUnarchive(recordId);
                    if (!url) return;
                    router.put(
                        url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                void Swal.fire({
                                    icon: 'success',
                                    title: 'Unarchived',
                                    text: 'Admission slip has been restored successfully.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    router.reload({ only: ['archivedItems'] });
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Restore failed',
                                    text: 'Unable to restore this admission slip. Please try again.',
                                });
                            },
                        },
                    );
                } else if (item.table === 'students') {
                    router.post(
                        `/admin/manage-users/${recordId}/unarchive`,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                void Swal.fire({
                                    icon: 'success',
                                    title: 'Unarchived',
                                    text: 'Student account has been restored successfully.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    router.reload({ only: ['archivedItems'] });
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Restore failed',
                                    text: 'Unable to restore this student account. Please try again.',
                                });
                            },
                        },
                    );
                } else if (item.table === 'events') {
                    const url = adminAttendanceUnarchive(recordId);
                    if (!url) return;
                    router.put(
                        url,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                void Swal.fire({
                                    icon: 'success',
                                    title: 'Unarchived',
                                    text: 'Event has been restored successfully.',
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    router.reload({ only: ['archivedItems'] });
                                });
                            },
                            onError: () => {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Restore failed',
                                    text: 'Unable to restore this event. Please try again.',
                                });
                            },
                        },
                    );
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cannot restore item',
                        text: 'Unsupported archived item type.',
                    });
                }
            }
        });
    };

    const handleDelete = (item: ArchiveRow) => {
        Swal.fire({
            title: 'Permanently delete?',
            text: `This will permanently delete "${item.description}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete permanently',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                // For now, we'll just show a message since we don't have permanent delete endpoints
                Swal.fire({
                    icon: 'info',
                    title: 'Feature not implemented',
                    text: 'Permanent deletion from archive is not yet implemented.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Archive" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* Hero Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                    <ArchiveIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        System Archive
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        Manage and restore archived records and
                                        system data
                                    </p>
                                </div>
                            </div>
                            <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-md sm:flex">
                                <CalendarDays className="h-4 w-4 text-blue-200" />
                                <div className="text-xs font-semibold tracking-wide text-white/90 uppercase">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Archived Records
                                    </p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {stats.archivedRecords}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        Total System Records
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Archived Reports
                                    </p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {stats.archivedReports}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        PDF/CSV Exports
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30">
                                    <ArchiveIcon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                            </div>
                        </div>
                    </div>

                    <Card className="w-full border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                        Archived Items
                                    </CardTitle>
                                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Manage system storage and restore
                                        history
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={typeFilter}
                                        onValueChange={(v: any) =>
                                            setTypeFilter(v)
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-xs font-bold sm:w-32 dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Types
                                            </SelectItem>
                                            <SelectItem value="reports">
                                                Reports
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={dateFilter}
                                        onValueChange={(v: any) =>
                                            setDateFilter(v)
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-xs font-bold sm:w-32 dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="Any Date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Any Date
                                            </SelectItem>
                                            <SelectItem value="last_7">
                                                Last 7 Days
                                            </SelectItem>
                                            <SelectItem value="last_30">
                                                Last 30 Days
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="relative w-full sm:w-64">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            placeholder="Search archive..."
                                            className="h-9 border-slate-200 bg-white pl-9 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                                <table className="min-w-full border-collapse">
                                    <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Item Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Storage Data
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Archived On
                                            </th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                                        {paginatedRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                                >
                                                    No archived items found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRows.map((row) => {
                                                const initials = (
                                                    row.type || 'ARCH'
                                                )
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase();

                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className="transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                                    <FileText className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            row.description
                                                                        }
                                                                    </div>
                                                                    <div className="mt-0.5 text-[10px] font-bold tracking-tight text-blue-600 uppercase dark:text-blue-400">
                                                                        {
                                                                            row.type
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-bold tracking-tight text-slate-500 uppercase dark:text-slate-400">
                                                                    System Table
                                                                </span>
                                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                    {row.table}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    {
                                                                        row.dateArchived
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                                    ID: {row.id}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                            <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                                                                    onClick={() =>
                                                                        handleUnarchive(
                                                                            row,
                                                                        )
                                                                    }
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
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

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Rows per page:
                            </span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) =>
                                    handlePageSizeChange(Number(v))
                                }
                            >
                                <SelectTrigger className="h-8 w-16 border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Page{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {currentPage}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {totalPages}
                                </span>
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
