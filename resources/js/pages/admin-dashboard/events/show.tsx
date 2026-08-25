import { Head, Link, router, usePage } from '@inertiajs/react';

// Stepper utility (same as in create page)
const stepperClass = (step: number) =>
    `h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
        step === 3
            ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md'
            : step < 3
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-800 text-blue-200'
    }`;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Archive,
    ArchiveRestore,
    ArrowLeft,
    Calendar,
    Edit,
    MapPin,
    QrCode,
    Trash2,
} from 'lucide-react';
import Swal from 'sweetalert2';

import {
    adminDashboard,
    adminEvents,
    adminEventsArchive,
    adminEventsDestroy,
    adminEventsEdit,
    adminEventsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import { uniqueCourseStringsForDisplay } from './mergeCourseYearOptions';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Events',
        href: adminEvents(),
    },
    {
        title: 'Event Details',
        href: '#',
    },
];

interface Event {
    id: number;
    event_name: string;
    description: string;
    courses: string[];
    year_levels: string[];
    location: string;
    event_date: string;
    event_time: string;
    registration_end_time: string | null;
    organizer: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    qr_code: string | null;
    attendances: Array<{
        id: number;
        student_id: number;
        student: {
            name: string;
            email: string;
        };
    }>;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    geofence_enabled: boolean;
    geofence_latitude?: number | string | null;
    geofence_longitude?: number | string | null;
    geofence_radius_m?: number | null;
    scanner_portal_active: boolean;
}

