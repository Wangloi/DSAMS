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
import { useMemo, useState, useEffect } from 'react';
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
    violationDaily?: { name: string; minor: number; major: number }[];
    violationMonthly?: { name: string; minor: number; major: number }[];
    violationWeekly?: { name: string; minor: number; major: number }[];
    violationStats?: { minor: number; major: number };
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
        violationStats: props.violationStats || { minor: 0, major: 0 },
        evaluationCounts: props.evaluationCounts || [],
        evaluationSummary: props.evaluationSummary || { average: 0, respondents: 0, sentiment: [] },
        inventory: props.inventory || { total: 0, breakdown: [] },
    });

    // Track when filters change
    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [reportRange, customStartDate, customEndDate]);

    const refreshData = async () => {
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
                    violationStats: data.violationStats || { minor: 0, major: 0 },
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
    };

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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Analytics Dashboard
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Comprehensive insights and system performance metrics
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last updated</div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{lastUpdated.toLocaleTimeString()}</div>
                            </div>
                            <Button
                                type="button"
                                onClick={refreshData}
                                disabled={isRefreshing}
                                className={cn(
                                    "h-11 shrink-0 gap-2 rounded-xl px-5 font-bold transition-all duration-200 shadow-md",
                                    hasUnsavedChanges
                                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 animate-pulse'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                )}
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                {hasUnsavedChanges ? 'Apply Filters' : 'Refresh Data'}
                            </Button>
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

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {/* Attendance Trends */}
                        <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Attendance Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#attendanceFill)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Violation Trends */}
                        <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Violation Trends</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="relative h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={violationData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="minor" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="major" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight">
                                        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Minor</div>
                                        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Major</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evaluation Sentiment */}
                        <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Evaluation Sentiment</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.evaluationSummary.sentiment}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                            >
                                                {analyticsData.evaluationSummary.sentiment.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Respondents</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{analyticsData.evaluationSummary.respondents}</div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Rating</div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">{analyticsData.evaluationSummary.average || '0.0'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evaluation Ratings Distribution */}
                        <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Evaluation Rating Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.evaluationCounts} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
