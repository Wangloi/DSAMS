import type { User } from '@/types/auth';

export type EvaluationRow = {
    id: string;
    title: string;
    date: string;
    statusLabel: string;
};

export type EventRecord = {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    status: string;
    attendance_type?: string;
    is_scanner_assigned?: boolean;
    scanner_portal_active?: boolean;
    geofence_enabled?: boolean;
    geofence_latitude?: number | null;
    geofence_longitude?: number | null;
    geofence_radius_m?: number;
    attendance_status?: 'none' | 'checked_in' | 'checked_out';
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    is_done?: boolean;
};

export type AttendedEventRecord = {
    attendance_id: number;
    event_id: number;
    title: string;
    date: string;
    raw_date?: string;
    time: string;
    location: string;
    organizer?: string;
    description?: string;
    attendance_type: string;
    status: 'checked_out' | 'checked_in' | 'late' | 'left_early' | 'incomplete' | 'excused';
    raw_status?: string;
    checked_in_at: string | null;
    checked_out_at: string | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
    check_in_distance_m?: number | null;
    check_out_distance_m?: number | null;
    is_flagged?: boolean;
    flagged_reason?: string | null;
    is_manual_override?: boolean;
    manual_override_reason?: string | null;
    mid_session_verified_at?: string | null;
};

export type ProgramOption = {
    id: number;
    name: string;
    code: string;
    department: string;
};

export type IncidentRecord = {
    id: number;
    caseId: string;
    title: string;
    classification?: string;
    date: string;
    time?: string;
    location?: string;
    status: string;
    calling_phase?: number;
    statusLabel?: string;
    calling_notice_sent_at?: string | null;
    calling_notice_details?: Record<string, any> | null;
    action_data?: Record<string, any> | null;
    reported_by?: string;
    description?: string;
};

export type ViolationOption = {
    id: number;
    name: string;
    section: string;
};

export type StudentInvolved = {
    id: string;
    name: string;
};

export type StudentDashboardProps = {
    user?: User;
    stats?: {
        active_incidents: number;
        event_attendance: number;
        pending_evaluations: number;
    };
    evaluations?: EvaluationRow[];
    events?: EventRecord[];
    attendedEvents?: AttendedEventRecord[];
    incidents?: IncidentRecord[];
    violations?: ViolationOption[];
    programs?: ProgramOption[];
    initialTab?: 'schedule' | 'history';
};

export const placeOptions = [
    'Main Gate',
    'Gate 1',
    'Back Gate',
    'Cafeteria',
    'Canteen',
    'Gymnasium',
    'Back of Gym',
    'Outer Ground',
    'Inner Ground',
    'Parents Lounge',
    'Chapel',
    'College Library',
    'Dean of Students Affairs',
    'Registrar',
    'Finance - Cashier',
    'School Clinic',
    'Guidance Office',
    'IT Laboratory',
    'Computer Laboratory',
    'Speech Laboratory',
    'Audio Visual Room',
    'Lecture Room 101',
    'Room 101',
    'Room 205',
    'Room 302',
    'CR Room 302',
];
