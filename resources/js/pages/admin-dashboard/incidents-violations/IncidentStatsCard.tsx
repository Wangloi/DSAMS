import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { KpiCard } from './types';

type Props = {
    kpi: KpiCard;
};

export default function IncidentStatsCard({ kpi }: Props) {
    const themeMap: Record<string, { bg: string, text: string, iconBg: string, iconText: string, border: string }> = {
        "Total Cases": { 
            bg: "bg-indigo-50/50 dark:bg-indigo-500/10", 
            text: "text-indigo-700 dark:text-indigo-300",
            iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
            iconText: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-100 dark:border-indigo-500/20"
        },
        "Pending Cases": { 
            bg: "bg-amber-50/50 dark:bg-amber-500/10", 
            text: "text-amber-700 dark:text-amber-300",
            iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
            iconText: "text-amber-600 dark:text-amber-400",
            border: "border-amber-100 dark:border-amber-500/20"
        },
        "Ongoing Cases": { 
            bg: "bg-sky-50/50 dark:bg-sky-500/10", 
            text: "text-sky-700 dark:text-sky-300",
            iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
            iconText: "text-sky-600 dark:text-sky-400",
            border: "border-sky-100 dark:border-sky-500/20"
        },
        "Resolved Cases": { 
            bg: "bg-emerald-50/50 dark:bg-emerald-500/10", 
            text: "text-emerald-700 dark:text-emerald-300",
            iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconText: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-100 dark:border-emerald-500/20"
        }
    };

    const theme = themeMap[kpi.title] || themeMap["Total Cases"];

    return (
        <Card className={`overflow-hidden border ${theme.border} ${theme.bg} shadow-sm group`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.text}`}>
                            {kpi.title}
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                {kpi.value}
                            </div>
                        </div>
                    </div>
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${theme.iconBg} ${theme.iconText} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
