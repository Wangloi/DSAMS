import {
    adminDashboard,
    adminEvents,
    adminEventsArchive,
    adminEventsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import EventAttendeesModal from '../attendance/EventAttendeesModal';
import CreateEventModal, { CreateEventPayload } from './CreateEventModal';
import EventsCalendarView from './EventsCalendarView';
import EventsHeroHeader from './EventsHeroHeader';
import EventsStatsCards from './EventsStatsCards';
import EventsTableCard from './EventsTableCard';
import EventsViewToggleHeader from './EventsViewToggleHeader';
import EventViewModal from './EventViewModal';
import { Event, PageProps, getEventLifecycleStatus } from './types';

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

export default function AdminEventsIndex() {
    const { props } = usePage() as { props: PageProps };
    const {
        events = [],
        allEvents = [],
        pagination,
        filters,
        courses = [],
        yearLevels = [],
        totalStudents = 0,
        studentCountsByCourseYear = [],
        announcements = [],
    } = props;

    // Filters and pagination state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'active');
    const [courseFilter, setCourseFilter] = useState(filters.course || '');
    const [yearLevelFilter, setYearLevelFilter] = useState(
        filters.year_level || '',
    );
    const [pageIndex, setPageIndex] = useState(pagination?.current_page ?? 1);
    const [pageSize, setPageSize] = useState(pagination?.per_page ?? 10);

    // Modal & View Mode state
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [viewOpen, setViewOpen] = useState(false);
    const [viewEvent, setViewEvent] = useState<Event | null>(null);
    const [attendeesOpen, setAttendeesOpen] = useState(false);
    const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalData, setModalData] = useState<any>(null);

    // Derived course and year lists from events
    const allCourses = useMemo<string[]>(() => {
        const set = new Set<string>();
        events.forEach((event: Event) => {
            event.courses?.forEach((course: string) => set.add(course));
        });
        return Array.from(set);
    }, [events]);

    const allYearLevels = useMemo<string[]>(() => {
        const set = new Set<string>();
        events.forEach((event: Event) => {
            event.year_levels?.forEach((year: string) => set.add(year));
        });
        return Array.from(set);
    }, [events]);

    // Live search filter debouncer
    useEffect(() => {
        const hasChanges =
            searchTerm !== (filters.search || '') ||
            statusFilter !== (filters.status || '') ||
            courseFilter !== (filters.course || '') ||
            yearLevelFilter !== (filters.year_level || '');

        if (!hasChanges) return;

        const timeoutId = setTimeout(() => {
            router.get(
                adminEvents(),
                {
                    search: searchTerm,
                    status: statusFilter,
                    course: courseFilter,
                    year_level: yearLevelFilter,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, courseFilter, yearLevelFilter]);

    // Server-side pagination router navigation
    const goToPage = (page: number, updatedFilters?: Record<string, any>) => {
        setPageIndex(page);
        router.get(
            adminEvents(),
            {
                search: searchTerm,
                status: statusFilter,
                course: courseFilter,
                year_level: yearLevelFilter,
                page,
                per_page: pageSize,
                ...updatedFilters,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleStatusFilterChange = (val: string) => {
        setStatusFilter(val);
        setPageIndex(1);
        router.get(
            adminEvents(),
            {
                search: searchTerm,
                status: val,
                course: courseFilter,
                year_level: yearLevelFilter,
                page: 1,
                per_page: pageSize,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCourseFilterChange = (val: string) => {
        const newCourse = val === 'all' ? '' : val;
        setCourseFilter(newCourse);
        setPageIndex(1);
        router.get(
            adminEvents(),
            {
                search: searchTerm,
                status: statusFilter,
                course: newCourse,
                year_level: yearLevelFilter,
                page: 1,
                per_page: pageSize,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleYearLevelFilterChange = (val: string) => {
        const newYear = val === 'all' ? '' : val;
        setYearLevelFilter(newYear);
        setPageIndex(1);
        router.get(
            adminEvents(),
            {
                search: searchTerm,
                status: statusFilter,
                course: courseFilter,
                year_level: newYear,
                page: 1,
                per_page: pageSize,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Client-side display filtering for immediate responsiveness
    const filteredEvents = useMemo(() => {
        return events.filter((event: Event) => {
            const matchesSearch =
                !searchTerm ||
                event.event_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                event.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                event.location
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                event.organizer
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesStatus =
                !statusFilter || statusFilter === 'active'
                    ? getEventLifecycleStatus(event) !== 'completed'
                    : statusFilter === 'all'
                      ? true
                      : statusFilter === 'pending'
                        ? event.approval_status === 'pending'
                        : statusFilter === 'rejected'
                          ? event.approval_status === 'rejected'
                          : getEventLifecycleStatus(event) === statusFilter;
            const matchesCourse =
                !courseFilter || event.courses?.includes(courseFilter);
            const matchesYearLevel =
                !yearLevelFilter || event.year_levels?.includes(yearLevelFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCourse &&
                matchesYearLevel
            );
        });
    }, [events, searchTerm, statusFilter, courseFilter, yearLevelFilter]);

    // Schedule approvals / rejections
    const handleApproveSchedule = (eventId: number, eventName: string) => {
        Swal.fire({
            title: 'Approve Schedule Request?',
            text: `This will approve the activity plan and proposed schedule for "${eventName}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            confirmButtonText: 'Yes, Approve Schedule',
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(`/admin/events/${eventId}/approve-schedule`, {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Schedule Approved!',
                            text: 'The activity plan schedule is now official.',
                            icon: 'success',
                            confirmButtonColor: '#059669',
                        });
                    },
                });
            }
        });
    };

    const handleRejectSchedule = (eventId: number, eventName: string) => {
        Swal.fire({
            title: 'Reject Schedule Request?',
            text: `Provide reason for rejecting the activity plan for "${eventName}":`,
            input: 'textarea',
            inputPlaceholder: 'Enter reason for rejection (optional)...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Reject Schedule',
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(`/admin/events/${eventId}/reject-schedule`, {
                    rejection_reason: res.value || 'Schedule request rejected by administrator.'
                }, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Schedule Rejected',
                            text: 'The program head has been notified.',
                            icon: 'info',
                            confirmButtonColor: '#dc2626',
                        });
                    },
                });
            }
        });
    };

    // Archival / Restoration handlers
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
                router.put(
                    adminEventsArchive(event.id),
                    {},
                    {
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
                    },
                );
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
                router.put(
                    adminEventsUnarchive(event.id),
                    {},
                    {
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
                    },
                );
            }
        });
    };

    // Calendar handlers
    const handleDateSelect = (selectInfo: any) => {
        const [datePart] = selectInfo.startStr.split('T');
        setModalMode('create');
        setModalData({ event_date: datePart });
        setIsEventModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const ev = allEvents.find(
            (ev: Event) => String(ev.id) === String(clickInfo.event.id),
        );
        if (ev) {
            setViewEvent(ev);
            setViewOpen(true);
        }
    };

    const handleEventDrop = async (dropInfo: any) => {
        const { event } = dropInfo;
        const ev = allEvents.find(
            (ev: Event) => String(ev.id) === String(event.id),
        );
        if (!ev) return;
        const newDate = event.start?.toISOString().split('T')[0];
        const newTime = event.start
            ?.toISOString()
            .split('T')[1]
            .substring(0, 5);
        try {
            await fetch(`/admin/events/${ev.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    event_date: newDate,
                    event_time: newTime,
                }),
            });
            await router.reload();
        } catch (e) {
            console.error('Failed to update event', e);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-[#020617]">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* ── Hero Header ── */}
                    <EventsHeroHeader
                        onCreateEvent={() => {
                            setModalMode('create');
                            setModalData(null);
                            setIsEventModalOpen(true);
                        }}
                    />

                    {/* ── KPI Cards ── */}
                    <EventsStatsCards
                        allEvents={allEvents}
                        onFilterChange={handleStatusFilterChange}
                    />

                    {/* ── Main View Container ── */}
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
                        <EventsViewToggleHeader
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            totalEvents={pagination?.total ?? 0}
                        />

                        {/* ── Activity Calendar View ── */}
                        {viewMode === 'calendar' && (
                            <EventsCalendarView
                                allEvents={allEvents}
                                onDateSelect={handleDateSelect}
                                onEventClick={handleEventClick}
                                onEventDrop={handleEventDrop}
                            />
                        )}

                        {/* ── Events Table View ── */}
                        {viewMode === 'list' && (
                            <EventsTableCard
                                displayedEvents={filteredEvents}
                                pagination={
                                    pagination || {
                                        current_page: 1,
                                        last_page: 1,
                                        per_page: 10,
                                        total: 0,
                                    }
                                }
                                pageIndex={pageIndex}
                                pageSize={pageSize}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                statusFilter={statusFilter}
                                onStatusFilterChange={handleStatusFilterChange}
                                courseFilter={courseFilter}
                                onCourseFilterChange={handleCourseFilterChange}
                                yearLevelFilter={yearLevelFilter}
                                onYearLevelFilterChange={handleYearLevelFilterChange}
                                allCourses={allCourses}
                                allYearLevels={allYearLevels}
                                onApproveSchedule={handleApproveSchedule}
                                onRejectSchedule={handleRejectSchedule}
                                onOpenAttendees={(event) => {
                                    setAttendeesEvent(event);
                                    setAttendeesOpen(true);
                                }}
                                onViewEvent={(event) => {
                                    setViewEvent(event);
                                    setViewOpen(true);
                                }}
                                onEditEvent={(event) => {
                                    setModalMode('edit');
                                    setModalData(event);
                                    setIsEventModalOpen(true);
                                }}
                                onArchiveEvent={handleArchive}
                                onUnarchiveEvent={handleUnarchive}
                                onPrevPage={() => goToPage(Math.max(1, pageIndex - 1))}
                                onNextPage={() =>
                                    goToPage(
                                        Math.min(
                                            pagination?.last_page ?? 1,
                                            pageIndex + 1,
                                        ),
                                    )
                                }
                                onSelectPage={(page) => goToPage(page)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
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
                                const isGeofence =
                                    payload.attendanceType === 'dynamic_qr' ||
                                    Boolean(payload.geofenceEnabled);
                                const sanitizedPayload = {
                                    event_name: payload.eventName.trim(),
                                    organizer: payload.organizer.trim(),
                                    location: payload.location.trim(),
                                    event_date: payload.eventDate,
                                    event_time: payload.eventTime,
                                    registration_end_time:
                                        payload.registrationEndTime?.trim() ||
                                        null,
                                    description:
                                        payload.description?.trim() || null,
                                    courses: payload.courses || [],
                                    year_levels: payload.yearLevels || [],
                                    geofence_enabled: isGeofence,
                                    geofence_latitude:
                                        isGeofence && payload.geofenceLatitude
                                            ? Number(payload.geofenceLatitude)
                                            : null,
                                    geofence_longitude:
                                        isGeofence && payload.geofenceLongitude
                                            ? Number(payload.geofenceLongitude)
                                            : null,
                                    geofence_radius_m:
                                        isGeofence && payload.geofenceRadiusM
                                            ? Number(payload.geofenceRadiusM)
                                            : 50,
                                    attendance_type:
                                        payload.attendanceType || 'qr_scanner',
                                    scanner_student_ids:
                                        payload.scannerStudentIds || [],
                                    scanner_portal_active: true,
                                };

                                router.post(adminEvents(), sanitizedPayload, {
                                    onSuccess: () => {
                                        setIsEventModalOpen(false);
                                        Swal.fire({
                                            icon: 'success',
                                            title: 'Created!',
                                            text: 'Event created successfully.',
                                            timer: 2000,
                                            showConfirmButton: false,
                                        });
                                    },
                                    onError: (errs) => {
                                        console.error(
                                            'Event creation errors:',
                                            errs,
                                        );
                                        const msg =
                                            errs &&
                                            typeof errs === 'object' &&
                                            Object.keys(errs).length > 0
                                                ? Object.values(errs)
                                                      .flat()
                                                      .join('<br/>')
                                                : 'Failed to create event. Please check the form fields.';
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Validation Error',
                                            html: msg,
                                        });
                                    },
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
                                const isGeofence =
                                    payload.attendanceType === 'dynamic_qr' ||
                                    Boolean(payload.geofenceEnabled);
                                const sanitizedPayload = {
                                    event_name: payload.eventName.trim(),
                                    organizer: payload.organizer.trim(),
                                    location: payload.location.trim(),
                                    event_date: payload.eventDate,
                                    event_time: payload.eventTime,
                                    registration_end_time:
                                        payload.registrationEndTime?.trim() ||
                                        null,
                                    description:
                                        payload.description?.trim() || null,
                                    courses: payload.courses || [],
                                    year_levels: payload.yearLevels || [],
                                    geofence_enabled: isGeofence,
                                    geofence_latitude:
                                        isGeofence && payload.geofenceLatitude
                                            ? Number(payload.geofenceLatitude)
                                            : null,
                                    geofence_longitude:
                                        isGeofence && payload.geofenceLongitude
                                            ? Number(payload.geofenceLongitude)
                                            : null,
                                    geofence_radius_m:
                                        isGeofence && payload.geofenceRadiusM
                                            ? Number(payload.geofenceRadiusM)
                                            : 50,
                                    attendance_type:
                                        payload.attendanceType || 'qr_scanner',
                                    scanner_student_ids:
                                        payload.scannerStudentIds || [],
                                    scanner_portal_active:
                                        modalData.scanner_portal_active ?? true,
                                };

                                router.put(
                                    `/admin/events/${modalData.id}`,
                                    sanitizedPayload,
                                    {
                                        onSuccess: () => {
                                            setIsEventModalOpen(false);
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Updated!',
                                                text: 'Event updated successfully.',
                                                timer: 2000,
                                                showConfirmButton: false,
                                            });
                                        },
                                        onError: (errs) => {
                                            console.error(
                                                'Event update errors:',
                                                errs,
                                            );
                                            const msg =
                                              errs &&
                                              typeof errs === 'object' &&
                                              Object.keys(errs).length > 0
                                                  ? Object.values(errs)
                                                        .flat()
                                                        .join('<br/>')
                                                  : 'Failed to update event. Please check the form fields.';
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Validation Error',
                                                html: msg,
                                            });
                                        },
                                    },
                                );
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

            {/* View Event Modal */}
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

            {/* Attendees Modal */}
            <EventAttendeesModal
                open={attendeesOpen}
                onOpenChange={setAttendeesOpen}
                eventId={attendeesEvent ? String(attendeesEvent.id) : null}
                eventName={attendeesEvent?.event_name}
            />
        </AdminLayout>
    );
}
