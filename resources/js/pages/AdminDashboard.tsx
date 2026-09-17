import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    adminAdmissionSlip,
    adminAttendance,
    adminDashboard,
    adminEvaluation,
    adminEvents,
    adminIncidentsViolations,
    adminLostFound,
    adminManageUsers,
    adminReports,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Award,
    BarChart3,
    Briefcase,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Eye,
    FileSpreadsheet,
    FileText,
    History,
    Layers,
    MapPin,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Ticket,
    TrendingUp,
    UserCheck,
    UserRoundCog,
    Users,
    Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Swal from 'sweetalert2';
import { AdminLayout } from './admin-dashboard';

type Props = {
    user?: {
        name: string;
        email?: string;
        handover_expires_at?: string | null;
        handover_expires_at_formatted?: string | null;
        is_handover_active?: boolean;
    };
    recentActivities?: {
        id: string;
        module: string;
        title: string;
        details: string;
        time: string;
        userType: string;
    }[];
    kpis?: {
        title: string;
        value: number;
        hasEventToday?: boolean;
    }[];
    attendanceTrend?: {
        name: string;
        value: number;
    }[];
    violationBreakdown?: {
        name: string;
        value: number;
        color?: string;
    }[];
    evaluationRatings?: {
        name: string;
        value: number;
    }[];
    lostFoundStatus?: {
        name: string;
        value: number;
        color?: string;
    }[];
    incomingEvents?: {
        id: string;
        event: string;
        dateTime: string;
        organizer: string;
        totalAttendees: number;
        presentCount: number;
        status: 'upcoming' | 'ongoing' | 'completed' | 'ended' | string;
        location: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    valueSuffix?: string;
}

const ChartTooltip = ({ active, payload, label, valueSuffix = '' }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="min-w-[140px] rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 ring-1 ring-black/5 dark:ring-white/10">
                {label && (
                    <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-400">
                        {label}
                    </p>
                )}
                <div className="space-y-1.5">
                    {payload.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: item.color || '#3b82f6' }}
                                />
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                    {item.name && item.name !== 'value' ? item.name : 'Count'}
                                </span>
                            </div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                                {Number(item.value).toLocaleString()}
                                {valueSuffix && (
                                    <span className="ml-1 text-[10px] font-normal text-slate-400">
                                        {valueSuffix}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard({
    user,
    recentActivities = [],
    incomingEvents = [],
    kpis: propKpis,
    attendanceTrend: propAttendanceTrend,
    violationBreakdown: propViolationBreakdown,
    evaluationRatings: propEvaluationRatings,
    lostFoundStatus: propLostFoundStatus,
}: Props) {
    const page = usePage();
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [activityFilter, setActivityFilter] = useState<string>('all');

    // Live clock in user's timezone
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                })
            );
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Flash messages handler
    const status =
        (page.props as any)?.status ||
        (page.props as any)?.flash?.status ||
        (page.props as any)?.flash?.success;

    useEffect(() => {
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
            });
        }
    }, [status]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => {
                setTimeout(() => setIsRefreshing(false), 500);
            },
        });
    };

    // User details
    const authUser = (page.props as any)?.auth?.user;
    const currentUser = user || authUser;
    const isHandoverActive = Boolean(
        currentUser?.is_handover_active || currentUser?.handover_expires_at
    );

    // KPI values resolution
    const kpiValues = propKpis ?? [
        { title: "Today's Attendance", value: 0, hasEventToday: false },
        { title: 'Admission Slips', value: 0 },
        { title: 'Active Cases', value: 0 },
        { title: 'Evaluation Surveys', value: 0 },
        { title: 'Total Events', value: 0 },
        { title: 'Total Students', value: 0 },
    ];

    const getKpiVal = (title: string) => {
        const found = kpiValues.find((k) => k.title.toLowerCase() === title.toLowerCase());
        return found?.value ?? 0;
    };

    const hasTodayEvent = kpiValues.find(
        (k) => k.title === "Today's Attendance"
    )?.hasEventToday ?? false;

    // Chart Data Seed Fallbacks
    const attendanceTrend = useMemo(() => {
        if (propAttendanceTrend && propAttendanceTrend.length > 0) {
            return propAttendanceTrend;
        }
        return [
            { name: 'Jan', value: 0 },
            { name: 'Feb', value: 0 },
            { name: 'Mar', value: 0 },
            { name: 'Apr', value: 0 },
            { name: 'May', value: 0 },
            { name: 'Jun', value: 0 },
        ];
    }, [propAttendanceTrend]);

    const totalAttendanceScanned = useMemo(() => {
        return attendanceTrend.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [attendanceTrend]);

    const violationBreakdown = useMemo(() => {
        const defaultColors: Record<string, string> = {
            Warning: '#f59e0b',
            Suspension: '#3b82f6',
            Exclusion: '#8b5cf6',
            Expulsion: '#ef4444',
        };
        if (propViolationBreakdown && propViolationBreakdown.length > 0) {
            return propViolationBreakdown.map((item) => ({
                ...item,
                color: item.color || defaultColors[item.name] || '#64748b',
            }));
        }
        return [
            { name: 'Warning', value: 0, color: '#f59e0b' },
            { name: 'Suspension', value: 0, color: '#3b82f6' },
            { name: 'Exclusion', value: 0, color: '#8b5cf6' },
            { name: 'Expulsion', value: 0, color: '#ef4444' },
        ];
    }, [propViolationBreakdown]);

    const totalViolations = useMemo(() => {
        return violationBreakdown.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [violationBreakdown]);

    const evaluationRatings = useMemo(() => {
        if (propEvaluationRatings && propEvaluationRatings.length > 0) {
            return propEvaluationRatings;
        }
        return [
            { name: '1★', value: 0 },
            { name: '2★', value: 0 },
            { name: '3★', value: 0 },
            { name: '4★', value: 0 },
            { name: '5★', value: 0 },
        ];
    }, [propEvaluationRatings]);

    const averageRating = useMemo(() => {
        let totalScore = 0;
        let totalCount = 0;
        evaluationRatings.forEach((item) => {
            const stars = parseInt(item.name.replace(/\D/g, ''), 10) || 1;
            totalScore += stars * (item.value || 0);
            totalCount += item.value || 0;
        });
        if (totalCount === 0) return 0;
        return Number((totalScore / totalCount).toFixed(1));
    }, [evaluationRatings]);

    const totalFeedbackResponses = useMemo(() => {
        return evaluationRatings.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [evaluationRatings]);

    const lostFoundStatus = useMemo(() => {
        if (propLostFoundStatus && propLostFoundStatus.length > 0) {
            return propLostFoundStatus;
        }
        return [
            { name: 'Claimed', value: 0, color: '#10b981' },
            { name: 'Unclaimed', value: 0, color: '#ef4444' },
            { name: 'Pending', value: 0, color: '#3b82f6' },
        ];
    }, [propLostFoundStatus]);

    const totalLostFound = useMemo(() => {
        return lostFoundStatus.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [lostFoundStatus]);

    const claimedCount = useMemo(() => {
        return lostFoundStatus.find((item) => item.name === 'Claimed')?.value ?? 0;
    }, [lostFoundStatus]);

    const recoveryRate = useMemo(() => {
        if (totalLostFound === 0) return 0;
        return Math.round((claimedCount / totalLostFound) * 100);
    }, [claimedCount, totalLostFound]);

    // Filtered Recent Activities
    const filteredActivities = useMemo(() => {
        if (activityFilter === 'all') return recentActivities;
        return recentActivities.filter(
            (act) => act.module.toLowerCase() === activityFilter.toLowerCase()
        );
    }, [recentActivities, activityFilter]);

    const uniqueModules = useMemo(() => {
        const modules = new Set(recentActivities.map((a) => a.module).filter(Boolean));
        return Array.from(modules);
    }, [recentActivities]);

    const getModuleColor = (mod: string) => {
        const m = mod.toLowerCase();
        if (m.includes('attend'))
            return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800';
        if (m.includes('slip') || m.includes('admiss'))
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800';
        if (m.includes('incid') || m.includes('violat'))
            return 'bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800';
        if (m.includes('event'))
            return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-800';
        if (m.includes('eval') || m.includes('surv'))
            return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800';
        if (m.includes('user') || m.includes('auth'))
            return 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-800';
        return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-800';
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Command Center | DSAMS" />

            <div className="min-h-screen bg-slate-50/60 pb-16 transition-colors duration-200 dark:bg-[#0B1120]">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* ── HANDOVER PERIOD ALERT (If active) ── */}
                    {isHandoverActive && (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-5 shadow-lg backdrop-blur-md dark:border-amber-600/50 dark:bg-amber-950/30">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3.5">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
                                        <Clock className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-black tracking-wide text-amber-950 uppercase dark:text-amber-200">
                                                Active Administrator Handover Window
                                            </h2>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-300">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                                Expiring Soon
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-relaxed text-amber-900/80 dark:text-amber-300/90">
                                            A new administrator account was registered. This administrative session is scheduled for automatic expiration and deactivation on{' '}
                                            <span className="font-extrabold text-amber-950 underline underline-offset-2 dark:text-white">
                                                {currentUser?.handover_expires_at_formatted ||
                                                    currentUser?.handover_expires_at}
                                            </span>
                                            . Verify that credentials and ongoing records have been fully transitioned.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={adminManageUsers()}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 transition-all hover:from-amber-700 hover:to-amber-800 hover:shadow-lg active:scale-95"
                                >
                                    <UserRoundCog className="h-4 w-4" />
                                    Review User Accounts
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── HERO BANNER: HIGH-TECH EXECUTIVE COMMAND CENTER ── */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1E48] via-[#123274] to-[#1D4ED8] p-6 text-white shadow-2xl shadow-blue-900/30 ring-1 ring-white/15 sm:p-8">
                        {/* Background glowing ambient elements */}
                        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute top-1/2 right-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-2xl" />

                        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            {/* Left: Identity & Status */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                                <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 p-3.5 shadow-inner ring-1 ring-white/25 backdrop-blur-xl">
                                    <Sparkles className="h-8 w-8 text-cyan-300 drop-shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0B1E48]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-md">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            SYSTEM OPERATIONAL
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100 ring-1 ring-white/15">
                                            <ShieldCheck className="h-3 w-3 text-cyan-300" />
                                            Admin Access
                                        </span>
                                    </div>
                                    <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                                        Welcome back, {currentUser?.name || 'Administrator'}
                                    </h1>
                                    <p className="mt-1 max-w-xl text-xs font-medium text-blue-100/80 sm:text-sm">
                                        DSAMS Institutional Command Center • Real-time student attendance, conduct compliance, and event orchestration.
                                    </p>
                                </div>
                            </div>

                            {/* Right: Real-time Indicators & Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Live Time & Date Badge */}
                                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-xl ring-1 ring-white/10">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-cyan-300 ring-1 ring-cyan-300/30">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-mono text-sm font-bold tracking-wider text-white">
                                            {currentTime || '--:--:--'}
                                        </div>
                                        <div className="text-[10px] font-medium tracking-wide text-blue-200/80 uppercase">
                                            {new Date().toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Refresh Button */}
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white shadow-md backdrop-blur-xl transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
                                    title="Refresh Dashboard Data"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 text-cyan-300 ${isRefreshing ? 'animate-spin' : ''}`}
                                    />
                                    <span className="hidden sm:inline">Sync Data</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── TOP KPI METRIC CARDS ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card 1: Today's Attendance */}
                        <div
                            onClick={() => router.visit(adminAttendance())}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-500/40"
                        >
                            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-400">
                                            Today's Attendance
                                        </span>
                                        {hasTodayEvent ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                No Event
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight dark:text-white sm:text-4xl">
                                        {getKpiVal("Today's Attendance").toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        QR Scans Logged Today
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-transform duration-300 group-hover:scale-110">
                                    <UserCheck className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <span>Manage Attendance Sessions</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        {/* Card 2: Admission Slips */}
                        <div
                            onClick={() => router.visit(adminAdmissionSlip())}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-emerald-500/40"
                        >
                            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-400">
                                        Admission Slips
                                    </span>
                                    <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight dark:text-white sm:text-4xl">
                                        {getKpiVal('Admission Slips').toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Ticket className="h-3.5 w-3.5" />
                                        Total Slips Issued
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110">
                                    <Ticket className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <span>Issue & Review Slips</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>

                        {/* Card 3: Active Disciplinary Cases */}
                        <div
                            onClick={() => router.visit(adminIncidentsViolations())}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-rose-500/40"
                        >
                            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/20 transition-all" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-400">
                                        Active Conduct Cases
                                    </span>
                                    <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight dark:text-white sm:text-4xl">
                                        {getKpiVal('Active Cases').toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Pending Hearings / Action
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 transition-transform duration-300 group-hover:scale-110">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <span>Track Incident Status</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>

                        {/* Card 4: Evaluation Surveys */}
                        <div
                            onClick={() => router.visit(adminEvaluation())}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/40"
                        >
                            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all" />
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase dark:text-slate-400">
                                        Evaluation Surveys
                                    </span>
                                    <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight dark:text-white sm:text-4xl">
                                        {getKpiVal('Evaluation Surveys').toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5" />
                                        Active Feedback Forms
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 transition-transform duration-300 group-hover:scale-110">
                                    <FileText className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                <span>Analyze Feedback Metrics</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>

                    {/* ── SECONDARY METRIC SUMMARY BAR ── */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                    Total Events
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                    {getKpiVal('Total Events').toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                    Active Students
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                    {getKpiVal('Total Students').toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                    Lost & Found Vault
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                    {totalLostFound} items{' '}
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        ({recoveryRate}% claimed)
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                    Avg Feedback Score
                                </p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                    {averageRating > 0 ? `${averageRating} / 5.0` : 'N/A'}{' '}
                                    <span className="text-xs font-semibold text-slate-400">
                                        ({totalFeedbackResponses} responses)
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── INCOMING EVENTS HUB & QUICK COMMAND LAUNCHPAD ── */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Incoming & Live Events Hub (8 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-8 dark:border-slate-800 dark:bg-slate-900/90">
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                                            Institutional Events Schedule
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Upcoming programs, active check-ins & real-time quorum
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={adminEvents()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Schedule Event
                                    </Link>
                                    <Link
                                        href={adminEvents()}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        View All
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>

                            {/* Events List / Table */}
                            <div className="flex-1 p-0">
                                {incomingEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <CalendarDays className="h-7 w-7" />
                                        </div>
                                        <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                            No Upcoming Events Scheduled
                                        </h4>
                                        <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                                            There are no upcoming campus events found in the system calendar.
                                        </p>
                                        <Link
                                            href={adminEvents()}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Create First Event
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {incomingEvents.slice(0, 5).map((evt) => {
                                            const total = evt.totalAttendees || 0;
                                            const present = evt.presentCount || 0;
                                            const percentage =
                                                total > 0 ? Math.round((present / total) * 100) : 0;
                                            const isOngoing = evt.status === 'ongoing';
                                            const isEnded =
                                                evt.status === 'completed' || evt.status === 'ended';

                                            return (
                                                <div
                                                    key={evt.id}
                                                    className="group flex flex-col gap-3 p-4 transition-colors hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/50"
                                                >
                                                    {/* Left: Event Details & Badges */}
                                                    <div className="flex items-start gap-3.5">
                                                        <div
                                                            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-center shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                                                                isOngoing
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                                                            }`}
                                                        >
                                                            <CalendarDays className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                                                    {evt.event}
                                                                </h4>
                                                                {isOngoing && (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 animate-pulse">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                        LIVE NOW
                                                                    </span>
                                                                )}
                                                                {isEnded && (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                        Concluded
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="flex items-center gap-1 font-medium">
                                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                    {evt.dateTime}
                                                                </span>
                                                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                                <span className="flex items-center gap-1 font-medium">
                                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                    {evt.location || 'Campus Grounds'}
                                                                </span>
                                                                {evt.organizer && (
                                                                    <>
                                                                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                                            {evt.organizer}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: Attendance Quorum Meter */}
                                                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                                                        <div className="text-left sm:text-right">
                                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                {present.toLocaleString()} /{' '}
                                                                {total.toLocaleString()} Attendees
                                                            </div>
                                                            <div className="text-[10px] font-medium text-slate-400">
                                                                {percentage}% Quorum reached
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-700 ${
                                                                    isOngoing
                                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                }`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Command Action Launchpad (4 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
                            <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <Zap className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                                Quick Launchpad
                                            </h3>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                Fast shortcuts to core workflows
                                            </p>
                                        </div>
                                    </div>
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-2.5">
                                    <Link
                                        href={adminAdmissionSlip() + '?open_add=true'}
                                        className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                <Ticket className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    Issue Admission Slip
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    Fast-track student pass
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                    </Link>

                                    <Link
                                        href={adminIncidentsViolations()}
                                        className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-rose-500/50 dark:hover:bg-rose-950/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                                <ShieldAlert className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    Log Student Violation
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    Incident & disciplinary case
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                                    </Link>

                                    <Link
                                        href={adminManageUsers()}
                                        className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                                                <UserRoundCog className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    User & Role Directory
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    Students, Heads, Admins
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                                    </Link>

                                    <Link
                                        href={adminReports()}
                                        className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-purple-500/50 dark:hover:bg-purple-950/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                                <FileSpreadsheet className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    Comprehensive Reports
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    PDF, Excel & Audit export
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                                    </Link>

                                    <Link
                                        href={adminLostFound()}
                                        className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-teal-500/50 dark:hover:bg-teal-950/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 group-hover:scale-110 transition-transform">
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    Lost & Found Vault
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    Manage claims & items
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── INTERACTIVE ANALYTICS & VISUAL INTELLIGENCE ── */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Monthly Attendance Trajectory (7 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-7 dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Monthly Attendance Trend
                                        </h3>
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Total student check-ins and QR verification trajectory
                                    </p>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-right dark:border-blue-900/40 dark:bg-blue-950/40">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase">
                                        6-Mo Volume
                                    </span>
                                    <div className="text-sm font-black text-blue-700 dark:text-blue-200">
                                        {totalAttendanceScanned.toLocaleString()} Scans
                                    </div>
                                </div>
                            </div>

                            <div className="h-72 w-full px-4 pt-6 pb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={attendanceTrend}
                                        margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="attendanceGlow"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#2563eb"
                                                    stopOpacity={0.45}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#2563eb"
                                                    stopOpacity={0.0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#e2e8f0"
                                            className="dark:stroke-slate-800"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                            }}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip valueSuffix="Scans" />
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#attendanceGlow)"
                                            dot={{
                                                r: 4,
                                                fill: '#2563eb',
                                                strokeWidth: 2,
                                                stroke: '#ffffff',
                                            }}
                                            activeDot={{
                                                r: 7,
                                                stroke: '#2563eb',
                                                strokeWidth: 3,
                                                fill: '#ffffff',
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Violation Breakdown Donut Chart (5 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-5 dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Conduct Severity Breakdown
                                        </h3>
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Disciplinary cases by classification
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {totalViolations} Active Cases
                                </span>
                            </div>

                            <div className="flex h-72 flex-col items-center justify-center p-4">
                                {totalViolations === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            No Active Violation Records
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Zero unresolved disciplinary infractions
                                        </p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                content={
                                                    <ChartTooltip valueSuffix="Cases" />
                                                }
                                            />
                                            <Pie
                                                data={violationBreakdown}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                cx="50%"
                                                cy="50%"
                                            >
                                                {violationBreakdown.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        stroke="transparent"
                                                    />
                                                ))}
                                            </Pie>
                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: '#94a3b8',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── LOWER ANALYTICS: EVALUATIONS & AUDIT ACTIVITY LOG ── */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Student Feedback & Evaluations (5 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-5 dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Student Evaluation Sentiment
                                        </h3>
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Star rating distribution across survey forms
                                    </p>
                                </div>
                                <Link
                                    href={adminEvaluation()}
                                    className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Details →
                                </Link>
                            </div>

                            <div className="h-72 w-full p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={evaluationRatings}
                                        margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f1f5f9"
                                            className="dark:stroke-slate-800"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: '#94a3b8',
                                                fontWeight: 700,
                                            }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#94a3b8',
                                            }}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip valueSuffix="Responses" />
                                            }
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#f59e0b"
                                            radius={[6, 6, 0, 0]}
                                        >
                                            {evaluationRatings.map((entry, index) => (
                                                <Cell
                                                    key={`bar-${index}`}
                                                    fill={
                                                        index === 4
                                                            ? '#10b981'
                                                            : index === 3
                                                            ? '#3b82f6'
                                                            : index === 2
                                                            ? '#f59e0b'
                                                            : index === 1
                                                            ? '#f97316'
                                                            : '#ef4444'
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity Audit Trail (7 Cols) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-7 dark:border-slate-800 dark:bg-slate-900/90">
                            {/* Card Header & Filter Chips */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <History className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Institutional Audit Stream
                                        </h3>
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Live system actions, approvals & user activities
                                    </p>
                                </div>

                                {/* Filter by module */}
                                {uniqueModules.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setActivityFilter('all')}
                                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                                activityFilter === 'all'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            All
                                        </button>
                                        {uniqueModules.slice(0, 3).map((mod) => (
                                            <button
                                                key={mod}
                                                type="button"
                                                onClick={() => setActivityFilter(mod)}
                                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                                    activityFilter === mod
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {mod}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stream Feed */}
                            <div className="flex-1 p-6">
                                {filteredActivities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            <History className="h-6 w-6" />
                                        </div>
                                        <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                            No Activities Logged Yet
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Audit logs will appear here automatically as administrators and users interact with DSAMS.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Vertical connector line */}
                                        <div className="absolute top-3 bottom-3 left-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

                                        <div className="space-y-4">
                                            {filteredActivities.slice(0, 6).map((activity) => {
                                                const modInitials =
                                                    (activity.module || 'AC')
                                                        .substring(0, 2)
                                                        .toUpperCase();
                                                const pillColor = getModuleColor(
                                                    activity.module
                                                );

                                                return (
                                                    <div
                                                        key={activity.id}
                                                        className="relative flex items-start gap-4"
                                                    >
                                                        {/* Avatar Node */}
                                                        <div
                                                            className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-[10px] font-black tracking-wider shadow-sm ring-4 ring-white dark:ring-slate-900 ${pillColor}`}
                                                        >
                                                            {modInitials}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                                        {activity.title}
                                                                    </span>
                                                                    {activity.userType && (
                                                                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                            {activity.userType}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                                    {activity.time}
                                                                </span>
                                                            </div>
                                                            {activity.details && (
                                                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                                                    {activity.details}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
