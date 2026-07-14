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
            return 'bg-blue-100 text-blue-800';
        case 'ongoing':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function EventsTable({ events, onEdit, onArchive, onUnarchive, onView }: Props) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Event Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Organizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Attendees
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {events.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="font-medium text-slate-900 dark:text-white">{event.event_name}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400">{event.organizer}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-900 dark:text-white">{event.location}</span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <Badge className={getStatusColor(event.status)}>
                                    {event.status}
                                </Badge>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-900 dark:text-white">
                                        {event.attendances.length}
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(event)}
                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        aria-label="View event"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(event)}
                                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        aria-label="Edit event"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>

                                    {event.archived_at ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onUnarchive(event)}
                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                            aria-label="Restore event"
                                        >
                                            <ArchiveRestore className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onArchive(event)}
                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                            aria-label="Archive event"
                                        >
                                            <Archive className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}