import {
    Users,
    Search,
    Download,
    Printer,
    X,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { adminAttendanceLogs } from '@/routes';
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

export default function EventAttendeesModal({ open, onOpenChange, eventId, eventName }: Props) {
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
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                const rows = (data.rows ?? []).map((r: any, idx: number) => ({
                    id: String(r.id ?? idx),
                    student_id: String(r.student_id ?? ''),
                    name: String(r.name ?? ''),
                    program: String(r.program ?? ''),
                    checked_in_at: String(r.checked_in_at ?? ''),
                    checked_out_at: r.checked_out_at ? String(r.checked_out_at) : null,
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

    const uniquePrograms = Array.from(new Set(attendees.map(a => a.program).filter(Boolean))).sort();

    const filteredAttendees = attendees.filter(a => {
        return selectedProgram === 'all' || a.program === selectedProgram;
    });

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Present
                    </Badge>
                );
            case 'late':
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 gap-1">
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
    const groupedAttendees = filteredAttendees.reduce<Record<string, Attendee[]>>((acc, curr) => {
        const prog = curr.program || 'Unassigned';
        if (!acc[prog]) {
            acc[prog] = [];
        }
        acc[prog].push(curr);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full !max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-2xl">
                <DialogHeader className="p-6 border-b bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                    Attendees List
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {eventName || 'Event Participants'}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => window.open(`/admin/attendance/${eventId}/print`, '_blank')}
                            >
                                <Printer className="h-4 w-4" />
                                Print List
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 relative max-w-xs">
                        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                            <SelectTrigger className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                                <SelectValue placeholder="All Programs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Programs</SelectItem>
                                {uniquePrograms.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-0 bg-slate-50/30 dark:bg-slate-950/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading attendees...</p>
                        </div>
                    ) : Object.keys(groupedAttendees).length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-850">
                            {Object.keys(groupedAttendees).sort().map((prog) => {
                                const list = groupedAttendees[prog];
                                return (
                                    <div key={prog} className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                                {prog}
                                            </h4>
                                            <Badge variant="secondary" className="font-semibold text-xs">
                                                {list.length} {list.length === 1 ? 'Attendee' : 'Attendees'}
                                            </Badge>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">Student ID</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[45%]">Name</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%]">Time In</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[13%]">Time Out</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-[10%]">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                                                    {list.map((attendee) => (
                                                        <tr key={attendee.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{attendee.student_id}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{attendee.name}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{attendee.time}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{attendee.time_out}</td>
                                                            <td className="px-4 py-3 text-right">{getStatusBadge(attendee.status)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No attendees found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                                {selectedProgram !== 'all' ? "No participants match the selected program." : "No students have checked into this event yet."}
                            </p>
                            {selectedProgram !== 'all' && (
                                <Button
                                    variant="link"
                                    className="mt-2 text-blue-600 dark:text-blue-400 font-semibold"
                                    onClick={() => setSelectedProgram('all')}
                                >
                                    Reset Program Filter
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Total Attendees: <span className="text-slate-900 dark:text-white font-bold">{filteredAttendees.length}</span>
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
