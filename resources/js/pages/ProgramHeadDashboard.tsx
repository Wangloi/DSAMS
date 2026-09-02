import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    BarChart2,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    ShieldAlert,
    Users,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import ProgramHeadLayout from './program-head/components/ProgramHeadLayout';

type ProgramEventOption = {
    id: string;
    event_name: string;
    event_date: string;
    event_time: string;
    status: string;
    organizer?: string;
    location?: string;
    present_count?: number;
    absent_count?: number;
    present_rate?: number;
    absent_rate?: number;
    total_students?: number;
};

type AttendanceRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    status: string;
    scanned_at?: string | null;
};

type Props = {
    user?: { name: string };
};

const statusColor: Record<string, { bg: string; text: string; dot: string }> = {
    upcoming: {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-400',
    },
    ongoing: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-400',
    },
    completed: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
    },
    cancelled: {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        text: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-400',
    },
};

function getStatusStyle(status: string) {
    return statusColor[status?.toLowerCase()] ?? statusColor['upcoming'];
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function ProgramHeadDashboard({ user }: Props) {
    const page = usePage<{
        events?: ProgramEventOption[];
        recentEvents?: ProgramEventOption[];
        attendanceRows?: AttendanceRow[];
        program?: string;
        violationsByYearLevel?: {
            label: string;
            value: number;
            color: string;
        }[];
        totalViolationsCount?: number;
    }>();

    const events = page.props.events ?? [];
    const recentEvents = page.props.recentEvents ?? [];
    const attendanceRows = page.props.attendanceRows ?? [];
    const program = String(page.props.program ?? '').trim();
    const violationsByYearLevel = page.props.violationsByYearLevel ?? [];
    const totalViolationsCount = page.props.totalViolationsCount ?? 0;

    const [activeTab, setActiveTab] = useState<'recent' | 'live'>('recent');
    const [monitorEventId, setMonitorEventId] = useState<string>('');
    const [monitoringEnabled, setMonitoringEnabled] = useState<boolean>(true);
    const [liveCounts, setLiveCounts] = useState({ total: 0, present: 0, late: 0 });
    const [liveRows, setLiveRows] = useState<any[]>([]);
    const [loadingLive, setLoadingLive] = useState<boolean>(false);
    const [lastUpdatedLive, setLastUpdatedLive] = useState<string | null>(null);

    // List of all events (upcoming + recent) to make selectable
    const allSelectableEvents = useMemo(() => {
        const map = new Map();
        [...recentEvents, ...events].forEach((e) => {
            if (e.id) map.set(String(e.id), e);
        });
        return Array.from(map.values());
    }, [recentEvents, events]);

    // Set initial monitorEventId if empty and selectable events exist
    useEffect(() => {
        if (!monitorEventId && allSelectableEvents.length > 0) {
            setMonitorEventId(String(allSelectableEvents[0].id));
        }
    }, [allSelectableEvents, monitorEventId]);

    const fetchLiveLogs = useCallback(async () => {
        if (!monitorEventId) return;
        setLoadingLive(true);
        try {
            const res = await fetch(`/program-head/attendance/${monitorEventId}/logs?limit=5`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setLiveRows(data.rows ?? []);
                setLiveCounts({
                    total: data.counts?.total ?? 0,
                    present: data.counts?.present ?? 0,
                    late: data.counts?.late ?? 0,
                });
                setLastUpdatedLive(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
        } catch (error) {
            console.error('Failed to fetch live logs:', error);
        } finally {
            setLoadingLive(false);
        }
    }, [monitorEventId]);

    // Live poller
    useEffect(() => {
        if (activeTab !== 'live' || !monitoringEnabled || !monitorEventId) {
            return;
        }

        void fetchLiveLogs();
        const interval = window.setInterval(() => {
            void fetchLiveLogs();
        }, 3000);

        return () => window.clearInterval(interval);
    }, [activeTab, monitoringEnabled, monitorEventId, fetchLiveLogs]);

    const counts = useMemo(() => {
        const present = attendanceRows.filter(
            (r) => String(r.status).toLowerCase() === 'present',
        ).length;
        const absent = Math.max(attendanceRows.length - present, 0);
        const pct =
            attendanceRows.length > 0
                ? Math.round((present / attendanceRows.length) * 100)
                : 0;
        return { present, absent, pct, total: attendanceRows.length };
    }, [attendanceRows]);

    const maxViolation = Math.max(
        ...violationsByYearLevel.map((v) => v.value),
        1,
    );

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    React.useEffect(() => {
        const status =
            (page.props as any)?.status ||
            (page.props as any)?.flash?.status ||
            (page.props as any)?.flash?.success;
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [page.props]);

    React.useEffect(() => {
        // Poll for real-time attendance updates every 10 seconds
        const interval = setInterval(() => {
            router.reload({
                only: ['attendanceRows'],
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    /* ─────────────────────────────────── RENDER ─────────────────────────────────── */
    return (
        <ProgramHeadLayout>
            <Head title="Program Head Dashboard" />

            <div className="relative z-10 flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Hero Header ─────────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                    {/* Background decorations */}
                    <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                <Activity className="h-7 w-7 text-blue-200" />
                            </div>

                            <div>
                                <h1 className="text-2xl leading-tight font-black tracking-tight text-white">
                                    Welcome Back, {user?.name || 'Program Head'}
                                    ! 👋
                                </h1>
                                <div className="mt-0.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <p className="text-sm font-medium text-blue-200/80">
                                        Monitoring program performance and
                                        student activity for today.
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="w-fit gap-1 self-center rounded-lg border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:self-auto"
                                    >
                                        <ShieldAlert className="h-2.5 w-2.5 text-blue-300" />
                                        {program || 'Program Administration'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Live Date Indicator widget */}
                        <div className="hidden items-center gap-3 self-center rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-md md:flex">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                                <Clock className="h-4.5 w-4.5 text-blue-200" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black tracking-widest text-blue-200/40 uppercase">
                                    System Time
                                </p>
                                <p className="text-xs font-bold tracking-tight text-white">
                                    {today}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── KPI Cards ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* Total Students */}
                    <div
                        onClick={() => router.visit('/program-head/students')}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                    >
                        <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/5" />
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    Total Students
                                </p>
                                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                    {counts.total}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    Enrolled Students
                                </p>
                            </div>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-indigo-600 uppercase transition-all duration-200 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                            <span>View Student Records</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                    </div>

                    {/* Present Today */}
                    <div
                        onClick={() => router.visit('/program-head/attendance')}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                    >
                        <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    Present Today
                                </p>
                                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                    {counts.present}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {counts.pct}% Attendance Rate
                                </p>
                            </div>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                                <CalendarCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-emerald-600 uppercase transition-all duration-200 group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300">
                            <span>View Attendance Logs</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                    </div>

                    {/* Incident Records */}
                    <div
                        onClick={() => router.visit('/program-head/violations')}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                    >
                        <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-rose-500/5" />
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    Incident Records
                                </p>
                                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                    {totalViolationsCount}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                    Flagged Cases
                                </p>
                            </div>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600" />
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-rose-600 uppercase transition-all duration-200 group-hover:text-rose-700 dark:text-rose-400 dark:group-hover:text-rose-300">
                            <span>View Incident Records</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>

                {/* ── Mid Row: Attendance + Violations Chart ───────────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                    {/* Upcoming Events – 3 cols */}
                    <Card className="flex h-[380px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5 lg:col-span-3 dark:border-slate-800 dark:bg-[#0B192C]/70">
                        <CardHeader className="dark:border-slate-850 flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-transparent px-5 pt-4 pb-3.5 dark:from-slate-800/40 dark:via-transparent">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                    <CalendarDays className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                        Upcoming Events
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Upcoming schedules & live attendance
                                        monitoring
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/program-head/calendar-events"
                                    className="hidden items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100/80 hover:text-blue-700 sm:inline-flex dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                >
                                    View All
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => router.reload()}
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-[#0B192C]/50 dark:text-slate-400 dark:hover:text-white"
                                    aria-label="Refresh Data"
                                    title="Refresh Events"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="scrollbar-thin flex-1 overflow-y-auto p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-400 uppercase backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-bold">
                                                Event
                                            </th>
                                            <th className="px-4 py-3 font-bold">
                                                Date & Time
                                            </th>
                                            <th className="px-4 py-3 font-bold">
                                                Attendance
                                            </th>
                                            <th className="px-4 py-3 text-right font-bold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {events.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-8 text-center text-slate-400 italic dark:text-slate-500"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                                        <CalendarDays className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            No upcoming events
                                                            scheduled
                                                        </p>
                                                        <Link
                                                            href="/program-head/calendar-events"
                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                        >
                                                            + View Calendar
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            events.slice(0, 5).map((row) => {
                                                const percent =
                                                    row.total_students &&
                                                    row.total_students > 0
                                                        ? Math.round(
                                                              ((row.present_count ??
                                                                  0) /
                                                                  row.total_students) *
                                                                  100,
                                                          )
                                                        : 0;

                                                const hashName = (
                                                    row.organizer || 'EV'
                                                )
                                                    .split('')
                                                    .reduce(
                                                        (
                                                            acc: number,
                                                            char: string,
                                                        ) =>
                                                            acc +
                                                            char.charCodeAt(0),
                                                        0,
                                                    );
                                                const initials = row.organizer
                                                    ? row.organizer
                                                          .split(' ')
                                                          .map(
                                                              (n: string) =>
                                                                  n[0],
                                                          )
                                                          .join('')
                                                          .slice(0, 2)
                                                          .toUpperCase()
                                                    : 'EV';
                                                const bgColors = [
                                                    'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30',
                                                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30',
                                                    'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-100 dark:border-sky-900/30',
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-100 dark:border-amber-900/30',
                                                    'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-100 dark:border-purple-900/30',
                                                    'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
                                                ];
                                                const avatarClass =
                                                    bgColors[
                                                        hashName %
                                                            bgColors.length
                                                    ];

                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className="group transition-colors duration-200 hover:bg-blue-50/30 dark:hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black tracking-wider shadow-sm ${avatarClass}`}
                                                                >
                                                                    {initials}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100">
                                                                        {
                                                                            row.event_name
                                                                        }
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                        <span className="truncate">
                                                                            {row.organizer ||
                                                                                'System'}
                                                                        </span>
                                                                        <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                                                                        <span className="truncate text-slate-400">
                                                                            {row.location ||
                                                                                'Campus'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                {formatDate(
                                                                    row.event_date,
                                                                )}{' '}
                                                                {row.event_time}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            {row.status ===
                                                            'upcoming' ? (
                                                                <span className="text-[11px] font-medium text-slate-400 italic dark:text-slate-500">
                                                                    Pending
                                                                </span>
                                                            ) : (
                                                                <div className="flex max-w-[140px] flex-col gap-1">
                                                                    <div className="flex items-center justify-between text-[11px]">
                                                                        <span className="text-[10px] font-bold text-slate-800 dark:text-white">
                                                                            {
                                                                                row.present_count
                                                                            }{' '}
                                                                            /{' '}
                                                                            {
                                                                                row.total_students
                                                                            }
                                                                        </span>
                                                                        <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                                                                            {
                                                                                percent
                                                                            }
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 font-medium dark:bg-slate-800">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${row.status === 'ongoing' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                                                            style={{
                                                                                width: `${percent}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${
                                                                    row.status ===
                                                                    'completed'
                                                                        ? 'border border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        : row.status ===
                                                                            'ongoing'
                                                                          ? 'animate-pulse border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                          : 'border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                                        row.status ===
                                                                        'completed'
                                                                            ? 'bg-slate-400'
                                                                            : row.status ===
                                                                                'ongoing'
                                                                              ? 'bg-emerald-500'
                                                                              : 'bg-blue-500'
                                                                    }`}
                                                                />
                                                                <span className="capitalize">
                                                                    {row.status}
                                                                </span>
                                                            </span>
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

                    {/* Attendance Overview – 2 cols */}
                    <Card className="flex min-h-[385px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5 lg:col-span-2 dark:border-slate-800 dark:bg-[#0B192C]/70">
                        <CardHeader className="dark:border-slate-850 flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-transparent px-5 pt-4 pb-3.5 dark:from-slate-800/40 dark:via-transparent">
                            <div className="flex items-center gap-3">
                                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-md transition-all ${
                                    activeTab === 'live'
                                        ? 'bg-red-600 shadow-red-500/20 animate-pulse'
                                        : 'bg-blue-600 shadow-blue-500/20'
                                }`}>
                                    {activeTab === 'live' ? (
                                        <Activity className="h-4.5 w-4.5 animate-pulse" />
                                    ) : (
                                        <Users className="h-4.5 w-4.5" />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                        Attendance Overview
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {activeTab === 'live' ? 'Live scan logs' : 'Recent event statistics'}
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Tab selector */}
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('recent')}
                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase transition-all ${
                                        activeTab === 'recent'
                                            ? 'bg-white text-blue-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Recent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('live');
                                        // Auto select first event if empty
                                        if (!monitorEventId && allSelectableEvents.length > 0) {
                                            setMonitorEventId(String(allSelectableEvents[0].id));
                                        }
                                    }}
                                    className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase transition-all ${
                                        activeTab === 'live'
                                            ? 'bg-white text-blue-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <span>Live Monitor</span>
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                    </span>
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-6 py-4">
                            {activeTab === 'recent' ? (
                                recentEvents.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-slate-400">
                                        <CalendarCheck className="h-10 w-10 opacity-20" />
                                        <p className="text-sm font-medium">No events recorded.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {recentEvents.slice(0, 4).map((ev: any) => (
                                            <div
                                                key={ev.id}
                                                className="group relative rounded-xl border border-slate-100 bg-slate-50/30 p-3 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/10 dark:border-white/5 dark:bg-white/5 dark:hover:border-slate-800 dark:hover:bg-slate-800/10"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-0.5">
                                                        <span className="block text-xs font-black text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {ev.event_name}
                                                        </span>
                                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                                            {formatDate(ev.event_date)}
                                                        </span>
                                                    </div>

                                                    {/* Live Monitor link button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMonitorEventId(String(ev.id));
                                                            setActiveTab('live');
                                                        }}
                                                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70"
                                                    >
                                                        <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                        Monitor
                                                    </button>
                                                </div>

                                                {/* Progress Bar showing Present vs Absent */}
                                                <div className="relative mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-850">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                                        style={{ width: `${ev.present_rate ?? 0}%` }}
                                                        title={`Present: ${ev.present_rate}%`}
                                                    />
                                                    <div
                                                        className="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-500"
                                                        style={{ width: `${ev.absent_rate ?? 0}%` }}
                                                        title={`Absent: ${ev.absent_rate}%`}
                                                    />
                                                </div>

                                                <div className="mt-1.5 flex justify-between text-[10px] font-black">
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        Present: {ev.present_rate ?? 0}% ({ev.present_count ?? 0})
                                                    </span>
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        Absent: {ev.absent_rate ?? 0}% ({ev.absent_count ?? 0})
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                /* Live Monitor Tab content */
                                <div className="space-y-4">
                                    {/* Selector & Polling control row */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={monitorEventId}
                                            onChange={(e) => setMonitorEventId(e.target.value)}
                                            className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-850 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0B192C] dark:text-white"
                                        >
                                            {allSelectableEvents.map((ev) => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.event_name} ({formatDate(ev.event_date)})
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setMonitoringEnabled((prev) => !prev)}
                                                className="h-9 w-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B192C]"
                                                title={monitoringEnabled ? 'Pause Live Polling' : 'Resume Live Polling'}
                                            >
                                                {monitoringEnabled ? (
                                                    <Pause className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                                                ) : (
                                                    <Play className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={loadingLive || !monitorEventId}
                                                onClick={fetchLiveLogs}
                                                className={`h-9 w-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B192C] ${
                                                    loadingLive ? 'animate-spin' : ''
                                                }`}
                                                title="Manual Sync"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-center dark:border-white/5 dark:bg-white/5">
                                            <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                                Total Scans
                                            </span>
                                            <span className="mt-0.5 block text-base font-black text-slate-850 dark:text-white">
                                                {liveCounts.total}
                                            </span>
                                        </div>
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-2.5 text-center dark:border-emerald-950/20 dark:bg-emerald-950/10">
                                            <span className="block text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                                                Present
                                            </span>
                                            <span className="mt-0.5 block text-base font-black text-emerald-600 dark:text-emerald-400">
                                                {liveCounts.present}
                                            </span>
                                        </div>
                                        <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-2.5 text-center dark:border-amber-950/20 dark:bg-amber-950/10">
                                            <span className="block text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                                                Late
                                            </span>
                                            <span className="mt-0.5 block text-base font-black text-amber-600 dark:text-amber-400">
                                                {liveCounts.late}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Scrollable Scans feed */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                                            <span>Recent Scan Feed</span>
                                            {lastUpdatedLive ? (
                                                <span className="text-slate-400 dark:text-slate-500">
                                                    Synced {lastUpdatedLive}
                                                </span>
                                            ) : (
                                                <span>No scans received</span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-none pr-1">
                                            {liveRows.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/10">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-450 opacity-75"></span>
                                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                                    </span>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550">Waiting for attendance check-ins...</p>
                                                </div>
                                            ) : (
                                                liveRows.slice(0, 3).map((row) => (
                                                    <div
                                                        key={row.id}
                                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-850 dark:bg-[#0C1E35] transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-bold text-slate-850 dark:text-slate-100">
                                                                {row.name}
                                                            </p>
                                                            <p className="text-[9px] font-semibold text-slate-400">
                                                                {row.student_id} &bull; {row.program}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`inline-block rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${
                                                                row.status?.toLowerCase() === 'late'
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                            }`}>
                                                                {row.status}
                                                            </span>
                                                            <p className="mt-0.5 text-[9px] font-semibold text-slate-400 flex items-center gap-1 justify-end">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {row.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Navigate to full monitoring */}
                                        <div className="pt-1 text-center">
                                            <Link
                                                href={`/program-head/attendance`}
                                                className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Open Full Real-Time Monitoring Panel
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Bottom Row: Violations Breakdown + Quick Reports ──────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Violations by Year Level */}
                    <Card className="flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5 dark:border-slate-800 dark:bg-[#0B192C]/70">
                        <CardHeader className="dark:border-slate-850 flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-transparent px-5 pt-4 pb-3.5 dark:from-slate-800/40 dark:via-transparent">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                    <BarChart2 className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                        Violations Breakdown
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        By Year Level
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col justify-between p-6">
                            {violationsByYearLevel.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-slate-400">
                                    <ShieldAlert className="h-10 w-10 opacity-20" />
                                    <p className="text-sm font-medium">
                                        No violation data recorded.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex h-48 items-end gap-6 px-2">
                                    {violationsByYearLevel.map((item) => {
                                        const heightPct = Math.max(
                                            (item.value / maxViolation) * 100,
                                            6,
                                        );
                                        return (
                                            <div
                                                key={item.label}
                                                className="group flex flex-1 flex-col items-center gap-3"
                                            >
                                                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/5">
                                                    <div
                                                        className="absolute right-0 bottom-0 left-0 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-1000 group-hover:brightness-110"
                                                        style={{
                                                            height: `${heightPct}%`,
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                                        <span className="rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5 text-center">
                                                    <p className="w-full truncate text-[9px] font-black tracking-tighter text-slate-400 uppercase">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white">
                                                        {item.value}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span className="text-xs font-bold tracking-tight text-slate-500 uppercase dark:text-slate-400">
                                        Total Logged:{' '}
                                        <span className="text-slate-900 dark:text-white">
                                            {totalViolationsCount}
                                        </span>
                                    </span>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 rounded-xl bg-slate-900 px-6 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-blue-600 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                >
                                    <Link href="/program-head/violations">
                                        Records
                                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Reports */}
                    <Card className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5 dark:border-slate-800 dark:bg-[#0B192C]/70">
                        <CardHeader className="dark:border-slate-850 flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-transparent px-5 pt-4 pb-3.5 dark:from-slate-800/40 dark:via-transparent">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                    <FileText className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                        Quick Reports
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Generate program insights
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 p-6">
                            {/* Attendance Report */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                                        Attendance Report
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-tight font-medium text-slate-500 dark:text-slate-400">
                                        Download period summary
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 rounded-xl bg-slate-900 px-5 text-[10px] font-black tracking-widest text-white uppercase shadow-md transition-all hover:bg-blue-600 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                >
                                    <a
                                        href="/program-head/reports/export/csv?type=attendance"
                                        download
                                    >
                                        Generate
                                    </a>
                                </Button>
                            </div>

                            {/* Violation Report */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                                        Incident Analytics
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-tight font-medium text-slate-500 dark:text-slate-400">
                                        Detailed violation breakdown
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 rounded-xl bg-slate-900 px-5 text-[10px] font-black tracking-widest text-white uppercase shadow-md transition-all hover:bg-blue-600 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                >
                                    <a
                                        href="/program-head/reports/export/csv?type=violations"
                                        download
                                    >
                                        Generate
                                    </a>
                                </Button>
                            </div>

                            {/* Student Summary */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                                        Student Census
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-tight font-medium text-slate-500 dark:text-slate-400">
                                        Overview of program population
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 rounded-xl bg-slate-900 px-5 text-[10px] font-black tracking-widest text-white uppercase shadow-md transition-all hover:bg-blue-600 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                >
                                    <Link href="/program-head/reports">
                                        Generate
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProgramHeadLayout>
    );
}
