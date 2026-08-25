import { Head, usePage } from '@inertiajs/react';
// Force Vite HMR reload
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
import { cn } from '@/lib/utils';
import IncidentReportDialog from '@/pages/admin-dashboard/incidents-violations/IncidentReportDialog';
import Pagination from '@/pages/admin-dashboard/incidents-violations/Pagination';
import type {
    IncidentReportPayload,
    IncidentRow,
    IncidentStats,
    StatusFilter,
    TypeFilter,
} from '@/pages/admin-dashboard/incidents-violations/types';
import {
    Activity,
    AlertCircle,
    Clock,
    Eye,
    FileText,
    Info,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import ProgramHeadLayout from './components/ProgramHeadLayout';

type PageProps = {
    incidents: IncidentRow[];
    program: string;
};

export default function Violations() {
    const { props } = usePage<PageProps>();
    const incidents = props.incidents ?? [];
    const programName = props.program ?? 'Program';

    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedIncident, setSelectedIncident] =
        useState<IncidentRow | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const stats: IncidentStats = useMemo(() => {
        const total = incidents.length;
        const pending = incidents.filter(
            (incident) => incident.status === 'Pending',
        ).length;
        const ongoing = incidents.filter(
            (incident) => incident.status === 'Ongoing',
        ).length;
        const resolved = incidents.filter(
            (incident) => incident.status === 'Resolved',
        ).length;
        const escalated = incidents.filter(
            (incident) => incident.status === 'Escalated',
        ).length;

        return { total, pending, ongoing, resolved, escalated };
    }, [incidents]);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return incidents.filter((row) => {
            const matchesType =
                typeFilter === 'all' ||
                row.classification.toLowerCase() === typeFilter;
            const matchesStatus =
                statusFilter === 'all' || row.status === statusFilter;
            const haystack = [
                row.caseId,
                row.student,
                row.type,
                row.classification,
                row.dateTime,
                row.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesType && matchesStatus && (!q || haystack.includes(q));
        });
    }, [incidents, searchQuery, statusFilter, typeFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const pagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;

        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, pageSize, totalPages]);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const kpiData = [
        {
            title: 'Total Cases',
            value: stats.total,
            icon: ShieldAlert,
            theme: 'indigo',
            subText: 'Total Logged',
            gradient: 'from-indigo-400 to-indigo-600',
            bgCircle: 'bg-indigo-500/5',
        },
        {
            title: 'Pending Review',
            value: stats.pending,
            icon: Info,
            theme: 'amber',
            subText: 'Requires Action',
            gradient: 'from-amber-400 to-amber-600',
            bgCircle: 'bg-amber-500/5',
        },
        {
            title: 'Ongoing Cases',
            value: stats.ongoing,
            icon: AlertCircle,
            theme: 'blue',
            subText: 'Under Investigation',
            gradient: 'from-blue-400 to-blue-600',
            bgCircle: 'bg-blue-500/5',
        },
        {
            title: 'Resolved',
            value: stats.resolved,
            icon: FileText,
            theme: 'emerald',
            subText: 'Case Closed',
            gradient: 'from-emerald-400 to-emerald-600',
            bgCircle: 'bg-emerald-500/5',
        },
    ];

    const statusStyles = (status: string) => {
        switch (status) {
            case 'Resolved':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
            case 'Pending':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
            case 'Ongoing':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
            case 'Escalated':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const classificationStyles = (classification: string) => {
        return classification === 'Major'
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
    };

    const handleViewDetails = (incident: IncidentRow) => {
        setSelectedIncident(incident);
        setIsDialogOpen(true);
    };

    const dialogInitialValues = useMemo<IncidentReportPayload | null>(() => {
        if (!selectedIncident?.raw) return null;

        const rawStudents = (selectedIncident.raw.studentsInvolved ||
            []) as unknown[];
        const studentsInvolved = rawStudents.map((id) => ({
            id: String(id),
            name: String(id),
        }));

        return {
            violationId: selectedIncident.raw.violationId ?? null,
            incidentType: selectedIncident.raw.incidentType,
            classification: selectedIncident.raw.classification,
            date: selectedIncident.raw.date,
            time: selectedIncident.raw.time,
            location: selectedIncident.raw.location,
            reportedBy: selectedIncident.raw.reportedBy ?? '',
            studentsInvolved,
            description: selectedIncident.raw.description,
            immediateAction: selectedIncident.raw.immediateAction ?? '',
            receivedBy: selectedIncident.raw.receivedBy ?? '',
        };
    }, [selectedIncident]);

    return (
        <ProgramHeadLayout>
            <Head title="Course Violations - Program Head" />

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
                                    <Activity className="h-7 w-7 text-blue-200" />
                                </div>

                                <div>
                                    <h1 className="text-2xl leading-tight font-black tracking-tight text-white">
                                        Course Violations & Incidents
                                    </h1>
                                    <div className="mt-0.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <p className="text-sm font-medium text-blue-200/80">
                                            Monitor student incidents and case
                                            status for {programName}.
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="w-fit gap-1 self-center rounded-lg border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:self-auto"
                                        >
                                            <ShieldAlert className="h-2.5 w-2.5 text-blue-300" />
                                            {programName}
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
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                        {kpiData.map((kpi) => (
                            <div
                                key={kpi.title}
                                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                            >
                                <div
                                    className={cn(
                                        'pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full',
                                        kpi.bgCircle,
                                    )}
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            {kpi.title}
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                                            {kpi.value.toLocaleString()}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-1 text-xs font-semibold',
                                                kpi.theme === 'indigo' &&
                                                    'text-indigo-600 dark:text-indigo-400',
                                                kpi.theme === 'amber' &&
                                                    'text-amber-600 dark:text-amber-400',
                                                kpi.theme === 'blue' &&
                                                    'text-blue-600 dark:text-blue-400',
                                                kpi.theme === 'emerald' &&
                                                    'text-emerald-600 dark:text-emerald-400',
                                            )}
                                        >
                                            {kpi.subText}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                                            kpi.theme === 'indigo' &&
                                                'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30',
                                            kpi.theme === 'amber' &&
                                                'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
                                            kpi.theme === 'blue' &&
                                                'bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30',
                                            kpi.theme === 'emerald' &&
                                                'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
                                        )}
                                    >
                                        <kpi.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={cn(
                                            'h-full w-full rounded-full bg-gradient-to-r',
                                            kpi.gradient,
                                        )}
                                        style={{
                                            width:
                                                kpi.value > 0 ? '100%' : '0%',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                        Case List
                                    </CardTitle>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Read-only case monitoring for your
                                        program.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(event) => {
                                                setSearchQuery(
                                                    event.target.value,
                                                );
                                                setPageIndex(1);
                                            }}
                                            placeholder="Search cases"
                                            className="h-9 w-[220px] border-slate-200 bg-white pl-9 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>

                                    <Select
                                        value={typeFilter}
                                        onValueChange={(value) => {
                                            setTypeFilter(value as TypeFilter);
                                            setPageIndex(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-[140px] border-slate-200 bg-white text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="Classification" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Levels
                                            </SelectItem>
                                            <SelectItem value="warning">
                                                Warning
                                            </SelectItem>
                                            <SelectItem value="suspension">
                                                Suspension
                                            </SelectItem>
                                            <SelectItem value="exclusion">
                                                Exclusion
                                            </SelectItem>
                                            <SelectItem value="expulsion">
                                                Expulsion
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value) => {
                                            setStatusFilter(
                                                value as StatusFilter,
                                            );
                                            setPageIndex(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-[140px] border-slate-200 bg-white text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Status
                                            </SelectItem>
                                            <SelectItem value="Pending">
                                                Pending
                                            </SelectItem>
                                            <SelectItem value="Ongoing">
                                                Ongoing
                                            </SelectItem>
                                            <SelectItem value="Resolved">
                                                Resolved
                                            </SelectItem>
                                            <SelectItem value="Escalated">
                                                Escalated
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                                <table className="min-w-full border-collapse">
                                    <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Case ID
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Student
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Violation Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Level
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                                        {pagedRows.length > 0 ? (
                                            pagedRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {row.caseId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {row.student}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {row.studentId}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {row.type}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge
                                                            className={cn(
                                                                'rounded-full px-2.5 py-1 text-xs font-bold',
                                                                classificationStyles(
                                                                    row.classification,
                                                                ),
                                                            )}
                                                        >
                                                            {row.classification}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge
                                                            className={cn(
                                                                'rounded-full px-2.5 py-1 text-xs font-bold',
                                                                statusStyles(
                                                                    row.status,
                                                                ),
                                                            )}
                                                        >
                                                            {row.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                        <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleViewDetails(
                                                                        row,
                                                                    )
                                                                }
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                                                >
                                                    No cases found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <Pagination
                                    currentPage={pageIndex}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={filteredRows.length}
                                    onPageChange={setPageIndex}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setPageIndex(1);
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <IncidentReportDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedIncident(null);
                }}
                initialValues={dialogInitialValues}
                viewMode
                onSubmit={() => {}}
                violations={[]}
            />
        </ProgramHeadLayout>
    );
}
