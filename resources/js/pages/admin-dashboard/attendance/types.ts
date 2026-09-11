export type AttendanceRow = {
    id: string;
    event: string;
    dateTime: string;
    organizer: string;
    totalAttendees: number;
    presentCount: number;
    scannedCount?: number;
    eligibleStudentsCount?: number;
    expectedAttendees?: number;
    attendanceDenominator?: number;
    lateCount?: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
    scannerPortalActive?: boolean;
    attendance_type?: string;
    geofence_enabled?: boolean;
};

export type StudentByCourseRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    scanned: boolean;
    status: string | null;
    checked_in_at: string | null;
};

export type ByCourseRow = {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
};
