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
    incidents?: IncidentRecord[];
    violations?: ViolationOption[];
    programs?: ProgramOption[];
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
