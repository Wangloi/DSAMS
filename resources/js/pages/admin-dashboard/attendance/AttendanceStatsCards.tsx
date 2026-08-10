import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiCard = {
    title: string;
    value: number;
    change: string;
    accent: string;
    iconWrap: string;
    icon: React.ComponentType<{ className?: string }>;
};

type Props = {
    totalEvents: number;
    totalAttendees: number;
    avgAttendanceRate: number;
    totalLate: number;
};

export default function AttendanceStatsCards({ 
    totalEvents, 
    totalAttendees, 
    avgAttendanceRate,
    totalLate 
}: Props) {
    const themeMap: Record<string, {
        glow: string;
        subtext: string;
        subtextColor: string;
        iconBg: string;
        barGradient: string;
    }> = {
        'Total Events': {
            glow: 'bg-blue-500/5',
            subtext: 'Scheduled Events',
            subtextColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30',
            barGradient: 'from-blue-400 to-blue-600',
        },
        'Total check-ins': {
            glow: 'bg-emerald-500/5',
            subtext: 'Scanned Records',
            subtextColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
            barGradient: 'from-emerald-400 to-emerald-600',
        },
        'Total Late': {
            glow: 'bg-rose-500/5',
            subtext: 'Tardy Scans',
            subtextColor: 'text-rose-600 dark:text-rose-400',
            iconBg: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30',
            barGradient: 'from-rose-400 to-rose-600',
        },
        'Avg Attendance Rate': {
            glow: 'bg-amber-500/5',
            subtext: 'Turnout Percentage',
            subtextColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
            barGradient: 'from-amber-400 to-amber-600',
        },
    };

    const kpis = [
        { title: 'Total Events', value: totalEvents, icon: Calendar },
        { title: 'Total check-ins', value: totalAttendees, icon: Users },
        { title: 'Total Late', value: totalLate, icon: Clock },
        { title: 'Avg Attendance Rate', value: avgAttendanceRate, icon: TrendingUp },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
            {kpis.map((kpi, index) => {
                const theme = themeMap[kpi.title] || themeMap['Total Events'];
                return (
                    <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                    >
                        <div className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${theme.glow}`} />
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    {kpi.title}
                                </p>
                                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                    {kpi.title === 'Avg Attendance Rate' ? `${kpi.value}%` : kpi.value.toLocaleString()}
                                </p>
                                <p className={`mt-1 text-xs font-semibold ${theme.subtextColor}`}>
                                    {theme.subtext}
                                </p>
                            </div>
                            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${theme.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                                <kpi.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full w-full bg-gradient-to-r ${theme.barGradient} rounded-full`} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
