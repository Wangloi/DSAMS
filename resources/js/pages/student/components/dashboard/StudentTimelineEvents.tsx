import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { studentAttendanceScannerPortal } from '@/routes';
import { router } from '@inertiajs/react';
import {
    Calendar,
    Camera,
    Check,
    Clock,
    MapPin,
    Navigation,
} from 'lucide-react';
import type { EventRecord } from './types';

interface StudentTimelineEventsProps {
    events?: EventRecord[];
    gpsCheckingIn: number | null;
    handleGpsCheckin: (event: EventRecord) => void;
    isGpsAttendance: (e: EventRecord) => boolean;
}

export function StudentTimelineEvents({
    events = [],
    gpsCheckingIn,
    handleGpsCheckin,
    isGpsAttendance,
}: StudentTimelineEventsProps) {
    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-blue-600/20 bg-blue-600/10 shadow-inner">
                        <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase sm:text-base dark:text-white">
                            Campus Schedule
                        </h2>
                        <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                            Co-Curricular & Academic Timeline
                        </p>
                    </div>
                </div>
                <Badge className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] sm:text-[10px] font-black tracking-widest text-blue-600 uppercase dark:bg-blue-500/20 dark:text-blue-400">
                    {events.length} Events Total
                </Badge>
            </div>

            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/60 bg-white/70 p-3.5 sm:p-6 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-800/60">
                {/* Timeline vertical track (visible on tablet/desktop) */}
                {events.length > 0 && (
                    <div className="pointer-events-none absolute top-8 bottom-8 left-[38px] hidden w-0.5 border-l border-dashed border-slate-300 sm:block dark:border-slate-700" />
                )}

                <div className="space-y-3 sm:space-y-8">
                    {events.map((event) => {
                        const isDone =
                            !!event.is_done ||
                            event.status?.toLowerCase() === 'completed';
                        const isOngoing =
                            !isDone && !!event.scanner_portal_active;

                        return (
                            <div
                                key={event.id}
                                className="group relative flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6 text-left"
                            >
                                {/* Timeline Node Circle (desktop / tablet) */}
                                <div className="relative z-10 hidden sm:flex items-center justify-center">
                                    <div
                                        className={cn(
                                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-500 group-hover:scale-105',
                                            isDone
                                                ? 'bg-slate-300 dark:bg-slate-700'
                                                : isOngoing
                                                  ? 'animate-pulse bg-gradient-to-br from-emerald-400 to-teal-500 ring-4 shadow-emerald-500/30 ring-emerald-500/20'
                                                  : 'bg-gradient-to-br from-blue-600 to-indigo-700',
                                        )}
                                    >
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:border-blue-500/30 hover:bg-white hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                                    <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0 flex-1 space-y-2">
                                            {/* Header: Title and Badges */}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge
                                                        className={cn(
                                                            'rounded-md border px-2 py-0.5 text-[8px] font-black tracking-[0.2em] uppercase',
                                                            isDone
                                                                ? 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                                : isOngoing
                                                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                  : 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                                        )}
                                                    >
                                                        {isDone
                                                            ? 'Completed'
                                                            : isOngoing
                                                              ? 'Ongoing'
                                                              : event.status ||
                                                                'Upcoming'}
                                                    </Badge>
                                                    {isGpsAttendance(event) && (
                                                        <Badge className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[8px] font-black tracking-[0.15em] text-violet-600 uppercase dark:text-violet-400">
                                                            📍 GPS (
                                                            {event.geofence_radius_m ||
                                                                50}
                                                            m)
                                                        </Badge>
                                                    )}
                                                    {event.is_scanner_assigned && (
                                                        <Badge className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[8px] font-black tracking-[0.15em] text-indigo-600 uppercase dark:text-indigo-400">
                                                            🛡️ Scanner
                                                        </Badge>
                                                    )}
                                                </div>

                                                <h3 className="text-sm font-black tracking-tight text-slate-900 break-words sm:text-base dark:text-white">
                                                    {event.title}
                                                </h3>
                                            </div>

                                            {/* Metadata: Date, Time, Location */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-800/60">
                                                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                    <span>{event.date}</span>
                                                </span>
                                                {event.time && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-800/60">
                                                        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                        <span>{event.time}</span>
                                                    </span>
                                                )}
                                                {event.location && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-800/60 max-w-full">
                                                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                                        <span className="truncate">
                                                            {event.location}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            {event.description && (
                                                <p className="mt-1 text-xs leading-relaxed text-slate-500 break-words dark:text-slate-400">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions / Status badges */}
                                        <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-3 md:w-auto md:justify-end md:border-0 md:pt-0 dark:border-slate-800">
                                            {isDone ? (
                                                event.attendance_status ===
                                                'checked_out' ? (
                                                    <Badge className="w-full sm:w-auto justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        <Check className="h-3.5 w-3.5" />
                                                        Checked Out
                                                    </Badge>
                                                ) : event.attendance_status ===
                                                  'checked_in' ? (
                                                    <Badge className="w-full sm:w-auto justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                        <Check className="h-3.5 w-3.5" />
                                                        Checked In
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="w-full sm:w-auto justify-center rounded-xl border-slate-200 bg-slate-50/60 px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500"
                                                    >
                                                        Event Ended
                                                    </Badge>
                                                )
                                            ) : (
                                                <>
                                                    {isGpsAttendance(event) &&
                                                        (event.attendance_status ===
                                                        'checked_out' ? (
                                                            <Badge className="w-full sm:w-auto justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-3.5 w-3.5" />
                                                                Checked Out
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                className={cn(
                                                                    'h-9 w-full sm:w-auto justify-center gap-1.5 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase shadow-md transition-all active:scale-95',
                                                                    event.attendance_status ===
                                                                        'checked_in'
                                                                        ? 'bg-amber-600 text-white shadow-amber-500/25 hover:bg-amber-700'
                                                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700',
                                                                )}
                                                                disabled={
                                                                    gpsCheckingIn ===
                                                                    event.id
                                                                }
                                                                onClick={() =>
                                                                    handleGpsCheckin(
                                                                        event,
                                                                    )
                                                                }
                                                            >
                                                                <Navigation className="h-3.5 w-3.5" />
                                                                {event.attendance_status ===
                                                                'checked_in'
                                                                    ? 'Check Out (GPS)'
                                                                    : 'Check In (GPS)'}
                                                            </Button>
                                                        ))}

                                                    {event.is_scanner_assigned &&
                                                        event.scanner_portal_active &&
                                                        !isDone && (
                                                            <Button
                                                                className="h-9 w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-md shadow-blue-500/25 transition-all active:scale-95"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        studentAttendanceScannerPortal(
                                                                            event.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                Open Scanner
                                                                <Camera className="ml-1.5 h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {events.length === 0 && (
                        <div className="py-16 text-center">
                            <Calendar className="mx-auto h-12 w-12 animate-pulse text-slate-300 dark:text-slate-600" />
                            <h3 className="mt-4 text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                No Scheduled Events
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Keep checking back for future school events and
                                announcements.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
