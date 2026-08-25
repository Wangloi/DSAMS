import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { adminAdmissionSlip, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Bell, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Notifications',
        href: '/admin/notifications',
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

export default function AdminNotifications({ paginatedNotifications }: Props) {
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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="All Notifications" />

            <div className="flex h-full w-full flex-col space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Notifications
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            View and manage all system notifications and alerts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="bg-white"
                            onClick={markAllAsRead}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="flex flex-col">
                        {notifications.length > 0 ? (
                            notifications.map((n) => {
                                const isRead =
                                    n.is_read || locallyRead.includes(n.id);
                                return (
                                    <div
                                        key={n.id}
                                        onClick={(e) =>
                                            !isRead && markSingleAsRead(n.id, e)
                                        }
                                        className={cn(
                                            'group relative flex flex-col justify-between gap-4 border-b border-slate-100 p-5 transition-colors sm:flex-row sm:items-center',
                                            isRead
                                                ? 'cursor-default bg-slate-50/50'
                                                : 'cursor-pointer bg-white hover:bg-slate-50',
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
                                                        ? 'bg-slate-100'
                                                        : 'bg-blue-100 text-blue-600',
                                                )}
                                            >
                                                <Bell
                                                    className={cn(
                                                        'h-5 w-5',
                                                        isRead
                                                            ? 'text-slate-400'
                                                            : 'text-blue-600',
                                                    )}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={cn(
                                                            'text-base transition-colors',
                                                            isRead
                                                                ? 'font-medium text-slate-700'
                                                                : 'font-bold text-slate-900',
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {!isRead && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-5 border-0 bg-blue-100 px-1.5 text-[10px] text-blue-700 hover:bg-blue-100"
                                                        >
                                                            NEW
                                                        </Badge>
                                                    )}
                                                </div>

                                                {n.subtitle && (
                                                    <p className="text-sm text-slate-600">
                                                        {n.subtitle}
                                                    </p>
                                                )}

                                                <div className="mt-1 flex items-center gap-4">
                                                    <p className="text-xs font-medium text-slate-400">
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
                                                'admission_slip_requested' && (
                                                <Link
                                                    href={adminAdmissionSlip()}
                                                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#23509A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#000D6A] sm:w-auto"
                                                >
                                                    Review Request
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                    <Bell className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    All caught up!
                                </h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing page{' '}
                            <span className="font-medium text-slate-900">
                                {paginatedNotifications.current_page}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium text-slate-900">
                                {paginatedNotifications.last_page}
                            </span>
                        </p>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
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
        </AdminLayout>
    );
}
