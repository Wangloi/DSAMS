import type { CourseYearOption } from './mergeCourseYearOptions';

export interface EventAttendance {
    id: number;
    student_id: number;
    student: {
        name: string;
        email: string;
    };
}

export interface Event {
    id: number;
    event_name: string;
    description: string;
    courses: string[];
    year_levels: string[];
    location: string;
    event_date: string;
    event_time: string;
    registration_end_time: string | null;
    organizer: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    approval_status?: 'pending' | 'approved' | 'rejected';
    activity_plan_path?: string | null;
    activity_plan_url?: string | null;
    requested_by?: string | null;
    rejection_reason?: string | null;
    qr_code: string | null;
    attendances: EventAttendance[];
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    geofence_enabled: boolean;
    scanner_portal_active: boolean;
    geofence_latitude?: number | string | null;
    geofence_longitude?: number | string | null;
    geofence_radius_m?: number | null;
    eligible_students_count?: number;
    expected_attendees?: number | null;
}

export interface PageProps extends Record<string, any> {
    events: Event[];
    allEvents?: Event[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        course?: string;
        year_level?: string;
    };
    courses: CourseYearOption[];
    yearLevels: CourseYearOption[];
    totalStudents: number;
    studentCountsByCourseYear: Array<{
        course: string;
        year_level: string;
        total: number;
    }>;
    announcements: Array<{
        id: string | number;
        title: string;
        eventDate?: string;
        eventTime?: string;
    }>;
}

export function formatEventAttendeesLabel(event: Event): string {
    const present = event.attendances?.length ?? 0;
    const eligible =
        typeof event.eligible_students_count === 'number'
            ? event.eligible_students_count
            : 0;
    const exp = event.expected_attendees;
    const denominator = typeof exp === 'number' && exp > 0 ? exp : eligible;

    if (event.status === 'upcoming') {
        return `0 / ${denominator}`;
    }

    return `${present} / ${denominator}`;
}

export function getEventColor(courses: string[]): string {
    if (!courses || courses.length === 0) return '#3b82f6'; // default blue

    const colors: Record<string, string> = {
        BSIT: '#800000',
        'INFORMATION TECHNOLOGY': '#800000',
        BSED: '#3b82f6',
        EDUCATION: '#3b82f6',
        BSHM: '#22c55e',
        HOSPITALITY: '#22c55e',
        BSBA: '#eab308',
        BUSINESS: '#eab308',
        CRIM: '#2563eb',
        CRIMINOLOGY: '#2563eb',
    };

    for (const course of courses) {
        const upperCourse = course.toUpperCase();
        for (const [key, color] of Object.entries(colors)) {
            if (upperCourse.includes(key)) {
                return color;
            }
        }
    }

    return '#3b82f6'; // default
}

export function getEventLifecycleStatus(event: Event): string {
    if (event.status === 'completed') {
        return 'completed';
    }
    if (event.event_date) {
        const dateStr = String(event.event_date).split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr < todayStr) return 'completed';
        if (dateStr > todayStr) return 'upcoming';
        return 'ongoing';
    }
    return event.status || 'upcoming';
}
