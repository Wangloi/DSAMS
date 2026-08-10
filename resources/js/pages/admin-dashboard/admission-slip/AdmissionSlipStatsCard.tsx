import { ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Stats = {
    total: number;
    issuedToday: number;
    validThisWeek: number;
};

type Props = {
    stats: Stats;
};

export default function AdmissionSlipStatsCard({ stats }: Props) {
    const kpis = [
        {
            title: 'Total Issued',
            value: stats.total,
            subtext: 'All Admission Slips',
            icon: ClipboardList,
            glow: 'bg-blue-500/5',
            subtextColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30',
            barGradient: 'from-blue-400 to-blue-600',
        },
        {
            title: 'Issued Today',
            value: stats.issuedToday,
            subtext: 'Created Today',
            icon: Calendar,
            glow: 'bg-emerald-500/5',
            subtextColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
            barGradient: 'from-emerald-400 to-emerald-600',
        },
        {
            title: 'Valid This Week',
            value: stats.validThisWeek,
            subtext: 'Active Slips',
            icon: CheckCircle2,
            glow: 'bg-purple-500/5',
            subtextColor: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-200/50 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-purple-900/30',
            barGradient: 'from-purple-400 to-purple-600',
        },
    ];

    return (
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
            {kpis.map((kpi, index) => (
                <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                >
                    <div className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${kpi.glow}`} />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {kpi.title}
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {kpi.value.toLocaleString()}
                            </p>
                            <p className={`mt-1 text-xs font-semibold ${kpi.subtextColor}`}>
                                {kpi.subtext}
                            </p>
                        </div>
                        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${kpi.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                            <kpi.icon className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full w-full bg-gradient-to-r ${kpi.barGradient} rounded-full`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
