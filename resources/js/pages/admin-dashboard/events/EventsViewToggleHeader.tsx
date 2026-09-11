import { cn } from '@/lib/utils';
import { CalendarDays, LayoutDashboard } from 'lucide-react';

interface EventsViewToggleHeaderProps {
    viewMode: 'calendar' | 'list';
    onViewModeChange: (mode: 'calendar' | 'list') => void;
    totalEvents: number;
}

const PROGRAM_LEGEND = [
    { label: 'BSIT', color: 'bg-rose-700' },
    { label: 'BSED', color: 'bg-blue-600' },
    { label: 'BSBA', color: 'bg-yellow-500' },
    { label: 'CRIM', color: 'bg-indigo-600' },
    { label: 'BSHM', color: 'bg-emerald-600' },
];

export default function EventsViewToggleHeader({
    viewMode,
    onViewModeChange,
    totalEvents,
}: EventsViewToggleHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    {viewMode === 'calendar' ? (
                        <CalendarDays className="h-5 w-5" />
                    ) : (
                        <LayoutDashboard className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                        {viewMode === 'calendar' ? 'Activity Calendar' : 'Events List'}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {viewMode === 'calendar'
                            ? 'Manage events by date (colored by program)'
                            : `Total: ${totalEvents} events`}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {/* Calendar Legend (Only visible in calendar view on large screens) */}
                {viewMode === 'calendar' && (
                    <div className="hidden flex-wrap items-center gap-3 border-r border-slate-200 pr-2 lg:flex dark:border-slate-700">
                        {PROGRAM_LEGEND.map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Toggle */}
                <div className="inline-flex items-center rounded-xl bg-slate-200/50 p-1 ring-1 ring-slate-900/5 dark:bg-slate-800/50 dark:ring-white/10">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('calendar')}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                            viewMode === 'calendar'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                        )}
                    >
                        <CalendarDays className="h-4 w-4" />
                        Calendar View
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('list')}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                            viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        List View
                    </button>
                </div>
            </div>
        </div>
    );
}
