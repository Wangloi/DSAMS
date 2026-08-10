import { ShieldAlert, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { KpiCard } from './types';

type Props = {
    kpi: KpiCard;
};

export default function IncidentStatsCard({ kpi }: Props) {
    const configMap: Record<string, { icon: any, glow: string, subtextColor: string, iconBg: string, barGradient: string }> = {
        "Total Cases": {
            icon: ShieldAlert,
            glow: 'bg-indigo-500/5',
            subtextColor: 'text-indigo-600 dark:text-indigo-400',
            iconBg: 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30',
            barGradient: 'from-indigo-400 to-indigo-600',
        },
        "Pending Cases": {
            icon: AlertTriangle,
            glow: 'bg-amber-500/5',
            subtextColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
            barGradient: 'from-amber-400 to-amber-600',
        },
        "Ongoing Cases": {
            icon: Clock,
            glow: 'bg-sky-500/5',
            subtextColor: 'text-sky-600 dark:text-sky-400',
            iconBg: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-200/50 dark:bg-sky-500/20 dark:text-sky-400 dark:ring-sky-900/30',
            barGradient: 'from-sky-400 to-sky-600',
        },
        "Resolved Cases": {
            icon: CheckCircle2,
            glow: 'bg-emerald-500/5',
            subtextColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
            barGradient: 'from-emerald-400 to-emerald-600',
        }
    };

    const config = configMap[kpi.title] || configMap["Total Cases"];
    const IconComponent = config.icon;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
            <div className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full ${config.glow}`} />
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {kpi.title}
                    </p>
                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${config.subtextColor}`}>
                        {kpi.subtitle || 'System Record'}
                    </p>
                </div>
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full w-full bg-gradient-to-r ${config.barGradient} rounded-full`} />
            </div>
        </div>
    );
}
