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
    const themeMap: Record<string, { bg: string, text: string, iconBg: string, iconText: string, border: string }> = {
        'Total Events': { 
            bg: "bg-indigo-50/50 dark:bg-indigo-500/10", 
            text: "text-indigo-700 dark:text-indigo-300",
            iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
            iconText: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-100 dark:border-indigo-500/20"
        },
        'Total check-ins': { 
            bg: "bg-emerald-50/50 dark:bg-emerald-500/10", 
            text: "text-emerald-700 dark:text-emerald-300",
            iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconText: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-100 dark:border-emerald-500/20"
        },
        'Total Late': { 
            bg: "bg-rose-50/50 dark:bg-rose-500/10", 
            text: "text-rose-700 dark:text-rose-300",
            iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
            iconText: "text-rose-600 dark:text-rose-400",
            border: "border-rose-100 dark:border-rose-500/20"
        },
        'Avg Attendance Rate': { 
            bg: "bg-amber-50/50 dark:bg-amber-500/10", 
            text: "text-amber-700 dark:text-amber-300",
            iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
            iconText: "text-amber-600 dark:text-amber-400",
            border: "border-amber-100 dark:border-amber-500/20"
        },
    };

    const kpis = [
        { title: 'Total Events', value: totalEvents, icon: Calendar },
        { title: 'Total check-ins', value: totalAttendees, icon: Users },
        { title: 'Total Late', value: totalLate, icon: Clock },
        { title: 'Avg Attendance Rate', value: avgAttendanceRate, icon: TrendingUp },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {kpis.map((kpi, index) => {
                const theme = themeMap[kpi.title];
                return (
                    <Card key={index} className={cn(
                        "overflow-hidden border shadow-sm group",
                        theme.border,
                        theme.bg
                    )}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.text}`}>
                                        {kpi.title}
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                                            {kpi.title === 'Avg Attendance Rate' ? `${kpi.value}%` : kpi.value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${theme.iconBg} ${theme.iconText} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                    <kpi.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
