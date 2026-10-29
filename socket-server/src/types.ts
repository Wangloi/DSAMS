export interface NotificationPayload {
  id?: number | string;
  user_id?: number | string | null;
  type: string;
  title: string;
  message: string;
  related_id?: string | number | null;
  related_type?: string | null;
  meta_data?: Record<string, any> | null;
  is_read?: boolean;
  created_at?: string;
}

export interface EmitRequestBody {
  room?: string | null;     // e.g. "user_15", "role_admin", or null for broadcast
  rooms?: string[] | null;  // e.g. ["user_1", "user_2"] for batch emission
  event?: string;           // defaults to "notification", or "attendance_scanned"
  data: NotificationPayload | Record<string, any>;
}

export interface ClientHandshakeAuth {
  userId?: string | number;
  role?: string;
  token?: string;
}
