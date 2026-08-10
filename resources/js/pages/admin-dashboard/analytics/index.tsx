import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    RefreshCw,
    Calendar,
    TrendingUp,
    Users,
    CalendarDays,
    ShieldAlert,
    BarChart3,
    Search
} from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { adminDashboard, adminAnalytics } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: adminDashboard() },
    { title: 'Analytics', href: adminAnalytics() },
];

type Props = {
    attendanceDaily?: { name: string; value: number }[];
    attendanceMonthly?: { name: string; value: number }[];
    attendanceWeekly?: { name: string; value: number }[];
    violationDaily?: { name: string; warning: number; suspension: number; exclusion: number; expulsion: number }[];
    violationMonthly?: { name: string; warning: number; suspension: number; exclusion: number; expulsion: number }[];
    violationWeekly?: { name: string; warning: number; suspension: number; exclusion: number; expulsion: number }[];
    violationStats?: { warning: number; suspension: number; exclusion: number; expulsion: number };
    evaluationCounts?: { name: string; value: number }[];
    evaluationSummary?: {
        average: number | null;
        respondents: number;
        sentiment: { name: string; value: number; color: string }[];
    };
    inventory?: {
        total: number;
        breakdown: { name: string; value: number; color: string }[];
    };
};

export default function AdminAnalyticsPage(props: Props) {
    const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'semester' | 'custom'>('weekly');
    const [reportSearch, setReportSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Local state for analytics data to prevent page reloads
    const [analyticsData, setAnalyticsData] = useState({
        attendanceDaily: props.attendanceDaily || [],
        attendanceMonthly: props.attendanceMonthly || [],
        attendanceWeekly: props.attendanceWeekly || [],
        violationDaily: props.violationDaily || [],
        violationMonthly: props.violationMonthly || [],
        violationWeekly: props.violationWeekly || [],
        violationStats: props.violationStats || { warning: 0, suspension: 0, exclusion: 0, expulsion: 0 },
        evaluationCounts: props.evaluationCounts || [],
        evaluationSummary: props.evaluationSummary || { average: 0, respondents: 0, sentiment: [] },
        inventory: props.inventory || { total: 0, breakdown: [] },
    });

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        setHasUnsavedChanges(false);

        try {
            const params = new URLSearchParams();
            params.append('reportRange', reportRange);
            if (reportRange === 'custom' && customStartDate && customEndDate) {
                params.append('customStartDate', customStartDate);
                params.append('customEndDate', customEndDate);
            }

            const response = await fetch(`/admin/analytics/data?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setAnalyticsData({
                    attendanceDaily: data.attendanceDaily || [],
                    attendanceMonthly: data.attendanceMonthly || [],
                    attendanceWeekly: data.attendanceWeekly || [],
                    violationDaily: data.violationDaily || [],
                    violationMonthly: data.violationMonthly || [],
                    violationWeekly: data.violationWeekly || [],
                    violationStats: data.violationStats || { warning: 0, suspension: 0, exclusion: 0, expulsion: 0 },
                    evaluationCounts: data.evaluationCounts || [],
                    evaluationSummary: data.evaluationSummary || { average: 0, respondents: 0, sentiment: [] },
                    inventory: data.inventory || { total: 0, breakdown: [] },
                });
            }
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setIsRefreshing(false);
            setLastUpdated(new Date());
        }
    }, [reportRange, customStartDate, customEndDate]);

    // Auto-refresh data whenever the range changes
    useEffect(() => {
        // For custom range, only refresh when both dates are filled in
        if (reportRange === 'custom' && (!customStartDate || !customEndDate)) {
            setHasUnsavedChanges(true);
            return;
        }
        refreshData();
    }, [reportRange, customStartDate, customEndDate]);

    const attendanceData = useMemo(() => {
        let data = [];
        switch (reportRange) {
            case 'daily': data = analyticsData.attendanceDaily || []; break;
            case 'weekly': data = analyticsData.attendanceWeekly || []; break;
            case 'monthly': data = analyticsData.attendanceMonthly || []; break;
            case 'yearly':
                const monthlyData = analyticsData.attendanceMonthly || [];
                data = monthlyData.reduce((acc: any[], item, index) => {
                    const yearIndex = Math.floor(index / 12);
                    if (!acc[yearIndex]) acc[yearIndex] = { name: `Year ${yearIndex + 1}`, value: 0 };
                    acc[yearIndex].value += item.value;
                    return acc;
                }, []);
                break;
            case 'semester':
                const semesterData = analyticsData.attendanceMonthly || [];
                const firstSemester = semesterData.slice(0, 6).reduce((sum, item) => sum + item.value, 0);
                const secondSemester = semesterData.slice(6, 12).reduce((sum, item) => sum + item.value, 0);
                data = [
                    { name: '1st Semester', value: firstSemester },
                    { name: '2nd Semester', value: secondSemester },
                ];
                break;
            default: data = analyticsData.attendanceWeekly || [];
        }
        if (reportSearch.trim()) {
            const searchLower = reportSearch.toLowerCase();
            data = data.filter(item => item.name.toLowerCase().includes(searchLower));
        }
        return data;
    }, [reportRange, analyticsData, reportSearch]);

    const violationData = useMemo(() => {
        let data = [];
        switch (reportRange) {
            case 'daily': data = analyticsData.violationDaily || []; break;
            case 'weekly': data = analyticsData.violationWeekly || []; break;
            case 'monthly': data = analyticsData.violationMonthly || []; break;
            default: data = analyticsData.violationWeekly || [];
        }
        if (reportSearch.trim()) {
            const searchLower = reportSearch.toLowerCase();
            data = data.filter(item => item.name.toLowerCase().includes(searchLower));
        }
        return data;
    }, [reportRange, analyticsData, reportSearch]);

    const totalAttendance = useMemo(() => {
        return attendanceData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [attendanceData]);

    const totalViolations = useMemo(() => {
        const vStats = analyticsData.violationStats || { warning: 0, suspension: 0, exclusion: 0, expulsion: 0 };
        return vStats.warning + vStats.suspension + vStats.exclusion + vStats.expulsion;
    }, [analyticsData.violationStats]);

    const avgRating = analyticsData.evaluationSummary?.average || 0;
    const totalInventory = analyticsData.inventory?.total || 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* Hero Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/20">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        Analytics Dashboard
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        Comprehensive insights and system performance metrics
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden text-right sm:block text-white">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80">Last updated</div>
                                    <div className="text-xs font-bold text-white">{lastUpdated.toLocaleTimeString()}</div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={refreshData}
                                    disabled={isRefreshing}
                                    className={cn(
                                        "h-11 shrink-0 gap-2 rounded-xl px-5 font-bold transition-all duration-200 shadow-md",
                                        hasUnsavedChanges
                                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 animate-pulse'
                                            : 'bg-white text-[#1e3a8a] hover:bg-blue-50 shadow-md'
                                    )}
                                >
                                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                    {hasUnsavedChanges ? 'Apply Filters' : 'Refresh Data'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* KPI Summary Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Check-Ins</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{totalAttendance}</p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">Attendance Activity</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Disciplinary Cases</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{totalViolations}</p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Recorded Incidents</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Avg Evaluation</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{avgRating} <span className="text-xl font-bold text-slate-400">/ 5.0</span></p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Student Satisfaction</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Inventory</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{totalInventory}</p>
                                    <p className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-400">Tracked Equipment</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-200/50 dark:bg-violet-500/20 dark:text-violet-400 dark:ring-violet-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                            {['daily', 'weekly', 'monthly', 'yearly', 'semester', 'custom'].map((range) => (
                                <button
                                    key={range}
                                    type="button"
                                    onClick={() => setReportRange(range as any)}
                                    className={cn(
                                        'h-9 px-5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-xl ',
                                        reportRange === range
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:ml-auto lg:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={reportSearch}
                                onChange={(e) => setReportSearch(e.target.value)}
                                placeholder="Search analytics..."
                                className="h-10 w-full rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 pl-9 text-xs font-medium"
                            />
                        </div>
                    </div>

                    {reportRange === 'custom' && (
                        <Card className="p-4 bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20 rounded-2xl">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    <Calendar className="h-4 w-4" />
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
                                        onClick={() => customStartDate && customEndDate && refreshData()}
                                    >
                                        Apply Range
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Analytics Main Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Attendance Trends */}
                        <Card className="group relative overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl dark:bg-[#0B192C]/50 dark:ring-slate-800">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                            Attendance Trends
                                        </CardTitle>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                            {reportRange.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Overview of student check-in frequency and turnouts
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#attendanceFill)" activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Violation Trends */}
                        <Card className="group relative overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl dark:bg-[#0B192C]/50 dark:ring-slate-800">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 via-violet-500 to-rose-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                            Violation Breakdown
                                        </CardTitle>
                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                            DISCIPLINE
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Distribution of disciplinary cases by severity levels
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="h-56 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={violationData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                                }}
                                            />
                                            <Bar dataKey="warning" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="suspension" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="exclusion" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="expulsion" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 rounded-xl bg-slate-50/80 p-2.5 text-xs font-semibold dark:bg-slate-800/40">
                                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-slate-600 dark:text-slate-300">Warning</span></div>
                                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-slate-600 dark:text-slate-300">Suspension</span></div>
                                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /><span className="text-slate-600 dark:text-slate-300">Exclusion</span></div>
                                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="text-slate-600 dark:text-slate-300">Expulsion</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evaluation Sentiment */}
                        <Card className="group relative overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl dark:bg-[#0B192C]/50 dark:ring-slate-800">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                            Evaluation Sentiment
                                        </CardTitle>
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                            FEEDBACK
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Overall sentiment composition from evaluations
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2">
                                <div className="h-52 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.evaluationSummary.sentiment}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                stroke="none"
                                            >
                                                {analyticsData.evaluationSummary.sentiment.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Respondents</div>
                                        <div className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">{analyticsData.evaluationSummary.respondents}</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Rating</div>
                                        <div className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">{analyticsData.evaluationSummary.average || '0.0'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evaluation Ratings Distribution */}
                        <Card className="group relative overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl dark:bg-[#0B192C]/50 dark:ring-slate-800">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                            Rating Distribution
                                        </CardTitle>
                                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                            SCORES
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Detailed breakdown of ratings given across forms
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.evaluationCounts} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(147, 51, 234, 0.06)' }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                                }}
                                            />
                                            <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
