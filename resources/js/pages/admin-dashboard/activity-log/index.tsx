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
import { adminActivityLog, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Search,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Activity Log',
        href: adminActivityLog(),
    },
];

type LogRow = {
    id: string;
    timestamp: string;
    user: string;
    module: string;
    action: string;
    details: string;
    userType?: string;
};

export default function AdminActivityLogPage() {
    const page = usePage();
    const logs = ((page.props as any)?.logs || []) as LogRow[];

    const [actionFilter, setActionFilter] = useState<
        'all' | 'approved' | 'requested' | 'created' | 'updated' | 'deleted'
    >('all');
    const [userFilter, setUserFilter] = useState<
        'all' | 'admin' | 'student' | 'program_head'
    >('all');
    const [timeFilter, setTimeFilter] = useState<
        'all' | 'today' | 'week' | 'month'
    >('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

    useEffect(() => {
        if (!isAutoRefreshEnabled) return;

        const id = window.setInterval(() => {
            router.reload({
                only: ['logs'],
                preserveUrl: true,
                onStart: () => setIsRefreshing(true),
                onFinish: () => {
                    setIsRefreshing(false);
                    setLastUpdated(new Date());
                },
            });
        }, 5000);

        return () => {
            window.clearInterval(id);
        };
    }, [isAutoRefreshEnabled]);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesAction = (r: LogRow) => {
            if (actionFilter === 'all') return true;
            const raw = r.action.toLowerCase();
            if (actionFilter === 'approved') return raw.includes('approved');
            if (actionFilter === 'requested') return raw.includes('request');
            if (actionFilter === 'created') return raw.includes('create');
            if (actionFilter === 'updated') return raw.includes('update');
            if (actionFilter === 'deleted') return raw.includes('delete');
            return true;
        };

        const matchesUser = (r: LogRow) => {
            if (userFilter === 'all') return true;
            const raw = r.user.toLowerCase();
            const userType = (r.userType || '').toLowerCase();
            if (userFilter === 'program_head')
                return raw.includes('program') || userType.includes('program');
            return raw.includes(userFilter) || userType.includes(userFilter);
        };

        const matchesTime = (_r: LogRow) => {
            if (timeFilter === 'all') return true;
            return true;
        };

        const matchesSearch = (r: LogRow) => {
            if (!q) return true;
            const haystack = [
                r.timestamp,
                r.user,
                r.module,
                r.action,
                r.details,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return logs.filter(
            (r) =>
                matchesAction(r) &&
                matchesUser(r) &&
                matchesTime(r) &&
                matchesSearch(r),
        );
    }, [actionFilter, searchQuery, timeFilter, userFilter, logs]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

    useEffect(() => {
        setPageIndex((p) => Math.min(Math.max(p, 1), totalPages));
    }, [totalPages]);

    // Reset to first page when page size changes
    useEffect(() => {
        setPageIndex(1);
    }, [pageSize]);

    const pagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, totalPages]);

    const stats = useMemo(() => {
        const total = logs.length;
        const admin = logs.filter(
            (r) =>
                r.user.toLowerCase().includes('admin') ||
                (r.userType || '').toLowerCase() === 'admin',
        ).length;
        const student = logs.filter(
            (r) =>
                r.user.toLowerCase().includes('student') ||
                (r.userType || '').toLowerCase() === 'student',
        ).length;
        return { total, admin, student };
    }, [logs]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Log" />
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
                                    <Activity className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        Activity Log
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        Monitor system-wide actions and security
                                        updates in real-time
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Total Activities
                                    </p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {stats.total}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        System Logs
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                                    <Activity className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Admin Actions
                                    </p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {stats.admin}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        Administrative Logs
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        Student Logs
                                    </p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {stats.student}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        Student Activity
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                            </div>
                        </div>
                    </div>

                    <Card className="w-full overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                        <CardHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                        Activity Timeline
                                    </CardTitle>
                                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Real-time system event monitoring
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={actionFilter}
                                        onValueChange={(v) =>
                                            setActionFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50 text-xs font-bold sm:w-32 dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="All Actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Actions
                                            </SelectItem>
                                            <SelectItem value="approved">
                                                Approved
                                            </SelectItem>
                                            <SelectItem value="requested">
                                                Requested
                                            </SelectItem>
                                            <SelectItem value="created">
                                                Created
                                            </SelectItem>
                                            <SelectItem value="updated">
                                                Updated
                                            </SelectItem>
                                            <SelectItem value="deleted">
                                                Deleted
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={userFilter}
                                        onValueChange={(v) =>
                                            setUserFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50 text-xs font-bold sm:w-32 dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Users
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value="student">
                                                Student
                                            </SelectItem>
                                            <SelectItem value="program_head">
                                                Program Head
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={timeFilter}
                                        onValueChange={(v) =>
                                            setTimeFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50 text-xs font-bold sm:w-32 dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Time
                                            </SelectItem>
                                            <SelectItem value="today">
                                                Today
                                            </SelectItem>
                                            <SelectItem value="week">
                                                This Week
                                            </SelectItem>
                                            <SelectItem value="month">
                                                This Month
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
                                            placeholder="Search log details..."
                                            className="h-9 border-slate-200 bg-slate-50 pl-9 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max border-collapse text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                Timestamp
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                User
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                Action & Module
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {pagedRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                                >
                                                    No activities recorded.
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {
                                                                    row.timestamp.split(
                                                                        ' ',
                                                                    )[1]
                                                                }
                                                            </span>
                                                            <span className="text-[10px] font-medium tracking-tight text-slate-500 uppercase dark:text-slate-400">
                                                                {
                                                                    row.timestamp.split(
                                                                        ' ',
                                                                    )[0]
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                                                                {row.user
                                                                    .split(' ')
                                                                    .map(
                                                                        (n) =>
                                                                            n[0],
                                                                    )
                                                                    .join('')
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white">
                                                                    {row.user}
                                                                </div>
                                                                <div className="text-[10px] font-bold tracking-tight text-blue-600 uppercase dark:text-blue-400">
                                                                    {row.userType ||
                                                                        'System'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span
                                                                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${row.action.toLowerCase().includes('delete') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : row.action.toLowerCase().includes('create') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}
                                                            >
                                                                {row.action}
                                                            </span>
                                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                in {row.module}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="line-clamp-2 max-w-md text-sm font-medium text-slate-600 dark:text-slate-300">
                                                            {row.details}
                                                        </p>
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
                    <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Rows per page:
                            </span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => setPageSize(Number(v))}
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
                                    {pageIndex}
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
                                    onClick={() => setPageIndex(pageIndex - 1)}
                                    disabled={pageIndex === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                    onClick={() => setPageIndex(pageIndex + 1)}
                                    disabled={pageIndex === totalPages}
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
