import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn, formatDate, formatTime } from '@/lib/utils';
import {
    Archive,
    ArchiveRestore,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    MapPin,
    Search,
    Users,
    XCircle,
} from 'lucide-react';
import { Event, getEventLifecycleStatus } from './types';

interface EventsTableCardProps {
    displayedEvents: Event[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    pageIndex: number;
    pageSize: number;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    courseFilter: string;
    onCourseFilterChange: (value: string) => void;
    yearLevelFilter: string;
    onYearLevelFilterChange: (value: string) => void;
    allCourses: string[];
    allYearLevels: string[];
    onApproveSchedule: (eventId: number, eventName: string) => void;
    onRejectSchedule: (eventId: number, eventName: string) => void;
    onOpenAttendees: (event: Event) => void;
    onViewEvent: (event: Event) => void;
    onEditEvent: (event: Event) => void;
    onArchiveEvent: (event: Event) => void;
    onUnarchiveEvent: (event: Event) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onSelectPage: (page: number) => void;
}

export default function EventsTableCard({
    displayedEvents,
    pagination,
    pageIndex,
    pageSize,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    courseFilter,
    onCourseFilterChange,
    yearLevelFilter,
    onYearLevelFilterChange,
    allCourses,
    allYearLevels,
    onApproveSchedule,
    onRejectSchedule,
    onOpenAttendees,
    onViewEvent,
    onEditEvent,
    onArchiveEvent,
    onUnarchiveEvent,
    onPrevPage,
    onNextPage,
    onSelectPage,
}: EventsTableCardProps) {
    const renderStatusBadge = (event: Event) => {
        if (event.approval_status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
                    <Clock className="h-3 w-3 animate-pulse text-amber-500" />
                    Pending Approval
                </span>
            );
        }

        if (event.approval_status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                    <XCircle className="h-3 w-3 text-rose-500" />
                    Schedule Rejected
                </span>
            );
        }

        const effectiveStatus = getEventLifecycleStatus(event);

