import { Badge } from '@/components/ui/badge';
import { Building2, Clock, MapPin } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    deriveEventLifecycleStatus,
    lifecycleStatusBadgeClass,
} from './deriveEventLifecycleStatus';
import { Event } from './types';

interface EventHoverCardProps {
    event: Event | null;
    targetRect: { top: number; left: number; width: number; height: number; bottom: number } | null;
}

export default function EventHoverCard({ event, targetRect }: EventHoverCardProps) {
    const [mounted, setMounted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!event || !targetRect || !cardRef.current) return;

        const card = cardRef.current;
        const cardWidth = card.offsetWidth || 300;
        const cardHeight = card.offsetHeight || 190;

        // Center horizontally relative to target element, bounded by screen edges
        let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        left = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12));

        // Place above target if there's enough space, otherwise place below
        let top = targetRect.top - cardHeight - 10;
        if (top < 12) {
            top = targetRect.bottom + 10;
        }

        setPosition({ top, left });
    }, [event, targetRect]);

    if (!mounted || !event || !targetRect) return null;

    const status = deriveEventLifecycleStatus(
        event.event_date,
        event.event_time,
        event.registration_end_time,
    );

    return createPortal(
        <div
            ref={cardRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            className="pointer-events-none fixed z-[99999] w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-150 animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900/95"
        >
            <div className="space-y-2.5">
                {/* Header: Title & Status */}
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {event.event_name}
                    </h4>
                    <Badge
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider capitalize ${lifecycleStatusBadgeClass(
                            status,
                        )}`}
                    >
                        {status === 'completed' ? 'Ended' : status}
                    </Badge>
                </div>

                {/* Schedule & Timing */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#23509A] dark:text-blue-300">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                        {event.event_time}
                        {event.registration_end_time && ` - ${event.registration_end_time}`}
                    </span>
                </div>

                {/* Details List: Venue & Organizer */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {event.location && (
                        <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                    {event.organizer && (
                        <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.organizer}</span>
                        </div>
                    )}
                </div>

                {/* Target Courses Pills */}
                {event.courses && event.courses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        {event.courses.slice(0, 5).map((course) => (
                            <span
                                key={course}
                                className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {course}
                            </span>
                        ))}
                        {event.courses.length > 5 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                                +{event.courses.length - 5}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer Hint */}
                <div className="pt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 text-right">
                    Click to view full details
                </div>
            </div>
        </div>,
        document.body,
    );
}
