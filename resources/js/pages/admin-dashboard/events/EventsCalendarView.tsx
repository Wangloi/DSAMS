import FullCalendarWrapper from '@/components/ui/FullCalendarWrapper';
import { Event, getEventColor } from './types';

interface EventsCalendarViewProps {
    allEvents: Event[];
    onDateSelect: (selectInfo: any) => void;
    onEventClick: (clickInfo: any) => void;
    onEventDrop: (dropInfo: any) => void;
}

const PROGRAM_LEGEND = [
    { label: 'BSIT', color: 'bg-rose-700' },
    { label: 'BSED', color: 'bg-blue-600' },
    { label: 'BSBA', color: 'bg-yellow-500' },
    { label: 'CRIM', color: 'bg-indigo-600' },
    { label: 'BSHM', color: 'bg-emerald-600' },
];

export default function EventsCalendarView({
    allEvents,
    onDateSelect,
    onEventClick,
    onEventDrop,
}: EventsCalendarViewProps) {
    return (
        <div>
            {/* Mobile Legend (Shows on small screens below header) */}
            <div className="flex justify-center border-b border-slate-100 bg-white px-6 py-3 lg:hidden dark:border-slate-800 dark:bg-transparent">
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {PROGRAM_LEGEND.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${item.color}`} />
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4">
                <div className="h-[640px] rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-[#0B192C]/40">
                    <FullCalendarWrapper
                        events={allEvents.map((e) => ({
                            id: String(e.id),
                            title: e.event_name,
                            start: `${e.event_date.split('T')[0]}T${e.event_time}`,
                            backgroundColor: getEventColor(e.courses),
                            borderColor: getEventColor(e.courses),
                        }))}
                        onDateSelect={onDateSelect}
                        onEventClick={onEventClick}
                        onEventDrop={onEventDrop}
                        selectable={true}
                        editable={true}
                    />
                </div>
            </div>
        </div>
    );
}
