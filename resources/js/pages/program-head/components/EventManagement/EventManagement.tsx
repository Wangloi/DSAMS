import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
    CalendarDays,
    CheckCircle2,
    Clock,
    MapPin,
    Upload,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FullCalendarWrapper from '@/components/ui/FullCalendarWrapper';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import ProgramHeadLayout from '@/pages/program-head/components/ProgramHeadLayout';

type EventStatus =
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'rescheduled';

interface EventItem {
    id: string;
    event_name: string;
    organizer?: string;
    location: string;
    event_date: string;
    event_time: string;
    status: EventStatus;
    courses?: string[];
    year_levels?: string[];
    description?: string;
}

function getStatusBadge(status: EventStatus) {
    const styles: Record<EventStatus, string> = {
        upcoming:
            'bg-blue-50/80 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400',
        ongoing:
            'bg-emerald-50/80 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
        completed:
            'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300',
        pending:
            'bg-amber-50/80 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
        approved:
            'bg-emerald-50/80 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
        rejected:
            'bg-rose-50/80 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400',
        rescheduled:
            'bg-indigo-50/80 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400',
    };
    return styles[status] || styles.pending;
}

function getCourseColor(course: string): string {
    const colors: Record<string, string> = {
        BSIT: 'bg-rose-700',
        BSCS: 'bg-rose-700',
        BSED: 'bg-blue-600',
        BSBA: 'bg-yellow-500',
        CRIM: 'bg-blue-600',
        BSHM: 'bg-green-500',
    };
    return colors[course] || 'bg-slate-500';
}

function getEventHexColor(courses?: string[]): string {
    if (!courses || courses.length === 0) return '#3b82f6'; // default blue

    const colors: Record<string, string> = {
        BSIT: '#800000',
        'INFORMATION TECHNOLOGY': '#800000',
        BSED: '#3b82f6',
        EDUCATION: '#3b82f6',
        BSHM: '#22c55e',
        HOSPITALITY: '#22c55e',
        BSBA: '#eab308',
        BUSINESS: '#eab308',
        CRIM: '#2563eb',
        CRIMINOLOGY: '#2563eb',
    };

    for (const course of courses) {
        const upperCourse = course.toUpperCase();
        for (const [key, color] of Object.entries(colors)) {
            if (upperCourse.includes(key)) {
                return color;
            }
        }
    }

    return '#3b82f6'; // default
}

