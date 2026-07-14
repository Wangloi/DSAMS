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
import { cn } from '@/lib/utils';
import { adminAttendanceLogs } from '@/routes';

type Attendee = {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
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
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredAttendees = attendees.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.program.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                    <div className="mt-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, student ID, or program..."
                            className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading attendees...</p>
                        </div>
                    ) : filteredAttendees.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Checked In</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredAttendees.map((attendee) => (
                                    <tr key={attendee.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{attendee.student_id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{attendee.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{attendee.program}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{attendee.checked_in_at}</td>
                                        <td className="px-6 py-4 text-right">{getStatusBadge(attendee.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No attendees found</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                                {searchQuery ? "No participants match your search criteria." : "No students have checked into this event yet."}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="link"
                                    className="mt-2 text-blue-600 dark:text-blue-400"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Clear search
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
