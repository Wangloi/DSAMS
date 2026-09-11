import {
    adminAttendance,
    adminAttendanceDestroy,
    adminAttendanceStudentsByCourse,
    adminDashboard,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import EventEditModal from '../events/EventEditModal';
import type { EventViewRecord } from '../events/EventViewModal';
import type { CourseYearOption } from '../events/mergeCourseYearOptions';
import AttendanceHeader from './AttendanceHeader';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceTable from './AttendanceTable';
import CourseStudentsDialog from './CourseStudentsDialog';
import EventAttendeesModal from './EventAttendeesModal';
import RealTimeMonitoringPanel from './RealTimeMonitoringPanel';
import type { AttendanceRow, StudentByCourseRow } from './types';

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

export default function AdminAttendancePage() {
    const page = usePage().props as Record<string, unknown>;

    if (page.error) {
        console.error('Backend Error:', page.error);
    }

    const incomingEvents = page.events as AttendanceRow[] | undefined;
    const hasBackendEvents =
        Array.isArray(incomingEvents) && incomingEvents.length > 0;

    const [events, setEvents] = useState<AttendanceRow[]>(
        hasBackendEvents && incomingEvents ? incomingEvents : [],
    );

    useEffect(() => {
        if (hasBackendEvents && incomingEvents) {
            setEvents(incomingEvents);
        }
    }, [hasBackendEvents, incomingEvents]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedListEventId, setSelectedListEventId] = useState<string>('');

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesStatus = !statusFilter
                ? true
                : ev.status === statusFilter;
            const q = searchQuery.trim().toLowerCase();
            const matches =
                !q ||
                (ev.event && ev.event.toLowerCase().includes(q)) ||
                (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
                (ev.location && ev.location.toLowerCase().includes(q));
            return matchesStatus && matches;
        });
    }, [events, statusFilter, searchQuery]);

    useEffect(() => {
        if (
            selectedListEventId &&
            !filteredEvents.some((e) => String(e.id) === selectedListEventId)
        ) {
            setSelectedListEventId('');
        }
    }, [filteredEvents, selectedListEventId]);

    const statsSourceEvents = useMemo(() => {
        if (selectedListEventId) {
            return filteredEvents.filter(
                (e) => String(e.id) === selectedListEventId,
            );
        }
        return filteredEvents.filter(
            (e) => e.status === 'ongoing' || e.status === 'completed',
        );
    }, [filteredEvents, selectedListEventId]);

    const calculatedStats = useMemo(() => {
        const list = statsSourceEvents;
        const totalEvents = selectedListEventId
            ? list.length > 0
                ? 1
                : 0
            : filteredEvents.length;

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
                                  : (event.scannedCount ??
                                    event.presentCount ??
                                    0);
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

    const courses =
        (page.courses as any[])?.length > 0
            ? (page.courses as any[])
            : [
                  'Computer Science',
                  'Information Technology',
                  'Business Administration',
                  'Accountancy',
                  'Psychology',
                  'Engineering',
              ];

    const yearLevels =
        (page.yearLevels as any[])?.length > 0
            ? (page.yearLevels as any[])
            : ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    // Real-time monitoring state
    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitorEventId, setMonitorEventId] = useState<string>('');

    // Course students modal state
    const [showCourseStudentsModal, setShowCourseStudentsModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [courseStudentsRows, setCourseStudentsRows] = useState<StudentByCourseRow[]>([]);
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<string | null>(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventViewRecord | null>(null);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [viewingEventName, setViewingEventName] = useState<string>('');

    const handleOpenRealTimeMonitoringForEvent = (
        eventId: string,
    ) => {
        const id = String(eventId);
        setMonitorEventId(id);
        setShowRealTimeMonitoring(true);
    };

    const handleViewStudentsByCourse = async (courseName: string) => {
        if (!monitorEventId) {
            Swal.fire({
                icon: 'error',
                title: 'Select event',
                text: 'Choose an active event to monitor.',
            });
            return;
        }

        setSelectedCourse(courseName);
        setShowCourseStudentsModal(true);
        setCourseStudentsLoading(true);
        setCourseStudentsError(null);

        try {
            const url =
                adminAttendanceStudentsByCourse(String(monitorEventId)) +
                `?course=${encodeURIComponent(courseName)}`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Failed to load students');
            }

            const data = (await res.json()) as {
                rows?: StudentByCourseRow[];
            };

            setCourseStudentsRows(
                Array.isArray(data.rows)
                    ? (data.rows as StudentByCourseRow[])
                    : [],
            );
        } catch (e: any) {
            setCourseStudentsRows([]);
            setCourseStudentsError(
                e?.message ? String(e.message) : 'Failed to load students',
            );
        } finally {
            setCourseStudentsLoading(false);
        }
    };

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
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setEditingEvent(data.props?.event || data.event || data);
                setShowEditModal(true);
            } else {
                throw new Error('Failed to fetch event details');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not load event details for editing.',
            });
        }
    };

    const handleViewAttendees = (eventId: string) => {
        const event = events.find((e) => String(e.id) === String(eventId));
        setViewingEventId(eventId);
        setViewingEventName(event?.event || 'Event Participants');
        setShowAttendeesModal(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        if (!eventId || eventId.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event ID is missing or invalid. Cannot delete event.',
            });
            return;
        }

        Swal.fire({
            title: 'Archive Event?',
            text: 'This event will be archived and hidden from the main list. You can restore it later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, archive it!',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(adminAttendanceDestroy(eventId), {
                    onSuccess: () => {
                        setEvents(
                            events.filter(
                                (event) => String(event.id) !== String(eventId),
                            ),
                        );
                        setSelectedListEventId((cur) =>
                            String(cur) === String(eventId) ? '' : cur,
                        );

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
            }
        });
    };

    const { totalEvents, totalAttendees, avgAttendanceRate, totalLate } =
        calculatedStats;

    const formattedCourseOptions: CourseYearOption[] = useMemo(
        () => courses.map((c) => ({ id: c, name: c, code: c })),
        [courses],
    );

    const formattedYearLevelOptions: CourseYearOption[] = useMemo(
        () => yearLevels.map((y) => ({ id: y, name: y, code: y })),
        [yearLevels],
    );

    const monitoredEvent = events.find((e) => String(e.id) === monitorEventId);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {showRealTimeMonitoring ? (
                        <RealTimeMonitoringPanel
                            monitoredEvent={monitoredEvent}
                            onBack={() => {
                                setShowRealTimeMonitoring(false);
                            }}
                            hasBackendEvents={hasBackendEvents}
                            handleViewStudentsByCourse={
                                handleViewStudentsByCourse
                            }
                            setEvents={setEvents}
                        />
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
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                                onViewStudents={handleViewAttendees}
                                onOpenRealTimeMonitoring={
                                    handleOpenRealTimeMonitoringForEvent
                                }
                                realTimeMonitoringActiveEventId={
                                    showRealTimeMonitoring
                                        ? monitorEventId
                                        : undefined
                                }
                                selectedEventId={selectedListEventId || null}
                                onSelectEventRow={(id) =>
                                    setSelectedListEventId(id ?? '')
                                }
                            />
                        </>
                    )}

                    <CourseStudentsDialog
                        open={showCourseStudentsModal}
                        onOpenChange={setShowCourseStudentsModal}
                        selectedCourse={selectedCourse}
                        rows={courseStudentsRows}
                        loading={courseStudentsLoading}
                        error={courseStudentsError}
                    />
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
        </AdminLayout>
    );
}
