import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatLastNameFirst } from '@/lib/utils';
import { adminAttendanceLogs } from '@/routes';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    MapPin,
    Printer,
    Search,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import PrintAttendanceModal from './PrintAttendanceModal';

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
    eventDate?: string;
    eventLocation?: string;
    printUrl?: string;
    logsUrl?: string;
};

const getProgramBadgeClass = (program?: string | null): string => {
    const p = (program ?? '').toUpperCase();
    if (p.includes('BSIT') || p.includes('INFORMATION')) {
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50';
    }
    if (p.includes('BSBA') || p.includes('BUSINESS')) {
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
    }
    if (p.includes('BEED') || p.includes('BSED') || p.includes('EDUCATION')) {
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
    }
    if (p.includes('CRIM') || p.includes('CRIMINOLOGY')) {
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50';
    }
    if (p.includes('HM') || p.includes('HOSPITALITY')) {
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

const getInitials = (name?: string): string => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EventAttendeesModal({
    open,
    onOpenChange,
    eventId,
    eventName,
    eventDate,
    eventLocation,
    printUrl,
    logsUrl,
}: Props) {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    useEffect(() => {
        if (open && eventId) {
            fetchAttendees();
        } else if (!open) {
            setSearchQuery('');
            setSelectedProgram('all');
            setStatusFilter('all');
            setIsPrintModalOpen(false);
        }
    }, [open, eventId]);

    const fetchAttendees = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const url = logsUrl || adminAttendanceLogs(eventId);
            const res = await fetch(url, {
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
                    time: String(r.time ?? r.checked_in_at ?? '—'),
                    time_out: String(r.time_out ?? r.checked_out_at ?? '—'),
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

    const handlePrint = () => {
        if (!eventId) return;
        setIsPrintModalOpen(true);
    };

    const uniquePrograms = useMemo(() => {
        return Array.from(
            new Set(attendees.map((a) => a.program).filter(Boolean)),
        ).sort();
    }, [attendees]);

    const stats = useMemo(() => {
        const total = attendees.length;
        const present = attendees.filter((a) => a.status === 'present').length;
        const late = attendees.filter((a) => a.status === 'late').length;
        const absent = attendees.filter((a) => a.status === 'absent').length;
        return { total, present, late, absent };
    }, [attendees]);

    const filteredAttendees = useMemo(() => {
        return attendees.filter((a) => {
            const matchesProgram =
                selectedProgram === 'all' || a.program === selectedProgram;

            const matchesStatus =
                statusFilter === 'all' || a.status === statusFilter;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                a.name.toLowerCase().includes(q) ||
                a.student_id.toLowerCase().includes(q) ||
                a.program.toLowerCase().includes(q);

            return matchesProgram && matchesStatus && matchesSearch;
        });
    }, [attendees, selectedProgram, statusFilter, searchQuery]);

    // Group filtered attendees by program
    const groupedAttendees = useMemo(() => {
        return filteredAttendees.reduce<Record<string, Attendee[]>>(
            (acc, curr) => {
                const prog = curr.program || 'Unassigned Department';
                if (!acc[prog]) {
                    acc[prog] = [];
                }
                acc[prog].push(curr);
                return acc;
            },
            {},
        );
    }, [filteredAttendees]);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Present
                    </span>
                );
            case 'late':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Late
                    </span>
                );
            case 'absent':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Absent
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {status || 'Unknown'}
                    </span>
                );
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="2xl" className="flex max-h-[85vh] h-[85vh] w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 !p-0 !gap-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>
                        {eventName || 'Event Participants'} Attendees List
                    </DialogTitle>
                    <DialogDescription>
                        Live event attendance check-in logs and participant breakdown
                    </DialogDescription>
                </DialogHeader>

                <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                    {/* ── CLEAN MINIMALIST HEADER ── */}
                    <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#23509A] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                                            {eventName || 'Event Attendees List'}
                                        </h2>
                                        <span className="shrink-0 rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#23509A] uppercase tracking-wider dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                            {attendees.length}{' '}
                                            {attendees.length === 1
                                                ? 'Participant'
                                                : 'Participants'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        {eventDate && (
                                            <span className="inline-flex items-center gap-1 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-[#23509A] dark:text-blue-400" />
                                                {eventDate}
                                            </span>
                                        )}
                                        {eventLocation && (
                                            <span className="inline-flex items-center gap-1 font-medium">
                                                <MapPin className="h-3.5 w-3.5 text-[#23509A] dark:text-blue-400" />
                                                {eventLocation}
                                            </span>
                                        )}
                                        <span className="hidden sm:inline font-medium text-slate-400">• Attendance Logs</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <Button
                                    type="button"
                                    onClick={handlePrint}
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                                >
                                    <Printer className="h-3.5 w-3.5 text-[#23509A] dark:text-blue-400" />
                                    <span>Print Sheet</span>
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                    aria-label="Close dialog"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close dialog</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── STATS SUMMARY RIBBON ── */}
                    <div className="shrink-0 border-b border-slate-200/80 bg-white px-6 py-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/50">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#000D6A]/10 text-[#000D6A] dark:bg-blue-500/20 dark:text-[#8CE4FF]">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Expected / Total
                                    </span>
                                    <span className="text-base font-black text-slate-900 dark:text-white">
                                        {stats.total}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-emerald-100/80 bg-emerald-50/40 p-2.5 transition-colors hover:bg-emerald-50/70 dark:border-emerald-950/50 dark:bg-emerald-950/20">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Present (On-Time)
                                    </span>
                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                        {stats.present}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-amber-100/80 bg-amber-50/40 p-2.5 transition-colors hover:bg-amber-50/70 dark:border-amber-950/50 dark:bg-amber-950/20">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Late Check-ins
                                    </span>
                                    <span className="text-base font-black text-amber-600 dark:text-amber-400">
                                        {stats.late}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-rose-100/80 bg-rose-50/40 p-2.5 transition-colors hover:bg-rose-50/70 dark:border-rose-950/50 dark:bg-rose-950/20">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Absent / Unscanned
                                    </span>
                                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                                        {stats.absent}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TOOLBAR & FILTERS ── */}
                    <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200/80 bg-slate-50/80 px-6 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/50 sm:px-8">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="h-9 rounded-xl border-slate-200 bg-white pl-8.5 text-xs font-medium shadow-2xs focus-visible:ring-[#000D6A] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter Pills */}
                            <div role="radiogroup" aria-label="Status filter" className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                                {(
                                    [
                                        { key: 'all', label: 'All' },
                                        { key: 'present', label: 'Present' },
                                        { key: 'late', label: 'Late' },
                                        { key: 'absent', label: 'Absent' },
                                    ] as const
                                ).map((st) => (
                                    <button
                                        key={st.key}
                                        type="button"
                                        role="radio"
                                        aria-checked={statusFilter === st.key}
                                        onClick={() => setStatusFilter(st.key)}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#000D6A] focus-visible:outline-none ${
                                            statusFilter === st.key
                                                ? 'bg-[#000D6A] text-white shadow-xs dark:bg-blue-600'
                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>

                            {/* Program Dropdown Filter */}
                            <Select
                                value={selectedProgram}
                                onValueChange={setSelectedProgram}
                            >
                                <SelectTrigger aria-label="Filter by program" className="h-9 w-44 rounded-xl border-slate-200 bg-white text-xs font-medium shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Filter className="h-3 w-3 text-slate-400" />
                                        <SelectValue placeholder="All Programs" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Programs ({attendees.length})
                                    </SelectItem>
                                    {uniquePrograms.map((p) => {
                                        const count = attendees.filter(
                                            (a) => a.program === p,
                                        ).length;
                                        return (
                                            <SelectItem key={p} value={p}>
                                                {p} ({count})
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* ── ATTENDEES TABLE CONTENT ── */}
                    <div className="scrollbar-thin flex-1 overflow-y-auto p-6 sm:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#000D6A] border-t-transparent dark:border-blue-500"></div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Loading event attendees logs...
                                </p>
                            </div>
                        ) : Object.keys(groupedAttendees).length > 0 ? (
                            <div className="space-y-6">
                                {Object.keys(groupedAttendees)
                                    .sort()
                                    .map((prog) => {
                                        const list = groupedAttendees[prog];
                                        return (
                                            <div
                                                key={prog}
                                                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
                                            >
                                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className={`rounded-lg border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${getProgramBadgeClass(prog)}`}
                                                        >
                                                            {prog}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {list.length}{' '}
                                                        {list.length === 1
                                                            ? 'Student'
                                                            : 'Students'}
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/20">
                                                            <tr>
                                                                <th className="px-5 py-2.5">
                                                                    Student Name
                                                                </th>
                                                                <th className="px-4 py-2.5">
                                                                    Student ID
                                                                </th>
                                                                <th className="px-4 py-2.5">
                                                                    Time In
                                                                </th>
                                                                <th className="px-4 py-2.5">
                                                                    Time Out
                                                                </th>
                                                                <th className="px-5 py-2.5 text-right">
                                                                    Status
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                                            {list.map((attendee) => (
                                                                <tr
                                                                    key={attendee.id}
                                                                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                                                >
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-800">
                                                                                <AvatarFallback className="bg-[#000D6A]/10 text-[11px] font-black text-[#000D6A] dark:bg-blue-500/20 dark:text-[#8CE4FF]">
                                                                                    {getInitials(
                                                                                        attendee.name,
                                                                                    )}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                                {formatLastNameFirst(
                                                                                    attendee.name,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                            {attendee.student_id ||
                                                                                '—'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                                            {attendee.time ||
                                                                                '—'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                            {attendee.time_out ||
                                                                                '—'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-right">
                                                                        {getStatusBadge(
                                                                            attendee.status,
                                                                        )}
                                                                    </td>
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
                            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#000D6A]/5 text-[#000D6A] dark:bg-blue-500/10 dark:text-blue-400">
                                    <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    No attendees match criteria
                                </h3>
                                <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                                    {searchQuery ||
                                    selectedProgram !== 'all' ||
                                    statusFilter !== 'all'
                                        ? 'Try clearing the search query or adjusting your filters.'
                                        : 'No participants have checked into this event yet.'}
                                </p>
                                {(searchQuery ||
                                    selectedProgram !== 'all' ||
                                    statusFilter !== 'all') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 h-8 rounded-xl text-xs font-semibold"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedProgram('all');
                                            setStatusFilter('all');
                                        }}
                                    >
                                        Reset All Filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER BAR ── */}
                    <div className="flex shrink-0 items-center justify-between border-t border-slate-200/80 bg-white px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Showing{' '}
                            <strong className="font-bold text-slate-900 dark:text-white">
                                {filteredAttendees.length}
                            </strong>{' '}
                            of{' '}
                            <strong className="font-bold text-slate-900 dark:text-white">
                                {attendees.length}
                            </strong>{' '}
                            attendees
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="h-8.5 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Print Sheet</span>
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8.5 rounded-xl bg-[#000D6A] text-xs font-semibold text-white hover:bg-[#102A83] dark:bg-blue-600 dark:hover:bg-blue-700"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
            <PrintAttendanceModal
                open={isPrintModalOpen}
                onOpenChange={setIsPrintModalOpen}
                eventId={eventId}
                eventName={eventName}
                eventDate={eventDate}
                initialProgram={selectedProgram}
                courses={uniquePrograms}
                baseUrl={printUrl}
            />
        </>
    );
}
