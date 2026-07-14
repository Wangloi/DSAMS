import { router } from '@inertiajs/react';
import {
    Activity,
    Archive,
    Eye,
    MapPin,
    Printer,
    QrCode,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { adminQrScanner } from '@/routes';

type AttendanceRow = {
    id: string;
    event: string;
    dateTime: string;
    organizer: string;
    totalAttendees: number;
    presentCount: number;
    /** All attendance records (present + late, etc.) */
    scannedCount?: number;
    eligibleStudentsCount?: number;
    expectedAttendees?: number;
    attendanceDenominator?: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
};

type DateRange = {
    start: string;
    end: string;
};

type Props = {
    attendanceEvents: AttendanceRow[];
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onEdit?: (event: AttendanceRow) => void;
    onDelete?: (eventId: string) => void;
    onOpenRealTimeMonitoring?: (eventId: string) => void;
    onPrintSummary?: () => void;
    onViewStudents?: (eventId: string) => void;
    hideScanner?: boolean;
    hideSummaryReport?: boolean;
    printUrlForEvent?: (eventId: string) => string;
    realTimeMonitoringActiveEventId?: string;
    /** When set, row is highlighted and parent may scope KPI stats to this event */
    selectedEventId?: string | null;
    /** Click the row (not action buttons) to select; same row again clears */
    onSelectEventRow?: (eventId: string | null) => void;
};

export default function AttendanceTable({
    attendanceEvents,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    onEdit,
    onDelete,
    onOpenRealTimeMonitoring,
    onViewStudents,
    hideScanner,
    hideSummaryReport,
    printUrlForEvent,
    realTimeMonitoringActiveEventId,
    selectedEventId,
    onSelectEventRow,
}: Props) {
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'upcoming':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Upcoming
                    </span>
                );
            case 'ongoing':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        </span>
                        Ongoing
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Completed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {status}
                    </span>
                );
        }
    };

    const attendanceFraction = (
        row: AttendanceRow,
    ): { numerator: number; denominator: number } => {
        const explicit = row.attendanceDenominator;
        const expected = row.expectedAttendees ?? 0;
        const eligible = row.eligibleStudentsCount ?? 0;
        const denominator =
            typeof explicit === 'number' && explicit > 0
                ? explicit
                : expected > 0
                  ? expected
                  : eligible > 0
                    ? eligible
                    : row.totalAttendees > 0
                      ? row.totalAttendees
                      : 0;

        if (row.status === 'upcoming') {
            return { numerator: 0, denominator };
        }

        const numerator = row.scannedCount ?? row.presentCount;

        return { numerator, denominator };
    };

    return (
        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                            Event List
                        </CardTitle>
                        {onSelectEventRow && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Click a row to show its statistics above; click
                                the same row again to clear.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <span>Date:</span>
                            <Input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) =>
                                    setDateRange({
                                        ...dateRange,
                                        start: e.target.value,
                                    })
                                }
                                className="h-9 w-[140px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <span>To:</span>
                            <Input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) =>
                                    setDateRange({
                                        ...dateRange,
                                        end: e.target.value,
                                    })
                                }
                                className="h-9 w-[140px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                placeholder="Search"
                                className="h-9 w-[200px] border border-slate-200 bg-white pl-9 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                    <table className="min-w-full border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Event Name
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Date & Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Attendance Rate
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {attendanceEvents.map((row) => {
                                const { numerator, denominator } =
                                    attendanceFraction(row);
                                const pct =
                                    denominator > 0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  (numerator / denominator) *
                                                      100,
                                              ),
                                          )
                                        : 0;

                                const rowId = String(row.id);
                                const isSelected =
                                    selectedEventId != null &&
                                    selectedEventId !== '' &&
                                    selectedEventId === rowId;
                                const initials = (row.organizer || 'EV')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => {
                                            if (!onSelectEventRow) {
                                                return;
                                            }
                                            onSelectEventRow(
                                                isSelected ? null : rowId,
                                            );
                                        }}
                                        className={cn(
                                            onSelectEventRow &&
                                                'cursor-pointer',
                                            isSelected
                                                ? 'bg-blue-50/70 ring-1 ring-blue-200 ring-inset dark:bg-blue-950/20 dark:ring-blue-800'
                                                : 'transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#1e40af] dark:text-white dark:hover:text-blue-400">
                                                        {row.event}
                                                    </span>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {row.organizer}
                                                        </span>
                                                        <span className="py-0.2 inline-flex items-center gap-0.5 rounded border border-slate-100 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            {row.location}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {row.dateTime}
                                                </span>
                                                <div>
                                                    {renderStatusBadge(
                                                        row.status,
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.status === 'upcoming' ? (
                                                <span className="inline-flex items-center pl-1 text-xs font-medium text-slate-400 italic dark:text-slate-500">
                                                    —
                                                </span>
                                            ) : (
                                                <div className="flex w-32 flex-col gap-1.5">
                                                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                                                        <span className="font-semibold tabular-nums">
                                                            {numerator} /{' '}
                                                            {denominator}
                                                        </span>
                                                        <span className="font-semibold text-[#1e40af] dark:text-blue-400">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-200/40 bg-slate-100 shadow-inner dark:border-slate-600/40 dark:bg-slate-700">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 ease-out"
                                                            style={{
                                                                width: `${pct}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                {onViewStudents && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onViewStudents(
                                                                row.id,
                                                            );
                                                        }}
                                                        title="View Students List"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onOpenRealTimeMonitoring && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenRealTimeMonitoring(
                                                                row.id,
                                                            );
                                                        }}
                                                        title="Real-Time Attendance Monitoring"
                                                    >
                                                        <Activity className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {!hideScanner && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.visit(
                                                                `${adminQrScanner()}?event=${row.id}`,
                                                            );
                                                        }}
                                                        title="Open Scanner Portal"
                                                    >
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-sky-50 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(
                                                            printUrlForEvent
                                                                ? printUrlForEvent(
                                                                      row.id,
                                                                  )
                                                                : `/admin/attendance/${row.id}/print`,
                                                            '_blank',
                                                        );
                                                    }}
                                                    title="Print Attendance Sheet"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                {onDelete && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(row.id);
                                                        }}
                                                        title="Archive Event"
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {attendanceEvents.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                                    >
                                        No events found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 px-2 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {attendanceEvents.length}
                        </span>{' '}
                        events
                    </div>
                    {!hideSummaryReport && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() =>
                                    window.open(
                                        '/admin/reports/print?type=attendance&range=monthly',
                                        '_blank',
                                    )
                                }
                            >
                                <Printer className="h-4 w-4" />
                                Summary Report
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
