import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Head, router, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Calendar, Edit, Eye, MapPin, Search, Trash2, Users, Clock, Archive, ArchiveRestore, CalendarDays, PlusCircle, Activity, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateEventModal, { CreateEventPayload } from './CreateEventModal';
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
import {
    adminDashboard,
    adminEvents,
    adminEventsArchive,
    adminEventsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import EventAttendeesModal from '../attendance/EventAttendeesModal';
import EventsTableHeader from './EventsTableHeader';
import EventViewModal from './EventViewModal';
import type { EventViewRecord } from './EventViewModal';
import type { CourseYearOption } from './mergeCourseYearOptions';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Events',
        href: adminEvents(),
    },
];

interface Event {
    id: number;
    event_name: string;
    description: string;
    courses: string[];
    year_levels: string[];
    location: string;
    event_date: string;
    event_time: string;
    registration_end_time: string | null;
    organizer: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    qr_code: string | null;
    attendances: Array<{
        id: number;
        student_id: number;
        student: {
            name: string;
            email: string;
        };
    }>;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    geofence_enabled: boolean;
    scanner_portal_active: boolean;
    geofence_latitude?: number | string | null;
    geofence_longitude?: number | string | null;
    geofence_radius_m?: number | null;
    eligible_students_count?: number;
    expected_attendees?: number | null;
}

function formatEventAttendeesLabel(event: Event): string {
    const present = event.attendances?.length ?? 0;
    const eligible = typeof event.eligible_students_count === 'number' ? event.eligible_students_count : 0;
    const exp = event.expected_attendees;
    const denominator = typeof exp === 'number' && exp > 0 ? exp : eligible;

    if (event.status === 'upcoming') {
        return `0 / ${denominator}`;
    }

    return `${present} / ${denominator}`;
}

