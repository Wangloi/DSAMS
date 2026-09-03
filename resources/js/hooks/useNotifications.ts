import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { connectSocket, getSocketInstance, disconnectSocket } from '@/services/socket';
import type { AppNotificationItem, NotificationResponse } from '@/types/notification';

export interface UseNotificationsOptions {
    userId?: number | string | null;
    role?: string | null;
    autoConnect?: boolean;
}

export function useNotifications({
    userId,
    role,
    autoConnect = true,
}: UseNotificationsOptions = {}) {
    const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [popupNotification, setPopupNotification] = useState<AppNotificationItem | null>(null);

    const isMounted = useRef<boolean>(true);

    // Fetch existing notifications from Laravel backend
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await axios.get<NotificationResponse>('/notifications', {
                params: { user_id: userId },
            });

            if (isMounted.current && response.data) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unread_count || 0);
            }
        } catch (error) {
            console.error('[useNotifications] Failed to load notifications:', error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [userId]);

    // Handle incoming real-time notification
    const handleIncomingNotification = useCallback((incoming: AppNotificationItem) => {
        console.log('[useNotifications] Real-time notification received:', incoming);

        setNotifications((prev) => {
            // Prevent duplicate notifications
            if (prev.some((n) => n.id === incoming.id)) {
                return prev;
            }
            return [incoming, ...prev];
        });

        if (!incoming.is_read) {
            setUnreadCount((count) => count + 1);
        }

        // Trigger floating popup toast
        setPopupNotification(incoming);
    }, []);

    // Setup Socket.IO listener
    useEffect(() => {
        isMounted.current = true;

        if (autoConnect && userId) {
            fetchNotifications();

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

    // Mark a single notification as read
    const markAsRead = useCallback(async (id: number) => {
        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await axios.post(`/notifications/${id}/mark-read`);
        } catch (error) {
            console.error('[useNotifications] Failed to mark as read:', error);
            // Re-fetch in case of failure
            fetchNotifications();
        }
    }, [fetchNotifications]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);

        try {
            await axios.post('/notifications/mark-all-read', { user_id: userId });
        } catch (error) {
            console.error('[useNotifications] Failed to mark all as read:', error);
            fetchNotifications();
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
        refreshNotifications: fetchNotifications,
    };
}
