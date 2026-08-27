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
    adminManageUsers,
    adminReports,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart as BarChart3,
    Briefcase,
    CalendarDays,
    ClipboardCheck,
    FileText,
    RotateCcw,
    Ticket,
    UserRoundCog,
    CheckCircle,
    History,
} from 'lucide-react';
import React from 'react';
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
        status: 'upcoming' | 'ongoing' | 'completed';
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
            <div className="rounded-xl border border-slate-200/60 bg-white/95 p-3 shadow-[0_10px_25px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/95 ring-1 ring-black/5 dark:ring-white/5">
                {label && (
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1 dark:text-slate-500">
                        {label}
                    </p>
                )}
                <div className="space-y-1">
                    {payload.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                            {item.color && (
                                <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                            )}
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {item.name && item.name !== 'value' ? `${item.name}: ` : ''}
                                <span className="font-extrabold text-[#23509A] dark:text-blue-400">
                                    {item.value.toLocaleString()}
                                </span>
                                <span className="ml-1 text-[10px] font-medium text-slate-500">
                                    {valueSuffix}
                                </span>
                            </p>
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
    recentActivities,
    incomingEvents,
}: Props) {
    const page = usePage();
    const status =
        (page.props as any)?.status ||
        (page.props as any)?.flash?.status ||
        (page.props as any)?.flash?.success;

    React.useEffect(() => {
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [status]);

    const kpiConfig = [
        {
            title: "Today's Attendance",
            href: adminAttendance(),
            color: 'bg-blue-600',
            icon: ClipboardCheck,
        },
        {
            title: 'Admission Slips',
            href: adminAdmissionSlip(),
            color: 'bg-emerald-600',
            icon: Ticket,
        },
        {
            title: 'Active Cases',
            href: adminIncidentsViolations(),
            color: 'bg-rose-600',
            icon: Briefcase,
        },
        {
            title: 'Evaluation Surveys',
            href: adminEvaluation(),
            color: 'bg-amber-600',
            icon: FileText,
        },
    ];

    const kpiValues = (arguments[0] as Props).kpis ?? [
        { title: "Today's Attendance", value: 320 },
        { title: 'Admission Slips', value: 45 },
        { title: 'Active Cases', value: 8 },
        { title: 'Evaluation Surveys', value: 12 },
    ];

    const kpis = kpiConfig.map((config) => {
        const stat = kpiValues.find((v) => v.title === config.title) || {
            value: 0,
        };
        return {
            ...config,
            value: stat.value,
        };
    });

    const seedAttendanceTrend = [
        { name: 'Jan', value: 210 },
        { name: 'Feb', value: 380 },
        { name: 'Mar', value: 360 },
        { name: 'Apr', value: 610 },
        { name: 'May', value: 470 },
        { name: 'Jun', value: 700 },
    ];

    const seedViolationBreakdown = [
        { name: 'Warning', value: 45, color: '#f59e0b' },
        { name: 'Suspension', value: 25, color: '#f97316' },
        { name: 'Exclusion', value: 15, color: '#ef4444' },
        { name: 'Expulsion', value: 5, color: '#7f1d1d' },
    ];

    const seedEvaluationRatings = [
        { name: '1★', value: 4200 },
        { name: '2★', value: 3500 },
        { name: '3★', value: 3400 },
        { name: '4★', value: 3200 },
        { name: '5★', value: 3000 },
    ];

    const seedLostFoundStatus = [
        { name: 'Claimed', value: 32, color: '#22c55e' },
        { name: 'Unclaimed', value: 14, color: '#ef4444' },
        { name: 'Pending', value: 9, color: '#2563eb' },
    ];

    const attendanceTrend = (arguments[0] as Props).attendanceTrend?.length
        ? ((arguments[0] as Props).attendanceTrend ?? [])
        : seedAttendanceTrend;
    const violationBreakdown = (arguments[0] as Props).violationBreakdown
        ?.length
        ? ((arguments[0] as Props).violationBreakdown ?? []).map((v) => ({
              ...v,
              color: v.color ?? '#94a3b8',
          }))
        : seedViolationBreakdown;
    const evaluationRatings = (arguments[0] as Props).evaluationRatings?.length
        ? ((arguments[0] as Props).evaluationRatings ?? [])
        : seedEvaluationRatings;
    const lostFoundStatus = (arguments[0] as Props).lostFoundStatus?.length
        ? ((arguments[0] as Props).lostFoundStatus ?? []).map((v) => ({
              ...v,
              color: v.color ?? '#94a3b8',
          }))
        : seedLostFoundStatus;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
                    {/* ── Hero Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        Welcome Back,{' '}
                                        {user?.name || 'Administrator'}! 👋
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        System Command Center • Incoming Events
                                        & Performance Metrics
                                    </p>
                                </div>
                            </div>

                            {/* Live Date Indicator widget */}
                            <div className="hidden items-center gap-3 self-center rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-md md:flex">
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

                    {/* ── KPI STAT CARDS (Top Priority Stats) ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {kpis.map((kpi) => {
                            const themeMap: Record<
                                string,
                                {
                                    glow: string;
                                    subtext: string;
                                    subtextColor: string;
                                    iconBg: string;
                                    barGradient: string;
                                }
                            > = {
                                "Today's Attendance": {
                                    glow: 'bg-blue-500/5',
                                    subtext: 'Scanned Today',
                                    subtextColor:
                                        'text-blue-600 dark:text-blue-400',
                                    iconBg: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30',
                                    barGradient: 'from-blue-400 to-blue-600',
                                },
                                'Admission Slips': {
                                    glow: 'bg-emerald-500/5',
                                    subtext: 'Generated Slips',
                                    subtextColor:
                                        'text-emerald-600 dark:text-emerald-400',
                                    iconBg: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
                                    barGradient:
                                        'from-emerald-400 to-emerald-600',
                                },
                                'Active Cases': {
                                    glow: 'bg-rose-500/5',
                                    subtext: 'Incident Records',
                                    subtextColor:
                                        'text-rose-600 dark:text-rose-400',
                                    iconBg: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30',
                                    barGradient: 'from-rose-400 to-rose-600',
                                },
                                'Evaluation Surveys': {
                                    glow: 'bg-amber-500/5',
                                    subtext: 'Form Feedback',
                                    subtextColor:
                                        'text-amber-600 dark:text-amber-400',
                                    iconBg: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
                                    barGradient: 'from-amber-400 to-amber-600',
                                },
                            };

                            const theme =
                                themeMap[kpi.title] ||
                                themeMap["Today's Attendance"];

                            return (
                                <div
                                    key={kpi.title}
                                    onClick={() => router.visit(kpi.href)}
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                                >
                                    <div
                                        className={`pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full ${theme.glow}`}
                                    />
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                {kpi.title}
                                            </p>
                                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                                {kpi.value}
                                            </p>
                                            <p
                                                className={`mt-1 text-xs font-semibold ${theme.subtextColor}`}
                                            >
                                                {theme.subtext}
                                            </p>
                                        </div>
                                        <div
                                            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${theme.iconBg} transition-transform duration-300 group-hover:scale-110`}
                                        >
                                            {React.createElement(kpi.icon, {
                                                className: 'h-5 w-5',
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={`h-full w-full bg-gradient-to-r ${theme.barGradient} rounded-full`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── INCOMING EVENTS & QUICK ACTIONS SECTION ── */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        {/* Incoming & Active Events (9 cols) */}
                        <Card className="flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5 lg:col-span-9 dark:border-slate-800 dark:bg-[#0B192C]/70">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-transparent px-5 pt-4 pb-3.5 dark:border-slate-800 dark:from-slate-800/40 dark:via-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                        <CalendarDays className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
                                            Incoming & Active Events
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Upcoming schedules & live attendance
                                            monitoring
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={adminEvents()}
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
                            <CardContent className="flex-1 p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500">
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
                                            {(incomingEvents ?? []).length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-4 py-8 text-center text-slate-400 italic dark:text-slate-500"
                                                    >
                                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                                            <CalendarDays className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                No upcoming
                                                                events scheduled
                                                            </p>
                                                            <Link
                                                                href={adminEvents()}
                                                                className="text-xs font-bold text-blue-600 hover:underline"
                                                            >
                                                                + Create New
                                                                Event
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                incomingEvents
                                                    ?.slice(0, 5)
                                                    .map((row) => {
                                                        const percent =
                                                            row.totalAttendees >
                                                            0
                                                                ? Math.round(
                                                                      (row.presentCount /
                                                                          row.totalAttendees) *
                                                                          100,
                                                                  )
                                                                : 0;

                                                        const hashName = (
                                                            row.organizer ||
                                                            'EV'
                                                        )
                                                            .split('')
                                                            .reduce(
                                                                (acc, char) =>
                                                                    acc +
                                                                    char.charCodeAt(
                                                                        0,
                                                                    ),
                                                                0,
                                                            );
                                                        const initials =
                                                            row.organizer
                                                                ? row.organizer
                                                                      .split(
                                                                          ' ',
                                                                      )
                                                                      .map(
                                                                          (n) =>
                                                                              n[0],
                                                                      )
                                                                      .join('')
                                                                      .slice(
                                                                          0,
                                                                          2,
                                                                      )
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
                                                                            {
                                                                                initials
                                                                            }
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100">
                                                                                {
                                                                                    row.event
                                                                                }
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                                <span className="truncate">
                                                                                    {
                                                                                        row.organizer
                                                                                    }
                                                                                </span>
                                                                                <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                                                                                <span className="truncate text-slate-400">
                                                                                    {
                                                                                        row.location
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                                        {
                                                                            row.dateTime
                                                                        }
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
                                                                                        row.presentCount
                                                                                    }{' '}
                                                                                    /{' '}
                                                                                    {
                                                                                        row.totalAttendees
                                                                                    }
                                                                                </span>
                                                                                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                                                                                    {
                                                                                        percent
                                                                                    }

                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
                                                                            {
                                                                                row.status
                                                                            }
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

                        {/* Tight Ultra-Compact Quick Actions (3 cols) */}
                        <Card className="flex h-fit flex-col border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md lg:col-span-3 dark:border-slate-700 dark:bg-[#0B192C]/50">
                            <CardHeader className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-700/50">
                                <CardTitle className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-slate-800 uppercase dark:text-white">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#23509A]" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-1 p-2">
                                <Link
                                    href={adminEvents()}
                                    className="group dark:from-slate-850 flex items-center gap-2 rounded-lg border border-slate-100 bg-gradient-to-r from-sky-50/70 to-blue-50/30 px-2.5 py-1.5 transition-all duration-200 hover:border-sky-300 hover:shadow-sm dark:border-slate-700/50 dark:to-slate-800 dark:hover:border-sky-800"
                                >
                                    <div className="shrink-0 rounded bg-sky-500/10 p-1 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        Create Event
                                    </span>
                                </Link>

                                <Link
                                    href={
                                        adminAdmissionSlip() + '?open_add=true'
                                    }
                                    className="group dark:from-slate-850 flex items-center gap-2 rounded-lg border border-slate-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/30 px-2.5 py-1.5 transition-all duration-200 hover:border-emerald-300 hover:shadow-sm dark:border-slate-700/50 dark:to-slate-800 dark:hover:border-emerald-800"
                                >
                                    <div className="shrink-0 rounded bg-emerald-500/10 p-1 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <Ticket className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        Admission Slip
                                    </span>
                                </Link>

                                <Link
                                    href={adminIncidentsViolations()}
                                    className="group dark:from-slate-850 flex items-center gap-2 rounded-lg border border-slate-100 bg-gradient-to-r from-rose-50/70 to-red-50/30 px-2.5 py-1.5 transition-all duration-200 hover:border-rose-300 hover:shadow-sm dark:border-slate-700/50 dark:to-slate-800 dark:hover:border-rose-800"
                                >
                                    <div className="shrink-0 rounded bg-rose-500/10 p-1 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                        <Briefcase className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        Log Violation
                                    </span>
                                </Link>

                                <Link
                                    href={adminManageUsers()}
                                    className="group dark:from-slate-850 flex items-center gap-2 rounded-lg border border-slate-100 bg-gradient-to-r from-amber-50/70 to-yellow-50/30 px-2.5 py-1.5 transition-all duration-200 hover:border-amber-300 hover:shadow-sm dark:border-slate-700/50 dark:to-slate-800 dark:hover:border-amber-800"
                                >
                                    <div className="shrink-0 rounded bg-amber-500/10 p-1 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                        <UserRoundCog className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        Manage Users
                                    </span>
                                </Link>

                                <Link
                                    href={adminReports()}
                                    className="group dark:from-slate-850 flex items-center gap-2 rounded-lg border border-slate-100 bg-gradient-to-r from-violet-50/70 to-purple-50/30 px-2.5 py-1.5 transition-all duration-200 hover:border-violet-300 hover:shadow-sm dark:border-slate-700/50 dark:to-slate-800 dark:hover:border-violet-800"
                                >
                                    <div className="shrink-0 rounded bg-violet-500/10 p-1 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                        <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                        Reports
                                    </span>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── CHARTS SECTION ── */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <Card className="flex h-[380px] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md lg:col-span-7 dark:border-slate-800 dark:bg-[#0B192C]/60">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 pt-4 pb-3 dark:border-slate-800/80 dark:bg-slate-900/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-black text-slate-800 dark:text-white">
                                            Attendance Trend
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Total student check-ins and QR
                                        attendance scans per month
                                    </CardDescription>
                                </div>
                                <div className="hidden text-right sm:block">
                                    <div className="text-xs font-medium text-slate-400">
                                        Total Scanned
                                    </div>
                                    <div className="text-base font-black text-[#23509A] dark:text-blue-400">
                                        {attendanceTrend
                                            .reduce(
                                                (acc, curr) => acc + curr.value,
                                                0,
                                            )
                                            .toLocaleString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="h-64 flex-1 px-1 pt-4 pb-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={attendanceTrend}
                                        margin={{
                                            top: 15,
                                            right: 15,
                                            left: -25,
                                            bottom: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="attendanceGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#2563eb"
                                                    stopOpacity={0.4}
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
                                            stroke="#f1f5f9"
                                            className="dark:stroke-slate-800"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748b',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                                fill: '#64748b',
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
                                            fill="url(#attendanceGradient)"
                                            dot={{
                                                r: 4,
                                                fill: '#1e40af',
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
                            </CardContent>
                        </Card>

                        <Card className="flex h-[360px] flex-col border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md lg:col-span-5 dark:border-slate-700 dark:bg-[#0B192C]/50">
                            <CardHeader className="px-5 pt-4 pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">
                                    Violation Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex h-64 items-center justify-center pb-4">
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
                                            outerRadius={90}
                                            cx="50%"
                                            cy="50%"
                                        >
                                            {violationBreakdown.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Legend
                                            wrapperStyle={{
                                                fontSize: 11,
                                                color: '#64748b',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <Card className="flex h-[360px] flex-col border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md lg:col-span-12 dark:border-slate-700 dark:bg-[#0B192C]/50">
                            <CardHeader className="px-5 pt-4 pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">
                                    Evaluation Ratings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 pb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={evaluationRatings}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fontSize: 12,
                                                fill: '#64748b',
                                            }}
                                        />
                                        <YAxis
                                            tick={{
                                                fontSize: 12,
                                                fill: '#64748b',
                                            }}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip valueSuffix="Responses" />
                                            }
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#23509A"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <Card className="flex flex-col border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md lg:col-span-12 dark:border-slate-700 dark:bg-[#0B192C]/50">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 pt-4 pb-3 dark:border-slate-800/80 dark:bg-slate-900/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <History className="h-4.5 w-4.5 text-[#23509A] dark:text-blue-400" />
                                        <CardTitle className="text-sm font-black text-slate-800 dark:text-white">
                                            Recent Activity Logs
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Latest system actions and audit trails
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="px-5 py-4 flex-1">
                                <div className="space-y-4">
                                    {!recentActivities || recentActivities.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-4 text-center">
                                            No recent activities logged.
                                        </p>
                                    ) : (
                                        <div className="flow-root">
                                            <ul className="-mb-8">
                                                {recentActivities.slice(0, 5).map((activity, idx) => (
                                                    <li key={activity.id}>
                                                        <div className="relative pb-8">
                                                            {idx !== recentActivities.slice(0, 5).length - 1 && (
                                                                <span
                                                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div className="relative flex space-x-3">
                                                                <div>
                                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 ring-4 ring-white dark:ring-slate-900">
                                                                        <span className="text-[10px] font-black uppercase">
                                                                            {activity.module.substring(0, 2) || 'AC'}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                            {activity.title}
                                                                        </p>
                                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                            {activity.details}
                                                                        </p>
                                                                    </div>
                                                                    <div className="whitespace-nowrap text-right text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                                        <time dateTime={activity.time}>{activity.time}</time>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
