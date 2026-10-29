import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { adminDashboard, adminReports } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Printer,
    Search,
    ShieldAlert,
    Star,
} from 'lucide-react';
import { type ComponentType, useMemo, useState } from 'react';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: adminDashboard() },
    { title: 'Reports', href: adminReports() },
];

type ReportRange = 'all' | 'weekly' | 'monthly' | 'yearly' | 'semester' | 'custom';

export type AttendanceEventItem = {
    id: number | string;
    name: string;
    date: string;
    formatted_date: string;
    time: string;
    location: string;
    target_programs: string;
    expected: number;
    attended: number;
    percentage: number;
    status: string;
};

export type AttendanceStats = {
    total_events: number;
    total_expected: number;
    total_attended: number;
    overall_percentage: number;
    events: AttendanceEventItem[];
};

type Props = {
    range?: ReportRange;
    periodLabel?: string;
    recordsLabel?: {
        attendance?: string;
        case_record?: string;
        evaluation?: string;
        admission_slip?: string;
    };
    attendanceStats?: AttendanceStats;
};

type ReportCardItem = {
    key: 'attendance' | 'case_record' | 'evaluation' | 'admission_slip';
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    periodLabel: string;
    recordsLabel: string;
};

export default function AdminReportsPage(props: Props) {
    const [query, setQuery] = useState('');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showAttendanceBreakdown, setShowAttendanceBreakdown] = useState(false);

    // Read directly from Inertia props — updates automatically on every router.get response
    const range = props.range ?? 'all';
    const periodLabel = props.periodLabel ?? '';
    const recordsLabelByKey = props.recordsLabel ?? {};
    const attendanceStats = props.attendanceStats;

    const handleRangeChange = (value: ReportRange) => {
        let url = adminReports() + `?range=${encodeURIComponent(value)}`;
        if (value === 'custom' && customStartDate && customEndDate) {
            url += `&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
        }
        router.get(
            url,
            {},
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const reports = useMemo<ReportCardItem[]>(
        () => [
            {
                key: 'attendance',
                title: 'Attendance Report',
                description:
                    'Overview of student attendance summary\nand detailed records.',
                icon: CalendarDays,
                periodLabel,
                recordsLabel: recordsLabelByKey.attendance ?? '0 Records',
            },
            {
                key: 'case_record',
                title: 'Case Record Report',
                description:
                    'Summary and detailed records of student case reports.',
                icon: ShieldAlert,
                periodLabel,
                recordsLabel: recordsLabelByKey.case_record ?? '0 Records',
            },
            {
                key: 'evaluation',
                title: 'Evaluation Report',
                description:
                    'Summary of student evaluations including ratings\nand feedback.',
                icon: Star,
                periodLabel,
                recordsLabel: recordsLabelByKey.evaluation ?? '0 Records',
            },
            {
                key: 'admission_slip',
                title: 'Admission Slip Report',
                description:
                    'Summary and detailed records of student admission slips.',
                icon: ClipboardList,
                periodLabel,
                recordsLabel: recordsLabelByKey.admission_slip ?? '0 Records',
            },
        ],
        [
            periodLabel,
            recordsLabelByKey.attendance,
            recordsLabelByKey.case_record,
            recordsLabelByKey.evaluation,
            recordsLabelByKey.admission_slip,
        ],
    );

    const filteredReports = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return reports;
        return reports.filter((r) =>
            [r.title, r.description].join(' ').toLowerCase().includes(q),
        );
    }, [query, reports]);

    const printUrl = (type: ReportCardItem['key']) => {
        const baseUrl = `/admin/reports/print?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`;
        if (range === 'custom' && customStartDate && customEndDate) {
            return `${baseUrl}&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
        }
        return baseUrl;
    };

    const csvUrl = (type: ReportCardItem['key']) => {
        const baseUrl = `/admin/reports/export/csv?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`;
        if (range === 'custom' && customStartDate && customEndDate) {
            return `${baseUrl}&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
        }
        return baseUrl;
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

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
                                    <ClipboardList className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        System Reports
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        Generate and export comprehensive
                                        summary reports across campus modules
                                    </p>
                                </div>
                            </div>
                            <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-md sm:flex">
                                <CalendarDays className="h-4 w-4 text-blue-200" />
                                <div className="text-xs font-semibold tracking-wide text-white/90 uppercase">
                                    {formatDate(new Date())}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex w-fit flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                            {(
                                [
                                    'all',
                                    'weekly',
                                    'monthly',
                                    'yearly',
                                    'semester',
                                    'custom',
                                ] as ReportRange[]
                            ).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => handleRangeChange(v)}
                                    className={
                                        'h-9 rounded-xl px-5 text-[11px] font-bold tracking-wider uppercase transition-all ' +
                                        (range === v
                                            ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white')
                                    }
                                >
                                    {v === 'all'
                                        ? 'All Events'
                                        : v === 'semester'
                                            ? 'By Semester'
                                            : v === 'custom'
                                                ? 'Custom Range'
                                                : v}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:ml-auto lg:max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search report types..."
                                className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 text-xs font-medium dark:border-slate-800 dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Custom Date Range Inputs */}
                    {range === 'custom' && (
                        <Card className="rounded-2xl border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                    <CalendarDays className="h-4 w-4" />
                                    Custom Date Range
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            From
                                        </span>
                                        <Input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) =>
                                                setCustomStartDate(
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-[150px] border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            To
                                        </span>
                                        <Input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) =>
                                                setCustomEndDate(e.target.value)
                                            }
                                            className="h-9 w-[150px] border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-slate-800"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        className="h-9 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                                        onClick={() => {
                                            if (
                                                customStartDate &&
                                                customEndDate
                                            ) {
                                                const url =
                                                    adminReports() +
                                                    `?range=custom&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
                                                router.get(
                                                    url,
                                                    {},
                                                    {
                                                        preserveState: true,
                                                        replace: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }
                                        }}
                                    >
                                        Apply Range
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {filteredReports.map((r) => (
                            <Card
                                key={r.key}
                                className="group overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800"
                            >
                                <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/30">
                                                <r.icon className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 uppercase dark:text-white">
                                                {r.title}
                                            </CardTitle>
                                        </div>
                                        {r.key === 'attendance' && attendanceStats && attendanceStats.total_events > 0 && (
                                            <span className="rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-[#23509A] uppercase tracking-wider dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
                                                {attendanceStats.overall_percentage}% Turnout
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                        {r.description}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 p-6">
                                    {r.key === 'attendance' && attendanceStats && (
                                        <div className="space-y-3">
                                            {/* Overall Attendance Percentage Bar */}
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        Overall Event Turnout ({attendanceStats.total_attended} / {attendanceStats.total_expected} Students)
                                                    </span>
                                                    <span className="font-extrabold text-[#23509A] dark:text-blue-400">
                                                        {attendanceStats.overall_percentage}% Attendance Rate
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, attendanceStats.overall_percentage))}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Expandable Breakdown of All Events Turnout */}
                                            {attendanceStats.events.length > 0 && (
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowAttendanceBreakdown(
                                                                !showAttendanceBreakdown,
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-xs font-bold text-[#23509A] transition-colors hover:bg-blue-100/70 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <BarChart3 className="h-3.5 w-3.5" />
                                                            {showAttendanceBreakdown
                                                                ? 'Hide Event Percentages'
                                                                : `View All Events Turnout (${attendanceStats.events.length} Events)`}
                                                        </span>
                                                        {showAttendanceBreakdown ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>

                                                    {showAttendanceBreakdown && (
                                                        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-2 space-y-1.5 shadow-inner dark:border-slate-800 dark:bg-slate-900/80">
                                                            {attendanceStats.events.map(
                                                                (ev) => {
                                                                    const pct = ev.percentage;
                                                                    const badgeColor =
                                                                        pct >= 75
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                            : pct >= 50
                                                                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                                                                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300';

                                                                    return (
                                                                        <div
                                                                            key={ev.id}
                                                                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs dark:border-slate-800/80 dark:bg-slate-800/40"
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                                    {ev.name}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                                    {ev.formatted_date} • {ev.target_programs}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex shrink-0 items-center gap-2">
                                                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                                                    {ev.attended} / {ev.expected}
                                                                                </span>
                                                                                <span
                                                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}
                                                                                >
                                                                                    {pct}%
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                                <CalendarDays className="h-4 w-4 text-blue-600" />
                                                <span className="truncate">
                                                    {r.periodLabel}
                                                </span>
                                            </div>
                                            <div className="ml-6 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                {r.recordsLabel}
                                            </div>
                                        </div>

                                        <div className="sm:ml-auto">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 gap-2 border-slate-200 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                                    onClick={() =>
                                                        window.open(
                                                            csvUrl(r.key),
                                                            '_blank',
                                                        )
                                                    }
                                                >
                                                    Export CSV
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="h-9 gap-2 bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white dark:shadow-blue-950/40"
                                                    onClick={() =>
                                                        window.open(
                                                            printUrl(r.key),
                                                            '_blank',
                                                        )
                                                    }
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    Print Report
                                                </Button>
                                                {r.key === 'attendance' && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                                                        onClick={() =>
                                                            window.open(
                                                                `${csvUrl(r.key)}&mode=detailed`,
                                                                '_blank',
                                                            )
                                                        }
                                                        title="Export raw scan logs with student IDs"
                                                    >
                                                        Scan Logs
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
