import { Head, router, usePage } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Activity, 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Filter, 
    Search, 
    Pause, 
    Play, 
    RefreshCw, 
    BarChart3,
    MoreHorizontal,
    ChevronRight,
    LayoutDashboard,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    adminDashboard,
    adminAttendance,
    adminAttendanceActivateScannerPortal,
    adminAttendanceLogs,
    adminAttendanceStudentsByCourse,
    adminAttendanceStore,
    adminAttendanceUpdate,
    adminAttendanceDestroy
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import EventEditModal from '../events/EventEditModal';
import type { EventViewRecord } from '../events/EventViewModal';
import type { CourseYearOption } from '../events/mergeCourseYearOptions';
import AttendanceHeader from './AttendanceHeader';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceTable from './AttendanceTable';
import EventAttendeesModal from './EventAttendeesModal';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Attendance',
        href: adminAttendance(),
    },
];

type AttendanceRow = {
    id: string;
    event: string;
    dateTime: string;
    organizer: string;
    totalAttendees: number;
    presentCount: number;
    scannedCount?: number;
    eligibleStudentsCount?: number;
    expectedAttendees?: number;
    attendanceDenominator?: number;
    lateCount?: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
    scannerPortalActive?: boolean;
};

type LiveLogRow = {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    time: string;
    status: string;
};


type ByCourseRow = {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
};

type StudentByCourseRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    scanned: boolean;
    status: string | null;
    checked_in_at: string | null;
};


