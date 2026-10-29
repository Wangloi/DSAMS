import FullCalendarWrapper from '@/components/ui/FullCalendarWrapper';
import { useState } from 'react';
import CalendarDayEventsModal from './CalendarDayEventsModal';
import DayEventsHoverCard from './DayEventsHoverCard';
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
    const [dayModalOpen, setDayModalOpen] = useState(false);
    const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
    const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);

    const [hoveredDay, setHoveredDay] = useState<{
        dateStr: string;
        date: Date;
        events: Event[];
        rect: { top: number; left: number; width: number; height: number; bottom: number };
    } | null>(null);

    const handleMoreLinkClick = (arg: any) => {
        if (!arg?.date) return;
        setHoveredDay(null);
        const y = arg.date.getFullYear();
        const m = String(arg.date.getMonth() + 1).padStart(2, '0');
        const d = String(arg.date.getDate()).padStart(2, '0');
        const dateYmd = `${y}-${m}-${d}`;

        const matching = allEvents.filter((e) => {
            const eDate = (e.event_date || '').split('T')[0];
            return eDate === dateYmd;
        });

        setSelectedDayDate(arg.date);
        setSelectedDayEvents(matching);
        setDayModalOpen(true);
    };

    const handleCalendarMouseMove = (e: React.MouseEvent) => {
        if (dayModalOpen) {
            if (hoveredDay) setHoveredDay(null);
            return;
        }

        const target = e.target as HTMLElement | null;
        const dayCell = target?.closest('td.fc-daygrid-day[data-date]') as HTMLElement | null;
        if (!dayCell) {
            if (hoveredDay) setHoveredDay(null);
            return;
        }

        const dateStr = dayCell.getAttribute('data-date');
        if (!dateStr) {
            if (hoveredDay) setHoveredDay(null);
            return;
        }

        if (hoveredDay?.dateStr === dateStr) return;

        const matching = allEvents.filter((ev) => {
            const evDate = (ev.event_date || '').split('T')[0];
            return evDate === dateStr;
        });

        if (matching.length === 0) {
            if (hoveredDay) setHoveredDay(null);
            return;
        }

        const rect = dayCell.getBoundingClientRect();
        setHoveredDay({
            dateStr,
            date: new Date(`${dateStr}T00:00:00`),
            events: matching,
            rect: {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            },
        });
    };

    const handleCalendarMouseLeave = () => {
        setHoveredDay(null);
    };

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
            <div
                className="p-4"
                onMouseMove={handleCalendarMouseMove}
                onMouseLeave={handleCalendarMouseLeave}
            >
                <div className="h-[640px] rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-[#0B192C]/40">
                    <FullCalendarWrapper
                        events={allEvents.map((e) => ({
                            id: String(e.id),
                            title: e.event_name,
                            start: `${e.event_date.split('T')[0]}T${e.event_time}`,
                            backgroundColor: getEventColor(e.courses),
                            borderColor: getEventColor(e.courses),
                        }))}
                        onDateSelect={(info) => {
                            setHoveredDay(null);
                            onDateSelect(info);
                        }}
                        onEventClick={(info) => {
                            setHoveredDay(null);
                            onEventClick(info);
                        }}
                        onEventDrop={onEventDrop}
                        onMoreLinkClick={handleMoreLinkClick}
                        selectable={true}
                        editable={true}
                    />
                </div>
            </div>

            {/* Clean Minimalist Day Events Modal */}
            <CalendarDayEventsModal
                open={dayModalOpen}
                onOpenChange={setDayModalOpen}
                date={selectedDayDate}
                events={selectedDayEvents}
                onSelectEvent={(ev) => {
                    onEventClick({ event: { id: ev.id } });
                }}
                onAddEvent={(dateStr) => {
                    onDateSelect({ startStr: dateStr });
                }}
            />

            {/* Day Events Hover Preview Card */}
            <DayEventsHoverCard
                date={hoveredDay?.date ?? null}
                events={hoveredDay?.events ?? []}
                targetRect={hoveredDay?.rect ?? null}
            />
        </div>
    );
}
