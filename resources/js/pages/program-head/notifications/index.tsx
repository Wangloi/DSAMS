import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import ProgramHeadLayout from '../components/ProgramHeadLayout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Program Head Dashboard',
        href: '/program-head-dashboard',
    },
    {
        title: 'Notifications',
        href: '/program-head/notifications',
    },
];

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
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

interface Props {
    paginatedNotifications: PaginatedNotifications;
}

export default function ProgramHeadNotifications({ paginatedNotifications }: Props) {
    const [locallyRead, setLocallyRead] = useState<string[]>([]);

    const notifications = paginatedNotifications.data;

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('a') ||
            (e.target as HTMLElement).closest('button')
        )
            return;

        const n = notifications.find((notif) => notif.id === id);
        if (n && !n.is_read && !locallyRead.includes(id)) {
            setLocallyRead((prev) => [...prev, id]);
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

    const markAllAsRead = () => {
        router.post(
            '/notifications/mark-all-read',
            {},
            { preserveScroll: true },
        );
    };

    const getActionHref = (n: Notification) => {
        if (
            n.type === 'activity_plan_submitted_admin' ||
            n.type === 'activity_plan_status_updated'
        ) {
            return '/program-head/calendar-events';
        }
        if (
            n.type === 'admission_slip_requested' ||
            n.type === 'admission_slip_status_updated'
        ) {
            return '/program-head/students';
        }
        if (
            n.type === 'incident_reported_program_head' ||
            n.type === 'incident_reported_admin'
        ) {
            return '/program-head/violations';
        }
        if (
            n.type === 'student_verification_requested' ||
            n.type === 'student_registered'
        ) {
            return '/program-head/students';
        }
        return null;
    };

    return (
        <ProgramHeadLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Head Notifications" />

            <div className="flex h-full w-full flex-col space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Department Notifications
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            View and manage all schedule requests, student rosters, and activity updates.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="bg-white dark:bg-slate-800 dark:border-slate-700"
                            onClick={markAllAsRead}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <Card className="divide-y divide-slate-100 overflow-hidden border border-slate-200 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        {notifications.length > 0 ? (
                            notifications.map((n) => {
                                const isRead = n.is_read || locallyRead.includes(n.id);
                                const actionHref = getActionHref(n);

                                return (
                                    <div
                                        key={n.id}
                                        onClick={(e) => markSingleAsRead(n.id, e)}
                                        className={cn(
                                            'flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5',
                                            isRead
                                                ? 'bg-white opacity-75 hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/40'
                                                : 'bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30',
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                                    isRead
                                                        ? 'bg-slate-100 dark:bg-slate-800'
                                                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
                                                )}
                                            >
                                                <Bell
                                                    className={cn(
                                                        'h-5 w-5',
                                                        isRead
                                                            ? 'text-slate-400'
                                                            : 'text-blue-600 dark:text-blue-400',
                                                    )}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={cn(
                                                            'text-base transition-colors',
                                                            isRead
                                                                ? 'font-medium text-slate-700 dark:text-slate-300'
                                                                : 'font-bold text-slate-900 dark:text-white',
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {!isRead && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-5 border-0 bg-blue-100 px-1.5 text-[10px] text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300"
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
                                            {actionHref && (
                                                <Link
                                                    href={actionHref}
                                                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#23509A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#000D6A] sm:w-auto"
                                                >
                                                    View Details
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
                                    You don't have any notifications at the moment. We'll let you know when there's an update from administrators.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {paginatedNotifications.last_page > 1 && (
                    <div className="flex items-center justify-between">
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
                        <div className="flex items-center gap-2">
                            {paginatedNotifications.prev_page_url ? (
                                <Link href={paginatedNotifications.prev_page_url}>
                                    <Button variant="outline" size="sm" className="dark:border-slate-700 dark:bg-slate-800">
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="sm" disabled className="dark:border-slate-700 dark:bg-slate-800">
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Previous
                                </Button>
                            )}

                            {paginatedNotifications.next_page_url ? (
                                <Link href={paginatedNotifications.next_page_url}>
                                    <Button variant="outline" size="sm" className="dark:border-slate-700 dark:bg-slate-800">
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="sm" disabled className="dark:border-slate-700 dark:bg-slate-800">
                                    Next
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ProgramHeadLayout>
    );
}
