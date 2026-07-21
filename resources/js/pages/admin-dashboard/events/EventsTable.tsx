import {
    Eye,
    Edit,
    Archive,
    ArchiveRestore,
    MapPin,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Event {
    id: number;
    event_name: string;
    organizer: string;
    location: string;
    event_date: string;
    event_time: string;
    description: string | null;
    status: 'upcoming' | 'ongoing' | 'completed';
    qr_code: string | null;
    attendances: Array<{
        id: number;
        student: {
            name: string;
            email: string;
        };
    }>;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    geofence_enabled: boolean;
    scanner_portal_active: boolean;
    courses: string[];
    year_levels: string[];
}

interface Props {
    events: Event[];
    onEdit: (event: Event) => void;
    onArchive: (event: Event) => void;
    onUnarchive: (event: Event) => void;
    onView: (event: Event) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'upcoming':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'ongoing':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'completed':
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
};

export default function EventsTable({ events, onEdit, onArchive, onUnarchive, onView }: Props) {
    return (
        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                            Events
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                    <table className="min-w-full border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Event Name
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Organizer
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">
                                    Attendees
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {events.map((event) => {
                                const initials = (event.event_name || 'EV')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <tr key={event.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                    {initials}
                                                </div>
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {event.event_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {event.organizer}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-900 dark:text-white">
                                                    {event.location}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(event.status)}>
                                                {event.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-900 dark:text-white">
                                                    {event.attendances.length}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onView(event)}
                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                    aria-label="View event"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(event)}
                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                                                    aria-label="Edit event"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                {event.archived_at ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onUnarchive(event)}
                                                        className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                                                        aria-label="Restore event"
                                                    >
                                                        <ArchiveRestore className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onArchive(event)}
                                                        className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                        aria-label="Archive event"
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