export default function EventManagement() {
    const page = usePage() as {
        props: { events: EventItem[]; program?: string };
    };

    const events = page.props.events ?? [];
    const program = page.props.program ?? '';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [showActivityPlanModal, setShowActivityPlanModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Activity Plan Form State
    const [activityPlanTitle, setActivityPlanTitle] = useState('');
    const [activityPlanDescription, setActivityPlanDescription] = useState('');
    const [activityPlanFile, setActivityPlanFile] = useState<File | null>(null);

    const summary = useMemo(() => {
        return {
            total: events.length,
            upcoming: events.filter((e: EventItem) => e.status === 'upcoming')
                .length,
            pending: events.filter((e: EventItem) => e.status === 'pending')
                .length,
            completed: events.filter((e: EventItem) => e.status === 'completed')
                .length,
        };
    }, [events]);

    const filteredEvents = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return events.filter((e: EventItem) => {
            const matchesSearch =
                !q ||
                e.event_name.toLowerCase().includes(q) ||
                e.location.toLowerCase().includes(q) ||
                (e.organizer ?? '').toLowerCase().includes(q);

            const matchesStatus = !statusFilter || e.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [events, searchTerm, statusFilter]);

    const eventDateList = useMemo(() => {
        const map: Record<string, Date[]> = {};
        events.forEach((e: EventItem) => {
            const dateStr = new Date(e.event_date).toDateString();
            const courses = e.courses ?? [];
            courses.forEach((course: string) => {
                if (!map[course]) map[course] = [];
                map[course].push(new Date(e.event_date));
            });
        });
        return map;
    }, [events]);

    const eventCountsByDate = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        events.forEach((e: EventItem) => {
            const dateStr = new Date(e.event_date).toDateString();
            const courses = e.courses ?? [];
            if (!map[dateStr]) map[dateStr] = {};
            courses.forEach((course: string) => {
                map[dateStr][course] = (map[dateStr][course] || 0) + 1;
            });
        });
        return map;
    }, [events]);

    const getDayEventsInfo = (
        date: Date,
    ): { courses: string[]; total: number } | null => {
        const dateStr = date.toDateString();
        const info = eventCountsByDate[dateStr];
        if (!info) return null;
        return {
            courses: Object.keys(info),
            total: Object.values(info).reduce((sum, count) => sum + count, 0),
        };
    };

    const handleActivityPlanSubmit = () => {
        if (!activityPlanTitle.trim() || !activityPlanFile) {
            alert('Please fill all required fields');
            return;
        }

        console.log('Activity Plan Submitted:', {
            title: activityPlanTitle,
            description: activityPlanDescription,
            file: activityPlanFile,
        });

        // Reset form
        setActivityPlanTitle('');
        setActivityPlanDescription('');
        setActivityPlanFile(null);
        setShowActivityPlanModal(false);
    };

    const calendarEvents = useMemo(
        () =>
            events.map((e: EventItem) => ({
                id: e.id,
                title: e.event_name,
                start: `${e.event_date.split('T')[0]}T${e.event_time}`,
                backgroundColor: getEventHexColor(e.courses ?? []),
                borderColor: getEventHexColor(e.courses ?? []),
            })),
        [events],
    );

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const kpiData = [
        {
            title: 'Total Events',
            value: summary.total,
            icon: CalendarDays,
            theme: 'indigo',
            subText: 'All Events',
            gradient: 'from-indigo-400 to-indigo-600',
            bgCircle: 'bg-indigo-500/5',
        },
        {
            title: 'Upcoming',
            value: summary.upcoming,
            icon: Clock,
            theme: 'amber',
            subText: 'Scheduled',
            gradient: 'from-amber-400 to-amber-600',
            bgCircle: 'bg-amber-500/5',
        },
        {
            title: 'Pending',
            value: summary.pending,
            icon: XCircle,
            theme: 'rose',
            subText: 'Awaiting Approval',
            gradient: 'from-rose-400 to-rose-600',
            bgCircle: 'bg-rose-500/5',
        },
        {
            title: 'Completed',
            value: summary.completed,
            icon: CheckCircle2,
            theme: 'emerald',
            subText: 'Finished',
            gradient: 'from-emerald-400 to-emerald-600',
            bgCircle: 'bg-emerald-500/5',
        },
    ];

    return (
        <ProgramHeadLayout>
            <Head title="Events - Program Head" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* ── Hero Header ─────────────────────────────────────────────── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        {/* Background decorations */}
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                    <Activity className="h-7 w-7 text-blue-200" />
                                </div>

                                <div>
                                    <h1 className="text-2xl leading-tight font-black tracking-tight text-white">
                                        Event Management
                                    </h1>
                                    <div className="mt-0.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <p className="text-sm font-medium text-blue-200/80">
                                            View and manage organization events,
                                            activity plans, schedules, and event
                                            updates.
                                        </p>
                                        {program && (
                                            <Badge
                                                variant="outline"
                                                className="w-fit gap-1 self-center rounded-lg border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:self-auto"
                                            >
                                                <CalendarDays className="h-2.5 w-2.5 text-blue-300" />
                                                {program}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 self-center">
                                {/* Live Date Indicator widget */}
                                <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white ring-1 ring-white/20 backdrop-blur-md md:flex">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                                        <Clock className="h-4.5 w-4.5 text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black tracking-widest text-blue-200/40 uppercase">
                                            System Time
                                        </p>
                                        <p className="text-xs font-bold tracking-tight text-white">
                                            {today}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    className="h-10 gap-2 rounded-xl bg-white px-5 text-[10px] font-black tracking-widest text-[#1e3a8a] uppercase shadow-md transition-all duration-200 hover:bg-slate-100 active:scale-95"
                                    onClick={() =>
                                        setShowActivityPlanModal(true)
                                    }
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Activity Plan
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── KPI Cards ───────────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                        {kpiData.map((kpi) => (
                            <div
                                key={kpi.title}
                                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800"
                            >
                                <div
                                    className={cn(
                                        'pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full',
                                        kpi.bgCircle,
                                    )}
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            {kpi.title}
                                        </p>
                                        <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                                            {kpi.value.toLocaleString()}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-1 text-xs font-semibold',
                                                kpi.theme === 'indigo' &&
                                                    'text-indigo-600 dark:text-indigo-400',
                                                kpi.theme === 'amber' &&
                                                    'text-amber-600 dark:text-amber-400',
                                                kpi.theme === 'rose' &&
                                                    'text-rose-600 dark:text-rose-400',
                                                kpi.theme === 'emerald' &&
                                                    'text-emerald-600 dark:text-emerald-400',
                                            )}
                                        >
                                            {kpi.subText}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                                            kpi.theme === 'indigo' &&
                                                'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30',
                                            kpi.theme === 'amber' &&
                                                'bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30',
                                            kpi.theme === 'rose' &&
                                                'bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30',
                                            kpi.theme === 'emerald' &&
                                                'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30',
                                        )}
                                    >
                                        <kpi.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={cn(
                                            'h-full w-full rounded-full bg-gradient-to-r',
                                            kpi.gradient,
                                        )}
                                        style={{
                                            width:
                                                kpi.value > 0 ? '100%' : '0%',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Main View Container ── */}
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
                        {/* Unified Header */}
                        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                    {viewMode === 'calendar' ? (
                                        <CalendarDays className="h-5 w-5" />
                                    ) : (
                                        <Activity className="h-5 w-5" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                        {viewMode === 'calendar'
                                            ? 'Activity Calendar'
                                            : 'Events List'}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {viewMode === 'calendar'
                                            ? 'View events by date (colored by program)'
                                            : `Total: ${filteredEvents.length} events`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {/* Calendar Legend (Only visible in calendar view) */}
                                {viewMode === 'calendar' && (
                                    <div className="hidden flex-wrap items-center gap-3 border-r border-slate-200 pr-2 lg:flex dark:border-slate-700">
                                        {[
                                            {
                                                course: 'BSIT',
                                                color: 'bg-rose-700',
                                            },
                                            {
                                                course: 'BSED',
                                                color: 'bg-blue-600',
                                            },
                                            {
                                                course: 'BSBA',
                                                color: 'bg-yellow-500',
                                            },
                                            {
                                                course: 'CRIM',
                                                color: 'bg-indigo-600',
                                            },
                                            {
                                                course: 'BSHM',
                                                color: 'bg-emerald-600',
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.course}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    className={`h-2 w-2 rounded-full ${item.color}`}
                                                />
                                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    {item.course}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* View Toggle */}
                                <div className="inline-flex items-center rounded-xl bg-slate-200/50 p-1 ring-1 ring-slate-900/5 dark:bg-slate-800/50 dark:ring-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('calendar')}
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
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                                            viewMode === 'list'
                                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <Activity className="h-4 w-4" />
                                        List View
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Activity Calendar View ── */}
                        {viewMode === 'calendar' && (
                            <div>
                                {/* Mobile Legend (Shows on small screens below header) */}
                                <div className="flex justify-center border-b border-slate-100 bg-white px-6 py-3 lg:hidden dark:border-slate-800 dark:bg-transparent">
                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        {[
                                            {
                                                course: 'BSIT',
                                                color: 'bg-rose-700',
                                            },
                                            {
                                                course: 'BSED',
                                                color: 'bg-blue-600',
                                            },
                                            {
                                                course: 'BSBA',
                                                color: 'bg-yellow-500',
                                            },
                                            {
                                                course: 'CRIM',
                                                color: 'bg-indigo-600',
                                            },
                                            {
                                                course: 'BSHM',
                                                color: 'bg-emerald-600',
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.course}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    className={`h-2 w-2 rounded-full ${item.color}`}
                                                />
                                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                    {item.course}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* FullCalendar Wrapper */}
                                    <div className="mx-auto h-[650px] max-w-5xl rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                                        <FullCalendarWrapper
                                            events={calendarEvents}
                                            selectable={false}
                                            editable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── List View ── */}
                        {viewMode === 'list' && (
                            <div className="p-6">
                                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                            Events list
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Filtered list of events
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400">
                                                <CalendarDays className="h-4 w-4" />
                                            </span>
                                            <Input
                                                placeholder="Search events..."
                                                className="h-9 w-[220px] border border-slate-200 bg-white pl-9 dark:border-slate-600 dark:bg-slate-800"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <Select
                                            value={statusFilter || 'all'}
                                            onValueChange={(value) =>
                                                setStatusFilter(
                                                    value === 'all'
                                                        ? ''
                                                        : (value as EventStatus),
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-9 w-[140px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    All Status
                                                </SelectItem>
                                                <SelectItem value="upcoming">
                                                    Upcoming
                                                </SelectItem>
                                                <SelectItem value="ongoing">
                                                    Ongoing
                                                </SelectItem>
                                                <SelectItem value="completed">
                                                    Completed
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                    #
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                    Event
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                    Venue
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredEvents.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                                    >
                                                        No events found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredEvents.map(
                                                    (
                                                        event: EventItem,
                                                        idx: number,
                                                    ) => (
                                                        <tr
                                                            key={event.id}
                                                            className="cursor-pointer transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                            onClick={() =>
                                                                setSelectedEvent(
                                                                    event,
                                                                )
                                                            }
                                                        >
                                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            event.event_name
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {event.organizer ??
                                                                            'N/A'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {new Date(
                                                                            event.event_date,
                                                                        ).toLocaleDateString(
                                                                            'en-US',
                                                                            {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                year: 'numeric',
                                                                            },
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {
                                                                            event.event_time
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                                                    <span>
                                                                        {
                                                                            event.location
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
                                                                        getStatusBadge(
                                                                            event.status,
                                                                        ),
                                                                    )}
                                                                >
                                                                    {
                                                                        event.status
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Activity Plan Modal */}
            {showActivityPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Upload Activity Plan
                            </h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                                    Activity Plan Title
                                </label>
                                <Input
                                    placeholder="Enter title"
                                    value={activityPlanTitle}
                                    onChange={(e) =>
                                        setActivityPlanTitle(e.target.value)
                                    }
                                    className="h-9 border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Enter description"
                                    value={activityPlanDescription}
                                    onChange={(e) =>
                                        setActivityPlanDescription(
                                            e.target.value,
                                        )
                                    }
                                    className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                                    Document Upload (PDF, DOC, DOCX)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) =>
                                        setActivityPlanFile(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700 dark:text-slate-400"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
                            <Button
                                variant="outline"
                                onClick={() => setShowActivityPlanModal(false)}
                                className="border-slate-200 dark:border-slate-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleActivityPlanSubmit}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ProgramHeadLayout>
    );
}
