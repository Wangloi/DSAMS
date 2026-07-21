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
    classification: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
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
    classification: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
    dateTime: string;
    status: 'Pending' | 'Ongoing' | 'Resolved' | 'Escalated';
    violation_id: number | null;
    raw: (IncidentReportPayload & { classification?: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion'; status?: IncidentRow['status'] }) | null;
};

export type IncidentStats = {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
};

export type TypeFilter = 'all' | 'warning' | 'suspension' | 'exclusion' | 'expulsion';
export type StatusFilter = 'all' | IncidentRow['status'];

export type KpiCard = {
    title: string;
    value: number;
    change: string;
    accent: string;
    iconWrap: string;
};

export type DisciplinaryActionType = 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';

export interface DisciplinaryActionRecord {
    id: number;
    student_id: number;
    student_name: string;
    recommended_action: DisciplinaryActionType;
    recommendation_reason: string | null;
    final_action: DisciplinaryActionType | null;
    final_action_reason: string | null;
    remarks: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    status: 'Pending' | 'Approved' | 'Modified' | 'Overridden';
    decision_history: Array<{
        action: string;
        timestamp: string;
        reason?: string;
        reviewed_by?: string;
        remarks?: string;
    }>;
    created_at: string | null;
}

export interface StudentDisciplinaryStats {
    warning_count: number;
    suspension_count: number;
    total_actions: number;
    next_sanction: string;
}

export interface DisciplinaryHistoryItem {
    id: number;
    incident_id: number;
    action_type: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
    date: string;
    description: string;
    case_ref: string | null;
    is_current: boolean;
    displayLabel?: string;
}
