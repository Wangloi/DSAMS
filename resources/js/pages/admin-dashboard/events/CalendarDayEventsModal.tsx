import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Calendar,
    ChevronRight,
    Clock,
    MapPin,
    Plus,
    X,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
    deriveEventLifecycleStatus,
    lifecycleStatusBadgeClass,
} from './deriveEventLifecycleStatus';
import { Event } from './types';

interface CalendarDayEventsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: Date | null;
    events: any[];
    onSelectEvent: (event: any) => void;
    onAddEvent: (dateStr: string) => void;
}

export default function CalendarDayEventsModal({
    open,
    onOpenChange,
    date,
    events,
    onSelectEvent,
    onAddEvent,
}: CalendarDayEventsModalProps) {
    if (!open || !date) return null;

    const formattedDate = useMemo(() => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [date]);

    const dateYmd = useMemo(() => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [date]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="lg" className="max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>{formattedDate}</DialogTitle>
                    <DialogDescription>
                        {events.length} {events.length === 1 ? 'event' : 'events'} scheduled for this date
                    </DialogDescription>
                </DialogHeader>

                {/* ── CLEAN MINIMALIST HEADER ── */}
                <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#23509A] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                        {formattedDate}
                                    </h3>
                                    <span className="shrink-0 rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#23509A] uppercase tracking-wider dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                        {events.length} {events.length === 1 ? 'Event' : 'Events'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Click any event to view attendees, geofencing & full details
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── EVENTS LIST ── */}
                <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                No events scheduled for this day
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Click the button below to schedule an activity.
                            </p>
                        </div>
                    ) : (
                        events.map((event) => {
                            const status = deriveEventLifecycleStatus(
                                event.event_date,
                                event.event_time,
                                event.registration_end_time,
                            );

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => {
                                        onOpenChange(false);
                                        onSelectEvent(event);
                                    }}
                                    className="group relative flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-slate-850 cursor-pointer"
                                >
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900 group-hover:text-[#23509A] dark:text-white dark:group-hover:text-blue-300 transition-colors">
                                                {event.event_name}
                                            </span>
                                            <Badge
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider capitalize ${lifecycleStatusBadgeClass(
                                                    status,
                                                )}`}
                                            >
                                                {status === 'completed' ? 'Ended' : status}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1 font-semibold text-[#23509A] dark:text-blue-300">
                                                <Clock className="h-3.5 w-3.5" />
                                                {event.event_time}
                                                {event.registration_end_time && ` - ${event.registration_end_time}`}
                                            </span>

                                            {event.location && (
                                                <span className="inline-flex items-center gap-1 font-medium truncate max-w-[200px]">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {event.location}
                                                </span>
                                            )}

                                            {event.organizer && (
                                                <span className="hidden sm:inline font-medium text-slate-400">
                                                    • {event.organizer}
                                                </span>
                                            )}
                                        </div>

                                        {event.courses && event.courses.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                {event.courses.slice(0, 4).map((c: string) => (
                                                    <span
                                                        key={c}
                                                        className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                                {event.courses.length > 4 && (
                                                    <span className="text-[10px] text-slate-400 font-semibold">
                                                        +{event.courses.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 group-hover:text-[#23509A] group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 dark:group-hover:text-blue-300 transition-colors">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── FOOTER ── */}
                <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            onOpenChange(false);
                            onAddEvent(dateYmd);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-[#23509A] hover:bg-[#1b3f7a] text-xs font-semibold text-white shadow-xs transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Event for This Day</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
