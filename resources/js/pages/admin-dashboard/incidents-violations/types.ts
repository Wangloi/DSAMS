export type StudentInfo = {
    id: string;
    name: string;
};

export type Violation = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    section: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
};

export type IncidentReportPayload = {
    violationId: number | null;
    incidentType: string;
    classification: 'Major' | 'Minor';
    date: string;
    time: string;
    location: string;
    reportedBy: string;
    studentsInvolved: StudentInfo[];
    description: string;
    immediateAction: string;
    receivedBy: string;
};

export interface IncidentRow {
    id: number;
    caseId: string;
    student: string;
    studentId: string;
    type: string;
    classification: 'Major' | 'Minor';
    dateTime: string;
    status: 'Pending' | 'Ongoing' | 'Resolved' | 'Escalated';
    violation_id: number | null;
    raw: (IncidentReportPayload & { classification?: 'Major' | 'Minor'; status?: IncidentRow['status'] }) | null;
};

export type IncidentStats = {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
};

export type TypeFilter = 'all' | 'major' | 'minor';
export type StatusFilter = 'all' | IncidentRow['status'];

export type KpiCard = {
    title: string;
    value: number;
    change: string;
    accent: string;
    iconWrap: string;
};