export default function AdminAttendancePage() {
    const page = usePage().props as Record<string, unknown>;

    // Debug: Check if there's an error from backend
    if (page.error) {
        console.error('Backend Error:', page.error);
    }

    // Sample events data for testing
    const sampleEvents: AttendanceRow[] = [

        {
            id: '1',
            event: 'Annual Sports Festival 2026',
            dateTime: '2026-03-15 08:00 AM',
            organizer: 'Student Affairs Office',
            totalAttendees: 150,
            presentCount: 142,
            scannedCount: 142,
            lateCount: 8,
            eligibleStudentsCount: 150,
            expectedAttendees: 0,
            attendanceDenominator: 150,
            status: 'completed',
            location: 'Main Sports Complex',
            scannerPortalActive: false
        },
        {
            id: '2',
            event: 'Career Fair 2026',
            dateTime: '2026-03-20 09:00 AM',
            organizer: 'Career Services',
            totalAttendees: 200,
            presentCount: 185,
            scannedCount: 185,
            lateCount: 15,
            eligibleStudentsCount: 200,
            expectedAttendees: 0,
            attendanceDenominator: 200,
            status: 'completed',
            location: 'University Gymnasium',
            scannerPortalActive: false
        },
        {
            id: '3',
            event: 'Tech Innovation Summit',
            dateTime: '2026-03-25 01:00 PM',
            organizer: 'Computer Science Department',
            totalAttendees: 75,
            presentCount: 68,
            scannedCount: 68,
            lateCount: 7,
            eligibleStudentsCount: 75,
            expectedAttendees: 0,
            attendanceDenominator: 75,
            status: 'ongoing',
            location: 'Conference Hall A',
            scannerPortalActive: true
        },
        {
            id: '4',
            event: 'Spring Music Concert',
            dateTime: '2026-04-01 06:00 PM',
            organizer: 'Cultural Affairs',
            totalAttendees: 300,
            presentCount: 0,
            scannedCount: 0,
            lateCount: 0,
            eligibleStudentsCount: 300,
            expectedAttendees: 0,
            attendanceDenominator: 300,
            status: 'upcoming',
            location: 'Auditorium Main Hall',
            scannerPortalActive: false
        },
        {
            id: '5',
            event: 'Research Symposium 2026',
            dateTime: '2026-04-10 10:00 AM',
            organizer: 'Research Office',
            totalAttendees: 120,
            presentCount: 0,
            scannedCount: 0,
            lateCount: 0,
            eligibleStudentsCount: 120,
            expectedAttendees: 0,
            attendanceDenominator: 120,
            status: 'upcoming',
            location: 'Science Building Room 301',
            scannerPortalActive: false
        },
        {
            id: '6',
            event: 'Leadership Workshop',
            dateTime: '2026-04-15 02:00 PM',
            organizer: 'Student Development',
            totalAttendees: 50,
            presentCount: 45,
            scannedCount: 45,
            lateCount: 5,
            eligibleStudentsCount: 50,
            expectedAttendees: 0,
            attendanceDenominator: 50,
            status: 'ongoing',
            location: 'Training Room B',
            scannerPortalActive: true
        }
    ];

    // Use backend data if available, otherwise use sample data
    const [events, setEvents] = useState<AttendanceRow[]>(
        (page.events as AttendanceRow[] && (page.events as any[]).length > 0)
            ? page.events as AttendanceRow[]
            : sampleEvents
    );

    const incomingEvents = page.events as AttendanceRow[] | undefined;
    const hasBackendEvents = Array.isArray(incomingEvents) && incomingEvents.length > 0;

    useEffect(() => {
        if (hasBackendEvents && incomingEvents) {
            setEvents(incomingEvents);
        }
    }, [hasBackendEvents, incomingEvents]);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    /** Row selected in the event list drives KPI scope (empty = aggregate ongoing + completed in filtered list) */
    const [selectedListEventId, setSelectedListEventId] = useState<string>('');

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const datePart = (ev.dateTime || '').split(/\s+/)[0]?.trim() ?? '';
            const inRange =
                (!dateRange.start || (datePart !== '' && datePart >= dateRange.start)) &&
                (!dateRange.end || (datePart !== '' && datePart <= dateRange.end));
            const q = searchQuery.trim().toLowerCase();
            const matches =
                !q ||
                (ev.event && ev.event.toLowerCase().includes(q)) ||
                (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
                (ev.location && ev.location.toLowerCase().includes(q));
            return inRange && matches;
        });
    }, [events, dateRange.start, dateRange.end, searchQuery]);

    useEffect(() => {
        if (selectedListEventId && !filteredEvents.some((e) => String(e.id) === selectedListEventId)) {
            setSelectedListEventId('');
        }
    }, [filteredEvents, selectedListEventId]);

    const statsSourceEvents = useMemo(() => {
        if (selectedListEventId) {
            return filteredEvents.filter((e) => String(e.id) === selectedListEventId);
        }
        return filteredEvents.filter((e) => e.status === 'ongoing' || e.status === 'completed');
    }, [filteredEvents, selectedListEventId]);

    const calculatedStats = useMemo(() => {
        const list = statsSourceEvents;
        const totalEvents = selectedListEventId ? (list.length > 0 ? 1 : 0) : filteredEvents.length;

        const totalAttendees = list.reduce((sum, event) => {
            const scans =
                event.status === 'upcoming'
                    ? 0
                    : (event.scannedCount ?? event.presentCount ?? 0);
            return sum + scans;
        }, 0);

        const avgAttendanceRate =
            list.length > 0
                ? Math.round(
                    list.reduce((sum, event) => {
                        const explicit = event.attendanceDenominator;
                        const expected = event.expectedAttendees ?? 0;
                        const eligible = event.eligibleStudentsCount ?? 0;
                        const denom =
                            typeof explicit === 'number' && explicit > 0
                                ? explicit
                                : expected > 0
                                    ? expected
                                    : eligible > 0
                                        ? eligible
                                        : event.totalAttendees > 0
                                            ? event.totalAttendees
                                            : 0;
                        const num =
                            event.status === 'upcoming'
                                ? 0
                                : (event.scannedCount ?? event.presentCount ?? 0);
                        return sum + (denom > 0 ? (num / denom) * 100 : 0);
                    }, 0) / list.length,
                )
                : 0;

        const totalLate = list.reduce((sum, event) => {
            if (event.status === 'upcoming') {
                return sum;
            }
            return sum + (event.lateCount ?? 0);
        }, 0);

        return {
            totalEvents,
            totalAttendees,
            avgAttendanceRate,
            totalLate,
        };
    }, [statsSourceEvents, selectedListEventId, filteredEvents]);

    // Sample courses and year levels
    const courses = (page.courses as any[])?.length > 0 ? page.courses as any[] : [
        'Computer Science',
        'Information Technology',
        'Business Administration',
        'Accountancy',
        'Psychology',
        'Engineering'
    ];

    const yearLevels = (page.yearLevels as any[])?.length > 0 ? page.yearLevels as any[] : [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year'
    ];

    const totalStudents = (page.totalStudents as number) || 850;
    const studentCountsByCourseYear = (page.studentCountsByCourseYear as any[])?.length > 0
        ? page.studentCountsByCourseYear as any[]
        : [
            { course: 'Computer Science', year_level: '1st Year', count: 45 },
            { course: 'Computer Science', year_level: '2nd Year', count: 38 },
            { course: 'Information Technology', year_level: '1st Year', count: 52 },
            { course: 'Business Administration', year_level: '3rd Year', count: 41 },
            { course: 'Accountancy', year_level: '4th Year', count: 35 },
            { course: 'Psychology', year_level: '2nd Year', count: 48 },
            { course: 'Engineering', year_level: '3rd Year', count: 29 },
        ];

    // Real-time monitoring state (temporary client-side integration; wire backend later)
    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitoringEnabled, setMonitoringEnabled] = useState(false);
    const [scannerPortalActive, setScannerPortalActive] = useState(false);
    const [monitorEventId, setMonitorEventId] = useState<string>('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
    });

    // Sample by course data for testing
    const sampleByCourse: ByCourseRow[] = [
        { program: 'Computer Science', expected: 45, scanned: 38, percentage: 84 },
        { program: 'Information Technology', expected: 52, scanned: 47, percentage: 90 },
        { program: 'Business Administration', expected: 41, scanned: 35, percentage: 85 },
        { program: 'Accountancy', expected: 35, scanned: 32, percentage: 91 },
        { program: 'Psychology', expected: 48, scanned: 42, percentage: 88 },
        { program: 'Engineering', expected: 29, scanned: 25, percentage: 86 }
    ];

    const [byCourse, setByCourse] = useState<ByCourseRow[]>(sampleByCourse);

    const [liveStartIndex, setLiveStartIndex] = useState(1);
    const [liveEndIndex, setLiveEndIndex] = useState(0);



    const handleOpenRealTimeMonitoringForEvent = (eventId: string) => {
        const id = String(eventId);
        setMonitorEventId(id);
        setShowRealTimeMonitoring(true);
        setMonitoringEnabled(false);
        setScannerPortalActive(false);
        setLastUpdatedAt(null);
        setLiveCurrentPage(1);

        if (!hasBackendEvents) {
            setLiveRows(sampleLiveLogs);
            const present = sampleLiveLogs.filter((r) => r.status?.toLowerCase() === 'present').length;
            const late = sampleLiveLogs.filter((r) => r.status?.toLowerCase() === 'late').length;
            setLiveCounts({ total: sampleLiveLogs.length, present, late });
            setByCourse(sampleByCourse);
            return;
        }

        setLiveRows([]);
        setLiveCounts({ total: 0, present: 0, late: 0 });
        setByCourse([]);
    };

    const handleActivatePortalAndStartMonitoring = () => {
        if (!monitorEventId) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
            return;
        }

        if (hasBackendEvents) {
            router.post(
                adminAttendanceActivateScannerPortal(monitorEventId),
                {},
                { preserveScroll: true },
            );
        }

        setScannerPortalActive(true);
        setMonitoringEnabled(true);
        setLastUpdatedAt(new Date().toLocaleString());
        void refreshLogs();
    };

    // Course students dialog state (temporary client-side integration)
    const [showCourseStudentsModal, setShowCourseStudentsModal] = useState(false);

    // Live/checked-in timestamps for the selected event

    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const [courseStudentsRows, setCourseStudentsRows] = useState<StudentByCourseRow[]>([]);
    const [courseStudentsYearFilter, setCourseStudentsYearFilter] = useState<string>('all');
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<string | null>(null);

    const handleViewStudentsByCourse = async (courseName: string) => {
        if (!monitorEventId) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
            return;
        }

        setSelectedCourse(courseName);
        setShowCourseStudentsModal(true);
        setCourseStudentsYearFilter('all');

        setCourseStudentsLoading(true);
        setCourseStudentsError(null);

        try {
            const url = adminAttendanceStudentsByCourse(String(monitorEventId)) + `?course=${encodeURIComponent(courseName)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });


            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Failed to load students');
            }

            const data = (await res.json()) as {
                rows?: StudentByCourseRow[];
            };

            setCourseStudentsRows(Array.isArray(data.rows) ? (data.rows as StudentByCourseRow[]) : []);
        } catch (e: any) {
            setCourseStudentsRows([]);
            setCourseStudentsError(e?.message ? String(e.message) : 'Failed to load students');
        } finally {
            setCourseStudentsLoading(false);
        }
    };



    // Sample live logs data for testing
    const sampleLiveLogs: LiveLogRow[] = [
        {
            id: '1',
            student_id: '2024-0001',
            name: 'Juan Dela Cruz',
            program: 'Computer Science',
            checked_in_at: '2026-03-25 13:15:30',
            time: '01:15 PM',
            status: 'Present'
        },
        {
            id: '2',
            student_id: '2024-0002',
            name: 'Maria Santos',
            program: 'Information Technology',
            checked_in_at: '2026-03-25 13:18:45',
            time: '01:18 PM',
            status: 'Present'
        },
        {
            id: '3',
            student_id: '2024-0003',
            name: 'Jose Reyes',
            program: 'Business Administration',
            checked_in_at: '2026-03-25 13:22:10',
            time: '01:22 PM',
            status: 'Late'
        },
        {
            id: '4',
            student_id: '2024-0004',
            name: 'Ana Garcia',
            program: 'Accountancy',
            checked_in_at: '2026-03-25 13:25:55',
            time: '01:25 PM',
            status: 'Present'
        },
        {
            id: '5',
            student_id: '2024-0005',
            name: 'Carlos Rodriguez',
            program: 'Psychology',
            checked_in_at: '2026-03-25 13:28:20',
            time: '01:28 PM',
            status: 'Present'
        },
        {
            id: '6',
            student_id: '2024-0006',
            name: 'Sofia Martinez',
            program: 'Engineering',
            checked_in_at: '2026-03-25 13:31:15',
            time: '01:31 PM',
            status: 'Late'
        }
    ];


    const [liveRows, setLiveRows] = useState<LiveLogRow[]>(sampleLiveLogs);
    const [livePageSize, setLivePageSize] = useState(10);
    const [liveCurrentPage, setLiveCurrentPage] = useState(1);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventViewRecord | null>(null);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [viewingEventName, setViewingEventName] = useState<string>('');

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId || !hasBackendEvents) {
            return;
        }
        try {
            const res = await fetch(adminAttendanceLogs(monitorEventId), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                return;
            }
            const data = (await res.json()) as {
                rows?: Array<Record<string, unknown>>;
                counts?: { total?: number; present?: number; late?: number };
                byCourse?: ByCourseRow[];
                server_time?: string;
                scanner_portal_active?: boolean;
            };

            const rows: LiveLogRow[] = (data.rows ?? []).map((r, idx) => ({
                id: String(r.id ?? idx),
                student_id: String(r.student_id ?? ''),
                name: String(r.name ?? ''),
                program: String(r.program ?? ''),
                checked_in_at: String(r.checked_in_at ?? ''),

                time: String(r.time ?? ''),

                status: String(r.status ?? '').toLowerCase(),
            }));

            setLiveRows(rows);
            const totalScans = Number(data.counts?.total ?? rows.length);
            const presentN = Number(data.counts?.present ?? 0);
            const lateN = Number(data.counts?.late ?? 0);
            setLiveCounts({
                total: totalScans,
                present: presentN,
                late: lateN,
            });
            if (Array.isArray(data.byCourse) && data.byCourse.length > 0) {
                setByCourse(data.byCourse as ByCourseRow[]);
            }
            setLastUpdatedAt(data.server_time ?? new Date().toLocaleString());
            setScannerPortalActive(Boolean(data.scanner_portal_active));

            setEvents((prev) =>
                prev.map((ev) =>
                    String(ev.id) === String(monitorEventId)
                        ? {
                            ...ev,
                            scannedCount: totalScans,
                            presentCount: presentN,
                            lateCount: lateN,
                        }
                        : ev,
                ),
            );
        } catch {
            // polling: ignore transient errors
        }
    }, [monitorEventId, hasBackendEvents]);

    useEffect(() => {
        if (!showRealTimeMonitoring || !monitorEventId || !hasBackendEvents) {
            return undefined;
        }
        void refreshLogs();
        return undefined;
    }, [showRealTimeMonitoring, monitorEventId, hasBackendEvents, refreshLogs]);

    useEffect(() => {
        if (!monitoringEnabled || !monitorEventId || !hasBackendEvents) {
            return undefined;
        }
        const id = window.setInterval(() => void refreshLogs(), 2500);
        return () => window.clearInterval(id);
    }, [monitoringEnabled, monitorEventId, hasBackendEvents, refreshLogs]);

    useEffect(() => {
        if (!hasBackendEvents || showRealTimeMonitoring) {
            return undefined;
        }
        const intervalMs = 12000;
        const tick = window.setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            router.reload({ only: ['events', 'stats'] });
        }, intervalMs);
        return () => window.clearInterval(tick);
    }, [hasBackendEvents, showRealTimeMonitoring]);

    useEffect(() => {
        if (!hasBackendEvents || showRealTimeMonitoring) {
            return undefined;
        }
        const onVis = () => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['events', 'stats'] });
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [hasBackendEvents, showRealTimeMonitoring]);
    const liveTotalPages = useMemo(() => {
        return Math.max(1, Math.ceil(liveRows.length / Math.max(1, livePageSize)));
    }, [liveRows.length, livePageSize]);

    const paginatedLiveRows = useMemo(() => {
        const start = (liveCurrentPage - 1) * livePageSize;
        const end = start + livePageSize;
        return liveRows.slice(start, end);
    }, [liveRows, liveCurrentPage, livePageSize]);

    useEffect(() => {
        const start = (liveCurrentPage - 1) * livePageSize;
        const end = Math.min(start + livePageSize, liveRows.length);
        setLiveStartIndex(liveRows.length ? start + 1 : 0);
        setLiveEndIndex(end);
    }, [liveCurrentPage, livePageSize, liveRows.length]);

    const handleEditEvent = async (row: AttendanceRow) => {
        if (!hasBackendEvents) {
            Swal.fire({
                icon: 'info',
                title: 'Sample Data',
                text: 'Editing is disabled for sample data. Please use real event data.',
            });
            return;
        }

        try {
            const res = await fetch(`/admin/events/${row.id}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                setEditingEvent(data.event || data);
                setShowEditModal(true);
            } else {
                throw new Error('Failed to fetch event details');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load event details for editing.' });
        }
    };

    const handleViewAttendees = (eventId: string) => {
        const event = events.find(e => String(e.id) === String(eventId));
        setViewingEventId(eventId);
        setViewingEventName(event?.event || 'Event Participants');
        setShowAttendeesModal(true);
    };

    const handleDeleteEvent = (eventId: string) => {

        console.log('=== HANDLE DELETE CALLED ===');
        console.log('Deleting event with ID:', eventId);
        console.log('Delete URL:', adminAttendanceDestroy(eventId));
        console.log('Current events:', events.map(e => ({ id: e.id, event: e.event })));

        if (!eventId || eventId === 'undefined' || eventId === 'null' || eventId.trim() === '') {
            console.error('Event ID is missing or invalid!');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event ID is missing or invalid. Cannot delete event.',
            });
            return;
        }

        // Additional validation: check if the event exists in the current list
        const eventExists = events.some(event => String(event.id) === eventId);
        if (!eventExists) {
            console.error('Event not found in current list!');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event not found. Cannot delete event.',
            });
            return;
        }

        Swal.fire({
            title: 'Archive Event?',
            text: "This event will be archived and hidden from the main list. You can restore it later.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, archive it!'
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    console.log('About to make DELETE request to:', adminAttendanceDestroy(eventId));
                    // Perform the delete request using POST with _method=DELETE for better compatibility
                    router.delete(adminAttendanceDestroy(eventId), {
                        onSuccess: () => {
                            setEvents(events.filter((event) => String(event.id) !== String(eventId)));
                            setSelectedListEventId((cur) => (String(cur) === String(eventId) ? '' : cur));

                            Swal.fire({
                                icon: 'success',
                                title: 'Archived!',
                                text: 'Event has been archived successfully.',
                                showConfirmButton: false,
                                timer: 1500,
                            });
                        },
                        onError: (errors) => {
                            console.error('Delete request failed:', errors);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to archive event. Please try again.',
                            });
                        },
                    });
                } catch (error) {
                    console.error('Error during delete operation:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Invalid event ID or delete operation failed.',
                    });
                }
            }
        });
    };

    // Stats props for non-real-time view
    const { totalEvents, totalAttendees, avgAttendanceRate, totalLate } = calculatedStats;

    // Prepare options for EventEditModal
    const formattedCourseOptions: CourseYearOption[] = useMemo(() => 
        courses.map(c => ({ id: c, name: c, code: c })), [courses]);
    
    const formattedYearLevelOptions: CourseYearOption[] = useMemo(() => 
        yearLevels.map(y => ({ id: y, name: y, code: y })), [yearLevels]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">

                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {showRealTimeMonitoring ? (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                            {/* --- MODERN MONITORING HEADER --- */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm">
                                <div className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                                                onClick={() => {
                                                    setShowRealTimeMonitoring(false);
                                                    setMonitoringEnabled(false);
                                                }}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <LayoutDashboard className="h-5 w-5 text-blue-400" />
                                                    <h2 className="text-xl font-bold tracking-tight">Real-Time Command Center</h2>
                                                </div>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Activity className={`h-3 w-3 ${monitoringEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                                                        {monitoringEnabled ? 'System Live' : 'System Paused'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{events.find(e => String(e.id) === monitorEventId)?.event || 'Select an event'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="hidden items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5 border border-slate-700 sm:flex">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-300">Last Sync: {lastUpdatedAt ? lastUpdatedAt.split(',')[1]?.trim() || lastUpdatedAt : 'Never'}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                                                    scannerPortalActive 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    <Zap className={`h-2.5 w-2.5 ${scannerPortalActive ? 'animate-pulse' : ''}`} />
                                                    Portal {scannerPortalActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant={monitoringEnabled ? 'outline' : 'default'}
                                                className={`h-10 gap-2 rounded-xl px-5 font-semibold transition-all duration-300 ${
                                                    monitoringEnabled
                                                        ? 'border-slate-700 bg-transparent text-white hover:bg-white/10'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                                                }`}
                                                onClick={() => {
                                                    if (monitoringEnabled) {
                                                        setMonitoringEnabled(false);
                                                        return;
                                                    }
                                                    handleActivatePortalAndStartMonitoring();
                                                }}
                                            >
                                                {monitoringEnabled ? (
                                                    <>
                                                        <Pause className="h-4 w-4 fill-current" />
                                                        Pause Monitoring
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4 fill-current" />
                                                        Start Live Monitoring
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <select
                                                    value={monitorEventId}
                                                    onChange={(e) => setMonitorEventId(e.target.value)}
                                                    className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                                                >
                                                    <option value="" disabled>Select event to monitor...</option>
                                                    {events.map((ev) => (
                                                        <option key={String(ev.id)} value={String(ev.id)}>{ev.event}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl border-slate-200 dark:border-slate-800"
                                                onClick={() => void refreshLogs()}
                                                disabled={!monitorEventId}
                                            >
                                                <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${monitoringEnabled ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- DASHBOARD GRID LAYOUT --- */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                
                                {/* LEFT COLUMN: LIVE FEED (8/12) */}
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <CardTitle className="text-base font-bold">Live Activity Feed</CardTitle>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 border border-emerald-100 dark:border-emerald-800">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Real-Time Updates</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                                            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
                                                            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Program</th>
                                                            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Time In</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                        {paginatedLiveRows.length ? (
                                                            paginatedLiveRows.map((row, index) => (
                                                                <tr 
                                                                    key={row.id} 
                                                                    className={`group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                                        index === 0 && monitoringEnabled ? 'bg-blue-50/30 dark:bg-blue-900/10 animate-pulse' : ''
                                                                    }`}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                                                                {row.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name || 'Unknown Student'}</div>
                                                                                <div className="text-[11px] font-medium text-slate-500">{row.student_id || '---'}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.program || '---'}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                                                            row.status?.toLowerCase() === 'late'
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                                                                : row.status?.toLowerCase() === 'present'
                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                                                    : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                                        }`}>
                                                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                                                row.status?.toLowerCase() === 'late' ? 'bg-amber-500' : row.status?.toLowerCase() === 'present' ? 'bg-emerald-500' : 'bg-slate-400'
                                                                            }`} />
                                                                            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '---'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{row.time || '---'}</div>
                                                                        <div className="text-[10px] font-medium text-slate-400">Just now</div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                                                                            <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">No scans detected yet</p>
                                                                            <p className="mt-1 text-xs text-slate-500">Activity will appear here as students scan their IDs.</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* MODERN PAGINATION */}
                                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                        Showing {liveStartIndex}-{liveEndIndex} <span className="mx-1 text-slate-300">/</span> {liveRows.length} Total
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 rounded-lg px-2 text-xs font-bold"
                                                            onClick={() => setLiveCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={liveCurrentPage <= 1}
                                                        >
                                                            Prev
                                                        </Button>
                                                        <div className="flex h-8 items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-xs font-bold">
                                                            {liveCurrentPage} <span className="mx-1 text-slate-400">of</span> {liveTotalPages}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 rounded-lg px-2 text-xs font-bold"
                                                            onClick={() => setLiveCurrentPage(p => Math.min(liveTotalPages, p + 1))}
                                                            disabled={liveCurrentPage >= liveTotalPages}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* RIGHT COLUMN: STATS & BREAKDOWN (4/12) */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    
                                    {/* LIVE STATS CARDS */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <Card className="relative overflow-hidden border-none bg-blue-600 shadow-lg shadow-blue-600/20 dark:bg-[#0B192C]/50 dark:shadow-none">
                                            <div className="absolute right-[-10%] top-[-20%] h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Total Attendees</p>
                                                        <h3 className="mt-1 text-3xl font-black text-white">{liveCounts.total}</h3>
                                                    </div>
                                                    <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                                        <Users className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                                                        <div className="h-full bg-white transition-all duration-1000" style={{ width: '100%' }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-100">LIVE</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-[#0B192C]/50">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-1.5">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Present</p>
                                                    </div>
                                                    <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{liveCounts.present}</h3>
                                                    <p className="mt-1 text-[9px] font-bold text-emerald-600 uppercase">On Schedule</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-[#0B192C]/50">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 p-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Late</p>
                                                    </div>
                                                    <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{liveCounts.late}</h3>
                                                    <p className="mt-1 text-[9px] font-bold text-amber-600 uppercase">Behind Time</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* COURSE BREAKDOWN */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-[#0B192C]/50">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-transparent px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <CardTitle className="text-sm font-bold">Program Breakdown</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="max-h-[400px] overflow-y-auto p-2">
                                                {byCourse.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {byCourse.sort((a, b) => (b.expected - b.scanned) - (a.expected - a.scanned)).map((c) => (
                                                            <div 
                                                                key={c.program} 
                                                                className="group flex flex-col gap-2 rounded-xl border border-transparent p-3 transition-all hover:border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                                                onClick={() => handleViewStudentsByCourse(String(c.program))}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">{c.program}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{c.scanned}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400">/</span>
                                                                        <span className="text-[10px] font-bold text-slate-400">{c.expected}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                        <div 
                                                                            className={`h-full transition-all duration-1000 ${
                                                                                c.percentage >= 90 ? 'bg-emerald-500' : c.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                                            }`}
                                                                            style={{ width: `${Math.min(c.percentage, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 w-8 text-right">{c.percentage}%</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 py-10 opacity-50">
                                                        <BarChart3 className="h-8 w-8 text-slate-300" />
                                                        <p className="text-xs font-medium">No program data available</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-slate-100 dark:border-slate-800 p-4">
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full h-9 rounded-xl text-xs font-bold gap-2 border-slate-200 dark:border-slate-800"
                                                    onClick={() => monitorEventId && handleViewStudentsByCourse(byCourse[0]?.program || '')}
                                                    disabled={byCourse.length === 0}
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    View All Students
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* SYSTEM HEALTH / INFO */}
                                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-white dark:bg-slate-800 p-2 shadow-sm">
                                                <AlertCircle className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Monitoring Active</p>
                                                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                                                    Attendance data is being synced every 2.5 seconds. Ensure the scanner portal is active for incoming scans.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <AttendanceHeader />

                            <AttendanceStatsCards
                                totalEvents={totalEvents}
                                totalAttendees={totalAttendees}
                                avgAttendanceRate={avgAttendanceRate}
                                totalLate={totalLate}
                            />


                            <AttendanceTable
                                attendanceEvents={filteredEvents}
                                dateRange={dateRange}
                                setDateRange={setDateRange}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                                onViewStudents={handleViewAttendees}
                                onOpenRealTimeMonitoring={handleOpenRealTimeMonitoringForEvent}
                                realTimeMonitoringActiveEventId={showRealTimeMonitoring ? monitorEventId : undefined}
                                selectedEventId={selectedListEventId || null}
                                onSelectEventRow={(id) => setSelectedListEventId(id ?? '')}
                            />
                        </>
                    )}

                    <Dialog open={showCourseStudentsModal} onOpenChange={setShowCourseStudentsModal}>
                        <DialogContent className="w-[96vw] !max-w-6xl max-h-[85vh] overflow-hidden bg-white p-0">
                            <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <DialogTitle className="text-base font-semibold text-slate-800">
                                            {selectedCourse ? `Students - ${selectedCourse}` : 'Students'}
                                        </DialogTitle>
                                        <div className="mt-1 text-sm text-slate-600">All students in this course for the selected event.</div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                            <span className="h-2 w-2 rounded-full bg-[#23509A]" />
                                            {courseStudentsRows.length.toLocaleString()} Students
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                            {courseStudentsRows.filter((r) => r.scanned).length.toLocaleString()} Scanned
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-6">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm font-semibold text-slate-700">Year Level</div>
                                    <select
                                        value={courseStudentsYearFilter}
                                        onChange={(e) => setCourseStudentsYearFilter(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-[220px]"
                                    >
                                        <option value="all">All</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                {courseStudentsLoading ? (
                                    <div className="text-sm text-slate-600">Loading students...</div>
                                ) : courseStudentsError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                                        {courseStudentsError}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="px-5 py-3 font-medium">Student ID</th>
                                                        <th className="px-5 py-3 font-medium">Name</th>
                                                        <th className="px-5 py-3 font-medium">Year</th>
                                                        <th className="px-5 py-3 text-right font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {(courseStudentsYearFilter === 'all'
                                                        ? courseStudentsRows
                                                        : courseStudentsRows.filter((row) => {
                                                            const raw = String(row.year_level ?? '').toLowerCase();
                                                            return raw.includes(courseStudentsYearFilter);
                                                        })
                                                    ).length ? (
                                                        (courseStudentsYearFilter === 'all'
                                                            ? courseStudentsRows
                                                            : courseStudentsRows.filter((row) => {
                                                                const raw = String(row.year_level ?? '').toLowerCase();
                                                                return raw.includes(courseStudentsYearFilter);
                                                            })
                                                        ).map((row) => (
                                                            <tr key={row.id} className="hover:bg-slate-50">
                                                                <td className="px-5 py-3 font-semibold text-slate-800">{row.student_id || '—'}</td>
                                                                <td className="px-5 py-3 text-slate-700">{row.name || '—'}</td>
                                                                <td className="px-5 py-3 text-slate-700">{row.year_level || '—'}</td>
                                                                <td className="px-5 py-3 text-right">
                                                                    {row.scanned ? (
                                                                        <span
                                                                            className={
                                                                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ' +
                                                                                (row.status === 'late'
                                                                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200')
                                                                            }
                                                                        >
                                                                            {row.status || 'scanned'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                                                            not scanned
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-600">
                                                                No students found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Modals */}
            <EventAttendeesModal 
                open={showAttendeesModal} 
                onOpenChange={setShowAttendeesModal} 
                eventId={viewingEventId}
                eventName={viewingEventName}
            />

            <EventEditModal 
                open={showEditModal} 
                onOpenChange={setShowEditModal} 
                event={editingEvent}
                onSaved={() => router.reload({ only: ['events'] })}
                courseOptions={formattedCourseOptions}
                yearLevelOptions={formattedYearLevelOptions}
            />

            {/* Print functionality now uses backend window.open - no client-side template needed */}
        </AdminLayout>
    );
}
