import { Head, router, usePage } from '@inertiajs/react';
// Force Vite HMR refresh
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    programHeadDashboard,
    programHeadReportsAttendance as reportsHome,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    Clock,
    Download,
    Printer,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { type ComponentType, useMemo, useState } from 'react';
import ProgramHeadLayout from '../components/ProgramHeadLayout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: programHeadDashboard() },
    { title: 'Reports', href: reportsHome() },
];

type ReportRange = 'weekly' | 'monthly' | 'yearly' | 'semester';

type Props = {
    range?: ReportRange;
    periodLabel?: string;
    recordsLabel?: {
        attendance?: string;
        violations?: string;
    };
};

type ReportCardItem = {
    key: 'attendance' | 'violations';
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    periodLabel: string;
    recordsLabel: string;
    accent: 'blue' | 'rose';
};

export default function ProgramHeadReportsPage() {
    const page = usePage<Props>();
    const [range, setRange] = useState<ReportRange>(
        page.props.range ?? 'weekly',
    );
    const [query, setQuery] = useState('');

    const seedPeriodLabel = useMemo(() => {
        if (range === 'weekly') return 'Weekly Report - April 2024';
        if (range === 'monthly') return 'Monthly Report - April 2024';
        if (range === 'yearly') return 'Yearly Report - 2024';
        return 'By Semester - 2nd Sem AY 2023-2024';
    }, [range]);

    const periodLabel = page.props.periodLabel ?? seedPeriodLabel;
    const recordsLabelByKey = page.props.recordsLabel ?? {};

    const reports = useMemo<ReportCardItem[]>(
        () => [
            {
                key: 'attendance',
                title: 'Attendance Report',
                description:
                    'Student attendance summaries and detailed records for your program.',
                icon: CalendarDays,
                periodLabel,
                recordsLabel: recordsLabelByKey.attendance ?? '0 Records',
                accent: 'blue',
            },
            {
                key: 'violations',
                title: 'Violation Report',
                description:
                    'Student violation summaries and detailed records for your program.',
                icon: ShieldAlert,
                periodLabel,
                recordsLabel: recordsLabelByKey.violations ?? '0 Records',
                accent: 'rose',
            },
        ],
        [
            periodLabel,
            recordsLabelByKey.attendance,
            recordsLabelByKey.violations,
        ],
    );

    const filteredReports = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return reports;

        return reports.filter((report) =>
            [report.title, report.description]
                .join(' ')
                .toLowerCase()
                .includes(q),
        );
    }, [query, reports]);

    const printUrl = (type: ReportCardItem['key']) =>
        `/program-head/reports/print?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`;
    const csvUrl = (type: ReportCardItem['key']) =>
        `/program-head/reports/export/csv?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`;

    const handleRangeChange = (value: ReportRange) => {
        setRange(value);
        const url = reportsHome() + `?range=${encodeURIComponent(value)}`;
        router.get(
            url,
            {},
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <ProgramHeadLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports Portal - Program Head" />

            <div className="min-h-screen bg-slate-50/50 dark:bg-[#020817]">
                <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    {/* ── Hero Header ─────────────────────────────────────────────── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        {/* Background decorations */}
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                    <ClipboardList className="h-7 w-7 text-blue-200" />
                                </div>

                                <div>
                                    <h1 className="text-2xl leading-tight font-black tracking-tight text-white">
                                        Reports Portal
                                    </h1>
                                    <div className="mt-0.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <p className="text-sm font-medium text-blue-200/80">
                                            Generate, print, and export program
                                            insights and records.
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="w-fit gap-1 self-center rounded-lg border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:self-auto"
                                        >
                                            <BarChart3 className="h-2.5 w-2.5 text-blue-300" />
                                            {range} Portal
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

                    <Card className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0B192C]/50">
                        <CardContent className="p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="inline-flex w-full items-center rounded-xl bg-slate-200/50 p-1 ring-1 ring-slate-900/5 lg:w-auto dark:bg-slate-800/50 dark:ring-white/10">
                                    {[
                                        { id: 'weekly', label: 'Weekly' },
                                        { id: 'monthly', label: 'Monthly' },
                                        { id: 'yearly', label: 'Yearly' },
                                        { id: 'semester', label: 'Semester' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() =>
                                                handleRangeChange(
                                                    tab.id as ReportRange,
                                                )
                                            }
                                            className={cn(
                                                'h-9 flex-1 rounded-lg px-4 text-xs font-extrabold tracking-wider uppercase transition-all duration-200 lg:flex-none',
                                                range === tab.id
                                                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full lg:w-80">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Search reports"
                                        className="h-10 rounded-xl border-slate-200 bg-white pl-9 dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {filteredReports.map((report) => (
                            <div
                                key={report.key}
                                className={cn(
                                    'group relative overflow-hidden rounded-2xl border-l-4 bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800',
                                    report.accent === 'blue'
                                        ? 'border-l-blue-500'
                                        : 'border-l-rose-500',
                                )}
                            >
                                <div
                                    className={cn(
                                        'pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full',
                                        report.accent === 'blue'
                                            ? 'bg-blue-500/5'
                                            : 'bg-rose-500/5',
                                    )}
                                />

                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                                            report.accent === 'blue'
                                                ? 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30'
                                                : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30',
                                        )}
                                    >
                                        <report.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                            {report.title}
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-[#0B192C]/30">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="flex items-center gap-3">
                                            <CalendarDays className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                                    Reporting Period
                                                </p>
                                                <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                                                    {report.periodLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                                    Records
                                                </p>
                                                <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                                                    {report.recordsLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <Button
                                        onClick={() =>
                                            window.open(
                                                printUrl(report.key),
                                                '_blank',
                                            )
                                        }
                                        className="h-10 gap-2 rounded-xl bg-slate-900 text-xs font-black tracking-wider text-white uppercase shadow-md transition-all hover:bg-blue-600 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print / PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            window.location.href = csvUrl(
                                                report.key,
                                            );
                                        }}
                                        className="h-10 gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:bg-transparent dark:hover:bg-white/5"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </div>
                                <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={cn(
                                            'h-full w-full rounded-full bg-gradient-to-r',
                                            report.accent === 'blue'
                                                ? 'from-blue-400 to-blue-600'
                                                : 'from-rose-400 to-rose-600',
                                        )}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredReports.length === 0 && (
                        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Search className="h-8 w-8 text-slate-300" />
                                <p className="text-sm font-medium text-slate-500">
                                    No reports found.
                                </p>
                                <Button
                                    variant="ghost"
                                    onClick={() => setQuery('')}
                                    className="text-xs font-bold text-blue-600"
                                >
                                    Clear search
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </ProgramHeadLayout>
    );
}
