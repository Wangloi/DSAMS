import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Head } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    Clock,
    Pause,
    Play,
    RefreshCw,
    Users,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AttendanceHeader from '../admin-dashboard/attendance/AttendanceHeader';
import AttendanceStatsCards from '../admin-dashboard/attendance/AttendanceStatsCards';
import AttendanceTable from '../admin-dashboard/attendance/AttendanceTable';
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

    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitoringEnabled, setMonitoringEnabled] = useState(true);
    const [monitorEventId, setMonitorEventId] = useState<string>('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [liveRows, setLiveRows] = useState<LiveLogRow[]>([]);
    const [byCourse, setByCourse] = useState<ByCourseRow[]>([]);
    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
    });

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

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId) {
            return;
        }

        const response = await fetch(
            `/program-head/attendance/${monitorEventId}/logs`,
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        );

        if (!response.ok) {
            return;
        }

        const data = (await response.json()) as {
            rows?: LiveLogRow[];
            counts?: { total?: number; present?: number; late?: number };
            byCourse?: ByCourseRow[];
            server_time?: string;
        };

        setLiveRows(Array.isArray(data.rows) ? data.rows : []);
        setByCourse(Array.isArray(data.byCourse) ? data.byCourse : []);
        setLiveCounts({
            total: Number(data.counts?.total ?? 0),
            present: Number(data.counts?.present ?? 0),
            late: Number(data.counts?.late ?? 0),
        });
        setLastUpdatedAt(data.server_time ?? new Date().toLocaleString());
    }, [monitorEventId]);

    useEffect(() => {
        if (!showRealTimeMonitoring || !monitoringEnabled || !monitorEventId) {
            return;
        }

        void refreshLogs();
        const interval = window.setInterval(() => {
            void refreshLogs();
        }, 2500);

        return () => window.clearInterval(interval);
    }, [
        monitorEventId,
        monitoringEnabled,
        refreshLogs,
        showRealTimeMonitoring,
    ]);

    const handleOpenRealTimeMonitoringForEvent = (eventId: string) => {
        setMonitorEventId(String(eventId));
        setShowRealTimeMonitoring(true);
        setMonitoringEnabled(true);
        setLiveRows([]);
        setByCourse([]);
        setLiveCounts({ total: 0, present: 0, late: 0 });
        setLastUpdatedAt(null);
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
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            setShowRealTimeMonitoring(false)
                                        }
                                        className="h-10 w-10 rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B192C]"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                Real-Time Attendance Monitoring
                                            </h1>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {selectedEvent?.event ??
                                                'Selected event'}
                                            {program ? ` - ${program}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setMonitoringEnabled(
                                                (value) => !value,
                                            )
                                        }
                                        className="h-10 gap-2 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-[#0B192C]"
                                    >
                                        {monitoringEnabled ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                        {monitoringEnabled ? 'Pause' : 'Resume'}
                                    </Button>
                                    <Button
                                        onClick={() => void refreshLogs()}
                                        className="h-10 gap-2 rounded-xl bg-[#0b2d66] text-xs font-bold text-white hover:bg-blue-700"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {[
                                    {
                                        label: 'Total Check-ins',
                                        value: liveCounts.total,
                                        icon: Users,
                                        color: 'text-blue-600',
                                    },
                                    {
                                        label: 'Present',
                                        value: liveCounts.present,
                                        icon: CheckCircle2,
                                        color: 'text-emerald-600',
                                    },
                                    {
                                        label: 'Late',
                                        value: liveCounts.late,
                                        icon: Clock,
                                        color: 'text-amber-600',
                                    },
                                ].map((item) => (
                                    <Card
                                        key={item.label}
                                        className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50"
                                    >
                                        <CardContent className="flex items-center justify-between p-5">
                                            <div>
                                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                                                    {item.value.toLocaleString()}
                                                </p>
                                            </div>
                                            <item.icon
                                                className={`h-8 w-8 ${item.color}`}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                                <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                                    <CardHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-emerald-600" />
                                                <CardTitle className="text-sm font-bold">
                                                    Live Check-ins
                                                </CardTitle>
                                            </div>
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                {lastUpdatedAt
                                                    ? `Updated ${lastUpdatedAt}`
                                                    : 'Waiting for sync'}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-[10px] font-bold tracking-widest text-slate-500 uppercase dark:bg-slate-800/50">
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
                                                    {liveRows.length > 0 ? (
                                                        liveRows.map((row) => (
                                                            <tr
                                                                key={row.id}
                                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                            >
                                                                <td className="px-5 py-4">
                                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                                        {row.name ||
                                                                            '-'}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {row.student_id ||
                                                                            '-'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                                    {row.program ||
                                                                        '-'}
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                                    {row.time ||
                                                                        '-'}
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 capitalize dark:bg-emerald-500/10 dark:text-emerald-300">
                                                                        {row.status ||
                                                                            'present'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="px-5 py-12 text-center text-sm text-slate-500"
                                                            >
                                                                No check-ins
                                                                have been
                                                                recorded for
                                                                this event yet.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-4">
                                    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                                        <CardHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                                <CardTitle className="text-sm font-bold">
                                                    Program Breakdown
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3">
                                            {byCourse.length > 0 ? (
                                                <div className="space-y-2">
                                                    {byCourse.map((row) => (
                                                        <div
                                                            key={row.program}
                                                            className="rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                        >
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {
                                                                        row.program
                                                                    }
                                                                </span>
                                                                <span className="font-black text-slate-600 dark:text-slate-300">
                                                                    {
                                                                        row.scanned
                                                                    }
                                                                    /
                                                                    {
                                                                        row.expected
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-3">
                                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                    <div
                                                                        className="h-full rounded-full bg-blue-600"
                                                                        style={{
                                                                            width: `${Math.min(Number(row.percentage), 100)}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="w-10 text-right text-[10px] font-black text-slate-500">
                                                                    {
                                                                        row.percentage
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center text-sm text-slate-500">
                                                    No program data available.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
                                            <p className="text-xs leading-relaxed text-slate-500">
                                                Monitoring refreshes every 2.5
                                                seconds while active. Use Print
                                                Attendance from the event list
                                                for the official sheet.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                hideScanner
                                hideSummaryReport
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
                                        <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
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
                                                            {row.name}
                                                        </p>
                                                        <p className="text-[10px] font-semibold text-slate-400">
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