export default function ShowEventPage() {
    const { props } = usePage();
    const event = props.event as Event;
    const errors = props.errors || {};

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

    const coursesForDisplay = uniqueCourseStringsForDisplay(
        event.courses ?? [],
    );

    const handleDelete = () => {
        Swal.fire({
            title: 'Delete Event?',
            text: `Are you sure you want to delete "${event.event_name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(adminEventsDestroy(event.id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted',
                            text: 'Event has been deleted successfully.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                        router.visit(adminEvents());
                    },
                    onError: (errors) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete event. Please try again.',
                        });
                        console.error('Delete error:', errors);
                    },
                });
            }
        });
    };

    const handleArchive = () => {
        Swal.fire({
            title: 'Archive Event?',
            text: `Are you sure you want to archive "${event.event_name}"? You can restore it later.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    adminEventsArchive(event.id),
                    {},
                    {
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Archived',
                                text: 'Event has been archived successfully.',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                            router.visit(adminEvents());
                        },
                        onError: (errors) => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to archive event. Please try again.',
                            });
                            console.error('Archive error:', errors);
                        },
                    },
                );
            }
        });
    };

    const handleUnarchive = () => {
        Swal.fire({
            title: 'Restore Event?',
            text: `Are you sure you want to restore "${event.event_name}" from the archive?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Restore',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(
                    adminEventsUnarchive(event.id),
                    {},
                    {
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Restored',
                                text: 'Event has been restored successfully.',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                            router.visit(adminEvents());
                        },
                        onError: (errors) => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to restore event. Please try again.',
                            });
                            console.error('Unarchive error:', errors);
                        },
                    },
                );
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={event.event_name} />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(adminEvents())}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {event.event_name}
                            </h1>
                            <p className="text-gray-600">
                                Event details and management
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Stepper Header */}
                        <div className="space-y-6 lg:col-span-2">
                            <div className="mx-auto flex max-w-xl items-center justify-between px-4">
                                <div className="relative flex flex-1 flex-col items-center">
                                    <div className={stepperClass(1)}>1</div>
                                    <span className="mt-2 text-[11px] font-medium tracking-wide text-white transition-colors">
                                        Basic Info
                                    </span>
                                </div>
                                <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                                    <div
                                        className="absolute inset-0 bg-white transition-all duration-300"
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                                <div className="relative flex flex-1 flex-col items-center">
                                    <div className={stepperClass(2)}>2</div>
                                    <span className="mt-2 text-[11px] font-medium tracking-wide text-white transition-colors">
                                        Location
                                    </span>
                                </div>
                                <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                                    <div
                                        className="absolute inset-0 bg-white transition-all duration-300"
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                                <div className="relative flex flex-1 flex-col items-center">
                                    <div className={stepperClass(3)}>3</div>
                                    <span className="mt-2 text-[11px] font-medium tracking-wide text-white transition-colors">
                                        Audience
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Event Details Card */}
                            <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                                <CardHeader>
                                    <CardTitle>Event Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Date & Time
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-900 dark:text-white">
                                                    {(() => {
                                                        const dateStr =
                                                            event.event_date;
                                                        if (
                                                            dateStr &&
                                                            dateStr.includes(
                                                                '-',
                                                            )
                                                        ) {
                                                            const parts =
                                                                dateStr
                                                                    .split(
                                                                        'T',
                                                                    )[0]
                                                                    .split('-');
                                                            return new Date(
                                                                Number(
                                                                    parts[0],
                                                                ),
                                                                Number(
                                                                    parts[1],
                                                                ) - 1,
                                                                Number(
                                                                    parts[2],
                                                                ),
                                                            ).toLocaleDateString();
                                                        }
                                                        return new Date(
                                                            dateStr,
                                                        ).toLocaleDateString();
                                                    })()}{' '}
                                                    at {event.event_time}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Location
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-900 dark:text-white">
                                                    {event.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Organizer
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                            {event.organizer}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Description
                                        </h4>
                                        <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                            {event.description ||
                                                'No description provided'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Status
                                            </h4>
                                            <div className="mt-1">
                                                <Badge
                                                    className={getStatusColor(
                                                        event.status,
                                                    )}
                                                >
                                                    {event.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Registration Ends
                                            </h4>
                                            <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                                {event.registration_end_time
                                                    ? new Date(
                                                          event.registration_end_time,
                                                      ).toLocaleString()
                                                    : 'No end time set'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Target Audience Card */}
                            <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                                <CardHeader>
                                    <CardTitle>Target Audience</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Courses
                                        </h4>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {coursesForDisplay.length === 0 ? (
                                                <span className="text-sm text-slate-500">
                                                    None
                                                </span>
                                            ) : (
                                                coursesForDisplay.map(
                                                    (course) => (
                                                        <span
                                                            key={course}
                                                            className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                                        >
                                                            {course}
                                                        </span>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Year Levels
                                        </h4>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {event.year_levels.map((year) => (
                                                <span
                                                    key={year}
                                                    className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                                                >
                                                    {year}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Settings Card */}
                            <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                                <CardHeader>
                                    <CardTitle>Event Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Geofence
                                            </h4>
                                            <div className="mt-1">
                                                <Badge
                                                    className={
                                                        event.geofence_enabled
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {event.geofence_enabled
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Scanner Portal
                                            </h4>
                                            <div className="mt-1">
                                                <Badge
                                                    className={
                                                        event.scanner_portal_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {event.scanner_portal_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Actions Card */}
                            <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Link
                                        href={adminEventsEdit(event.id)}
                                        className="w-full"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit Event
                                        </Button>
                                    </Link>

                                    {event.qr_code && (
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <QrCode className="h-4 w-4" />
                                            View QR Code
                                        </Button>
                                    )}

                                    {event.archived_at ? (
                                        <Button
                                            variant="outline"
                                            onClick={handleUnarchive}
                                            className="w-full gap-2"
                                        >
                                            <ArchiveRestore className="h-4 w-4" />
                                            Restore Event
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={handleArchive}
                                            className="w-full gap-2"
                                        >
                                            <Archive className="h-4 w-4" />
                                            Archive Event
                                        </Button>
                                    )}

                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        className="w-full gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Event
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Attendance Stats Card */}
                            <Card className="border-0 bg-white shadow-sm dark:bg-slate-800">
                                <CardHeader>
                                    <CardTitle>Attendance Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                Total Attendees
                                            </span>
                                            <span className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {event.attendances.length}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {event.attendances.length > 0
                                                ? `${Math.round((event.attendances.length / event.attendances.length) * 100)}% attendance rate`
                                                : 'No attendees yet'}
                                        </div>
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
