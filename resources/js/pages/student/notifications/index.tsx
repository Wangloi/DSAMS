import { AppShell } from '@/components/app-shell';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { studentDashboard, studentAttendanceScannerPortal, studentEvaluationShow } from '@/routes';
import { StudentHeader } from '../components/StudentHeader';
import { StudentDashboardFooter } from '../components/StudentDashboardFooter';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';

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

export default function StudentNotifications({ paginatedNotifications }: Props) {
    const [locallyRead, setLocallyRead] = useState<string[]>([]);

    const notifications = paginatedNotifications.data;

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) return;

        const n = notifications.find(notif => notif.id === id);
        if (n && !n.is_read && !locallyRead.includes(id)) {
            setLocallyRead(prev => [...prev, id]);
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

    const markAllAsRead = () => {
        axios.post('/notifications/mark-all-read')
            .then(() => {
                // Mark all as locally read for immediate UI feedback
                setLocallyRead(notifications.map(n => n.id));
            })
            .catch(console.error);
    };

    return (
        <AppShell>
            <StudentHeader />
            <Head title="Notifications" />

            <div className="mt-24 flex min-h-screen w-full flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Link
                        href={studentDashboard()}
                        className="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notifications</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and manage your updates, alerts, and notifications.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            onClick={markAllAsRead}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <Card className="mt-6 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                    <div className="flex flex-col">
                        {notifications.length > 0 ? (
                            notifications.map((n) => {
                                const isRead = n.is_read || locallyRead.includes(n.id);
                                return (
                                    <div
                                        key={n.id}
                                        onClick={(e) => !isRead && markSingleAsRead(n.id, e)}
                                        className={cn(
                                            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 transition-colors group relative",
                                            isRead
                                                ? "bg-slate-50/50 dark:bg-slate-900/50 cursor-default"
                                                : "bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {!isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                                        )}

                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                isRead ? "bg-slate-100 dark:bg-slate-800 text-slate-400" : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                                            )}>
                                                <Bell className="h-5 w-5" />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn(
                                                        "text-base transition-colors",
                                                        isRead ? "font-medium text-slate-700 dark:text-slate-300" : "font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                                    )}>{n.title}</p>
                                                    {!isRead && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-900 border-0 h-5 px-1.5 text-[10px]">NEW</Badge>}
                                                </div>

                                                {n.subtitle && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{n.subtitle}</p>
                                                )}

                                                <div className="flex items-center gap-4 mt-1">
                                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                                        {n.created_at ? new Date(n.created_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        }) : n.timeAgo}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons based on notification type */}
                                        <div className="flex shrink-0">
                                            {n.type === 'scanner_portal_access_granted' && n.eventId && (
                                                <Link
                                                    href={studentAttendanceScannerPortal(n.eventId)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    Open Scanner
                                                </Link>
                                            )}
                                            {n.type === 'evaluation_available' && n.evaluationId && (
                                                <Link
                                                    href={studentEvaluationShow(n.evaluationId)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    Evaluate
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                    You don't have any notifications at the moment. We'll let you know when there's something new.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Pagination */}
                {paginatedNotifications.last_page > 1 && (
                    <div className="flex items-center justify-between pb-10">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing page <span className="font-medium text-slate-900 dark:text-white">{paginatedNotifications.current_page}</span> of <span className="font-medium text-slate-900 dark:text-white">{paginatedNotifications.last_page}</span>
                        </p>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="dark:bg-slate-900 dark:border-slate-800"
                                disabled={!paginatedNotifications.prev_page_url}
                                onClick={() => paginatedNotifications.prev_page_url && router.get(paginatedNotifications.prev_page_url, {}, { preserveScroll: true })}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="dark:bg-slate-900 dark:border-slate-800"
                                disabled={!paginatedNotifications.next_page_url}
                                onClick={() => paginatedNotifications.next_page_url && router.get(paginatedNotifications.next_page_url, {}, { preserveScroll: true })}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <StudentDashboardFooter />
        </AppShell>
    );
}
