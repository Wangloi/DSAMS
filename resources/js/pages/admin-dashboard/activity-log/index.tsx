import { Head, router, usePage } from '@inertiajs/react';
import { Activity, Search, Trash2, Users, ChevronLeft, ChevronRight, RefreshCw, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { adminActivityLog, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
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
    
    const [actionFilter, setActionFilter] = useState<'all' | 'approved' | 'requested' | 'created' | 'updated' | 'deleted'>('all');
    const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'student' | 'program_head'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
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
            if (userFilter === 'program_head') return raw.includes('program') || userType.includes('program');
            return raw.includes(userFilter) || userType.includes(userFilter);
        };

        const matchesTime = (_r: LogRow) => {
            if (timeFilter === 'all') return true;
            return true;
        };

        const matchesSearch = (r: LogRow) => {
            if (!q) return true;
            const haystack = [r.timestamp, r.user, r.module, r.action, r.details]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return logs.filter((r) => matchesAction(r) && matchesUser(r) && matchesTime(r) && matchesSearch(r));
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
        const admin = logs.filter((r) => r.user.toLowerCase().includes('admin') || (r.userType || '').toLowerCase() === 'admin').length;
        const student = logs.filter((r) => r.user.toLowerCase().includes('student') || (r.userType || '').toLowerCase() === 'student').length;
        return { total, admin, student };
    }, [logs]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Log" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Activity Log
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Monitor system-wide actions and security updates
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:flex sm:items-center sm:gap-3 text-right">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1">
                                    {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                                    {isAutoRefreshEnabled ? 'Auto-updating' : 'Update paused'}
                                </div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {lastUpdated.toLocaleTimeString()}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-xl border-slate-200 dark:border-slate-800 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                                title={isAutoRefreshEnabled ? "Pause auto-refresh" : "Resume auto-refresh"}
                            >
                                {isAutoRefreshEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Total Logs */}
                        <Card className="overflow-hidden border border-blue-100 bg-blue-50/50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 opacity-70">
                                            Total Activities
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.total}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Logs */}
                        <Card className="overflow-hidden border border-emerald-100 bg-emerald-50/50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 opacity-70">
                                            Admin Actions
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.admin}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Student Logs */}
                        <Card className="overflow-hidden border border-amber-100 bg-amber-50/50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 opacity-70">
                                            Student Logs
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.student}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="w-full bg-white dark:bg-[#0B192C]/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Activity Timeline</CardTitle>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time system event monitoring</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as any)}>
                                        <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                            <SelectValue placeholder="All Actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="requested">Requested</SelectItem>
                                            <SelectItem value="created">Created</SelectItem>
                                            <SelectItem value="updated">Updated</SelectItem>
                                            <SelectItem value="deleted">Deleted</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={userFilter} onValueChange={(v) => setUserFilter(v as any)}>
                                        <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="program_head">Program Head</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
                                        <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                            <SelectValue placeholder="All Time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="relative w-full sm:w-64">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search log details..."
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
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Timestamp</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Action & Module</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Details</th>
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
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{row.timestamp.split(' ')[1]}</span>
                                                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">{row.timestamp.split(' ')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                                                                {row.user.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white">{row.user}</div>
                                                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">{row.userType || 'System'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`inline-flex items-center w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${row.action.toLowerCase().includes('delete') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : row.action.toLowerCase().includes('create') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                {row.action}
                                                            </span>
                                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">in {row.module}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-md line-clamp-2">{row.details}</p>
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
                                onValueChange={(v) => setPageSize(Number(v))}
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
                                Page <span className="font-bold text-slate-900 dark:text-white">{pageIndex}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
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
