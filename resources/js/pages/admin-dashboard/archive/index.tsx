import { Head, router, usePage } from '@inertiajs/react';
import {
    Archive as ArchiveIcon,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
    MoreHorizontal,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
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
import {
    adminArchive,
    adminAdmissionSlipUnarchive,
    adminEvaluationUnarchive,
    adminIncidentsViolationsUnarchive,
    adminAttendanceUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
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
    const flash = (props as any)?.flash as { success?: string; error?: string } | undefined;

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
    const [dateFilter, setDateFilter] = useState<'all' | 'last_7' | 'last_30'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, dateFilter, searchQuery]);

    const stats = useMemo(() => {
        const archivedRecords = archivedItems.length;
        const archivedReports = archivedItems.filter((r) => r.type.toLowerCase().includes('report')).length;

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
            const haystack = [r.id, r.type, r.description, r.dateArchived, r.lastModified]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return archivedItems.filter((r) => matchesType(r) && matchesDate(r) && matchesSearch(r));
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
                    router.put(url, {}, {
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
                    });
                } else if (item.table === 'evaluations') {
                    const url = adminEvaluationUnarchive(recordId);
                    if (!url) return;
                    router.put(url, {}, {
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
                    });
                } else if (item.table === 'admission_slips') {
                    const url = adminAdmissionSlipUnarchive(recordId);
                    if (!url) return;
                    router.put(url, {}, {
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
                    });
                } else if (item.table === 'students') {
                    router.post(`/admin/manage-users/${recordId}/unarchive`, {}, {
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
                    });
                } else if (item.table === 'events') {
                    const url = adminAttendanceUnarchive(recordId);
                    if (!url) return;
                    router.put(url, {}, {
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
                    });
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <ArchiveIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    System Archive
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Manage and restore archived records and system data
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Archived Records Card */}
                        <Card className="overflow-hidden border border-blue-100 bg-blue-50/50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 opacity-70">
                                            Archived Records
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.archivedRecords}
                                            </div>
                                            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                                Total Items
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Archived Reports Card */}
                        <Card className="overflow-hidden border border-amber-100 bg-amber-50/50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 opacity-70">
                                            Archived Reports
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.archivedReports}
                                            </div>
                                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                                PDF/CSV Exports
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <ArchiveIcon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="w-full bg-white dark:bg-[#0B192C]/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Archived Items</CardTitle>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Manage system storage and restore history</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={typeFilter}
                                        onValueChange={(v: any) => setTypeFilter(v)}
                                    >
                                        <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="reports">Reports</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={dateFilter}
                                        onValueChange={(v: any) => setDateFilter(v)}
                                    >
                                        <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                            <SelectValue placeholder="Any Date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any Date</SelectItem>
                                            <SelectItem value="last_7">Last 7 Days</SelectItem>
                                            <SelectItem value="last_30">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="relative w-full sm:w-64">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search archive..."
                                            className="h-9 pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Item Details</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Storage Data</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Archived On</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                            paginatedRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white">{row.description}</div>
                                                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight mt-0.5">{row.type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">System Table</span>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.table}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{row.dateArchived}</span>
                                                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">ID: {row.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                onClick={() => handleUnarchive(row)}
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                Restore
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rows per page:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => handlePageSizeChange(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-16 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-xs font-bold">
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
                                Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                    onClick={() => handlePageChange(currentPage + 1)}
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
