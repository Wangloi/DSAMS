import { Activity, Calendar, LayoutDashboard } from 'lucide-react';
import { Event, getEventLifecycleStatus } from './types';

interface EventsStatsCardsProps {
    allEvents: Event[];
    onFilterChange: (status: string) => void;
}

export default function EventsStatsCards({
    allEvents,
    onFilterChange,
}: EventsStatsCardsProps) {
    const activeCount = allEvents.filter(
        (e: Event) => getEventLifecycleStatus(e) !== 'completed',
    ).length;

    const ongoingCount = allEvents.filter(
        (e: Event) => getEventLifecycleStatus(e) === 'ongoing',
    ).length;

    const completedCount = allEvents.filter(
        (e: Event) => getEventLifecycleStatus(e) === 'completed',
    ).length;

    const ongoingPercentage =
        allEvents.length > 0
            ? `${Math.round((ongoingCount / allEvents.length) * 100)}%`
            : '0%';

    const completedPercentage =
        allEvents.length > 0
            ? `${Math.round((completedCount / allEvents.length) * 100)}%`
            : '0%';

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Active Events */}
            <div
                onClick={() => onFilterChange('active')}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
            >
                <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5" />
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Active Events
                        </p>
                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                            {activeCount}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Upcoming & Ongoing
                        </p>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                        <Calendar className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                </div>
            </div>

            {/* Ongoing Events */}
            <div
                onClick={() => onFilterChange('ongoing')}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
            >
                <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Ongoing
                        </p>
                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                            {ongoingCount}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                            Live Now
                        </p>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                        <Activity className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: ongoingPercentage }}
                    />
                </div>
            </div>

            {/* Completed Events */}
            <div
                onClick={() => onFilterChange('completed')}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
            >
                <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-slate-400/5" />
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Completed
                        </p>
                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                            {completedCount}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Finished
                        </p>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-600 ring-1 ring-slate-300/50 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600/30">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-slate-300 to-slate-500"
                        style={{ width: completedPercentage }}
                    />
                </div>
            </div>
        </div>
    );
}
