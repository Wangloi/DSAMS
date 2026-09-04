import StudentLayout from '../components/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    studentAttendanceScannerPortal,
    studentDashboard,
    studentEvaluationShow,
} from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { StudentDashboardFooter } from '../components/StudentDashboardFooter';

interface Notification {
    id: string;
    type: string;
    eventId?: number;
    evaluationId?: number;
    title: string;
    subtitle?: string;
    timeAgo: string;
    is_read: boolean;
    created_at?: string;
}

interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface StudentNotificationsProps {
    paginatedNotifications: PaginatedNotifications;
}

export default function StudentNotifications({
    paginatedNotifications,
}: StudentNotificationsProps) {
    const [locallyRead, setLocallyRead] = useState<string[]>([]);
    const notifications = paginatedNotifications.data;

    const markAllAsRead = () => {
        axios
            .post('/notifications/mark-all-read')
            .then(() => {
                setLocallyRead(notifications.map((n) => n.id));
                router.reload({ only: ['paginatedNotifications'] });
            })
            .catch(console.error);
    };

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocallyRead((prev) => [...prev, id]);
        const n = notifications.find((notif) => notif.id === id);
        if (n) {
            n.is_read = true;
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

    const unreadCount = notifications.filter(
        (n) => !n.is_read && !locallyRead.includes(n.id),
    ).length;

    return (
        <StudentLayout>
            <Head title="Notifications" />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                Notifications
                            </h1>
                            {unreadCount > 0 && (
                                <Badge className="bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-blue-600">
                                    {unreadCount} unread
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Stay updated with events, disciplinary records, and
                            important announcements.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="flex w-fit items-center gap-2 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <Check className="h-4 w-4 text-emerald-600" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <Card className="mt-6 overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col">
                        {notifications.length > 0 ? (
                            notifications.map((n) => {
                                const isRead =
                                    n.is_read || locallyRead.includes(n.id);
                                const isEvent =
                                    n.type === 'event_reminder' ||
                                    n.type === 'event_upcoming' ||
                                    n.type === 'event_updated' ||
                                    n.type === 'event_announcement';
                                return (
                                    <div
                                        key={n.id}
                                        onClick={(e) =>
                                            !isRead && markSingleAsRead(n.id, e)
                                        }
                                        className={cn(
                                            'group relative flex flex-col justify-between gap-4 border-b border-slate-100 p-5 transition-colors sm:flex-row sm:items-center dark:border-slate-800',
                                            isRead
                                                ? 'cursor-default bg-slate-50/50 dark:bg-slate-900/50'
                                                : 'cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800',
                                        )}
                                    >
                                        {!isRead && (
                                            <div className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-blue-600" />
                                        )}

                                        <div className="flex flex-1 items-start gap-4">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                                    isRead
                                                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                                        : isEvent
                                                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                                                )}
                                            >
                                                {isEvent ? (
                                                    <Calendar className="h-5 w-5" />
                                                ) : (
                                                    <Bell className="h-5 w-5" />
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={cn(
                                                            'text-base transition-colors',
                                                            isRead
                                                                ? 'font-medium text-slate-700 dark:text-slate-300'
                                                                : 'font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400',
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {!isRead && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-5 border-0 bg-blue-100 px-1.5 text-[10px] text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-900"
                                                        >
                                                            NEW
                                                        </Badge>
                                                    )}
                                                </div>

                                                {n.subtitle && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {n.subtitle}
                                                    </p>
                                                )}

                                                <div className="mt-1 flex items-center gap-4">
                                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                                        {n.created_at
                                                            ? new Date(
                                                                  n.created_at,
                                                              ).toLocaleString(
                                                                  'en-US',
                                                                  {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                      year: 'numeric',
                                                                      hour: 'numeric',
                                                                      minute: '2-digit',
                                                                  },
                                                              )
                                                            : n.timeAgo}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons based on notification type */}
                                        <div className="flex shrink-0">
                                            {n.type ===
                                                'scanner_portal_access_granted' &&
                                                n.eventId && (
                                                    <Link
                                                        href={studentAttendanceScannerPortal(
                                                            n.eventId,
                                                        )}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase shadow-sm transition-colors hover:bg-blue-700"
                                                    >
                                                        Open Scanner
                                                    </Link>
                                                )}
                                            {n.type ===
                                                'evaluation_available' &&
                                                n.evaluationId && (
                                                    <Link
                                                        href={studentEvaluationShow(
                                                            n.evaluationId,
                                                        )}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase shadow-sm transition-colors hover:bg-blue-700"
                                                    >
                                                        Evaluate
                                                    </Link>
                                                )}
                                            {isEvent && (
                                                <Link
                                                    href={studentDashboard()}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase shadow-sm transition-colors hover:bg-blue-700"
                                                >
                                                    View Event
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    All caught up!
                                </h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                    You don't have any notifications at the
                                    moment. We'll let you know when there's
                                    something new.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {paginatedNotifications.last_page > 1 && (
                    <div className="flex items-center justify-between pb-10">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing page{' '}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {paginatedNotifications.current_page}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {paginatedNotifications.last_page}
                            </span>
                        </p>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="dark:border-slate-800 dark:bg-slate-900"
                                disabled={!paginatedNotifications.prev_page_url}
                                onClick={() =>
                                    paginatedNotifications.prev_page_url &&
                                    router.get(
                                        paginatedNotifications.prev_page_url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />{' '}
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="dark:border-slate-800 dark:bg-slate-900"
                                disabled={!paginatedNotifications.next_page_url}
                                onClick={() =>
                                    paginatedNotifications.next_page_url &&
                                    router.get(
                                        paginatedNotifications.next_page_url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Next <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

        </StudentLayout>
    );
}
