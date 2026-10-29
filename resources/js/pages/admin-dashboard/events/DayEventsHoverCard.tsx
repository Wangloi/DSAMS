import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    deriveEventLifecycleStatus,
    lifecycleStatusBadgeClass,
} from './deriveEventLifecycleStatus';
import { Event } from './types';

interface DayEventsHoverCardProps {
    date: Date | null;
    events: any[];
    targetRect: { top: number; left: number; width: number; height: number; bottom: number } | null;
}

export default function DayEventsHoverCard({
    date,
    events,
    targetRect,
}: DayEventsHoverCardProps) {
    const [mounted, setMounted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    const formattedDate = useMemo(() => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }, [date]);

    useEffect(() => {
        if (!date || events.length === 0 || !targetRect || !cardRef.current) return;

        const card = cardRef.current;
        const cardWidth = card.offsetWidth || 320;
        const cardHeight = card.offsetHeight || 220;

        let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));

        let top = targetRect.top - cardHeight - 10;
        if (top < 16) {
            top = targetRect.bottom + 10;
        }
        if (top + cardHeight > window.innerHeight - 16) {
            top = Math.max(16, window.innerHeight - cardHeight - 16);
        }

        setPosition({ top, left });
    }, [date, events, targetRect]);

    if (!mounted || !date || events.length === 0 || !targetRect) return null;

    return createPortal(
        <div
            ref={cardRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            className="pointer-events-none fixed z-[9999] w-80 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-150 animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900/95"
        >
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-[#23509A] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {formattedDate}
                        </span>
                    </div>
                    <span className="shrink-0 rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#23509A] uppercase tracking-wider dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                        {events.length} {events.length === 1 ? 'Event' : 'Events'}
                    </span>
                </div>
            </div>

            {/* Events List */}
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                {events.slice(0, 4).map((ev) => {
                    const status = deriveEventLifecycleStatus(
                        ev.event_date,
                        ev.event_time,
                        ev.registration_end_time,
                    );

                    return (
                        <div
                            key={ev.id}
                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-1"
                        >
                            <div className="flex items-start justify-between gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white leading-snug truncate">
                                    {ev.event_name}
                                </span>
                                <Badge
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider capitalize ${lifecycleStatusBadgeClass(
                                        status,
                                    )}`}
                                >
                                    {status === 'completed' ? 'Ended' : status}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1 font-semibold text-[#23509A] dark:text-blue-300">
                                    <Clock className="h-3 w-3" />
                                    {ev.event_time}
                                </span>
                                {ev.location && (
                                    <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                        {ev.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {events.length > 4 && (
                    <div className="text-center pt-1 text-[11px] font-bold text-[#23509A] dark:text-blue-400">
                        +{events.length - 4} more scheduled events
                    </div>
                )}
            </div>

            {/* Hint Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-center text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
                Click date to view complete details or add events
            </div>
        </div>,
        document.body,
    );
}
