import React, { useEffect, useState } from 'react';
import { Bell, X, ExternalLink, CheckCircle2, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import type { AppNotificationItem } from '@/types/notification';

interface NotificationPopupProps {
    notification: AppNotificationItem | null;
    onClose: () => void;
    onView?: (notification: AppNotificationItem) => void;
    autoCloseDuration?: number; // ms, default 6000
}

export default function NotificationPopup({
    notification,
    onClose,
    onView,
    autoCloseDuration = 6000,
}: NotificationPopupProps) {
    const [progress, setProgress] = useState<number>(100);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        if (!notification) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
        setProgress(100);

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100);
            setProgress(remaining);

            if (elapsed >= autoCloseDuration) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [notification, autoCloseDuration]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 250);
    };

    const handleView = () => {
        if (notification && onView) {
            onView(notification);
        }
        handleDismiss();
    };

    if (!notification || !isVisible) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'event_reminder':
            case 'event_upcoming':
            case 'event_updated':
            case 'event_announcement':
                return <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
            case 'incident_created':
            case 'calling_slip_issued':
            case 'security_alert':
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'resolution_served':
            case 'evaluation_approved':
                return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            default:
                return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <aside
            aria-label="Real-time notifications"
            className="fixed top-5 right-5 z-[9999] max-w-sm w-full pointer-events-auto"
        >
            <div
                role="status"
                aria-live="polite"
                className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 animate-in slide-in-from-top-3 fade-in-0 zoom-in-95"
            >
                {/* Progress bar */}
                <div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 transition-all duration-75"
                    style={{ width: `${progress}%` }}
                />

                <div className="flex items-start gap-3">
                    {/* Icon Container */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shadow-inner ring-1 ring-black/5 dark:bg-slate-800 dark:text-white dark:ring-white/10">
                        {getIcon()}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                                {notification.title}
                            </h4>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {notification.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <span className="font-semibold text-slate-400">
                                Just now
                            </span>

                            <div className="flex items-center gap-1.5">
                                {onView && (
                                    <button
                                        type="button"
                                        onClick={handleView}
                                        className="inline-flex items-center gap-1 rounded-lg bg-[#0B192C] px-2.5 py-1 text-xs font-bold text-amber-400 shadow-xs hover:bg-[#1E3E62] dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 cursor-pointer"
                                    >
                                        <span>View</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
