import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatLastNameFirst } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AttendanceHeader from '../admin-dashboard/attendance/AttendanceHeader';
import AttendanceStatsCards from '../admin-dashboard/attendance/AttendanceStatsCards';
import AttendanceTable from '../admin-dashboard/attendance/AttendanceTable';
import CourseStudentsDialog from '../admin-dashboard/attendance/CourseStudentsDialog';
import RealTimeMonitoringPanel from '../admin-dashboard/attendance/RealTimeMonitoringPanel';
import ProgramHeadLayout from './components/ProgramHeadLayout';

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
    event_time?: string;
    registration_end_time?: string;
};

type Props = {
    events?: AttendanceRow[];
    filters?: {
        search?: string;
    };
    program?: string;
    stats?: {
        totalEvents?: number;
        totalAttendees?: number;
        avgAttendanceRate?: number;
        totalLate?: number;
        totalStudents?: number;
    };
};

export default function Attendance({
    events: initialEvents = [],
    filters,
    program,
    stats,
}: Props) {
    const [events, setEvents] = useState<AttendanceRow[]>(initialEvents);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedListEventId, setSelectedListEventId] = useState<string>('');
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [viewingEventName, setViewingEventName] = useState('');
    const [attendees, setAttendees] = useState<any[]>([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);

    // Real-time monitoring state
    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitorEventId, setMonitorEventId] = useState<string>('');

    // Course students modal state
    const [showCourseStudentsModal, setShowCourseStudentsModal] =
        useState(false);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [courseStudentsRows, setCourseStudentsRows] = useState<any[]>([]);
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<
        string | null
    >(null);

    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents]);

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const datePart = (ev.dateTime || '').split(/\s+/)[0]?.trim() ?? '';
            const inRange =
                (!dateRange.start ||
                    (datePart !== '' && datePart >= dateRange.start)) &&
                (!dateRange.end ||
                    (datePart !== '' && datePart <= dateRange.end));
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !q ||
                ev.event.toLowerCase().includes(q) ||
                ev.organizer.toLowerCase().includes(q) ||
                ev.location.toLowerCase().includes(q);
            const matchesStatus = !statusFilter || ev.status === statusFilter;

            return inRange && matchesSearch && matchesStatus;
        });
    }, [dateRange.end, dateRange.start, events, searchQuery, statusFilter]);

    useEffect(() => {
        if (
            selectedListEventId &&
            !filteredEvents.some(
                (event) => String(event.id) === selectedListEventId,
            )
        ) {
            setSelectedListEventId('');
        }
    }, [filteredEvents, selectedListEventId]);

    const statsSourceEvents = useMemo(() => {
        if (selectedListEventId) {
            return filteredEvents.filter(
                (event) => String(event.id) === selectedListEventId,
            );
        }

        return filteredEvents.filter(
            (event) =>
                event.status === 'ongoing' || event.status === 'completed',
        );
    }, [filteredEvents, selectedListEventId]);

    const calculatedStats = useMemo(() => {
        const totalEvents = selectedListEventId
            ? statsSourceEvents.length > 0
                ? 1
                : 0
            : filteredEvents.length;
        const totalAttendees = statsSourceEvents.reduce((sum, event) => {
            return (
                sum +
                (event.status === 'upcoming'
                    ? 0
                    : (event.scannedCount ?? event.presentCount ?? 0))
            );
        }, 0);
        const totalLate = statsSourceEvents.reduce((sum, event) => {
            return (
                sum + (event.status === 'upcoming' ? 0 : (event.lateCount ?? 0))
            );
        }, 0);
        const avgAttendanceRate =
            statsSourceEvents.length > 0
                ? Math.round(
                      statsSourceEvents.reduce((sum, event) => {
                          const denominator =
                              event.attendanceDenominator &&
                              event.attendanceDenominator > 0
                                  ? event.attendanceDenominator
                                  : event.expectedAttendees &&
                                      event.expectedAttendees > 0
                                    ? event.expectedAttendees
                                    : event.eligibleStudentsCount &&
                                        event.eligibleStudentsCount > 0
                                      ? event.eligibleStudentsCount
                                      : event.totalAttendees;
                          const numerator =
                              event.status === 'upcoming'
                                  ? 0
                                  : (event.scannedCount ??
                                    event.presentCount ??
                                    0);

                          return (
                              sum +
                              (denominator > 0
                                  ? (numerator / denominator) * 100
                                  : 0)
                          );
                      }, 0) / statsSourceEvents.length,
                  )
                : 0;

        return { totalEvents, totalAttendees, totalLate, avgAttendanceRate };
    }, [filteredEvents.length, selectedListEventId, statsSourceEvents]);

    const selectedEvent = useMemo(() => {
        return events.find((event) => String(event.id) === monitorEventId);
    }, [events, monitorEventId]);

    const handleOpenRealTimeMonitoringForEvent = (eventId: string) => {
        setMonitorEventId(String(eventId));
        setShowRealTimeMonitoring(true);
    };

    const handleViewStudentsByCourse = async (courseName: string) => {
        if (!monitorEventId) return;

        setSelectedCourse(courseName);
        setShowCourseStudentsModal(true);
        setCourseStudentsLoading(true);
        setCourseStudentsError(null);

        try {
            const url =
                `/program-head/attendance/${monitorEventId}/students` +
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

            const data = await res.json();
            setCourseStudentsRows(Array.isArray(data.rows) ? data.rows : []);
        } catch (e: any) {
            setCourseStudentsRows([]);
            setCourseStudentsError(
                e?.message ? String(e.message) : 'Failed to load students',
            );
        } finally {
            setCourseStudentsLoading(false);
        }
    };

    const handleViewAttendees = async (eventId: string) => {
        const event = events.find((e) => String(e.id) === String(eventId));
        setViewingEventId(eventId);
        setViewingEventName(event?.event || 'Event Participants');
        setShowAttendeesModal(true);
        setAttendeesLoading(true);
        try {
            const res = await fetch(
                `/program-head/attendance/${eventId}/logs`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            if (res.ok) {
                const data = await res.json();
                setAttendees(data.rows ?? []);
            }
        } catch (error) {
            console.error('Failed to fetch attendees:', error);
        } finally {
            setAttendeesLoading(false);
        }
    };

    return (
        <ProgramHeadLayout>
            <Head title="Attendance Monitoring - Program Head" />

            <div className="min-h-screen bg-slate-50/50 dark:bg-[#020817]">
                <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    {showRealTimeMonitoring ? (
                        <RealTimeMonitoringPanel
                            monitoredEvent={selectedEvent}
                            onBack={() => setShowRealTimeMonitoring(false)}
                            hasBackendEvents={true}
                            handleViewStudentsByCourse={
                                handleViewStudentsByCourse
                            }
                            setEvents={setEvents}
                            userRole="program_head"
                        />
                    ) : (
                        <>
                            <AttendanceHeader />

                            <AttendanceStatsCards
                                totalEvents={
                                    calculatedStats.totalEvents ||
                                    stats?.totalEvents ||
                                    0
                                }
                                totalAttendees={
                                    calculatedStats.totalAttendees ||
                                    stats?.totalAttendees ||
                                    0
                                }
                                avgAttendanceRate={
                                    calculatedStats.avgAttendanceRate ||
                                    stats?.avgAttendanceRate ||
                                    0
                                }
                                totalLate={
                                    calculatedStats.totalLate ||
                                    stats?.totalLate ||
                                    0
                                }
                            />

                            <AttendanceTable
                                attendanceEvents={filteredEvents}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                onViewStudents={handleViewAttendees}
                                onOpenRealTimeMonitoring={
                                    handleOpenRealTimeMonitoringForEvent
                                }
                                printUrlForEvent={(eventId) =>
                                    `/program-head/attendance/${eventId}/print`
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

            <Dialog
                open={showAttendeesModal}
                onOpenChange={setShowAttendeesModal}
            >
                <DialogContent className="max-h-[85vh] w-[96vw] !max-w-4xl overflow-hidden border border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
                    <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                        <DialogTitle className="text-base font-bold text-slate-950 dark:text-white">
                            {viewingEventName} - Attendees List
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            List of student attendees check-in logs
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[calc(85vh-120px)] overflow-y-auto p-6">
                        {attendeesLoading ? (
                            <div className="py-8 text-center text-sm font-semibold text-slate-500">
                                Loading attendees...
                            </div>
                        ) : attendees.length === 0 ? (
                            <div className="py-8 text-center text-sm font-semibold text-slate-500">
                                No attendees check-in recorded.
                            </div>
                        ) : (
                            <div className="border-slate-150 overflow-hidden rounded-xl border bg-white dark:border-slate-800 dark:bg-transparent">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    Student
                                                </th>
                                                <th className="px-5 py-3">
                                                    Program
                                                </th>
                                                <th className="px-5 py-3">
                                                    Time
                                                </th>
                                                <th className="px-5 py-3 text-right">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {attendees.map((row, idx) => (
                                                <tr
                                                    key={row.id ?? idx}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {formatLastNameFirst(
                                                                row.name,
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                                            {row.student_id}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                                                        {row.program}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                                                        {row.time}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:bg-emerald-500/10 dark:text-emerald-400">
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </ProgramHeadLayout>
    );
}
