import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { connectSocket, getSocketInstance, disconnectSocket } from '@/services/socket';
import { playNotificationSound } from '@/services/notification-sound';
import type { AppNotificationItem, NotificationResponse } from '@/types/notification';

export interface UseNotificationsOptions {
    userId?: number | string | null;
    role?: string | null;
    autoConnect?: boolean;
    /** Polling / pull interval in milliseconds (defaults to 10,000ms / 10s) */
    pollingInterval?: number;
    /** Enable automatic background pulling / polling */
    enablePolling?: boolean;
}

export function useNotifications({
    userId,
    role,
    autoConnect = true,
    pollingInterval = 10000,
    enablePolling = true,
}: UseNotificationsOptions = {}) {
    const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [popupNotification, setPopupNotification] = useState<AppNotificationItem | null>(null);

    const isMounted = useRef<boolean>(true);
    const initialLoadDone = useRef<boolean>(false);
    const knownIds = useRef<Set<number>>(new Set());

    // Fetch notifications from Laravel backend with new-alert detection
    const fetchNotifications = useCallback(
        async (isBackgroundPull: boolean = false) => {
            if (!userId) return;

            if (!isBackgroundPull) {
                setLoading(true);
            }

            try {
                const response = await axios.get<NotificationResponse>('/notifications', {
                    params: { user_id: userId },
                });

                if (isMounted.current && response.data) {
                    const fetchedList = response.data.notifications || [];
                    const fetchedUnread = response.data.unread_count || 0;

                    // If this is a background pull and initial load already finished,
                    // detect any new unread notification to trigger sound & popup toast
                    if (isBackgroundPull && initialLoadDone.current) {
                        const newItems = fetchedList.filter(
                            (n) => !knownIds.current.has(n.id) && !n.is_read
                        );

                        if (newItems.length > 0) {
                            // Play chime sound
                            playNotificationSound();
                            // Trigger toast with the newest notification
                            setPopupNotification(newItems[0]);
                        }
                    }

                    // Update tracked known notification IDs
                    fetchedList.forEach((n) => knownIds.current.add(n.id));
                    initialLoadDone.current = true;

                    setNotifications(fetchedList);
                    setUnreadCount(fetchedUnread);
                }
            } catch (error) {
                if (!isBackgroundPull) {
                    console.error('[useNotifications] Failed to load notifications:', error);
                }
            } finally {
                if (isMounted.current && !isBackgroundPull) {
                    setLoading(false);
                }
            }
        },
        [userId]
    );

    // Handle incoming real-time socket notification
    const handleIncomingNotification = useCallback((incoming: AppNotificationItem) => {
        console.log('[useNotifications] Real-time notification received:', incoming);

        knownIds.current.add(incoming.id);

        setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) {
                return prev;
            }
            return [incoming, ...prev];
        });

        if (!incoming.is_read) {
            setUnreadCount((count) => count + 1);
        }

        // Play Howler.js notification sound
        playNotificationSound();

        // Trigger floating popup toast
        setPopupNotification(incoming);
    }, []);

    // Setup Socket.IO listener & Initial Fetch
    useEffect(() => {
        isMounted.current = true;

        if (userId) {
            void fetchNotifications(false);
        }

        if (autoConnect && userId) {
            const socket = connectSocket(userId, role);

            // Listen for notification events
            socket.on('notification', handleIncomingNotification);

            // Also join user room explicitly if socket was already open
            socket.emit('join_user_room', userId);

            return () => {
                isMounted.current = false;
                socket.off('notification', handleIncomingNotification);
            };
        }

        return () => {
            isMounted.current = false;
        };
    }, [userId, role, autoConnect, fetchNotifications, handleIncomingNotification]);

    // Setup periodic polling / pulling timer
    useEffect(() => {
        if (!enablePolling || !userId || pollingInterval <= 0) return;

        const timer = setInterval(() => {
            // Only pull if document is visible or always active
            if (typeof document === 'undefined' || !document.hidden) {
                void fetchNotifications(true);
            }
        }, pollingInterval);

        return () => {
            clearInterval(timer);
        };
    }, [enablePolling, userId, pollingInterval, fetchNotifications]);

    // Mark a single notification as read
    const markAsRead = useCallback(
        async (id: number) => {
            // Optimistic UI update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            try {
                await axios.post(`/notifications/${id}/mark-read`);
            } catch (error) {
                console.error('[useNotifications] Failed to mark as read:', error);
                void fetchNotifications(false);
            }
        },
        [fetchNotifications]
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        // Optimistic UI update
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);

        try {
            await axios.post('/notifications/mark-all-read', { user_id: userId });
        } catch (error) {
            console.error('[useNotifications] Failed to mark all as read:', error);
            void fetchNotifications(false);
        }
    }, [userId, fetchNotifications]);

    // Clear active popup toast
    const clearPopup = useCallback(() => {
        setPopupNotification(null);
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        popupNotification,
        markAsRead,
        markAllAsRead,
        clearPopup,
        refreshNotifications: () => fetchNotifications(false),
    };
}

