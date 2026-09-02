import { Head, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileText,
    MapPin,
    Sparkles,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
    approval_status?: string;
    activity_plan_path?: string;
    requested_by?: string;
    rejection_reason?: string;
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

    const isOwnProgramEvent = useMemo(() => {
        if (!selectedEvent) return false;
        if (!program) return true; // If program head's program is not set, default to true
        
        const targetCourses = selectedEvent.courses ?? [];
        if (targetCourses.length === 0) return true;
        
        const normProgram = program.trim().toUpperCase();
        return targetCourses.some((c: string) => {
            const normCourse = c.trim().toUpperCase();
            return normCourse === normProgram || 
                   normCourse.includes(normProgram) || 
                   normProgram.includes(normCourse) ||
                   normCourse === 'ALL';
        });
    }, [selectedEvent, program]);

    // Activity Plan Form State
    const [activityPlanTitle, setActivityPlanTitle] = useState('');
    const [activityPlanLocation, setActivityPlanLocation] = useState('');
    const [activityPlanDate, setActivityPlanDate] = useState('');
    const [activityPlanTime, setActivityPlanTime] = useState('08:00');
    const [activityPlanDescription, setActivityPlanDescription] = useState('');
    const [activityPlanFile, setActivityPlanFile] = useState<File | null>(null);
    const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

    // Auto-select event from URL query params (e.g. from notifications)
    useMemo(() => {
        if (typeof window === 'undefined') return;
        const urlParams = new URLSearchParams(window.location.search);
        const urlEventId = urlParams.get('event_id') || urlParams.get('eventId');
        const urlStatus = urlParams.get('status');

        if (urlEventId && !selectedEvent) {
            const foundEvent = events.find((e: EventItem) => String(e.id) === String(urlEventId));
            if (foundEvent) {
                setSelectedEvent(foundEvent);
            }
        }
        if (urlStatus && !statusFilter) {
            setStatusFilter(urlStatus as EventStatus);
        }
    }, [events]);

    const summary = useMemo(() => {
        return {
            total: events.length,
            upcoming: events.filter((e: EventItem) => e.status === 'upcoming' && e.approval_status !== 'pending' && e.approval_status !== 'rejected')
                .length,
            pending: events.filter((e: EventItem) => e.approval_status === 'pending' || e.status === 'pending')
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

            const effectiveStatus = (e.approval_status === 'pending' || e.approval_status === 'rejected')
                ? e.approval_status
                : e.status;

            const matchesStatus = !statusFilter || effectiveStatus === statusFilter || e.status === statusFilter || e.approval_status === statusFilter;

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

    const handleDateSelect = (selectInfo: any) => {
        const [datePart] = selectInfo.startStr.split('T');
        setActivityPlanDate(datePart);
        setShowActivityPlanModal(true);
    };

    const handleActivityPlanSubmit = () => {
        if (!activityPlanTitle.trim() || !activityPlanDate || !activityPlanLocation.trim()) {
            Swal.fire({
                title: 'Missing Required Fields',
                text: 'Please provide event title, date, and venue location.',
                icon: 'warning',
                confirmButtonColor: '#1e40af',
            });
            return;
        }

        setIsSubmittingPlan(true);

        const formData = new FormData();
        formData.append('event_name', activityPlanTitle);
        formData.append('location', activityPlanLocation);
        formData.append('event_date', activityPlanDate);
        formData.append('event_time', activityPlanTime || '08:00');
        formData.append('description', activityPlanDescription || '');

        if (activityPlanFile) {
            formData.append('activity_plan', activityPlanFile);
        }

        router.post('/program-head/calendar-events', formData, {
            onSuccess: () => {
                setIsSubmittingPlan(false);
                Swal.fire({
                    title: 'Schedule Request Submitted!',
                    text: 'Your activity plan and proposed schedule have been submitted. System administrators have been notified for review and approval.',
                    icon: 'success',
                    confirmButtonColor: '#1e40af',
                });
                setActivityPlanTitle('');
                setActivityPlanLocation('');
                setActivityPlanDate('');
                setActivityPlanTime('08:00');
                setActivityPlanDescription('');
                setActivityPlanFile(null);
                setShowActivityPlanModal(false);
            },
            onError: () => {
                setIsSubmittingPlan(false);
                Swal.fire({
                    title: 'Submission Failed',
                    text: 'Please check your inputs and try again.',
                    icon: 'error',
                    confirmButtonColor: '#dc2626',
                });
            },
        });
    };

function formatToIsoStart(dateStr: string, timeStr: string): string {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    if (!timeStr) return cleanDate;

    let time = timeStr.trim().toUpperCase();
    const isPM = time.includes('PM');
    const isAM = time.includes('AM');
    time = time.replace(/(AM|PM)/g, '').trim();

    const parts = time.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const formattedHours = String(hours).padStart(2, '0');
    return `${cleanDate}T${formattedHours}:${minutes}:00`;
}

    const calendarEvents = useMemo(
        () =>
            events.map((e: EventItem) => ({
                id: e.id,
                title: e.event_name,
                start: formatToIsoStart(e.event_date, e.event_time),
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
                                <div className="p-4">
                                    <div className="h-[640px] rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-[#0B192C]/40">
                                        <FullCalendarWrapper
                                            events={calendarEvents}
                                            selectable={true}
                                            editable={false}
                                            onDateSelect={handleDateSelect}
                                            onEventClick={(clickInfo) => {
                                                const eventId = clickInfo.event.id;
                                                const foundEvent = events.find((e: EventItem) => String(e.id) === String(eventId));
                                                if (foundEvent) {
                                                    setSelectedEvent(foundEvent);
                                                }
                                            }}
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
                                                                            (event.approval_status === 'pending' || event.approval_status === 'rejected')
                                                                                ? (event.approval_status as EventStatus)
                                                                                : event.status,
                                                                        ),
                                                                    )}
                                                                >
                                                                    {
                                                                        (event.approval_status === 'pending' || event.approval_status === 'rejected')
                                                                            ? event.approval_status
                                                                            : event.status
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 pt-16 sm:pt-20 pb-6 backdrop-blur-md transition-all duration-300 sm:p-6">
                    <div className="mx-auto flex max-h-[82vh] w-full max-w-xl animate-in flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl duration-200 zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                        {/* Premium Header Banner */}
                        <div className="relative shrink-0 overflow-hidden border-b border-blue-900/30 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-4 text-white sm:px-8">
                            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-blue-300 shadow-inner">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
                                                Submit Activity Plan
                                            </h2>
                                            <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">
                                                Schedule Proposal
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-300/90">
                                            Submit event parameters and official proposal docs for Administrator review.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowActivityPlanModal(false)}
                                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body Form */}
                        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-900/40">
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                        Event / Activity Title *
                                    </label>
                                    <Input
                                        placeholder="e.g. IT Department Annual Tech Summit 2026"
                                        value={activityPlanTitle}
                                        onChange={(e) => setActivityPlanTitle(e.target.value)}
                                        className="h-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                        Proposed Venue / Location *
                                    </label>
                                    <Input
                                        placeholder="e.g. Main Campus Gymnasium / AVR Hall 2"
                                        value={activityPlanLocation}
                                        onChange={(e) => setActivityPlanLocation(e.target.value)}
                                        className="h-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            Proposed Date *
                                        </label>
                                        <Input
                                            type="date"
                                            value={activityPlanDate}
                                            onChange={(e) => setActivityPlanDate(e.target.value)}
                                            className="h-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            Start Time *
                                        </label>
                                        <Input
                                            type="time"
                                            value={activityPlanTime}
                                            onChange={(e) => setActivityPlanTime(e.target.value)}
                                            className="h-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Description & Objectives
                                    </label>
                                    <textarea
                                        placeholder="Briefly outline event objectives, schedule, or expected participants..."
                                        value={activityPlanDescription}
                                        onChange={(e) => setActivityPlanDescription(e.target.value)}
                                        className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            {/* Document File Attachment Box */}
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                                <label className="mb-2 block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Attach Official Activity Plan (PDF / Word / Image)
                                </label>

                                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-500">
                                    <Upload className="mb-2 h-7 w-7 text-blue-500" />
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {activityPlanFile ? activityPlanFile.name : 'Click to upload activity proposal document'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                        Supports PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                                    </p>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={(e) => setActivityPlanFile(e.target.files?.[0] ?? null)}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>
                                {activityPlanFile && (
                                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                        <span className="truncate">✓ {activityPlanFile.name} ({(activityPlanFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        <button
                                            type="button"
                                            onClick={() => setActivityPlanFile(null)}
                                            className="text-xs font-bold hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                            <Button
                                variant="outline"
                                onClick={() => setShowActivityPlanModal(false)}
                                disabled={isSubmittingPlan}
                                className="h-10 rounded-xl border-slate-300 font-semibold dark:border-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleActivityPlanSubmit}
                                disabled={isSubmittingPlan}
                                className="h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/35"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {isSubmittingPlan ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Details View Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 pt-16 sm:pt-20 pb-6 backdrop-blur-md transition-all duration-300 sm:p-6">
                    <div className="mx-auto flex max-h-[82vh] w-full max-w-xl animate-in flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl duration-200 zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                        {/* Header Banner */}
                        <div className="relative shrink-0 overflow-hidden border-b border-blue-900/30 bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-5 text-white sm:px-8">
                            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={cn(
                                                'px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                                                selectedEvent.approval_status === 'pending'
                                                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                                    : selectedEvent.approval_status === 'rejected'
                                                    ? 'bg-rose-400/20 text-rose-300 border-rose-400/30'
                                                    : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                                            )}
                                        >
                                            {selectedEvent.approval_status === 'pending'
                                                ? 'Pending Admin Approval'
                                                : selectedEvent.approval_status === 'rejected'
                                                ? 'Schedule Rejected'
                                                : 'Approved Schedule'}
                                        </Badge>
                                    </div>
                                    <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
                                        {selectedEvent.event_name}
                                    </h2>
                                    <p className="mt-1 text-xs text-blue-200/90">
                                        Organized by: {selectedEvent.organizer || 'Program Head'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvent(null)}
                                    className="rounded-full p-2 text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                            {/* Status Alert Banner */}
                            {selectedEvent.approval_status === 'pending' && isOwnProgramEvent && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                                    <div className="flex items-start gap-3">
                                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <h4 className="text-xs font-bold">Schedule Request Pending Review</h4>
                                            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
                                                This event schedule and activity plan proposal have been submitted to Administrators for approval. Once approved, it will be officially published on campus calendars.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedEvent.approval_status === 'rejected' && isOwnProgramEvent && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                        <div>
                                            <h4 className="text-xs font-bold">Schedule Request Rejected</h4>
                                            {selectedEvent.rejection_reason && (
                                                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 font-semibold bg-rose-100/60 p-2 rounded-lg dark:bg-rose-900/40">
                                                    Reason: "{selectedEvent.rejection_reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Event Details Grid */}
                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</span>
                                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {selectedEvent.event_time}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venue Location</span>
                                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                        {selectedEvent.location}
                                    </p>
                                </div>

                                {selectedEvent.courses && selectedEvent.courses.length > 0 && (
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Programs</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {selectedEvent.courses.map((c) => (
                                                <Badge key={c} variant="secondary" className="text-[10px] px-2 py-0.5">
                                                    {c}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.year_levels && selectedEvent.year_levels.length > 0 && (
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Levels</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {selectedEvent.year_levels.map((y) => (
                                                <Badge key={y} variant="outline" className="text-[10px] px-2 py-0.5">
                                                    {y}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {selectedEvent.description && (
                                <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description & Objectives</span>
                                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {selectedEvent.description}
                                    </p>
                                </div>
                            )}

                            {/* Attached Activity Plan Document Download */}
                            {selectedEvent.activity_plan_path && isOwnProgramEvent && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Activity Plan Proposal Document</h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Attached proposal file</p>
                                            </div>
                                        </div>
                                        <a
                                            href={selectedEvent.activity_plan_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                                        >
                                            <Upload className="h-3.5 w-3.5 rotate-180" />
                                            Download Document
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-slate-200/80 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedEvent(null)}
                                className="h-9 text-xs rounded-xl"
                            >
                                Close Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ProgramHeadLayout>
    );
}
