import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Kpi } from './types';

interface KpiCardsProps {
    kpis: Kpi[];
}

export default function KpiCards({ kpis }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {kpis.map((kpi) => {
                const themeMap: Record<string, { bg: string, text: string, iconBg: string, iconText: string, border: string }> = {
                    'Total Responses': { 
                        bg: "bg-indigo-50/50 dark:bg-indigo-500/10", 
                        text: "text-indigo-700 dark:text-indigo-300",
                        iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
                        iconText: "text-indigo-600 dark:text-indigo-400",
                        border: "border-indigo-100 dark:border-indigo-500/20"
                    },
                    'Response Rate': { 
                        bg: "bg-emerald-50/50 dark:bg-emerald-500/10", 
                        text: "text-emerald-700 dark:text-emerald-300",
                        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                        iconText: "text-emerald-600 dark:text-emerald-400",
                        border: "border-emerald-100 dark:border-emerald-500/20"
                    },
                    'Average Rating': { 
                        bg: "bg-amber-50/50 dark:bg-amber-500/10", 
                        text: "text-amber-700 dark:text-amber-300",
                        iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                        iconText: "text-amber-600 dark:text-amber-400",
                        border: "border-amber-100 dark:border-amber-500/20"
                    },
                    'Positive Feedback': { 
                        bg: "bg-emerald-50/50 dark:bg-emerald-500/10", 
                        text: "text-emerald-700 dark:text-emerald-300",
                        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                        iconText: "text-emerald-600 dark:text-emerald-400",
                        border: "border-emerald-100 dark:border-emerald-500/20"
                    },
                    'Negative Feedback': { 
                        bg: "bg-rose-50/50 dark:bg-rose-500/10", 
                        text: "text-rose-700 dark:text-rose-300",
                        iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
                        iconText: "text-rose-600 dark:text-rose-400",
                        border: "border-rose-100 dark:border-rose-500/20"
                    },
                };
                const theme = themeMap[kpi.title] || themeMap['Total Responses'];
                return (
                    <Card key={kpi.title} className={`overflow-hidden border ${theme.border} ${theme.bg} shadow-sm group`}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.text}`}>
                                        {kpi.title}
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            {kpi.value}
                                        </div>
                                    </div>
                                </div>
                                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${theme.iconBg} ${theme.iconText} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