        switch (effectiveStatus) {
            case 'upcoming':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Upcoming
                    </span>
                );
            case 'ongoing':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        </span>
                        Ongoing
                    </span>
                );
            case 'completed':
            case 'ended':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Ended
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {effectiveStatus}
                    </span>
                );
        }
    };

    const renderEventInfo = (event: Event) => {
        const initials = (event.organizer || 'EV')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        return (
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm ring-2 ring-white dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300 dark:ring-slate-800">
                    {initials}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 transition-colors hover:text-[#1e40af] dark:text-white dark:hover:text-blue-400">
                        {event.event_name}
                    </span>
                    <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {event.organizer}
                    </span>
                </div>
            </div>
        );
    };

    const renderDateTime = (dateStr: string, timeStr: string) => {
        return (
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatDate(dateStr)}
                </span>
                <span className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatTime(timeStr)}
                </span>
            </div>
        );
    };

    const renderAttendanceProgress = (event: Event) => {
        if (event.status === 'upcoming') {
            return (
                <span className="inline-flex items-center pl-1 text-xs font-medium text-slate-400 italic dark:text-slate-500">
                    —
                </span>
            );
        }

        const present = event.attendances?.length ?? 0;
        const eligible =
            typeof event.eligible_students_count === 'number'
                ? event.eligible_students_count
                : 0;
        const exp = event.expected_attendees;
        const denominator = typeof exp === 'number' && exp > 0 ? exp : eligible;
        const pct =
            denominator > 0
                ? Math.min(100, Math.round((present / denominator) * 100))
                : 0;

        return (
            <div className="flex w-32 flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="font-semibold tabular-nums">
                        {present} / {denominator}
                    </span>
                    <span className="font-semibold text-[#1e40af] dark:text-blue-400">
                        {pct}%
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-200/40 bg-slate-100 shadow-inner dark:border-slate-600/40 dark:bg-slate-700">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Table Filters Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800 dark:bg-transparent">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search events..."
                            className="h-9 w-48 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <Select
                        value={statusFilter || 'active'}
                        onValueChange={onStatusFilterChange}
                    >
                        <SelectTrigger className="h-9 w-44 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="Active Events" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active Events</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="ongoing">Ongoing (Live)</SelectItem>
                            <SelectItem value="pending">Pending Approval</SelectItem>
                            <SelectItem value="completed">Ended / Past Events</SelectItem>
                            <SelectItem value="rejected">Schedule Rejected</SelectItem>
                            <SelectItem value="all">All Events (Include Past)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={courseFilter || 'all'}
                        onValueChange={onCourseFilterChange}
                    >
                        <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {allCourses.map((course) => (
                                <SelectItem key={course} value={course}>
                                    {course}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={yearLevelFilter || 'all'}
                        onValueChange={onYearLevelFilterChange}
                    >
                        <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="All Year Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Year Levels</SelectItem>
                            {allYearLevels.map((year) => (
                                <SelectItem key={year} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                            <th className="w-12 px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                #
                            </th>
                            <th className="px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Event Info
                            </th>
                            <th className="px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Schedule
                            </th>
                            <th className="px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Location
                            </th>
                            <th className="px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Status
                            </th>
                            <th className="px-6 py-3.5 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Attendance
                            </th>
                            <th className="px-6 py-3.5 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/70">
                        {displayedEvents.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            No events found
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            Try adjusting your search or filters
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayedEvents.map((event: Event, idx: number) => (
                                <tr
                                    key={event.id}
                                    className="group transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-blue-950/10"
                                >
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400 tabular-nums dark:text-slate-600">
                                        {(pageIndex - 1) * pageSize + idx + 1}
                                    </td>
                                    <td className="px-6 py-4">{renderEventInfo(event)}</td>
                                    <td className="px-6 py-4">
                                        {renderDateTime(
                                            event.event_date,
                                            event.event_time,
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                            <span className="max-w-[120px] truncate">
                                                {event.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{renderStatusBadge(event)}</td>
                                    <td className="px-6 py-4">
                                        {renderAttendanceProgress(event)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {event.approval_status === 'pending' && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                        onClick={() =>
                                                            onApproveSchedule(
                                                                event.id,
                                                                event.event_name,
                                                            )
                                                        }
                                                        title="Approve Schedule Request"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                        onClick={() =>
                                                            onRejectSchedule(
                                                                event.id,
                                                                event.event_name,
                                                            )
                                                        }
                                                        title="Reject Schedule Request"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                                                onClick={() => onOpenAttendees(event)}
                                                title="View Attendees"
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                onClick={() => onViewEvent(event)}
                                                aria-label="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                onClick={() => onEditEvent(event)}
                                                aria-label="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {event.archived_at ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                                                    onClick={() => onUnarchiveEvent(event)}
                                                    title="Restore Event"
                                                >
                                                    <ArchiveRestore className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                                                    onClick={() => onArchiveEvent(event)}
                                                    title="Archive Event"
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Showing{' '}
                    <span className="font-black text-slate-700 dark:text-slate-300">
                        {pagination.total === 0 ? 0 : (pageIndex - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-black text-slate-700 dark:text-slate-300">
                        {Math.min(pageIndex * pageSize, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-black text-slate-700 dark:text-slate-300">
                        {pagination.total}
                    </span>{' '}
                    entries
                </p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                        onClick={onPrevPage}
                        disabled={pageIndex <= 1}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </button>
                    {Array.from(
                        { length: Math.min(pagination.last_page, 5) },
                        (_, i) => {
                            const num = i + 1;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => onSelectPage(num)}
                                    className={cn(
                                        'h-8 w-8 rounded-lg text-xs font-bold transition-all duration-200',
                                        pageIndex === num
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                    )}
                                >
                                    {num}
                                </button>
                            );
                        },
                    )}
                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                        onClick={onNextPage}
                        disabled={pageIndex >= pagination.last_page}
                    >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
