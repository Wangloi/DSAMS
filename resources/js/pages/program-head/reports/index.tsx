import { Head, usePage, router } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    Download,
    Printer,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { type ComponentType, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    programHeadDashboard,
    programHeadReportsAttendance as reportsHome,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
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
        router.get(url, {}, { preserveState: true, replace: true, preserveScroll: true });
    };

    return (
        <ProgramHeadLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports Portal - Program Head" />

            <div className="min-h-screen bg-slate-50/50 dark:bg-[#020817]">
                <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Reports Portal
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Generate, print, and export program reports
                                </p>
                            </div>
                        </div>

                        <Badge className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                            {range}
                        </Badge>
                    </div>

                    <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
                        <CardContent className="p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 lg:w-auto dark:border-slate-800 dark:bg-slate-900/50">
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
                                                'h-9 rounded-lg px-4 text-xs font-bold tracking-wider uppercase transition-all',
                                                range === tab.id
                                                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white',
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
                                        className="h-10 border-slate-200 bg-white pl-9 dark:border-slate-700 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredReports.map((report) => (
                            <Card
                                key={report.key}
                                className={cn(
                                    'overflow-hidden border shadow-sm',
                                    report.accent === 'blue'
                                        ? 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/10'
                                        : 'border-rose-100 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10',
                                )}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    'grid h-12 w-12 place-items-center rounded-2xl shadow-inner',
                                                    report.accent === 'blue'
                                                        ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                        : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
                                                )}
                                            >
                                                <report.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {report.title}
                                                </CardTitle>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="rounded-xl border border-white/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-[#0B192C]/50">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="flex items-center gap-3">
                                                <CalendarDays className="h-5 w-5 text-slate-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                        Reporting Period
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {report.periodLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="h-5 w-5 text-slate-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                        Records
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {report.recordsLabel}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <Button
                                            onClick={() =>
                                                window.open(
                                                    printUrl(report.key),
                                                    '_blank',
                                                )
                                            }
                                            className="h-10 gap-2 rounded-xl bg-[#0b2d66] text-xs font-bold text-white hover:bg-blue-700"
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
                                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export CSV
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
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
