import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatTimeTo12Hour } from '@/lib/utils';
import {
    AlertCircle,
    AlertTriangle,
    Building2,
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    Clock,
    Filter,
    MapPin,
    Navigation,
    QrCode,
    RotateCcw,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import type { AttendedEventRecord } from './types';

interface StudentEventHistoryProps {
    attendedEvents?: AttendedEventRecord[];
    onSwitchToSchedule?: () => void;
}

export function StudentEventHistory({
    attendedEvents = [],
    onSwitchToSchedule,
}: StudentEventHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Quick date preset handlers
    const applyDatePreset = (preset: 'all' | 'this_month' | 'past_30' | 'past_90') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().slice(0, 10);

        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'this_month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setStartDate(formatDate(firstDay));
            setEndDate(formatDate(lastDay));
        } else if (preset === 'past_30') {
            const past30 = new Date(today);
            past30.setDate(today.getDate() - 30);
            setStartDate(formatDate(past30));
            setEndDate(formatDate(today));
        } else if (preset === 'past_90') {
            const past90 = new Date(today);
            past90.setDate(today.getDate() - 90);
            setStartDate(formatDate(past90));
            setEndDate(formatDate(today));
        }
    };

    const isFiltered = Boolean(
        searchQuery.trim() || statusFilter !== 'all' || startDate || endDate,
    );

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    // Filtered list
    const filteredEvents = useMemo(() => {
        return attendedEvents.filter((item) => {
            // 1. Search Query filter (event title, location, organizer)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesTitle = item.title?.toLowerCase().includes(q);
                const matchesLoc = item.location?.toLowerCase().includes(q);
                const matchesOrg = item.organizer?.toLowerCase().includes(q);
                if (!matchesTitle && !matchesLoc && !matchesOrg) {
                    return false;
                }
            }

            // 2. Attendance Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'checked_out') {
                    if (
                        item.status !== 'checked_out' &&
                        item.raw_status !== 'present'
                    ) {
                        return false;
                    }
                } else if (
                    item.status !== statusFilter &&
                    item.raw_status !== statusFilter
                ) {
                    return false;
                }
            }

            // 3. Date Range filter (using raw_date YYYY-MM-DD or parsed check-in date)
            if (startDate || endDate) {
                const itemDate =
                    item.raw_date ||
                    (item.checked_in_at
                        ? new Date(item.checked_in_at).toISOString().slice(0, 10)
                        : '');
                if (itemDate) {
                    if (startDate && itemDate < startDate) {
                        return false;
                    }
                    if (endDate && itemDate > endDate) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [attendedEvents, searchQuery, statusFilter, startDate, endDate]);

    // Status badge helper
    const renderStatusBadge = (item: AttendedEventRecord) => {
        switch (item.status) {
            case 'checked_out':
                return (
                    <Badge className="gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Checked Out
                    </Badge>
                );
            case 'checked_in':
                return (
                    <Badge className="gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-amber-600 uppercase dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Checked In
                    </Badge>
                );
            case 'late':
                return (
                    <Badge className="gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        Late Check-in
                    </Badge>
                );
            case 'left_early':
                return (
                    <Badge className="gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3" />
                        Left Early
                    </Badge>
                );
            case 'incomplete':
                return (
                    <Badge className="gap-1 rounded-lg border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-400">
                        <X className="h-3 w-3" />
                        Incomplete
                    </Badge>
                );
            case 'excused':
                return (
                    <Badge className="gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-sky-600 uppercase dark:text-sky-400">
                        <ShieldCheck className="h-3 w-3" />
                        Excused
                    </Badge>
                );
            default:
                return (
                    <Badge className="gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.raw_status || 'Attended'}
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-xs backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-850/60">
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Search Query Input */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by event or venue..."
                                className="h-9.5 rounded-xl border-slate-200 bg-white pl-9 text-xs shadow-xs focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 2. Attendance Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="all">All Attendance Statuses</option>
                                <option value="checked_out">
                                    Checked Out / Present
                                </option>
                                <option value="checked_in">
                                    Checked In (In-Progress)
                                </option>
                                <option value="late">Late Arrival</option>
                                <option value="left_early">Left Early</option>
                                <option value="incomplete">Incomplete</option>
                                <option value="excused">Excused</option>
                            </select>
                        </div>

                        {/* 3. Start Date */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                From:
                            </span>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9.5 rounded-xl border-slate-200 bg-white text-xs shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        {/* 4. End Date */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                To:
                            </span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9.5 rounded-xl border-slate-200 bg-white text-xs shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Filter Presets & Reset */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-700/60">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                Quick Range:
                            </span>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('all')}
                                className={cn(
                                    'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                                    !startDate && !endDate
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                                )}
                            >
                                All Time
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('this_month')}
                                className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('past_30')}
                                className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Past 30 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('past_90')}
                                className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Past 90 Days
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Showing {filteredEvents.length} of{' '}
                                {attendedEvents.length} record
                                {attendedEvents.length === 1 ? '' : 's'}
                            </span>
                            {isFiltered && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-7 gap-1 rounded-lg border-slate-200 px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attended Events List */}
            <div className="space-y-3.5">
                {filteredEvents.map((item) => {
                    const isGps = item.attendance_type === 'geofence' || item.check_in_distance_m !== null;

                    return (
                        <div
                            key={item.attendance_id}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:border-emerald-500/30"
                        >
                            <div className="flex flex-col gap-3.5 md:flex-row md:items-start md:justify-between">
                                {/* Left Info */}
                                <div className="min-w-0 flex-1 space-y-2">
                                    {/* Header & Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {renderStatusBadge(item)}

                                        {item.organizer && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[8px] font-black tracking-wider text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                            >
                                                <Building2 className="h-2.5 w-2.5" />
                                                {item.organizer}
                                            </Badge>
                                        )}

                                        {isGps ? (
                                            <Badge className="gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-violet-600 uppercase dark:text-violet-400">
                                                <Navigation className="h-2.5 w-2.5" />
                                                GPS Verified
                                                {item.check_in_distance_m !== null &&
                                                    ` (${item.check_in_distance_m}m)`}
                                            </Badge>
                                        ) : (
                                            <Badge className="gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                                                <QrCode className="h-2.5 w-2.5" />
                                                QR Scanner
                                            </Badge>
                                        )}

                                        {item.mid_session_verified_at && (
                                            <Badge className="gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                                <ShieldCheck className="h-2.5 w-2.5" />
                                                Mid-Session Verified
                                            </Badge>
                                        )}

                                        {item.is_manual_override && (
                                            <Badge className="gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-400">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                                Admin Override
                                            </Badge>
                                        )}

                                        {item.is_flagged && (
                                            <Badge className="gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[8px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                Flagged
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Event Title */}
                                    <h3 className="text-sm font-black tracking-tight text-slate-900 break-words sm:text-base dark:text-white">
                                        {item.title}
                                    </h3>

                                    {/* Event Metadata (Date, Time, Location) */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-700/60">
                                            <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                            <span>{item.date}</span>
                                        </span>
                                        {item.time && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-700/60">
                                                <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                <span>{formatTimeTo12Hour(item.time)}</span>
                                            </span>
                                        )}
                                        {item.location && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-slate-700/60 max-w-full">
                                                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                                <span className="truncate">
                                                    {item.location}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Description if present */}
                                    {item.description && (
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Right Info: Check-In & Check-Out Timestamps Box */}
                                <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left md:w-56 dark:border-slate-700/60 dark:bg-slate-900/40">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                            <span>Time In</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                Recorded
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {item.checked_in_at || 'Recorded'}
                                        </p>
                                    </div>

                                    <div className="border-t border-slate-200/60 pt-1.5 dark:border-slate-700/60 space-y-0.5">
                                        <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                            <span>Time Out</span>
                                            <span
                                                className={cn(
                                                    'font-bold',
                                                    item.checked_out_at
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-amber-600 dark:text-amber-400',
                                                )}
                                            >
                                                {item.checked_out_at
                                                    ? 'Completed'
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {item.checked_out_at || (
                                                <span className="italic text-amber-600 dark:text-amber-400">
                                                    Check-out Pending
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Notes if manual override or flagged */}
                                    {item.manual_override_reason && (
                                        <div className="border-t border-slate-200/60 pt-1 text-[10px] text-slate-500 dark:border-slate-700/60">
                                            <span className="font-bold">Override: </span>
                                            {item.manual_override_reason}
                                        </div>
                                    )}
                                    {item.flagged_reason && (
                                        <div className="border-t border-rose-200/60 pt-1 text-[10px] text-rose-600 dark:border-rose-900/60 dark:text-rose-400">
                                            <span className="font-bold">Flag: </span>
                                            {item.flagged_reason}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State: Filter Returned No Results */}
                {filteredEvents.length === 0 && attendedEvents.length > 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/40">
                        <Search className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <h4 className="mt-3 text-sm font-black tracking-wider text-slate-800 uppercase dark:text-white">
                            No Matching Attendance Records
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            No attended events match your search term or active filters.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-4 gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear All Filters
                        </Button>
                    </div>
                )}

                {/* Empty State: Student has 0 attended events recorded in the database */}
                {attendedEvents.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-slate-700 dark:bg-slate-800/40">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                            <CalendarCheck2 className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h4 className="mt-4 text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                            No Event Attendance History Yet
                        </h4>
                        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            Only events where your attendance is officially recorded in
                            the database appear here. Once you check in to campus
                            activities via QR scanner or GPS geofence, your attendance records
                            will be saved here.
                        </p>
                        {onSwitchToSchedule && (
                            <Button
                                type="button"
                                onClick={onSwitchToSchedule}
                                className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
                            >
                                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                Browse Upcoming Events Schedule
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
