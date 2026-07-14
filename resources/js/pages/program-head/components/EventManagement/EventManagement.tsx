import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, FileText, Upload, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'approved' | 'rejected' | 'rescheduled';

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
        upcoming: 'bg-blue-50/80 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400',
        ongoing: 'bg-emerald-50/80 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
        completed: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300',
        pending: 'bg-amber-50/80 text-amber-700 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
        approved: 'bg-emerald-50/80 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
        rejected: 'bg-rose-50/80 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400',
        rescheduled: 'bg-indigo-50/80 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400',
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
        'BSIT': '#800000',
        'INFORMATION TECHNOLOGY': '#800000',
        'BSED': '#3b82f6',
        'EDUCATION': '#3b82f6',
        'BSHM': '#22c55e',
        'HOSPITALITY': '#22c55e',
        'BSBA': '#eab308',
        'BUSINESS': '#eab308',
        'CRIM': '#2563eb',
        'CRIMINOLOGY': '#2563eb'
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
    const page = usePage() as { props: { events: EventItem[]; program?: string } };

    const events = page.props.events ?? [];
    const program = page.props.program ?? '';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [showActivityPlanModal, setShowActivityPlanModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Activity Plan Form State
    const [activityPlanTitle, setActivityPlanTitle] = useState('');
    const [activityPlanDescription, setActivityPlanDescription] = useState('');
    const [activityPlanFile, setActivityPlanFile] = useState<File | null>(null);

    const summary = useMemo(() => {
        return {
            total: events.length,
            upcoming: events.filter((e: EventItem) => e.status === 'upcoming').length,
            pending: events.filter((e: EventItem) => e.status === 'pending').length,
            completed: events.filter((e: EventItem) => e.status === 'completed').length,
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

    const getDayEventsInfo = (date: Date): { courses: string[]; total: number } | null => {
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

    const calendarEvents = useMemo(() => events.map((e: EventItem) => ({
        id: e.id,
        title: e.event_name,
        start: `${e.event_date.split('T')[0]}T${e.event_time}`,
        backgroundColor: getEventHexColor(e.courses ?? []),
        borderColor: getEventHexColor(e.courses ?? []),
    })), [events]);

    return (
        <ProgramHeadLayout>
            <Head title="Events - Program Head" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* Page Header */}
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 shadow-sm dark:bg-blue-600/20 dark:text-blue-400">
                                <CalendarDays className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Event Management
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    View and manage organization events, activity plans, schedules, and event updates
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            className="h-10 gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                            onClick={() => setShowActivityPlanModal(true)}
                        >
                            <Upload className="h-5 w-5" />
                            Upload Activity Plan
                        </Button>
                    </div>

                    {/* Event Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="group overflow-hidden border border-blue-100 bg-blue-50/50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-blue-700 uppercase opacity-70 dark:text-blue-400">
                                            Total Events
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {summary.total}
                                            </div>
                                            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                All Events
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400">
                                        <CalendarDays className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border border-amber-100 bg-amber-50/50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-amber-700 uppercase opacity-70 dark:text-amber-400">
                                            Upcoming
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {summary.upcoming}
                                            </div>
                                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                Scheduled
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border border-rose-100 bg-rose-50/50 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-rose-700 uppercase opacity-70 dark:text-rose-400">
                                            Pending
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {summary.pending}
                                            </div>
                                            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                Awaiting Approval
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner transition-transform duration-300 group-hover:scale-110 dark:bg-rose-500/20 dark:text-rose-400">
                                        <XCircle className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group overflow-hidden border border-emerald-100 bg-emerald-50/50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase opacity-70 dark:text-emerald-400">
                                            Completed
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {summary.completed}
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                Finished
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Calendar Section - After Stats Cards */}
                    <div>
                        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 mb-6">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                            Activity Calendar
                                        </CardTitle>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            View events by date (colored by program)
                                        </p>
                                    </div>
                                </div>

                            </CardHeader>
                            <CardContent>
                                {/* FullCalendar Wrapper */}
                                <div className="mx-auto max-w-5xl h-[650px] rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                                    <FullCalendarWrapper
                                        events={calendarEvents}
                                        selectable={false}
                                        editable={false}
                                    />
                                </div>
                                {/* Calendar Legend */}
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Program Indicators:
                                    </span>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { course: 'BSIT', color: 'bg-rose-700', label: 'Information Technology' },
                                            { course: 'BSED', color: 'bg-blue-600', label: 'Secondary Education' },
                                            { course: 'BSBA', color: 'bg-yellow-500', label: 'Business Admin' },
                                            { course: 'CRIM', color: 'bg-blue-600', label: 'Criminology' },
                                            { course: 'BSHM', color: 'bg-green-600', label: 'Hospitality Management' },
                                        ].map((item) => (
                                            <div key={item.course} className="flex items-center gap-1.5" title={item.label}>
                                                <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.course}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Two-Column Layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Section - Event List - Full Width */}
                        <Card className="flex-1 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <CardHeader>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                            Events List
                                        </CardTitle>
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            Total: {filteredEvents.length} events
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center">
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400">
                                                <CalendarDays className="h-4 w-4" />
                                            </span>
                                            <Input
                                                placeholder="Search events..."
                                                className="h-9 border border-slate-200 bg-white pl-9 dark:border-slate-600 dark:bg-slate-800"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <Select
                                            value={statusFilter || 'all'}
                                            onValueChange={(value) =>
                                                setStatusFilter(
                                                    value === 'all' ? '' : (value as EventStatus),
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-9 border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Event</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Schedule</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Venue</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                                        No events found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredEvents.map((event: EventItem, idx: number) => (
                                                    <tr
                                                        key={event.id}
                                                        className="cursor-pointer transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    {event.event_name}
                                                                </span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {event.organizer ?? 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                    {new Date(event.event_date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {event.event_time}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                                                <span>{event.location}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
                                                                getStatusBadge(event.status),
                                                            )}>
                                                                {event.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Upload Activity Plan Modal */}
            {showActivityPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
                        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Upload Activity Plan
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">
                                    Activity Plan Title
                                </label>
                                <Input
                                    placeholder="Enter title"
                                    value={activityPlanTitle}
                                    onChange={(e) => setActivityPlanTitle(e.target.value)}
                                    className="h-9 border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Enter description"
                                    value={activityPlanDescription}
                                    onChange={(e) => setActivityPlanDescription(e.target.value)}
                                    className="w-full h-20 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">
                                    Document Upload (PDF, DOC, DOCX)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setActivityPlanFile(e.target.files?.[0] ?? null)}
                                    className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
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
