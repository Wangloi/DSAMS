import IncidentStatsCard from './IncidentStatsCard';
import type { IncidentStats, KpiCard } from './types';

interface IncidentStatsCardsProps {
    stats: IncidentStats;
}

export default function IncidentStatsCards({ stats }: IncidentStatsCardsProps) {
    const kpiData: KpiCard[] = [
        {
            title: 'Total Cases',
            value: stats.total,
            change: '',
            accent: 'bg-blue-600',
            iconWrap:
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
        },
        {
            title: 'Pending Cases',
            value: stats.pending,
            change: '',
            accent: 'bg-amber-500',
            iconWrap:
                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
        },
        {
            title: 'Ongoing Cases',
            value: stats.ongoing,
            change: '',
            accent: 'bg-sky-500',
            iconWrap:
                'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300',
        },
        {
            title: 'Resolved Cases',
            value: stats.resolved,
            change: '',
            accent: 'bg-emerald-600',
            iconWrap:
                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
                <IncidentStatsCard key={kpi.title} kpi={kpi} />
            ))}
        </div>
    );
}
