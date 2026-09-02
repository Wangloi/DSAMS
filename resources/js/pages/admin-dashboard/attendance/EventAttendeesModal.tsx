import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { adminAttendanceLogs } from '@/routes';
import { AlertCircle, CheckCircle2, Clock, Printer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
type Attendee = {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    checked_out_at?: string | null;
    time?: string;
    time_out?: string;
    status: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string | null;
    eventName?: string;
};

export default function EventAttendeesModal({
    open,
    onOpenChange,
    eventId,
    eventName,
}: Props) {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<string>('all');

    useEffect(() => {
        if (open && eventId) {
            fetchAttendees();
        }
    }, [open, eventId]);

    const fetchAttendees = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const res = await fetch(adminAttendanceLogs(eventId), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                const rows = (data.rows ?? []).map((r: any, idx: number) => ({
                    id: String(r.id ?? idx),
                    student_id: String(r.student_id ?? ''),
                    name: String(r.name ?? ''),
                    program: String(r.program ?? ''),
                    checked_in_at: String(r.checked_in_at ?? ''),
                    checked_out_at: r.checked_out_at
                        ? String(r.checked_out_at)
                        : null,
                    time: String(r.time ?? '—'),
                    time_out: String(r.time_out ?? '—'),
                    status: String(r.status ?? '').toLowerCase(),
                }));
                setAttendees(rows);
            }
        } catch (error) {
            console.error('Failed to fetch attendees:', error);
        } finally {
            setLoading(false);
        }
    };

    const uniquePrograms = Array.from(
        new Set(attendees.map((a) => a.program).filter(Boolean)),
    ).sort();

    const filteredAttendees = attendees.filter((a) => {
        return selectedProgram === 'all' || a.program === selectedProgram;
    });

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return (
                    <Badge className="gap-1 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Present
                    </Badge>
                );
            case 'late':
                return (
                    <Badge className="gap-1 border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100">
                        <Clock className="h-3 w-3" />
                        Late
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {status}
                    </Badge>
                );
        }
    };

    // Group attendees by program
    const groupedAttendees = filteredAttendees.reduce<
        Record<string, Attendee[]>
    >((acc, curr) => {
        const prog = curr.program || 'Unassigned';
        if (!acc[prog]) {
            acc[prog] = [];
        }
        acc[prog].push(curr);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full !max-w-6xl flex-col overflow-hidden border-slate-200 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <DialogHeader className="shrink-0 border-b bg-slate-50/50 p-6 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                    Attendees List
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                    {eventName || 'Event Participants'}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() =>
                                    window.open(
                                        `/admin/attendance/${eventId}/print`,
                                        '_blank',
                                    )
                                }
                            >
                                <Printer className="h-4 w-4" />
                                Print List
                            </Button>
                        </div>
                    </div>

                    <div className="relative mt-6 max-w-xs">
                        <Select
                            value={selectedProgram}
                            onValueChange={setSelectedProgram}
                        >
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                                <SelectValue placeholder="All Programs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Programs
                                </SelectItem>
                                {uniquePrograms.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-0 dark:bg-slate-950/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Loading attendees...
                            </p>
                        </div>
                    ) : Object.keys(groupedAttendees).length > 0 ? (
                        <div className="dark:divide-slate-850 divide-y divide-slate-100">
                            {Object.keys(groupedAttendees)
                                .sort()
                                .map((prog) => {
                                    const list = groupedAttendees[prog];
                                    return (
                                        <div key={prog} className="p-6">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                                                    {prog}
                                                </h4>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs font-semibold"
                                                >
                                                    {list.length}{' '}
                                                    {list.length === 1
                                                        ? 'Attendee'
                                                        : 'Attendees'}
                                                </Badge>
                                            </div>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                                <table className="w-full min-w-max border-collapse text-left">
                                                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                                                        <tr>
                                                            <th className="w-[20%] px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                                Student ID
                                                            </th>
                                                            <th className="w-[45%] px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                                Name
                                                            </th>
                                                            <th className="w-[12%] px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                                Time In
                                                            </th>
                                                            <th className="w-[13%] px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                                Time Out
                                                            </th>
                                                            <th className="w-[10%] px-4 py-3 text-right text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                                                        {list.map(
                                                            (attendee) => (
                                                                <tr
                                                                    key={
                                                                        attendee.id
                                                                    }
                                                                    className="dark:hover:bg-slate-850/40 transition-colors hover:bg-slate-50/60"
                                                                >
                                                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                        {
                                                                            attendee.student_id
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                                                                        {
                                                                            attendee.name
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                                        {
                                                                            attendee.time
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                                        {
                                                                            attendee.time_out
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {getStatusBadge(
                                                                            attendee.status,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                No attendees found
                            </h3>
                            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                                {selectedProgram !== 'all'
                                    ? 'No participants match the selected program.'
                                    : 'No students have checked into this event yet.'}
                            </p>
                            {selectedProgram !== 'all' && (
                                <Button
                                    variant="link"
                                    className="mt-2 font-semibold text-blue-600 dark:text-blue-400"
                                    onClick={() => setSelectedProgram('all')}
                                >
                                    Reset Program Filter
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between border-t bg-slate-50/50 p-4 dark:bg-slate-800/50">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total Attendees:{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                            {filteredAttendees.length}
                        </span>
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
