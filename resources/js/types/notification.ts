export interface AppNotificationItem {
    id: number;
    user_id: number | null;
    user_type?: string;
    type: string;
    title: string;
    message: string;
    related_id?: string | number | null;
    related_type?: string | null;
    meta_data?: Record<string, any> | null;
    is_read: boolean;
    created_at: string;
    updated_at?: string;
}

export interface NotificationResponse {
    notifications: AppNotificationItem[];
    unread_count: number;
}
