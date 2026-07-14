import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarCheck,
    FileText,
    ShieldAlert,
    Users,
    BarChart2,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Activity,
    PlusCircle,
    ArrowRight
} from 'lucide-react';
import { useMemo } from 'react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ProgramHeadLayout from './program-head/components/ProgramHeadLayout';

type ProgramEventOption = {
    id: string;
    event_name: string;
    event_date: string;
    event_time: string;
    status: string;
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
    upcoming: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    ongoing: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-400' },
    completed: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
    cancelled: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-400' },
};

function getStatusStyle(status: string) {
    return statusColor[status?.toLowerCase()] ?? statusColor['upcoming'];
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProgramHeadDashboard({ user }: Props) {
    const page = usePage<{
        events?: ProgramEventOption[];
        attendanceRows?: AttendanceRow[];
        program?: string;
        violationsByYearLevel?: { label: string; value: number; color: string }[];
        totalViolationsCount?: number;
    }>();

    const events = page.props.events ?? [];
    const attendanceRows = page.props.attendanceRows ?? [];
    const program = String(page.props.program ?? '').trim();
    const violationsByYearLevel = page.props.violationsByYearLevel ?? [];
    const totalViolationsCount = page.props.totalViolationsCount ?? 0;

    const counts = useMemo(() => {
        const present = attendanceRows.filter(r => String(r.status).toLowerCase() === 'present').length;
        const absent = Math.max(attendanceRows.length - present, 0);
        const pct = attendanceRows.length > 0 ? Math.round((present / attendanceRows.length) * 100) : 0;
        return { present, absent, pct, total: attendanceRows.length };
    }, [attendanceRows]);

    const maxViolation = Math.max(...violationsByYearLevel.map(v => v.value), 1);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

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

            <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 relative z-10">

                {/* ── Hero Header ─────────────────────────────────────────────── */}
                <div className="rounded-3xl bg-[#0b2d66] px-8 py-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                    {/* Background glowing decorations */}
                    <div className="absolute -right-10 -top-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute right-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-105 transition-transform duration-1000" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                            <div className="relative group/avatar">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-400 to-indigo-400 rounded-2xl blur opacity-20 group-hover/avatar:opacity-50 transition duration-500"></div>
                                <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                    <Activity className="h-8 w-8 text-blue-200" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 h-5 w-5 rounded-full border-4 border-[#0b2d66] shadow-lg" title="Live System" />
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-0.5">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">{user?.name?.split(' ')[0] || 'Program Head'}</span>! 👋
                                    </h1>
                                    <p className="text-blue-100/70 font-medium text-xs sm:text-sm max-w-md">
                                        Monitoring program performance and student activity for today.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1.5 backdrop-blur-md">
                                        <ShieldAlert className="h-3 w-3 text-blue-300" />
                                        {program || 'Program Administration'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Live Date Indicator widget */}
                        <div className="hidden lg:flex items-center gap-4 bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-200" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/40">System Time</p>
                                <p className="text-sm font-bold text-white tracking-tight">{today}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── KPI Cards ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* Total Students */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-40" />
                        <CardContent className="relative p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Total Students
                                        </p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {counts.total}
                                        </h3>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight backdrop-blur-md border bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                        <TrendingUp className="h-2 w-2" />
                                        Stable
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl shadow-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <Link href="/program-head/students" className="mt-6 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between group/link cursor-pointer">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/link:text-indigo-500 transition-colors">View All Students</span>
                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Today's Attendance */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-40" />
                        <CardContent className="relative p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Present Today
                                        </p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {counts.present}
                                        </h3>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight backdrop-blur-md border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="h-2 w-2" />
                                        {counts.pct}% Rate
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl shadow-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                                    <CalendarCheck className="h-5 w-5" />
                                </div>
                            </div>
                            <Link href="/program-head/attendance" className="mt-6 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between group/link cursor-pointer">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/link:text-emerald-500 transition-colors">View Attendance</span>
                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Total Violations */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-none transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 opacity-40" />
                        <CardContent className="relative p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Incident Records
                                        </p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {totalViolationsCount}
                                        </h3>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight backdrop-blur-md border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400">
                                        <AlertTriangle className="h-2 w-2" />
                                        Flagged Cases
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl shadow-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                            </div>
                            <Link href="/program-head/violations" className="mt-6 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between group/link cursor-pointer">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/link:text-rose-500 transition-colors">Review Violations</span>
                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Mid Row: Attendance + Violations Chart ───────────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">

                    {/* Attendance Overview – 2 cols */}
                    <Card className="group relative rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg lg:col-span-2 flex flex-col min-h-[380px]">
                        <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Attendance Overview</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time engagement</p>
                            </div>
                            <Badge className="rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 backdrop-blur-md animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" />
                                Live
                            </Badge>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col items-center pt-8 pb-6 px-6">
                            <div className="relative mb-6 flex items-center justify-center">
                                <svg className="size-40 -rotate-90 drop-shadow-2xl" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="10" fill="transparent" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        stroke="url(#head-grad)"
                                        strokeWidth="10"
                                        fill="transparent"
                                        strokeDasharray={326.7}
                                        strokeDashoffset={326.7 - (326.7 * counts.pct) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                    <defs>
                                        <linearGradient id="head-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#1e40af" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{counts.pct}%</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Rate</span>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3 text-center group/stat">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{counts.present}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/stat:text-emerald-500 transition-colors">Present</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3 text-center group/stat">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{counts.absent}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/stat:text-rose-500 transition-colors">Absent</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Violations by Year Level – 3 cols */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg lg:col-span-3 flex flex-col h-[380px]">
                        <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Violations Breakdown</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">By Year Level</p>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
                                <BarChart2 className="h-4.5 w-4.5 text-rose-600" />
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-between p-6">
                            {violationsByYearLevel.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-3">
                                    <ShieldAlert className="h-10 w-10 opacity-20" />
                                    <p className="text-sm font-medium">No violation data recorded.</p>
                                </div>
                            ) : (
                                <div className="flex items-end gap-6 h-48 px-2">
                                    {violationsByYearLevel.map((item) => {
                                        const heightPct = Math.max((item.value / maxViolation) * 100, 6);
                                        return (
                                            <div key={item.label} className="group flex flex-1 flex-col items-center gap-3">
                                                <div className="relative w-full h-32 rounded-xl bg-slate-50 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/5">
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-1000 group-hover:brightness-110"
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-black text-white bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm">{item.value}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate w-full">{item.label}</p>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white">{item.value}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                        Total Logged: <span className="text-slate-900 dark:text-white">{totalViolationsCount}</span>
                                    </span>
                                </div>
                                <Button asChild size="sm" className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest px-6 hover:bg-blue-600 dark:hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                                    <Link href="/program-head/violations">
                                        Records
                                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Bottom Row: Upcoming Events + Quick Reports ──────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    {/* Upcoming Events */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-5 pt-6 px-6 border-b border-slate-100 dark:border-white/5">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Upcoming Events</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scheduled program activities</p>
                            </div>
                            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                <Link href="/program-head/calendar-events">
                                    View all
                                    <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                                </Link>
                            </Button>
                        </CardHeader>

                        <CardContent className="p-6">
                            {events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5">
                                        <CalendarCheck className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">No upcoming events scheduled.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {events.slice(0, 4).map((e) => {
                                        const s = getStatusStyle(e.status);
                                        return (
                                            <Link href={`?event=${e.id}`} preserveState preserveScroll key={e.id} className="group/item block w-full text-left">
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover/item:scale-110 transition-transform">
                                                        <CalendarCheck className="h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{e.event_name}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDate(e.event_date)}
                                                            </div>
                                                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md", s.bg, s.text, "border-none")}>
                                                                {e.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Reports */}
                    <Card className="group relative overflow-hidden rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg">
                        <CardHeader className="pb-5 pt-6 px-6 border-b border-slate-100 dark:border-white/5">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Quick Reports</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Generate program insights</p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            {/* Attendance Report */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-md">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Attendance Report</p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Download period summary</p>
                                </div>
                                <Button asChild size="sm" className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest px-5 hover:bg-blue-600 dark:hover:bg-blue-600 transition-all shadow-md active:scale-95">
                                    <a href="/program-head/reports/export/csv?type=attendance" download>
                                        Generate
                                    </a>
                                </Button>
                            </div>

                            {/* Violation Report */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-md">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Incident Analytics</p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Detailed violation breakdown</p>
                                </div>
                                <Button asChild size="sm" className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest px-5 hover:bg-blue-600 dark:hover:bg-blue-600 transition-all shadow-md active:scale-95">
                                    <a href="/program-head/reports/export/csv?type=violations" download>
                                        Generate
                                    </a>
                                </Button>
                            </div>

                            {/* Student Summary */}
                            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:shadow-md">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Student Census</p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Overview of program population</p>
                                </div>
                                <Button asChild size="sm" className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest px-5 hover:bg-blue-600 dark:hover:bg-blue-600 transition-all shadow-md active:scale-95">
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
