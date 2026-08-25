import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getPhilippinesHolidayEvents } from '@/lib/philippines-holidays';
import {
    adminAnnouncement,
    adminAnnouncementArchive,
    adminAnnouncementShow,
    adminAnnouncementStore,
    adminAnnouncementUpdate,
    adminDashboard,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Eye,
    Megaphone,
    Pencil,
    Plus,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Announcement',
        href: adminAnnouncement(),
    },
];

type CalendarEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    organizer: string;
    duration: string;
    kind?: 'event' | 'holiday';
};

type AnnouncementRow = {
    id: string;
    title: string;
    category: 'Event' | 'Discipline' | 'Lost & Found' | 'General';
    status: 'Published' | 'Draft' | 'Scheduled' | 'Archived';
    date: string;
};

type AnnouncementStatusOption = AnnouncementRow['status'];

type PageProps = {
    announcements?: Array<AnnouncementRow & { views?: number }>;
    stats?: {
        totalAnnouncements: number;
        active: number;
        scheduled: number;
        archived: number;
    };
};

function formatBytes(bytes: number) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(
        units.length - 1,
        Math.floor(Math.log(bytes) / Math.log(1024)),
    );
    const value = bytes / Math.pow(1024, idx);
    const rounded = idx === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded} ${units[idx]}`;
}

type ActivityRow = {
    id: string;
    title: string;
    timeAgo: string;
};

const eventsSeed: CalendarEvent[] = [
    {
        id: '1',
        title: 'Semcon',
        date: '2025-06-09',
        time: '9:30 AM',
        organizer: 'DSA',
        duration: '1 day',
    },
];

const announcementsSeed: AnnouncementRow[] = [
    {
        id: '1',
        title: 'Leadership Seminar Reminder',
        category: 'Discipline',
        status: 'Published',
        date: 'Feb 10',
    },
    {
        id: '2',
        title: 'Dress Code Policy Update',
        category: 'Discipline',
        status: 'Published',
        date: 'Feb 18',
    },
    {
        id: '3',
        title: 'Lost Laptop Claim Notice',
        category: 'Lost & Found',
        status: 'Draft',
        date: 'Feb 19',
    },
    {
        id: '4',
        title: 'Good Moral Clearance Process',
        category: 'General',
        status: 'Scheduled',
        date: 'Feb 25',
    },
    {
        id: '5',
        title: 'Campus-wide Assembly',
        category: 'Event',
        status: 'Archived',
        date: 'Jan 20',
    },
];

const recentActivitySeed: ActivityRow[] = [
    {
        id: '1',
        title: 'New announcement “Leadership Seminar Reminder” has been published',
        timeAgo: '1 hour ago',
    },
    {
        id: '2',
        title: '45 students downloaded an attachment from Dress Code Policy Update',
        timeAgo: '2 hours ago',
    },
    {
        id: '3',
        title: '“Good Moral Clearance Process” is scheduled for publication',
        timeAgo: '1 day ago',
    },
];

function formatMonthLabel(date: Date) {
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function getMonthGrid(month: Date) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const startDay = first.getDay();
    const start = new Date(year, monthIndex, 1 - startDay);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        days.push(
            new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + i,
            ),
        );
    }
    return days;
}

export default function AdminAnnouncementPage() {
    const page = usePage<PageProps>();
    const announcementsFromServer = page.props.announcements ?? [];
    const statsFromServer = page.props.stats;
    const [activeCategory, setActiveCategory] = useState<
        'all' | AnnouncementRow['category']
    >('all');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'Published' | 'Draft' | 'Scheduled' | 'Archived'
    >('Published');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const [activeMonth, setActiveMonth] = useState(() => new Date());
    const [createForm, setCreateForm] = useState<{
        title: string;
        category: AnnouncementRow['category'];
        status: AnnouncementRow['status'];
        content: string;
        attachments: File[];
        schedule: 'none' | 'later_today' | 'tomorrow' | 'custom';
        eventDate?: string;
        eventTime?: string;
    }>({
        title: '',
        category: 'General',
        status: 'Published',
        content: '',
        attachments: [],
        schedule: 'none',
        eventDate: '',
        eventTime: '',
    });
    const [eventCreateOpen, setEventCreateOpen] = useState(false);
    const [eventForm, setEventForm] = useState<
        CalendarEvent & { date: string }
    >({
        id: '',
        title: '',
        date: '',
        time: '9:00 AM',
        organizer: 'DSA',
        duration: '1 day',
    });
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(
        null,
    );
    const [dayEventsOpen, setDayEventsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const activeYear = activeMonth.getFullYear();
    const todayKey = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, []);

    const monthDays = useMemo(() => getMonthGrid(activeMonth), [activeMonth]);

    const [events, setEvents] = useState<CalendarEvent[]>(() => eventsSeed);

    const eventByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of events) {
            map.set(ev.date, [...(map.get(ev.date) ?? []), ev]);
        }

        for (const hol of getPhilippinesHolidayEvents(activeYear)) {
            map.set(hol.date, [
                ...(map.get(hol.date) ?? []),
                {
                    id: hol.id,
                    title: hol.title,
                    date: hol.date,
                    time: hol.time,
                    organizer: 'Holiday',
                    duration: '1 day',
                    kind: 'holiday',
                },
            ]);
        }

        return map;
    }, [activeYear, events]);

    const announcements = useMemo(
        () =>
            announcementsFromServer.length > 0
                ? announcementsFromServer
                : announcementsSeed,
        [announcementsFromServer],
    );
    const recentActivity = useMemo(() => recentActivitySeed, []);

    const handleViewAnnouncement = async (id: string) => {
        try {
            const response = await fetch(adminAnnouncementShow(id));
            const data = await response.json();

            Swal.fire({
                title: data.title,
                html: `
                    <div class="text-left mt-4 text-slate-700">
                        <div class="mb-4">
                            <span class="inline-block px-2 py-1 rounded-md bg-slate-100 text-xs font-semibold mr-2">${data.category}</span>
                            <span class="text-xs text-slate-500">${new Date(data.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="prose prose-sm max-w-none">
                            ${data.content || '<p class="text-slate-400 italic">No content provided.</p>'}
                        </div>
                        ${
                            data.event_date
                                ? `
                        <div class="mt-4 pt-4 border-t border-slate-100 italic text-xs font-medium">
                            Scheduled Event: ${new Date(data.event_date).toLocaleDateString()} at ${data.event_time || 'N/A'}
                        </div>`
                                : ''
                        }
                    </div>
                `,
                confirmButtonColor: '#23509A',
                confirmButtonText: 'Close',
                customClass: {
                    container: 'font-sans',
                },
            });
        } catch (error) {
            Swal.fire(
                'Error',
                'Could not fetch announcement details.',
                'error',
            );
        }
    };

    const handleEditAnnouncement = async (id: string) => {
        try {
            const response = await fetch(adminAnnouncementShow(id));
            const data = await response.json();

            setCreateForm({
                title: data.title,
                category: data.category || 'General',
                status: data.status || 'Published',
                content: data.content || '',
                attachments: [],
                schedule: 'none',
                eventDate: data.event_date || '',
                eventTime: data.event_time || '',
            });
            setCurrentEditId(id);
            setCreateOpen(true);
        } catch (error) {
            Swal.fire(
                'Error',
                'Could not fetch announcement details.',
                'error',
            );
        }
    };

    const handleArchiveAnnouncement = (id: string) => {
        Swal.fire({
            title: 'Archive Announcement?',
            text: 'This will move it to the archive list.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#23509A',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, archive it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminAnnouncementArchive(id),
                    {
                        _method: 'PUT',
                    },
                    {
                        onSuccess: () => {
                            Swal.fire(
                                'Archived!',
                                'Announcement has been archived.',
                                'success',
                            );
                        },
                    },
                );
            }
        });
    };

    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    const filteredAnnouncements = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesCategory = (row: AnnouncementRow) => {
            if (activeCategory === 'all') return true;
            return row.category === activeCategory;
        };

        const matchesStatus = (row: AnnouncementRow) => {
            if (statusFilter === 'all') return true;
            return row.status === statusFilter;
        };

        const matchesSearch = (row: AnnouncementRow) => {
            if (!q) return true;
            const haystack = [row.title, row.category, row.status, row.date]
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return announcements.filter(
            (row) =>
                matchesCategory(row) &&
                matchesStatus(row) &&
                matchesSearch(row),
        );
    }, [activeCategory, announcements, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        if (statsFromServer) {
            return statsFromServer;
        }

        const totalAnnouncements = announcements.length;
        const active = announcements.filter(
            (a) => a.status === 'Published',
        ).length;
        const scheduled = announcements.filter(
            (a) => a.status === 'Scheduled',
        ).length;
        const archived = announcements.filter(
            (a) => a.status === 'Archived',
        ).length;
        return { totalAnnouncements, active, scheduled, archived };
    }, [announcements, announcementsFromServer, statsFromServer]);

    const pageSize = 5;
    const totalPages = Math.max(
        1,
        Math.ceil(filteredAnnouncements.length / pageSize),
    );
    const pagedAnnouncements = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredAnnouncements.slice(start, start + pageSize);
    }, [filteredAnnouncements, pageIndex, totalPages]);

    const closeCreate = () => {
        setCreateOpen(false);
        setCurrentEditId(null);
        setCreateForm({
            title: '',
            category: 'General',
            status: 'Published',
            content: '',
            attachments: [],
            schedule: 'none',
            eventDate: '',
            eventTime: '',
        });
    };

    const closeEventDialog = () => {
        setEventCreateOpen(false);
        setEventForm({
            id: '',
            title: '',
            date: '',
            time: '9:00 AM',
            organizer: 'DSA',
            duration: '1 day',
        });
    };

    const handleCreateEvent = () => {
        const title = eventForm.title.trim();
        if (!title || !eventForm.date) return;

        const now = new Date();
        const dateLabel = now
            .toLocaleString(undefined, { month: 'short', day: '2-digit' })
            .replace(',', '');

        const newRow: CalendarEvent = {
            id: String(Date.now()),
            title,
            date: eventForm.date,
            time: eventForm.time,
            organizer: eventForm.organizer,
            duration: eventForm.duration,
        };

        setEvents((prev) => [...prev, newRow]);
        setPageIndex(1);
        closeEventDialog();
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditingEvent(event);
        setEventForm(event);
        setEventCreateOpen(true);
    };

    const handleSaveEvent = () => {
        if (editingEvent) {
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === editingEvent.id ? { ...eventForm } : e,
                ),
            );
        } else {
            handleCreateEvent();
        }
        setEditingEvent(null);
        closeEventDialog();
    };

    const handleDeleteEvent = (eventId: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
    };

    const handleCreateAnnouncement = () => {
        const title = createForm.title.trim();
        if (!title) return;

        const method = currentEditId ? 'PUT' : 'POST';
        const url = currentEditId
            ? adminAnnouncementUpdate(currentEditId)
            : adminAnnouncementStore();

        router.post(
            url,
            {
                _method: method,
                title: createForm.title,
                content: createForm.content,
                category: createForm.category,
                status: createForm.status,
                event_date: createForm.eventDate || undefined,
                event_time: createForm.eventTime || undefined,
                target_audience: 'student',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    Swal.fire(
                        'Success',
                        `Announcement ${currentEditId ? 'updated' : 'created'} successfully.`,
                        'success',
                    );
                    closeCreate();
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text:
                            (errors as any)?.message ??
                            'Please check the form for errors.',
                    });
                },
            },
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcement" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                                    <Megaphone className="h-6 w-6 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <div className="text-lg font-semibold">
                                        Announcement Management
                                    </div>
                                    <div className="text-sm text-white/80">
                                        Manage announcements and engagement
                                    </div>
                                </div>
                            </div>
                            <Dialog
                                open={createOpen}
                                onOpenChange={(next) =>
                                    next ? setCreateOpen(true) : closeCreate()
                                }
                            >
                                <Button
                                    type="button"
                                    className="gap-2 bg-white/15 text-white transition-colors hover:bg-white/25"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Announcement
                                </Button>

                                <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
                                    <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-white">
                                                {currentEditId
                                                    ? 'Edit Announcement'
                                                    : 'Create Announcement'}
                                            </DialogTitle>
                                            <DialogDescription className="text-white/80">
                                                {currentEditId
                                                    ? 'Modify the details of this announcement.'
                                                    : 'Compose and publish a new announcement.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>

                                    <div className="max-h-[70vh] space-y-5 overflow-y-auto bg-white px-6 py-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="announcementTitle">
                                                Title{' '}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="announcementTitle"
                                                placeholder="Enter announcement title"
                                                value={createForm.title}
                                                onChange={(e) =>
                                                    setCreateForm((p) => ({
                                                        ...p,
                                                        title: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="announcementContent">
                                                Content
                                            </Label>
                                            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                                                <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2 text-slate-600">
                                                    {[
                                                        'B',
                                                        'I',
                                                        'U',
                                                        '•',
                                                        '1',
                                                        '🔗',
                                                        '🖼',
                                                        '≡',
                                                        '👤',
                                                        '+',
                                                    ].map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className="grid h-8 w-8 place-items-center rounded-md text-sm hover:bg-white"
                                                            aria-label={t}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    id="announcementContent"
                                                    value={createForm.content}
                                                    onChange={(e) =>
                                                        setCreateForm((p) => ({
                                                            ...p,
                                                            content:
                                                                e.target.value.slice(
                                                                    0,
                                                                    2000,
                                                                ),
                                                        }))
                                                    }
                                                    rows={7}
                                                    placeholder="Enter the announcement content..."
                                                    className="block w-full resize-none px-3 py-3 text-sm text-slate-800 outline-none"
                                                />
                                                <div className="flex justify-end border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                                    {
                                                        String(
                                                            createForm.content ??
                                                                '',
                                                        ).length
                                                    }{' '}
                                                    / 2,000
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>
                                                Attachments (optional)
                                            </Label>
                                            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
                                                <div className="text-center text-sm text-slate-600">
                                                    <div className="font-medium">
                                                        Drag &amp; drop files
                                                        here, or{' '}
                                                        <label className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700">
                                                            Browse
                                                            <input
                                                                type="file"
                                                                multiple
                                                                className="hidden"
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const files =
                                                                        Array.from(
                                                                            e
                                                                                .target
                                                                                .files ??
                                                                                [],
                                                                        );
                                                                    if (
                                                                        !files.length
                                                                    )
                                                                        return;
                                                                    setCreateForm(
                                                                        (
                                                                            p,
                                                                        ) => ({
                                                                            ...p,
                                                                            attachments:
                                                                                [
                                                                                    ...p.attachments,
                                                                                    ...files,
                                                                                ],
                                                                        }),
                                                                    );
                                                                    e.currentTarget.value =
                                                                        '';
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Supported file types:
                                                        PDF, DOCX, PNG, JPG. Max
                                                        size &le; 10MB
                                                    </div>
                                                </div>
                                            </div>

                                            {createForm.attachments.length ? (
                                                <div className="space-y-2">
                                                    {createForm.attachments.map(
                                                        (f, idx) => (
                                                            <div
                                                                key={`${f.name}-${idx}`}
                                                                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                                            >
                                                                <div className="truncate font-medium text-slate-700">
                                                                    {f.name}
                                                                </div>
                                                                <div className="ml-4 shrink-0 text-xs text-slate-500">
                                                                    {formatBytes(
                                                                        f.size,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label>
                                                    Category{' '}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </Label>
                                                <select
                                                    value={createForm.category}
                                                    onChange={(e) =>
                                                        setCreateForm((p) => ({
                                                            ...p,
                                                            category: e.target
                                                                .value as AnnouncementRow['category'],
                                                        }))
                                                    }
                                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-56"
                                                >
                                                    <option value="General">
                                                        Select Category
                                                    </option>
                                                    <option value="Event">
                                                        Event
                                                    </option>
                                                    <option value="Discipline">
                                                        Discipline
                                                    </option>
                                                    <option value="Lost & Found">
                                                        Lost &amp; Found
                                                    </option>
                                                    <option value="General">
                                                        General
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <select
                                                    value={createForm.status}
                                                    onChange={(e) =>
                                                        setCreateForm((p) => ({
                                                            ...p,
                                                            status: e.target
                                                                .value as AnnouncementStatusOption,
                                                        }))
                                                    }
                                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-52"
                                                >
                                                    <option value="Published">
                                                        Published
                                                    </option>
                                                    <option value="Draft">
                                                        Draft
                                                    </option>
                                                    <option value="Scheduled">
                                                        Scheduled
                                                    </option>
                                                    <option value="Archived">
                                                        Archived
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="eventDate">
                                                    Event Date
                                                </Label>
                                                <Input
                                                    id="eventDate"
                                                    type="date"
                                                    value={
                                                        createForm.eventDate ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((p) => ({
                                                            ...p,
                                                            eventDate:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="eventTime">
                                                    Event Time
                                                </Label>
                                                <Input
                                                    id="eventTime"
                                                    type="time"
                                                    value={
                                                        createForm.eventTime ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setCreateForm((p) => ({
                                                            ...p,
                                                            eventTime:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 px-8"
                                            onClick={closeCreate}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-10 bg-[#23509A] px-8 text-white transition-colors hover:bg-[#1e4a8a]"
                                            disabled={!createForm.title.trim()}
                                            onClick={handleCreateAnnouncement}
                                        >
                                            {currentEditId
                                                ? 'Save Changes'
                                                : 'Create Announcement'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                title: 'Total Announcements',
                                value: stats.totalAnnouncements,
                                change: '+6%',
                                accent: 'bg-blue-600',
                            },

                            {
                                title: 'Active',
                                value: stats.active,
                                change: '',
                                accent: 'bg-emerald-600',
                            },
                            {
                                title: 'Scheduled',
                                value: stats.scheduled,
                                change: '',
                                accent: 'bg-amber-500',
                            },
                            {
                                title: 'Archived',
                                value: stats.archived,
                                change: '',
                                accent: 'bg-rose-600',
                            },
                        ].map((kpi) => (
                            <Card
                                key={kpi.title}
                                className="overflow-hidden border border-slate-200 bg-white shadow-sm"
                            >
                                <CardContent className="relative py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-medium text-slate-600">
                                                {kpi.title}
                                            </div>
                                            <div className="mt-1 flex items-end gap-2">
                                                <div className="text-2xl leading-none font-semibold text-slate-900">
                                                    {kpi.value}
                                                </div>
                                                {kpi.change && (
                                                    <div className="text-[10px] font-semibold text-emerald-700">
                                                        {kpi.change}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
                                            <Megaphone className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className={`h-1 w-full ${kpi.accent}`} />
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-8">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold text-slate-800">
                                                Announcements
                                            </CardTitle>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Showing{' '}
                                                {filteredAnnouncements.length}{' '}
                                                results
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <select
                                                value={activeCategory}
                                                onChange={(e) => {
                                                    setActiveCategory(
                                                        e.target
                                                            .value as typeof activeCategory,
                                                    );
                                                    setPageIndex(1);
                                                }}
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-44"
                                            >
                                                <option value="all">All</option>
                                                <option value="Event">
                                                    Event
                                                </option>
                                                <option value="Discipline">
                                                    Discipline
                                                </option>
                                                <option value="Lost & Found">
                                                    Lost &amp; Found
                                                </option>
                                                <option value="General">
                                                    General
                                                </option>
                                            </select>

                                            <select
                                                value={statusFilter}
                                                onChange={(e) => {
                                                    setStatusFilter(
                                                        e.target
                                                            .value as typeof statusFilter,
                                                    );
                                                    setPageIndex(1);
                                                }}
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-40"
                                            >
                                                <option value="all">All</option>
                                                <option value="Published">
                                                    Published
                                                </option>
                                                <option value="Draft">
                                                    Draft
                                                </option>
                                                <option value="Scheduled">
                                                    Scheduled
                                                </option>
                                                <option value="Archived">
                                                    Archived
                                                </option>
                                            </select>

                                            <div className="relative w-full sm:w-64">
                                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(
                                                            e.target.value,
                                                        );
                                                        setPageIndex(1);
                                                    }}
                                                    placeholder="Search..."
                                                    className="h-10 border-slate-200 bg-white pl-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-100 text-slate-700">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">
                                                            Title
                                                        </th>
                                                        <th className="px-4 py-3 font-medium">
                                                            Category
                                                        </th>
                                                        <th className="px-4 py-3 font-medium">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-3 font-medium">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 font-medium">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {pagedAnnouncements.length ===
                                                    0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="px-4 py-8 text-center text-sm text-slate-500"
                                                            >
                                                                No announcements
                                                                found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        pagedAnnouncements.map(
                                                            (a) => (
                                                                <tr
                                                                    key={a.id}
                                                                    className="transition-colors hover:bg-slate-50"
                                                                >
                                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                                        {
                                                                            a.title
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-700">
                                                                        {
                                                                            a.category
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span
                                                                            className={
                                                                                a.status ===
                                                                                'Published'
                                                                                    ? 'rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white'
                                                                                    : a.status ===
                                                                                        'Draft'
                                                                                      ? 'rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white'
                                                                                      : a.status ===
                                                                                          'Scheduled'
                                                                                        ? 'rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white'
                                                                                        : 'rounded-md bg-slate-600 px-3 py-1 text-xs font-semibold text-white'
                                                                            }
                                                                        >
                                                                            {
                                                                                a.status
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-700">
                                                                        {a.date}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-8 w-8 border-slate-200 text-black transition-colors hover:bg-slate-100"
                                                                                aria-label="View"
                                                                                onClick={() =>
                                                                                    handleViewAnnouncement(
                                                                                        a.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-8 w-8 border-slate-200 text-black transition-colors hover:bg-slate-100"
                                                                                aria-label="Edit"
                                                                                onClick={() =>
                                                                                    handleEditAnnouncement(
                                                                                        a.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-8 w-8 border-slate-200 text-black transition-colors hover:bg-slate-100"
                                                                                aria-label="Archive"
                                                                                onClick={() =>
                                                                                    handleArchiveAnnouncement(
                                                                                        a.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Archive className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            Showing{' '}
                                            {filteredAnnouncements.length === 0
                                                ? 0
                                                : (Math.min(
                                                      Math.max(pageIndex, 1),
                                                      totalPages,
                                                  ) -
                                                      1) *
                                                      pageSize +
                                                  1}{' '}
                                            to{' '}
                                            {Math.min(
                                                Math.min(
                                                    Math.max(pageIndex, 1),
                                                    totalPages,
                                                ) * pageSize,
                                                filteredAnnouncements.length,
                                            )}{' '}
                                            of {filteredAnnouncements.length}{' '}
                                            entries
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                                onClick={() =>
                                                    setPageIndex((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={pageIndex <= 1}
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages })
                                                .slice(0, 5)
                                                .map((_, idx) => {
                                                    const num = idx + 1;
                                                    return (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() =>
                                                                setPageIndex(
                                                                    num,
                                                                )
                                                            }
                                                            className={
                                                                'rounded-md px-2 py-1 ' +
                                                                (pageIndex ===
                                                                num
                                                                    ? 'bg-[#23509A] text-white'
                                                                    : 'text-slate-600 hover:bg-slate-100')
                                                            }
                                                        >
                                                            {num}
                                                        </button>
                                                    );
                                                })}
                                            <button
                                                type="button"
                                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                                onClick={() =>
                                                    setPageIndex((p) =>
                                                        Math.min(
                                                            totalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    pageIndex >= totalPages
                                                }
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold text-slate-800">
                                            Announcement Calendar
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <button
                                                type="button"
                                                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                aria-label="Previous month"
                                                onClick={() =>
                                                    setActiveMonth(
                                                        (d) =>
                                                            new Date(
                                                                d.getFullYear(),
                                                                d.getMonth() -
                                                                    1,
                                                                1,
                                                            ),
                                                    )
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <div className="min-w-[140px] text-center text-sm font-semibold">
                                                {formatMonthLabel(activeMonth)}
                                            </div>
                                            <button
                                                type="button"
                                                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                aria-label="Next month"
                                                onClick={() =>
                                                    setActiveMonth(
                                                        (d) =>
                                                            new Date(
                                                                d.getFullYear(),
                                                                d.getMonth() +
                                                                    1,
                                                                1,
                                                            ),
                                                    )
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="grid grid-cols-7 gap-px bg-slate-200">
                                            {[
                                                'S',
                                                'M',
                                                'T',
                                                'W',
                                                'T',
                                                'F',
                                                'S',
                                            ].map((d, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700"
                                                >
                                                    {d}
                                                </div>
                                            ))}

                                            {monthDays.map((d) => {
                                                const inMonth =
                                                    d.getMonth() ===
                                                    activeMonth.getMonth();
                                                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                const dayEvents =
                                                    eventByDate.get(key) ?? [];
                                                const isToday =
                                                    key === todayKey;

                                                return (
                                                    <div
                                                        key={key}
                                                        className={
                                                            'group relative min-h-[54px] bg-white px-2 py-2 text-xs transition-colors duration-150 ' +
                                                            (inMonth
                                                                ? 'cursor-pointer hover:bg-slate-100'
                                                                : 'bg-slate-50/60 text-slate-400')
                                                        }
                                                        onClick={() => {
                                                            setDayEventsOpen(
                                                                true,
                                                            );
                                                            setSelectedDate(
                                                                key,
                                                            );
                                                        }}
                                                    >
                                                        {dayEvents.length >
                                                        0 ? (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div className="flex h-full w-full flex-col">
                                                                        <div
                                                                            className={
                                                                                'inline-flex h-6 w-fit min-w-6 items-center justify-center rounded-full px-2 ' +
                                                                                (isToday
                                                                                    ? 'bg-[#23509A] text-white'
                                                                                    : 'text-slate-700')
                                                                            }
                                                                        >
                                                                            {d.getDate()}
                                                                        </div>
                                                                        <div className="mt-1 h-1.5 w-6 rounded-full bg-[#23509A]/80 shadow-sm" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    side="top"
                                                                    className="max-w-[180px] border-slate-200 bg-slate-900 px-3 py-2 text-white shadow-xl"
                                                                >
                                                                    <div className="space-y-1.5">
                                                                        <div className="mb-1 border-b border-white/20 pb-1 text-[10px] font-bold tracking-wider uppercase opacity-60">
                                                                            Scheduled
                                                                            Events
                                                                        </div>
                                                                        {dayEvents.map(
                                                                            (
                                                                                ev,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        ev.id
                                                                                    }
                                                                                    className="line-clamp-2 text-xs leading-tight font-semibold"
                                                                                >
                                                                                    •{' '}
                                                                                    {
                                                                                        ev.title
                                                                                    }
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <div className="flex h-full w-full flex-col">
                                                                <div
                                                                    className={
                                                                        'inline-flex h-6 w-fit min-w-6 items-center justify-center rounded-full px-2 ' +
                                                                        (isToday
                                                                            ? 'bg-[#23509A] text-white'
                                                                            : 'text-slate-700')
                                                                    }
                                                                >
                                                                    {d.getDate()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 px-3 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#23509A] px-2 text-[10px] font-bold text-white uppercase">
                                                    {new Date().getDate()}
                                                </div>
                                                <span className="text-xs font-medium tracking-tight text-slate-600">
                                                    Today
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-6 rounded-full bg-[#23509A]" />
                                                <span className="text-xs font-medium tracking-tight text-slate-600">
                                                    Announcement / Event
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4 lg:col-span-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800">
                                        Recent Announcement Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {recentActivity.map((row) => (
                                            <div
                                                key={row.id}
                                                className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
                                            >
                                                <div className="text-sm text-slate-700">
                                                    {row.title}
                                                </div>
                                                <div className="text-xs whitespace-nowrap text-slate-500">
                                                    {row.timeAgo}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
