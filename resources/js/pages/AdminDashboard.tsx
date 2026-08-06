import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { 
    Briefcase, 
    CalendarDays, 
    ClipboardCheck, 
    LayoutGrid, 
    PackageSearch, 
    RotateCcw, 
    BarChart as BarChart3,
    ArrowRight,
    Ticket,
    Package,
    UserRoundCog,
    FileText,
    PlusCircle,
    QrCode,
    ArrowUpRight,
    MapPin
} from 'lucide-react';
import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminDashboard, adminAttendance, adminAdmissionSlip, adminEvaluation, adminIncidentsViolations, adminQrScanner, adminReports, adminEvents, adminManageUsers } from '@/routes';
import type { BreadcrumbItem } from '@/types';
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
    recentEvents?: {
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

export default function AdminDashboard({ user, recentActivities, recentEvents }: Props) {
    const page = usePage();
    const status = (page.props as any)?.status || (page.props as any)?.flash?.status || (page.props as any)?.flash?.success;

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
        { title: "Today's Attendance", href: adminAttendance(), color: 'bg-blue-600', icon: ClipboardCheck },
        { title: 'Admission Slips', href: adminAdmissionSlip(), color: 'bg-emerald-600', icon: Ticket },
        { title: 'Active Cases', href: adminIncidentsViolations(), color: 'bg-rose-600', icon: Briefcase },
        { title: 'Evaluation Surveys', href: adminEvaluation(), color: 'bg-amber-600', icon: FileText },
    ];

    const kpiValues = (arguments[0] as Props).kpis ?? [
        { title: "Today's Attendance", value: 320 },
        { title: 'Admission Slips', value: 45 },
        { title: 'Active Cases', value: 8 },
        { title: 'Evaluation Surveys', value: 12 },
    ];

    const kpis = kpiConfig.map(config => {
        const stat = kpiValues.find(v => v.title === config.title) || { value: 0 };
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

    const attendanceTrend = (arguments[0] as Props).attendanceTrend?.length ? ((arguments[0] as Props).attendanceTrend ?? []) : seedAttendanceTrend;
    const violationBreakdown = (arguments[0] as Props).violationBreakdown?.length
        ? ((arguments[0] as Props).violationBreakdown ?? []).map((v) => ({ ...v, color: v.color ?? '#94a3b8' }))
        : seedViolationBreakdown;
    const evaluationRatings = (arguments[0] as Props).evaluationRatings?.length ? ((arguments[0] as Props).evaluationRatings ?? []) : seedEvaluationRatings;
    const lostFoundStatus = (arguments[0] as Props).lostFoundStatus?.length
        ? ((arguments[0] as Props).lostFoundStatus ?? []).map((v) => ({ ...v, color: v.color ?? '#94a3b8' }))
        : seedLostFoundStatus;

    const activityItems = (recentActivities ?? []).length
        ? (recentActivities ?? []).map((a) => ({
              id: a.id,
              tone:
                  a.userType === 'admin'
                      ? 'from-sky-50 to-white hover:from-sky-100 hover:to-sky-50 dark:from-sky-900/20 dark:to-slate-800 dark:hover:from-sky-900/30 dark:hover:to-slate-700'
                      : a.userType === 'student'
                          ? 'from-emerald-50 to-white hover:from-emerald-100 hover:to-emerald-50 dark:from-emerald-900/20 dark:to-slate-800 dark:hover:from-emerald-900/30 dark:hover:to-slate-700'
                          : a.userType === 'program_head'
                              ? 'from-amber-50 to-white hover:from-amber-100 hover:to-amber-50 dark:from-amber-900/20 dark:to-slate-800 dark:hover:from-amber-900/30 dark:hover:to-slate-700'
                              : 'from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 dark:from-slate-900/20 dark:to-slate-800 dark:hover:from-slate-900/30 dark:hover:to-slate-700',
              dot:
                  a.userType === 'admin'
                      ? 'bg-sky-500'
                      : a.userType === 'student'
                          ? 'bg-emerald-500'
                          : a.userType === 'program_head'
                              ? 'bg-amber-500'
                              : 'bg-slate-400',
              text: a.title,
              time: a.time,
              details: a.details,
          }))
        : [
              {
                  id: 'seed-1',
                  tone: 'from-emerald-50 to-white hover:from-emerald-100 hover:to-emerald-50 dark:from-emerald-900/20 dark:to-slate-800 dark:hover:from-emerald-900/30 dark:hover:to-slate-700',
                  dot: 'bg-emerald-500',
                  text: 'Juan Dela Cruz scanned QR',
                  time: '8:05 AM',
                  details: '',
              },
              {
                  id: 'seed-2',
                  tone: 'from-rose-50 to-white hover:from-rose-100 hover:to-rose-50 dark:from-rose-900/20 dark:to-slate-800 dark:hover:from-rose-900/30 dark:hover:to-slate-700',
                  dot: 'bg-rose-500',
                  text: 'New Major Violation Reported',
                  time: '',
                  details: '',
              },
              {
                  id: 'seed-3',
                  tone: 'from-amber-50 to-white hover:from-amber-100 hover:to-amber-50 dark:from-amber-900/20 dark:to-slate-800 dark:hover:from-amber-900/30 dark:hover:to-slate-700',
                  dot: 'bg-amber-500',
                  text: 'Case #2025-014 Updated',
                  time: '',
                  details: '',
              },
              {
                  id: 'seed-4',
                  tone: 'from-sky-50 to-white hover:from-sky-100 hover:to-sky-50 dark:from-sky-900/20 dark:to-slate-800 dark:hover:from-sky-900/30 dark:hover:to-slate-700',
                  dot: 'bg-sky-500',
                  text: 'Laptop Claimed Successfully',
                  time: '',
                  details: '',
              },
          ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="rounded-2xl bg-gradient-to-br from-[#0b2d66] via-[#103875] to-[#1e40af] px-7 py-7 text-white shadow-md relative overflow-hidden group">
                        {/* Background glowing decorations */}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute right-20 -bottom-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 backdrop-blur-md shadow-inner border border-white/10 group-hover:rotate-3 transition-transform duration-300">
                                    <BarChart3 className="h-7 w-7 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-xl font-bold tracking-tight">
                                        Welcome Back, {user?.name || 'Administrator'}! 👋
                                    </div>
                                    <div className="text-sm text-white/80 mt-1 flex items-center gap-1.5 font-medium">
                                        <span>System Command Center</span>
                                        <span className="inline-block h-1 w-1 rounded-full bg-blue-300" />
                                        <span className="text-blue-200">Data & Student Attendance Management</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Live Date Indicator widget */}
                            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 self-center">
                                <CalendarDays className="h-4 w-4 text-blue-200" />
                                <div className="text-xs font-semibold tracking-wide uppercase text-white/90">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {kpis.map((kpi, index) => {
                            // Map of colors for different KPI indicators
                            const themeMap: Record<string, { bg: string, text: string, iconBg: string, iconText: string, border: string }> = {
                                "Today's Attendance": { 
                                    bg: "bg-indigo-50/50 dark:bg-indigo-500/10", 
                                    text: "text-indigo-700 dark:text-indigo-300",
                                    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
                                    iconText: "text-indigo-600 dark:text-indigo-400",
                                    border: "border-indigo-100 dark:border-indigo-500/20"
                                },
                                "Admission Slips": { 
                                    bg: "bg-emerald-50/50 dark:bg-emerald-500/10", 
                                    text: "text-emerald-700 dark:text-emerald-300",
                                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                                    iconText: "text-emerald-600 dark:text-emerald-400",
                                    border: "border-emerald-100 dark:border-emerald-500/20"
                                },
                                "Active Cases": { 
                                    bg: "bg-rose-50/50 dark:bg-rose-500/10", 
                                    text: "text-rose-700 dark:text-rose-300",
                                    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
                                    iconText: "text-rose-600 dark:text-rose-400",
                                    border: "border-rose-100 dark:border-rose-500/20"
                                },
                                "Evaluation Surveys": { 
                                    bg: "bg-amber-50/50 dark:bg-amber-500/10", 
                                    text: "text-amber-700 dark:text-amber-300",
                                    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                                    iconText: "text-amber-600 dark:text-amber-400",
                                    border: "border-amber-100 dark:border-amber-500/20"
                                }
                            };

                            const theme = themeMap[kpi.title] || themeMap["Today's Attendance"];
                            
                            return (
                                <Card 
                                    key={kpi.title} 
                                    onClick={() => router.visit(kpi.href)}
                                    className={`overflow-hidden border ${theme.border} ${theme.bg} shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between group`}
                                >
                                    <CardContent className="relative pt-5 pb-4 px-5 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className={`text-xs font-bold uppercase tracking-wider opacity-80 ${theme.text}`}>
                                                    {kpi.title}
                                                </div>
                                                <div className="mt-2 flex items-baseline gap-2">
                                                    <div className="text-3xl font-black leading-none text-slate-900 dark:text-white">
                                                        {kpi.value}
                                                    </div>
                                                    <div className={`text-[10px] font-bold ${theme.text} opacity-60`}>
                                                        Total
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${theme.iconBg} ${theme.iconText} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                                {React.createElement(kpi.icon, { className: 'h-6 w-6' })}
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Action Footers */}
                                    {(kpi.title === 'Evaluation Surveys' || kpi.title === 'Admission Slips') ? (
                                        <div className="flex divide-x divide-white/20 dark:divide-slate-800 border-t border-white/20 dark:border-slate-800">
                                            {kpi.title === 'Evaluation Surveys' && (
                                                <Link 
                                                    href={adminEvaluation()} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 py-2 text-center text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-white/30 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    View Evaluations
                                                </Link>
                                            )}
                                            {kpi.title === 'Admission Slips' && (
                                                <Link 
                                                    href={adminAdmissionSlip() + '?open_add=true'} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 py-2 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-white/30 dark:hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    Create New Slip
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="px-5 py-2 border-t border-white/20 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center justify-between">
                                            <span>Manage Module</span>
                                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

                        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 shadow-sm hover:shadow-md transition-shadow duration-200 lg:col-span-7 flex flex-col h-[360px]">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Attendance Trend</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 pb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={attendanceTrend} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#23509A"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#23509A' }}
                                            activeDot={{ r: 6, stroke: '#23509A', strokeWidth: 2, fill: '#ffffff' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 shadow-sm hover:shadow-md transition-shadow duration-200 lg:col-span-5 flex flex-col h-[360px]">
                            <CardHeader className="pb-2 pt-4 px-5 border-b border-slate-100 dark:border-slate-700/50">
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#23509A] animate-pulse" />
                                        Quick Actions
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-2 flex flex-col gap-1.5 flex-1 justify-center">
                                <Link 
                                    href={adminEvents()}
                                    className="group flex flex-row items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50/50 to-blue-50/20 border border-slate-100 dark:from-slate-850 dark:to-slate-800 dark:border-slate-700/50 hover:border-sky-200 dark:hover:border-sky-900/60 hover:shadow-sm transition-all duration-200 w-full"
                                >
                                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 group-hover:scale-105 group-hover:bg-sky-500/20 transition-all">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Create Event</div>
                                </Link>

                                <Link 
                                    href={adminAdmissionSlip() + '?open_add=true'}
                                    className="group flex flex-row items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/20 border border-slate-100 dark:from-slate-850 dark:to-slate-800 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-900/60 hover:shadow-sm transition-all duration-200 w-full"
                                >
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all">
                                        <Ticket className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Issue Admission Slip</div>
                                </Link>

                                <Link 
                                    href={adminIncidentsViolations()}
                                    className="group flex flex-row items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-50/50 to-red-50/20 border border-slate-100 dark:from-slate-850 dark:to-slate-800 dark:border-slate-700/50 hover:border-rose-200 dark:hover:border-rose-900/60 hover:shadow-sm transition-all duration-200 w-full"
                                >
                                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 group-hover:scale-105 group-hover:bg-rose-500/20 transition-all">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Log Violation</div>
                                </Link>

                                <Link 
                                    href={adminManageUsers()}
                                    className="group flex flex-row items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/20 border border-slate-100 dark:from-slate-850 dark:to-slate-800 dark:border-slate-700/50 hover:border-amber-200 dark:hover:border-yellow-900/60 hover:shadow-sm transition-all duration-200 w-full"
                                >
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
                                        <UserRoundCog className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Manage Users</div>
                                </Link>

                                <Link 
                                    href={adminReports()}
                                    className="group flex flex-row items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-50/50 to-purple-50/20 border border-slate-100 dark:from-slate-850 dark:to-slate-800 dark:border-slate-700/50 hover:border-violet-200 dark:hover:border-violet-900/60 hover:shadow-sm transition-all duration-200 w-full"
                                >
                                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 group-hover:scale-105 group-hover:bg-violet-500/20 transition-all">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Generate Reports</div>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 shadow-sm hover:shadow-md transition-shadow duration-200 lg:col-span-7 flex flex-col h-[360px]">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Evaluation Ratings</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 pb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={evaluationRatings} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#23509A" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 shadow-sm hover:shadow-md transition-shadow duration-200 lg:col-span-5 flex flex-col h-[360px]">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Violation Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 pb-4 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Pie data={violationBreakdown} dataKey="value" nameKey="name" outerRadius={90} cx="50%" cy="50%">
                                            {violationBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4 border-b border-slate-50 dark:border-slate-700/50">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                                    Recent Events Overview
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Status, organizers, and live attendance metrics</CardDescription>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.reload()}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B192C]/50 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-sm transition-all duration-200"
                                aria-label="Refresh Data"
                                title="Refresh"
                            >
                                <RotateCcw className="h-4.5 w-4.5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                                        <tr>
                                            <th className="px-6 py-3.5 font-bold">Event Details</th>
                                            <th className="px-6 py-3.5 font-bold">Date & Time</th>
                                            <th className="px-6 py-3.5 font-bold">Attendance Progress</th>
                                            <th className="px-6 py-3.5 text-right font-bold">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {(recentEvents ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                                                No recent events found.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentEvents?.map((row) => {
                                            // Compute attendance percentage
                                            const percent = row.totalAttendees > 0 ? Math.round((row.presentCount / row.totalAttendees) * 100) : 0;
                                            
                                            // Circular initial colors matching design system
                                            const hashName = (row.organizer || "EV").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const initials = row.organizer ? row.organizer.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EV';
                                            const bgColors = [
                                                'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30',
                                                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30',
                                                'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-100 dark:border-sky-900/30',
                                                'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-100 dark:border-amber-900/30',
                                                'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-100 dark:border-purple-900/30',
                                                'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
                                            ];
                                            const avatarClass = bgColors[hashName % bgColors.length];

                                            return (
                                                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors duration-200 group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3.5">
                                                            {/* Initial Avatar */}
                                                            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs shadow-inner tracking-wider shrink-0 ${avatarClass}`}>
                                                                {initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#23509A] transition-colors">{row.event}</div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                                                                    <span className="font-semibold text-slate-600 dark:text-slate-350">{row.organizer}</span>
                                                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                                    <span className="flex items-center gap-0.5 shrink-0">
                                                                        <MapPin className="h-3 w-3 inline text-slate-400" />
                                                                        {row.location}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                                            {row.dateTime}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {row.status === 'upcoming' ? (
                                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">—</span>
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="font-bold text-slate-800 dark:text-white">{row.presentCount} <span className="text-slate-400 dark:text-slate-500 font-normal font-sans">/ {row.totalAttendees}</span></span>
                                                                    <span className="font-extrabold text-[#23509A] dark:text-blue-400">{percent}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner flex">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${row.status === 'ongoing' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                                                        style={{ width: `${percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                                                            row.status === 'completed' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                                                            row.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' :
                                                            'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                                                        }`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                                row.status === 'completed' ? 'bg-slate-400' :
                                                                row.status === 'ongoing' ? 'bg-emerald-500 animate-ping' :
                                                                'bg-blue-500'
                                                            }`} />
                                                            <span className="capitalize">{row.status}</span>
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
                </div>
            </div>
        </AdminLayout>
    );
}
