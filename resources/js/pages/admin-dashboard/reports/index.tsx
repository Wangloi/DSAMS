import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adminDashboard, adminReports } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
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

type ReportRange = 'weekly' | 'monthly' | 'yearly' | 'semester' | 'custom';

type Props = {
    range?: ReportRange;
    periodLabel?: string;
    recordsLabel?: {
        attendance?: string;
        case_record?: string;
        evaluation?: string;
    };
};

type ReportCardItem = {
    key: 'attendance' | 'case_record' | 'evaluation';
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

    // Read directly from Inertia props — updates automatically on every router.get response
    const range = props.range ?? 'weekly';
    const periodLabel = props.periodLabel ?? '';
    const recordsLabelByKey = props.recordsLabel ?? {};

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
        ],
        [
            periodLabel,
            recordsLabelByKey.attendance,
            recordsLabelByKey.case_record,
            recordsLabelByKey.evaluation,
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

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex w-fit flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                            {(
                                [
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
                                    {v === 'semester'
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
                                    </div>
                                    <div className="mt-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                        {r.description}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 p-6">
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
                                                    className="h-9 gap-2 bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
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
