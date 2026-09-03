import React, { useState, useRef, useEffect } from 'react';
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    Trash2,
    X,
    ExternalLink,
    AlertTriangle,
    ShieldCheck,
    Info,
    Inbox,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppNotificationItem } from '@/types/notification';

interface NotificationBellProps {
    notifications: AppNotificationItem[];
    unreadCount: number;
    loading?: boolean;
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onSelectNotification?: (notification: AppNotificationItem) => void;
}

export default function NotificationBell({
    notifications = [],
    unreadCount = 0,
    loading = false,
    onMarkAsRead,
    onMarkAllAsRead,
    onSelectNotification,
}: NotificationBellProps) {
    const [open, setOpen] = useState(false);

    // Format relative timestamp helper
    const formatTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return 'Recently';
        }
    };

    const handleItemClick = (notification: AppNotificationItem) => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        if (onSelectNotification) {
            onSelectNotification(notification);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Notifications (${unreadCount} unread)`}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/90 text-slate-700 shadow-2xs transition-all hover:bg-slate-200/80 focus:outline-hidden dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                    <Bell className="h-5 w-5 transition-transform duration-200 group-hover:rotate-6" />

                    {/* Reactive Unread Counter Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white dark:ring-[#0B192C] animate-in zoom-in-50">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-[#0B192C] z-50 overflow-hidden"
            >
                {/* Dropdown Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <Badge className="bg-rose-500 font-bold text-[10px] text-white">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={onMarkAllAsRead}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span>Mark all as read</span>
                        </button>
                    )}
                </div>

                {/* Notifications Scrollable List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleItemClick(notification)}
                                className={`group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                    !notification.is_read
                                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                                        : 'bg-white dark:bg-transparent'
                                }`}
                            >
                                {/* Unread indicator dot */}
                                <div className="mt-1.5 flex shrink-0 items-center justify-center">
                                    {!notification.is_read ? (
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-sm ring-2 ring-blue-300 dark:bg-blue-400 dark:ring-blue-900" />
                                    ) : (
                                        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    )}
                                </div>

                                {/* Content Details */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-1">
                                        <h5
                                            className={`text-xs font-black truncate leading-tight ${
                                                !notification.is_read
                                                    ? 'text-slate-900 dark:text-white'
                                                    : 'text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {notification.title}
                                        </h5>
                                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                                            {formatTimeAgo(notification.created_at)}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-2">
                                <Inbox className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                No notifications yet
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                You're all caught up! Real-time alerts will appear here.
                            </p>
                        </div>
                    )}
                </div>

                {/* Dropdown Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center dark:border-slate-800 dark:bg-slate-900/30">
                    <span className="text-[10px] font-bold text-slate-400">
                        ⚡ Real-Time Powered by Node.js + Socket.IO
                    </span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
