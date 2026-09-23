import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatDate, formatTime } from '@/lib/utils';
import {
    Archive,
    ArchiveRestore,
    Edit,
    Eye,
    MapPin,
    Users,
} from 'lucide-react';

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

export default function EventsTable({
    events,
    onEdit,
    onArchive,
    onUnarchive,
    onView,
}: Props) {
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
                    <table className="w-full min-w-max border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Event Name
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Organizer
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Date & Time
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                    Attendees
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {events.map((event) => {
                                const initials = (event.event_name || 'EV')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <tr
                                        key={event.id}
                                        onClick={() => onView(event)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onView(event);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`View details for event ${event.event_name}`}
                                        className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/80 dark:hover:bg-slate-800 dark:hover:bg-blue-950/60 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50"
                                    >
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
                                            {formatDate(event.event_date)} at {formatTime(event.event_time)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                className={getStatusColor(
                                                    event.status,
                                                )}
                                            >
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
                                        <td
                                            className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        >
                                            <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                <SimpleTooltip content="View Event Details">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            onView(event)
                                                        }
                                                        className="h-8 w-8 rounded-md text-blue-600 transition-all duration-200 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                                        aria-label="View event"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </SimpleTooltip>

                                                <SimpleTooltip content="Edit Event">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            onEdit(event)
                                                        }
                                                        className="h-8 w-8 rounded-md text-amber-600 transition-all duration-200 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                        aria-label="Edit event"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </SimpleTooltip>

                                                {event.archived_at ? (
                                                    <SimpleTooltip content="Restore Event">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                onUnarchive(event)
                                                            }
                                                            className="h-8 w-8 rounded-md text-emerald-600 transition-all duration-200 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                            aria-label="Restore event"
                                                        >
                                                            <ArchiveRestore className="h-4 w-4" />
                                                        </Button>
                                                    </SimpleTooltip>
                                                ) : (
                                                    <SimpleTooltip content="Archive Event">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                onArchive(event)
                                                            }
                                                            className="h-8 w-8 rounded-md text-orange-600 transition-all duration-200 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                                                            aria-label="Archive event"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                    </SimpleTooltip>
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
