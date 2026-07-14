import { Head } from '@inertiajs/react';
import { BarChart3, CalendarDays, ClipboardList, Printer, Search, ShieldAlert, ChevronDown, Star } from 'lucide-react';
import { type ComponentType, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { adminDashboard, adminReports } from '@/routes';
import type { BreadcrumbItem } from '@/types';
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

export default function AdminReportsPage() {
    const [range, setRange] = useState<ReportRange>((arguments[0] as Props).range ?? 'weekly');
    const [query, setQuery] = useState('');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const seedPeriodLabel = useMemo(() => {
        if (range === 'weekly') return 'Weekly Report - April 2024';
        if (range === 'monthly') return 'Monthly Report - April 2024';
        if (range === 'yearly') return 'Yearly Report - 2024';
        if (range === 'custom' && customStartDate && customEndDate) {
            return `Custom Report - ${customStartDate} to ${customEndDate}`;
        }
        return 'By Semester - 2nd Sem AY 2023-2024';
    }, [range, customStartDate, customEndDate]);

    const periodLabel = (arguments[0] as Props).periodLabel ?? seedPeriodLabel;

    const recordsLabelByKey = (arguments[0] as Props).recordsLabel ?? {};

    const reports = useMemo<ReportCardItem[]>(
        () => [
            {
                key: 'attendance',
                title: 'Attendance Report',
                description: 'Overview of student attendance summary\nand detailed records.',
                icon: CalendarDays,
                periodLabel,
                recordsLabel: recordsLabelByKey.attendance ?? '312 Records',
            },
            {
                key: 'case_record',
                title: 'Case Record Report',
                description: 'Summary and detailed records of student case reports.',
                icon: ShieldAlert,
                periodLabel,
                recordsLabel: recordsLabelByKey.case_record ?? '75 Records',
            },
            {
                key: 'evaluation',
                title: 'Evaluation Report',
                description: 'Summary of student evaluations including ratings\nand feedback.',
                icon: Star,
                periodLabel,
                recordsLabel: recordsLabelByKey.evaluation ?? '450 Records',
            },
        ],
        [periodLabel, recordsLabelByKey.attendance, recordsLabelByKey.case_record, recordsLabelByKey.evaluation],
    );

    const filteredReports = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return reports;
        return reports.filter((r) => [r.title, r.description].join(' ').toLowerCase().includes(q));
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

    const tabButton = (value: ReportRange, label: string) => (
        <button
            type="button"
            onClick={() => {
                setRange(value as ReportRange);
                let url = adminReports() + `?range=${encodeURIComponent(value)}`;
                if (value === 'custom' && customStartDate && customEndDate) {
                    url += `&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
                }
                window.history.replaceState(null, '', url);
            }}
            className={
                'h-9 shrink-0 whitespace-nowrap px-4 text-sm font-semibold transition-colors ' +
                (range === value
                    ? 'bg-[#23509A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')
            }
        >
            {label}
        </button>
    );

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    System Reports
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Generate and export comprehensive summary reports
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                            {['weekly', 'monthly', 'yearly', 'semester', 'custom'].map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                        setRange(v as ReportRange);
                                        let url = adminReports() + `?range=${encodeURIComponent(v)}`;
                                        if (v === 'custom' && customStartDate && customEndDate) {
                                            url += `&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
                                        }
                                        window.history.replaceState(null, '', url);
                                    }}
                                    className={
                                        'h-9 px-5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-xl ' +
                                        (range === v 
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' 
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                                    }
                                >
                                    {v === 'semester' ? 'By Semester' : v === 'custom' ? 'Custom Range' : v}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:ml-auto lg:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search report types..."
                                className="h-10 w-full rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 pl-9 text-xs font-medium"
                            />
                        </div>
                    </div>

                    {/* Custom Date Range Inputs */}
                    {range === 'custom' && (
                        <Card className="p-4 bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20 rounded-2xl">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    <CalendarDays className="h-4 w-4" />
                                    Custom Date Range
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">From</span>
                                        <Input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="h-9 w-[150px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">To</span>
                                        <Input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="h-9 w-[150px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-xs font-bold"
                                        />
                                    </div>
                                    <Button 
                                        type="button"
                                        className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 px-6 text-xs font-bold shadow-md shadow-blue-500/20"
                                        onClick={() => {
                                            if (customStartDate && customEndDate) {
                                                const url = adminReports() + `?range=custom&customStartDate=${encodeURIComponent(customStartDate)}&customEndDate=${encodeURIComponent(customEndDate)}`;
                                                window.history.replaceState(null, '', url);
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
                            <Card key={r.key} className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                                <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                                                <r.icon className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{r.title}</CardTitle>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{r.description}</div>
                                </CardHeader>

                                <CardContent className="p-6 space-y-4">
                                    <div className="flex flex-col gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 sm:flex-row sm:items-center">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                                <CalendarDays className="h-4 w-4 text-blue-600" />
                                                <span className="truncate">{r.periodLabel}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-6">
                                                {r.recordsLabel}
                                            </div>
                                        </div>

                                        <div className="sm:ml-auto">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 gap-2 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    onClick={() => window.open(csvUrl(r.key), '_blank')}
                                                >
                                                    Export CSV
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="h-9 gap-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                                    onClick={() => window.open(printUrl(r.key), '_blank')}
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
