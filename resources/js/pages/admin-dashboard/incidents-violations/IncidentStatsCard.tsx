import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import type { KpiCard } from './types';

type Props = {
    kpi: KpiCard;
};

export default function IncidentStatsCard({ kpi }: Props) {
    const configMap: Record<
        string,
        {
            icon: any;
            glow: string;
            subtextColor: string;
            iconBg: string;
            barGradient: string;
        }
    > = {
        'Total Cases': {
            icon: ShieldAlert,
            glow: 'bg-indigo-500/5',
            subtextColor: 'text-indigo-600 dark:text-indigo-400',
            iconBg: 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30',
            barGradient: 'from-indigo-400 to-indigo-600',
        },
        'Pending Cases': {
            icon: AlertTriangle,
            glow: 'bg-amber-500/5',
            subtextColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
            barGradient: 'from-amber-400 to-amber-600',
        },
        'Ongoing Cases': {
            icon: Clock,
            glow: 'bg-sky-500/5',
            subtextColor: 'text-sky-600 dark:text-sky-400',
            iconBg: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-200/50 dark:bg-sky-500/20 dark:text-sky-400 dark:ring-sky-900/30',
            barGradient: 'from-sky-400 to-sky-600',
        },
        'Resolved Cases': {
            icon: CheckCircle2,
            glow: 'bg-emerald-500/5',
            subtextColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
            barGradient: 'from-emerald-400 to-emerald-600',
        },
    };

    const config = configMap[kpi.title] || configMap['Total Cases'];
    const IconComponent = config.icon;

    return (
        <div className="group relative overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-5 dark:bg-[#0B192C]/60 dark:ring-slate-800">
            <div
                className={`pointer-events-none absolute -top-4 -right-4 h-16 w-16 rounded-full sm:h-24 sm:w-24 ${config.glow}`}
            />
            <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-black tracking-wider text-slate-400 uppercase sm:text-[10px] sm:tracking-widest dark:text-slate-500">
                        {kpi.title}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900 sm:mt-2 sm:text-4xl dark:text-white">
                        {typeof kpi.value === 'number'
                            ? kpi.value.toLocaleString()
                            : kpi.value}
                    </p>
                    <p
                        className={`mt-0.5 truncate text-[10px] font-semibold sm:mt-1 sm:text-xs ${config.subtextColor}`}
                    >
                        {kpi.subtitle || 'System Record'}
                    </p>
                </div>
                <div
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-12 sm:w-12 sm:rounded-2xl ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                    <IconComponent className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </div>
            </div>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 sm:mt-4 dark:bg-slate-800">
                <div
                    className={`h-full w-full bg-gradient-to-r ${config.barGradient} rounded-full`}
                />
            </div>
        </div>
    );
}
