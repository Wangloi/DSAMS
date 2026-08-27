import { Kpi } from './types';

interface KpiCardsProps {
    kpis: Kpi[];
}

export default function KpiCards({ kpis }: KpiCardsProps) {
    const filteredKpis = kpis.filter((kpi) => kpi.value !== 'N/A');
    const colsCount = filteredKpis.length;
    const gridColsClass = 
        colsCount === 1 ? 'lg:grid-cols-1' :
        colsCount === 2 ? 'lg:grid-cols-2' :
        colsCount === 3 ? 'lg:grid-cols-3' :
        colsCount === 4 ? 'lg:grid-cols-4' :
        'lg:grid-cols-5';

    return (
        <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${gridColsClass}`}
        >
            {filteredKpis.map((kpi) => {
                const themeMap: Record<
                    string,
                    {
                        bg: string;
                        text: string;
                        iconBg: string;
                        iconText: string;
                        ring: string;
                        progress: string;
                        accent: string;
                    }
                > = {
                    'Total Responses': {
                        bg: 'bg-blue-500/5',
                        text: 'text-blue-600 dark:text-blue-400',
                        iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
                        iconText: 'text-blue-600 dark:text-blue-400',
                        ring: 'ring-blue-200/50 dark:ring-blue-900/30',
                        progress: 'from-blue-400 to-blue-600',
                        accent: 'blue',
                    },
                    'Response Rate': {
                        bg: 'bg-emerald-500/5',
                        text: 'text-emerald-600 dark:text-emerald-400',
                        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                        iconText: 'text-emerald-600 dark:text-emerald-400',
                        ring: 'ring-emerald-200/50 dark:ring-emerald-900/30',
                        progress: 'from-emerald-400 to-emerald-600',
                        accent: 'emerald',
                    },
                    'Average Rating': {
                        bg: 'bg-amber-500/5',
                        text: 'text-amber-600 dark:text-amber-400',
                        iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
                        iconText: 'text-amber-600 dark:text-amber-400',
                        ring: 'ring-amber-200/50 dark:ring-amber-900/30',
                        progress: 'from-amber-400 to-amber-600',
                        accent: 'amber',
                    },
                    'Positive Feedback': {
                        bg: 'bg-emerald-500/5',
                        text: 'text-emerald-600 dark:text-emerald-400',
                        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                        iconText: 'text-emerald-600 dark:text-emerald-400',
                        ring: 'ring-emerald-200/50 dark:ring-emerald-900/30',
                        progress: 'from-emerald-400 to-emerald-600',
                        accent: 'emerald',
                    },
                    'Negative Feedback': {
                        bg: 'bg-rose-500/5',
                        text: 'text-rose-600 dark:text-rose-400',
                        iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
                        iconText: 'text-rose-600 dark:text-rose-400',
                        ring: 'ring-rose-200/50 dark:ring-rose-900/30',
                        progress: 'from-rose-400 to-rose-600',
                        accent: 'rose',
                    },
                };
                const theme =
                    themeMap[kpi.title] || themeMap['Total Responses'];

                // Calculate progress width based on KPI type
                let progressWidth = '100%';
                if (kpi.title === 'Response Rate') {
                    const rate =
                        typeof kpi.value === 'number'
                            ? kpi.value
                            : parseFloat(String(kpi.value).replace('%', ''));
                    progressWidth = isNaN(rate)
                        ? '0%'
                        : `${Math.min(100, Math.max(0, rate))}%`;
                } else if (kpi.title === 'Average Rating') {
                    const rating =
                        typeof kpi.value === 'number'
                            ? kpi.value
                            : parseFloat(String(kpi.value));
                    progressWidth = isNaN(rating)
                        ? '0%'
                        : `${((rating || 0) / 5) * 100}%`;
                }

                return (
                    <div
                        key={kpi.title}
                        className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                    >
                        <div
                            className={`pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full ${theme.bg}`}
                        />
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    {kpi.title}
                                </p>
                                <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                    {kpi.value}
                                </p>
                                <p
                                    className={`mt-1 text-xs font-semibold ${theme.text}`}
                                >
                                    {kpi.title === 'Total Responses' &&
                                        'All Feedback'}
                                    {kpi.title === 'Response Rate' &&
                                        kpi.value !== 'N/A' &&
                                        'Completion Rate'}
                                    {kpi.title === 'Average Rating' &&
                                        kpi.value !== 'N/A' &&
                                        'Out of 5 Stars'}
                                    {kpi.title === 'Positive Feedback' &&
                                        'Satisfied Responses'}
                                    {kpi.title === 'Negative Feedback' &&
                                        'Concerns Raised'}
                                </p>
                            </div>
                            <div
                                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${theme.iconBg} ${theme.iconText} ring-1 ${theme.ring} transition-transform duration-300 group-hover:scale-110`}
                            >
                                <kpi.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={`h-full bg-gradient-to-r ${theme.progress} rounded-full`}
                                style={{ width: progressWidth }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
