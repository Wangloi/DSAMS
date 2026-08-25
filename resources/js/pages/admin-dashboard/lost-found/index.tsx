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
    adminDashboard,
    adminLostFound,
    adminLostFoundArchive,
    adminLostFoundDestroy,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Archive,
    CheckCircle2,
    Edit,
    Pause,
    Play,
    RefreshCw,
    ScrollText,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import AddFoundItemDialog from './AddFoundItemDialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Lost & Found',
        href: adminLostFound(),
    },
];

type FoundItemRow = {
    id: string;
    title: string;
    foundAt: string;
    dateFound: string;
    timeFound: string;
    location: string;
    status: 'Claimed' | 'In Storage' | 'Verification Pending' | 'Unclaimed';
    imageUrl?: string;
};

type PageProps = {
    foundItems: FoundItemRow[];
    stats?: {
        totalItems: number;
        unclaimed: number;
        claimed: number;
        pending: number;
        inStorage: number;
    };
};

export default function AdminLostFoundPage() {
    const { props } = usePage() as { props: PageProps };
    const foundItems = props.foundItems ?? [];
    const stats = props.stats;

    const [filter, setFilter] = useState<
        'all' | 'unclaimed' | 'claimed' | 'pending' | 'storage'
    >('all');
    const [query, setQuery] = useState('');
    const [editingItem, setEditingItem] = useState<FoundItemRow | null>(null);
    const [pageIndex, setPageIndex] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

    // Real-time polling
    useEffect(() => {
        if (!isAutoRefreshEnabled) return;

        const pollMs = 8000;

        const interval = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            if (editingItem) return; // Don't refresh while editing

            router.reload({
                only: ['foundItems', 'stats'],
                onStart: () => setIsRefreshing(true),
                onFinish: () => {
                    setIsRefreshing(false);
                    setLastUpdated(new Date());
                },
            });
        }, pollMs);

        return () => {
            window.clearInterval(interval);
        };
    }, [editingItem, isAutoRefreshEnabled]);

    const kpis = useMemo(
        () => [
            {
                title: 'Total Items',
                value: stats?.totalItems ?? 0,
                change: '',
                accent: 'bg-blue-600',
            },
            {
                title: 'Unclaimed Items',
                value: stats?.unclaimed ?? 0,
                change: '',
                accent: 'bg-amber-500',
            },
            {
                title: 'Pending Items',
                value: stats?.pending ?? 0,
                change: '',
                accent: 'bg-sky-500',
            },
            {
                title: 'Claimed Items',
                value: stats?.claimed ?? 0,
                change: '',
                accent: 'bg-emerald-600',
            },
        ],
        [stats],
    );

    // Filter items based on status and search query
    const filteredItems = useMemo(() => {
        let filtered = foundItems;

        // Apply status filter
        if (filter !== 'all') {
            const statusMap = {
                unclaimed: 'Unclaimed',
                claimed: 'Claimed',
                pending: 'Verification Pending',
                storage: 'In Storage',
            };
            filtered = filtered.filter(
                (item: FoundItemRow) =>
                    item.status === statusMap[filter as keyof typeof statusMap],
            );
        }

        // Apply search filter
        if (query.trim()) {
            const searchLower = query.toLowerCase().trim();
            filtered = filtered.filter(
                (item: FoundItemRow) =>
                    item.title.toLowerCase().includes(searchLower) ||
                    item.location.toLowerCase().includes(searchLower) ||
                    item.status.toLowerCase().includes(searchLower),
            );
        }

        return filtered;
    }, [foundItems, filter, query]);

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

    useEffect(() => {
        setPageIndex((p) => Math.min(Math.max(p, 1), totalPages));
    }, [totalPages]);

    const pagedItems = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, pageIndex, totalPages]);

    const statusBadge = (status: FoundItemRow['status']) => {
        if (status === 'Claimed') return 'bg-emerald-600 text-white';
        if (status === 'In Storage') return 'bg-amber-500 text-white';
        if (status === 'Verification Pending') return 'bg-blue-600 text-white';
        return 'bg-slate-600 text-white';
    };

    const openEditModal = (item: FoundItemRow) => {
        setEditingItem(item);
    };

    const handleDelete = (item: FoundItemRow) => {
        const id = String(item.id ?? '').trim();
        if (!id) {
            Swal.fire({
                icon: 'error',
                title: 'Unable to delete',
                text: 'Missing item id. Please refresh the page and try again.',
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
                timerProgressBar: true,
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete the found item "${item.title}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(adminLostFoundDestroy(id), {
                    preserveScroll: true,
                });
            }
        });
    };

    const handleArchive = (item: FoundItemRow) => {
        const id = String(item.id ?? '').trim();
        if (!id) {
            Swal.fire({
                icon: 'error',
                title: 'Unable to archive',
                text: 'Missing item id. Please refresh the page and try again.',
                toast: true,
                position: 'top-end',
                timer: 3500,
                showConfirmButton: false,
                timerProgressBar: true,
            });
            return;
        }

        Swal.fire({
            title: 'Archive item?',
            text: `This will move "${item.title}" to the archive. You can restore it later.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    adminLostFoundArchive(id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Archived',
                                text: 'Item has been archived successfully.',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                    },
                );
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Lost & Found" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                                    <ScrollText className="h-6 w-6 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-lg font-semibold">
                                        Lost &amp; Found
                                    </div>
                                    <div className="text-sm text-white/80">
                                        Track found items and claim status
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="mr-2 hidden text-right sm:flex sm:items-center sm:gap-3">
                                    <div>
                                        <div className="flex items-center justify-end gap-1 text-[10px] font-bold tracking-wider text-white/70 uppercase">
                                            {isRefreshing && (
                                                <RefreshCw className="h-3 w-3 animate-spin text-white" />
                                            )}
                                            {isAutoRefreshEnabled
                                                ? 'Auto-updating'
                                                : 'Update paused'}
                                        </div>
                                        <div className="text-xs font-bold text-white/90">
                                            {lastUpdated.toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl bg-white/10 text-white transition-all hover:bg-white/20"
                                        onClick={() =>
                                            setIsAutoRefreshEnabled(
                                                !isAutoRefreshEnabled,
                                            )
                                        }
                                        title={
                                            isAutoRefreshEnabled
                                                ? 'Pause auto-refresh'
                                                : 'Resume auto-refresh'
                                        }
                                    >
                                        {isAutoRefreshEnabled ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="ml-0.5 h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <AddFoundItemDialog
                                    editingItem={editingItem}
                                    setEditingItem={setEditingItem}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {kpis.map((kpi) => (
                            <Card
                                key={kpi.title}
                                className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50"
                            >
                                <CardContent className="relative py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                {kpi.title}
                                            </div>
                                            <div className="mt-1 flex items-end gap-2">
                                                <div className="text-2xl leading-none font-semibold text-slate-900 dark:text-white">
                                                    {kpi.value}
                                                </div>
                                                {kpi.change ? (
                                                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                                        {kpi.change}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className={`h-1 w-full ${kpi.accent}`} />
                            </Card>
                        ))}
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-sm">
                                        Found Items
                                    </CardTitle>
                                    <div className="mt-1 text-xs text-slate-500">
                                        Showing {filteredItems.length} results
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <div className="w-full sm:w-52">
                                        <Select
                                            value={filter}
                                            onValueChange={(v) =>
                                                setFilter(v as typeof filter)
                                            }
                                        >
                                            <SelectTrigger className="h-10 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                                <SelectValue placeholder="Filter" />
                                            </SelectTrigger>
                                            <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                                <SelectItem value="all">
                                                    All
                                                </SelectItem>
                                                <SelectItem value="unclaimed">
                                                    Unclaimed
                                                </SelectItem>
                                                <SelectItem value="pending">
                                                    Verification Pending
                                                </SelectItem>
                                                <SelectItem value="storage">
                                                    In Storage
                                                </SelectItem>
                                                <SelectItem value="claimed">
                                                    Claimed
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="relative w-full sm:w-80">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={query}
                                            onChange={(e) =>
                                                setQuery(e.target.value)
                                            }
                                            className="h-10 border-slate-200 bg-slate-50 pr-10 pl-9 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="Search items..."
                                        />
                                        {query ? (
                                            <button
                                                type="button"
                                                onClick={() => setQuery('')}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                aria-label="Clear"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {pagedItems.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-400">
                                            <ScrollText className="h-5 w-5" />
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-900">
                                            No items found
                                        </div>
                                        <div className="mt-1 text-[11px] text-balance text-slate-500">
                                            Try adjusting your filters or search
                                            query
                                        </div>
                                    </div>
                                ) : (
                                    pagedItems.map((item: FoundItemRow) => (
                                        <Card
                                            key={item.id}
                                            onClick={() => openEditModal(item)}
                                            className="group h-fit cursor-pointer overflow-hidden border-slate-200 bg-white shadow-none transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg dark:border-slate-800 dark:bg-[#0B192C]/50"
                                        >
                                            <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                        <ScrollText className="h-8 w-8 opacity-30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase shadow-md backdrop-blur-sm ${statusBadge(item.status)}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <CardContent className="p-3.5">
                                                <h3 className="line-clamp-1 h-5 text-sm font-bold text-slate-900 transition-colors group-hover:text-[#23509A]">
                                                    {item.title}
                                                </h3>

                                                <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-50 pt-3 text-[11px]">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3 w-3 text-slate-400" />
                                                        <span className="truncate font-medium text-slate-600">
                                                            Found:{' '}
                                                            {item.foundAt}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Search className="h-3 w-3 text-slate-400" />
                                                        <span
                                                            className="truncate font-medium text-slate-600"
                                                            title={
                                                                item.location
                                                            }
                                                        >
                                                            {item.location}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div
                                                    className="mt-4 flex items-center justify-between gap-1.5 border-t border-slate-50 pt-3"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <div className="flex gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    item,
                                                                )
                                                            }
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                                                            onClick={() =>
                                                                handleArchive(
                                                                    item,
                                                                )
                                                            }
                                                            title="Archive"
                                                        >
                                                            <Archive className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                                        onClick={() =>
                                                            handleDelete(item)
                                                        }
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    Showing{' '}
                                    {filteredItems.length === 0
                                        ? 0
                                        : (Math.min(
                                              Math.max(pageIndex, 1),
                                              totalPages,
                                          ) -
                                              1) *
                                              pageSize +
                                          1}{' '}
                                    to{' '}
                                    {Math.min(
                                        Math.min(
                                            Math.max(pageIndex, 1),
                                            totalPages,
                                        ) * pageSize,
                                        filteredItems.length,
                                    )}{' '}
                                    of {filteredItems.length} entries
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        onClick={() =>
                                            setPageIndex((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={pageIndex <= 1}
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: totalPages })
                                        .slice(0, 3)
                                        .map((_, idx) => {
                                            const num = idx + 1;
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() =>
                                                        setPageIndex(num)
                                                    }
                                                    className={
                                                        'rounded-md px-2 py-1 ' +
                                                        (pageIndex === num
                                                            ? 'bg-[#23509A] text-white'
                                                            : 'text-slate-600 hover:bg-slate-100')
                                                    }
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                    <button
                                        type="button"
                                        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        onClick={() =>
                                            setPageIndex((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={pageIndex >= totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