function getEventColor(courses: string[]): string {
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

interface PageProps extends Record<string, any> {
    events: Event[];
    allEvents?: Event[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        course?: string;
        year_level?: string;
    };
    courses: CourseYearOption[];
    yearLevels: CourseYearOption[];
    totalStudents: number;
    studentCountsByCourseYear: Array<{ course: string; year_level: string; total: number }>;
    announcements: Array<{ id: string | number; title: string; eventDate?: string; eventTime?: string }>;
}

export default function AdminEventsIndex() {
    const { props } = (usePage() as { props: PageProps });
    const {
        events,
        allEvents = [],
        pagination,
        filters,
        courses = [],
        yearLevels = [],
        totalStudents = 0,
        studentCountsByCourseYear = [],
        announcements = [],
    } = props;

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'upcoming':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Upcoming
                    </span>
                );
            case 'ongoing':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Ongoing
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Completed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {status}
                    </span>
                );
        }
    };

    const renderEventInfo = (event: Event) => {
        const initials = (event.organizer || 'EV').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return (
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-[#1e40af] dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300 text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-800">
                    {initials}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#1e40af] dark:hover:text-blue-400 transition-colors">
                        {event.event_name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {event.organizer}
                    </span>
                </div>
            </div>
        );
    };

    const renderDateTime = (dateStr: string, timeStr: string) => {
        const d = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = d.toLocaleDateString('en-US', options);

        return (
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{formattedDate}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{timeStr}</span>
            </div>
        );
    };

    const renderAttendanceProgress = (event: Event) => {
        if (event.status === 'upcoming') {
            return (
                <span className="inline-flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium italic pl-1">
                    —
                </span>
            );
        }

        const present = event.attendances?.length ?? 0;
        const eligible = typeof event.eligible_students_count === 'number' ? event.eligible_students_count : 0;
        const exp = event.expected_attendees;
        const denominator = typeof exp === 'number' && exp > 0 ? exp : eligible;
        const pct = denominator > 0 ? Math.min(100, Math.round((present / denominator) * 100)) : 0;

        return (
            <div className="flex flex-col gap-1.5 w-32">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="tabular-nums font-semibold">{present} / {denominator}</span>
                    <span className="text-[#1e40af] dark:text-blue-400 font-semibold">{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-600/40 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [courseFilter, setCourseFilter] = useState(filters.course || '');
    const [yearLevelFilter, setYearLevelFilter] = useState(filters.year_level || '');
    const [pageIndex, setPageIndex] = useState(pagination?.current_page ?? 1);
    const [pageSize, setPageSize] = useState(pagination?.per_page ?? 10);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewEvent, setViewEvent] = useState<Event | null>(null);
    const [attendeesOpen, setAttendeesOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalData, setModalData] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null);

    const allCourses = useMemo<string[]>(() => {
        const courses = new Set<string>();
        events.forEach((event: Event) => {
            event.courses.forEach((course: string) => courses.add(course));
        });
        return Array.from(courses);
    }, [events]);

    const allYearLevels = useMemo<string[]>(() => {
        const yearLevels = new Set<string>();
        events.forEach((event: Event) => {
            event.year_levels.forEach((year: string) => yearLevels.add(year));
        });
        return Array.from(yearLevels);
    }, [events]);

    useEffect(() => {
        // Only make request if filters have actually changed from initial values
        const hasChanges = searchTerm !== (filters.search || '') ||
            statusFilter !== (filters.status || '') ||
            courseFilter !== (filters.course || '') ||
            yearLevelFilter !== (filters.year_level || '');

        if (!hasChanges) return;

        const timeoutId = setTimeout(() => {
            router.get(adminEvents(), {
                search: searchTerm,
                status: statusFilter,
                course: courseFilter,
                year_level: yearLevelFilter,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, courseFilter, yearLevelFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming':
                return 'bg-blue-100 text-blue-800';
            case 'ongoing':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    const handleArchive = (event: Event) => {
        Swal.fire({
            title: 'Archive Event?',
            text: `Are you sure you want to archive "${event.event_name}"? You can restore it later.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(adminEventsArchive(event.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Archived',
                            text: 'Event has been archived successfully.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (errors: Record<string, any>) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to archive event. Please try again.',
                        });
                        console.error('Archive error:', errors);
                    },
                });
            }
        });
    };

    const handleUnarchive = (event: Event) => {
        Swal.fire({
            title: 'Restore Event?',
            text: `Are you sure you want to restore "${event.event_name}" from the archive?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Restore',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(adminEventsUnarchive(event.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Restored',
                            text: 'Event has been restored successfully.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (errors: Record<string, any>) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to unarchive event. Please try again.',
                        });
                        console.error('Unarchive error:', errors);
                    },
                });
            }
        });
    };

    const filteredEvents = useMemo(() => {
        return events.filter((event: Event) => {
            const matchesSearch = !searchTerm ||
                event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.organizer.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = !statusFilter || event.status === statusFilter;
            const matchesCourse = !courseFilter || event.courses.includes(courseFilter);
            const matchesYearLevel = !yearLevelFilter || event.year_levels.includes(yearLevelFilter);

            return matchesSearch && matchesStatus && matchesCourse && matchesYearLevel;
        });
    }, [events, searchTerm, statusFilter, courseFilter, yearLevelFilter]);

    // Server-side pagination handling
    const goToPage = (page: number) => {
        setPageIndex(page);
        router.get(adminEvents(), { ...filters, page, per_page: pageSize }, { preserveState: true, preserveScroll: true });
    };

    // When page size changes, request first page with new size and update state
    const changePageSize = (size: number) => {
        setPageSize(size);
        setPageIndex(1);
        router.get(adminEvents(), { ...filters, page: 1, per_page: size }, { preserveState: true, preserveScroll: true });
    };

    // Update URL parameters when filters or pagination change
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter) params.set('status', statusFilter);
        if (courseFilter) params.set('course', courseFilter);
        if (yearLevelFilter) params.set('year_level', yearLevelFilter);
        params.set('page', pageIndex.toString());
        params.set('per_page', pageSize.toString());
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }, [searchTerm, statusFilter, courseFilter, yearLevelFilter, pageIndex, pageSize]);

    // Reset to first page when filters change
    useEffect(() => {
        goToPage(1);
    }, [searchTerm, statusFilter, courseFilter, yearLevelFilter]);

    // Use server-provided events directly (no client-side slicing)
    const displayedEvents = filteredEvents;

    // Pagination controls use server-side functions
    const handlePrev = () => goToPage(Math.max(1, pageIndex - 1));
    const handleNext = () => goToPage(Math.min(pagination?.last_page ?? 1, pageIndex + 1));
    const handlePageSelect = (page: number) => goToPage(page);
    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => changePageSize(Number(e.target.value));

    // Calendar handlers

    // Calendar handlers
    const handleDateSelect = (selectInfo: any) => {
        const [datePart] = selectInfo.startStr.split('T');
        setModalMode('create');
        setModalData({ event_date: datePart });
        setIsEventModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const ev = allEvents.find((ev: Event) => String(ev.id) === String(clickInfo.event.id));
        if (ev) {
            setViewEvent(ev);
            setViewOpen(true);
        }
    };

    const handleEventDrop = async (dropInfo: any) => {
        const { event } = dropInfo;
        const ev = allEvents.find((ev: Event) => String(ev.id) === String(event.id));
        if (!ev) return;
        const newDate = event.start?.toISOString().split('T')[0];
        const newTime = event.start?.toISOString().split('T')[1].substring(0, 5);
        try {
            await fetch(`/admin/events/${ev.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ event_date: newDate, event_time: newTime }),
            });
            await router.reload();
        } catch (e) {
            console.error('Failed to update event', e);
        }
    };

    // Render pagination UI
    const paginationUI = (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {(pageIndex - 1) * pageSize + 1} to {Math.min(pageIndex * pageSize, pagination.total)} of {pagination.total} items
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Show</span>
                    <select value={pageSize} onChange={handleSizeChange}
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1e40af]">
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={handlePrev} disabled={pageIndex === 1}>
                        Previous
                    </Button>
                    <div className="flex space-x-1">
                        {Array.from({ length: pagination.last_page }, (_, i) => (
                            <Button key={i + 1}
                                variant={pageIndex === i + 1 ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-8 w-8 p-0 transition-colors",
                                    pageIndex === i + 1
                                        ? "bg-[#1e40af] text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                                        : "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                                onClick={() => handlePageSelect(i + 1)}>
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={handleNext} disabled={pageIndex === pagination.last_page}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-[#020617]">
                <div className="flex w-full flex-col gap-6 px-6 py-6">

                    {/* ── Hero Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/20">
                                    <CalendarDays className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">School Events</h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        Manage and track all campus events, schedules, and attendance
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg self-start sm:self-auto"
                                onClick={() => {
                                    setModalMode('create');
                                    setModalData(null);
                                    setIsEventModalOpen(true);
                                }}
                            >
                                <PlusCircle className="h-5 w-5" />
                                Create New Event
                            </Button>
                        </div>
                    </div>

                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Events</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{pagination.total}</p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">All Campus Events</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Calendar className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Upcoming</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {events.filter((e: Event) => e.status === 'upcoming').length}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Scheduled</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                    style={{ width: pagination.total > 0 ? `${Math.round((events.filter((e: Event) => e.status === 'upcoming').length / pagination.total) * 100)}%` : '0%' }} />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ongoing</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {events.filter((e: Event) => e.status === 'ongoing').length}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        </span>
                                        Live Now
                                    </p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Activity className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                    style={{ width: pagination.total > 0 ? `${Math.round((events.filter((e: Event) => e.status === 'ongoing').length / pagination.total) * 100)}%` : '0%' }} />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-400/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Completed</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                        {events.filter((e: Event) => e.status === 'completed').length}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Finished</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-600 ring-1 ring-slate-300/50 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600/30 transition-transform duration-300 group-hover:scale-110">
                                    <LayoutDashboard className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full bg-gradient-to-r from-slate-300 to-slate-500 rounded-full"
                                    style={{ width: pagination.total > 0 ? `${Math.round((events.filter((e: Event) => e.status === 'completed').length / pagination.total) * 100)}%` : '0%' }} />
                            </div>
                        </div>
                    </div>

                    {/* ── Main View Container ── */}
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
                        
                        {/* Unified Header */}
                        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                    {viewMode === 'calendar' ? <CalendarDays className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        {viewMode === 'calendar' ? 'Activity Calendar' : 'Events List'}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {viewMode === 'calendar' ? 'Manage events by date (colored by program)' : `Total: ${pagination.total} events`}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Calendar Legend (Only visible in calendar view) */}
                                {viewMode === 'calendar' && (
                                    <div className="hidden lg:flex flex-wrap items-center gap-3 pr-2 border-r border-slate-200 dark:border-slate-700">
                                        {[
                                            { label: 'BSIT', color: 'bg-rose-700' },
                                            { label: 'BSED', color: 'bg-blue-600' },
                                            { label: 'BSBA', color: 'bg-yellow-500' },
                                            { label: 'CRIM', color: 'bg-indigo-600' },
                                            { label: 'BSHM', color: 'bg-emerald-600' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* View Toggle */}
                                <div className="inline-flex items-center rounded-xl bg-slate-200/50 p-1 dark:bg-slate-800/50 ring-1 ring-slate-900/5 dark:ring-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('calendar')}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                                            viewMode === 'calendar'
                                                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                                                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <CalendarDays className="h-4 w-4" />
                                        Calendar View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                                            viewMode === 'list'
                                                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                                                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        List View
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Activity Calendar View ── */}
                        {viewMode === 'calendar' && (
                            <div>
                                {/* Mobile Legend (Shows on small screens below header) */}
                                <div className="lg:hidden border-b border-slate-100 px-6 py-3 dark:border-slate-800 bg-white dark:bg-transparent flex justify-center">
                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        {[
                                            { label: 'BSIT', color: 'bg-rose-700' },
                                            { label: 'BSED', color: 'bg-blue-600' },
                                            { label: 'BSBA', color: 'bg-yellow-500' },
                                            { label: 'CRIM', color: 'bg-indigo-600' },
                                            { label: 'BSHM', color: 'bg-emerald-600' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="h-[620px] rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-[#020617]/50">
                                        <FullCalendarWrapper
                                            events={allEvents.map((e) => ({
                                                id: String(e.id),
                                                title: e.event_name,
                                                start: `${e.event_date.split('T')[0]}T${e.event_time}`,
                                                backgroundColor: getEventColor(e.courses),
                                                borderColor: getEventColor(e.courses),
                                            }))}
                                            onDateSelect={handleDateSelect}
                                            onEventClick={handleEventClick}
                                            onEventDrop={handleEventDrop}
                                            selectable={true}
                                            editable={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Events Table View ── */}
                        {viewMode === 'list' && (
                            <div>
                                <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end bg-white dark:bg-transparent">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                placeholder="Search events..."
                                                className="h-9 w-48 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white focus-visible:ring-blue-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                                            <SelectTrigger className="h-9 w-32 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={courseFilter || 'all'} onValueChange={(value) => setCourseFilter(value === 'all' ? '' : value)}>
                                            <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                <SelectValue placeholder="All Courses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Courses</SelectItem>
                                                {allCourses.map((course) => (
                                                    <SelectItem key={course} value={course}>{course}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={yearLevelFilter || 'all'} onValueChange={(value) => setYearLevelFilter(value === 'all' ? '' : value)}>
                                            <SelectTrigger className="h-9 w-36 rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                <SelectValue placeholder="All Year Levels" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Year Levels</SelectItem>
                                                {allYearLevels.map((year) => (
                                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                                                <th className="w-12 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">#</th>
                                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Event Info</th>
                                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Schedule</th>
                                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Location</th>
                                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Attendance</th>
                                                <th className="px-6 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Actions</th>
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
                                                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No events found</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayedEvents.map((event: Event, idx: number) => (
                                                    <tr key={event.id} className="group transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-blue-950/10">
                                                        <td className="px-6 py-4 text-xs font-bold tabular-nums text-slate-400 dark:text-slate-600">
                                                            {(pageIndex - 1) * pageSize + idx + 1}
                                                        </td>
                                                        <td className="px-6 py-4">{renderEventInfo(event)}</td>
                                                        <td className="px-6 py-4">{renderDateTime(event.event_date, event.event_time)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                                                <span className="max-w-[120px] truncate">{event.location}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{renderStatusBadge(event.status)}</td>
                                                        <td className="px-6 py-4">{renderAttendanceProgress(event)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    type="button" variant="ghost" size="icon"
                                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition-colors"
                                                                    onClick={() => { setAttendeesEvent(event); setAttendeesOpen(true); }}
                                                                    title="View Attendees"
                                                                >
                                                                    <Users className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button" variant="ghost" size="icon"
                                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                                                    onClick={() => { setViewEvent(event); setViewOpen(true); }}
                                                                    aria-label="View"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button" variant="ghost" size="icon"
                                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                                                    onClick={() => {
                                                                        setModalMode('edit');
                                                                        setModalData(event);
                                                                        setIsEventModalOpen(true);
                                                                    }}
                                                                    aria-label="Edit"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                {event.archived_at ? (
                                                                    <Button
                                                                        type="button" variant="ghost" size="icon"
                                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors"
                                                                        onClick={() => handleUnarchive(event)}
                                                                        title="Restore Event"
                                                                    >
                                                                        <ArchiveRestore className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        type="button" variant="ghost" size="icon"
                                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 transition-colors"
                                                                        onClick={() => handleArchive(event)}
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
                                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
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
                                        <span className="font-black text-slate-700 dark:text-slate-300">{pagination.total}</span>{' '}entries
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                                            onClick={handlePrev}
                                            disabled={pageIndex <= 1}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                        </button>
                                        {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                                            const num = i + 1;
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handlePageSelect(num)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg text-xs font-bold transition-all duration-200",
                                                        pageIndex === num
                                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                                                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                                            onClick={handleNext}
                                            disabled={pageIndex >= pagination.last_page}
                                        >
                                            Next <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div> {/* ── End Main View Container ── */}
                </div>
            </div>


            <CreateEventModal
                open={isEventModalOpen}
                onOpenChange={setIsEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSubmit={(payload: CreateEventPayload) => {
                    if (modalMode === 'create') {
                        Swal.fire({
                            title: 'Confirm Create Event',
                            text: 'Are you sure you want to create this event?',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#1e40af',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, create',
                        }).then((result) => {
                            if (result.isConfirmed) {
                                router.post(adminEvents(), {
                                    event_name: payload.eventName,
                                    description: payload.description,
                                    courses: payload.courses,
                                    year_levels: payload.yearLevels,
                                    location: payload.location,
                                    event_date: payload.eventDate,
                                    event_time: payload.eventTime,
                                    registration_end_time: payload.registrationEndTime,
                                    organizer: payload.organizer,
                                    geofence_enabled: payload.geofenceEnabled,
                                    geofence_latitude: payload.geofenceLatitude,
                                    geofence_longitude: payload.geofenceLongitude,
                                    geofence_radius_m: payload.geofenceRadiusM,
                                    attendance_type: payload.attendanceType,
                                    scanner_portal_active: true,
                                }, {
                                    onSuccess: () => {
                                        setIsEventModalOpen(false);
                                        Swal.fire({ icon: 'success', title: 'Created!', text: 'Event created successfully.', timer: 2000, showConfirmButton: false });
                                    },
                                    onError: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create event. Please check the form.' }),
                                });
                            }
                        });
                    } else if (modalMode === 'edit' && modalData?.id) {
                        Swal.fire({
                            title: 'Confirm Update Event',
                            text: 'Are you sure you want to update this event?',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#1e40af',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Yes, update',
                        }).then((result) => {
                            if (result.isConfirmed) {
                                router.put(`/admin/events/${modalData.id}`, {
                                    event_name: payload.eventName,
                                    description: payload.description,
                                    courses: payload.courses,
                                    year_levels: payload.yearLevels,
                                    location: payload.location,
                                    event_date: payload.eventDate,
                                    event_time: payload.eventTime,
                                    registration_end_time: payload.registrationEndTime,
                                    organizer: payload.organizer,
                                    geofence_enabled: payload.geofenceEnabled,
                                    geofence_latitude: payload.geofenceLatitude,
                                    geofence_longitude: payload.geofenceLongitude,
                                    geofence_radius_m: payload.geofenceRadiusM,
                                    attendance_type: payload.attendanceType,
                                    scanner_portal_active: modalData.scanner_portal_active ?? true,
                                }, {
                                    onSuccess: () => {
                                        setIsEventModalOpen(false);
                                        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Event updated successfully.', timer: 2000, showConfirmButton: false });
                                    },
                                    onError: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update event. Please check the form.' }),
                                });
                            }
                        });
                    }
                }}
                courses={courses}
                yearLevels={yearLevels}
                totalStudents={totalStudents}
                studentCountsByCourseYear={studentCountsByCourseYear}
                announcements={announcements}
                mode={modalMode}
                initialEvent={modalData}
            />

            <EventViewModal
                open={viewOpen}
                onOpenChange={setViewOpen}
                event={viewEvent as any}
                onEdit={(e) => {
                    setModalMode('edit');
                    setModalData(e);
                    setIsEventModalOpen(true);
                    setViewOpen(false);
                }}
            />

            <EventAttendeesModal
                open={attendeesOpen}
                onOpenChange={setAttendeesOpen}
                eventId={attendeesEvent ? String(attendeesEvent.id) : null}
                eventName={attendeesEvent?.event_name}
            />
        </AdminLayout>
    );
}