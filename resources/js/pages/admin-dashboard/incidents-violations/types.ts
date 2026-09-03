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
    course?: string;
    yearLevel?: string;
};

export type InvestigationDetails = {
    identity_verified: boolean;
    interviews_completed: boolean;
    gravity_assessed: boolean;
    student_history_notes?: string;
    interview_notes?: string;
    investigation_summary?: string;
    investigator_name?: string;
    recommended_action?: string;
    updated_at?: string;
    updated_by?: string;
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
    calling_phase?: number;
    calling_phase_history?: Array<{
        phase: number;
        at: string;
        by: string;
        trigger: string;
    }>;
    investigation_details?: InvestigationDetails | null;
    calling_notice_sent_at?: string | null;
    calling_notice_details?: Record<string, any> | null;
    action_data?: DisciplinaryDecisionData | null;
    updated_at?: string;
    violation_id: number | null;
    raw:
        | (IncidentReportPayload & {
              classification?:
                  | 'Warning'
                  | 'Suspension'
                  | 'Exclusion'
                  | 'Expulsion';
              status?: IncidentRow['status'];
              actionData?: DisciplinaryDecisionData | null;
          })
        | null;
}

export interface DisciplinaryDecisionData {
    section: 1 | 2 | 3 | 4;
    sanction: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
    sanction_type?: 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion';
    specific_penalty: string;
    findings: string;
    rationale: string;
    terms?: string | null;
    effective_date?: string;
    signatory_name?: string;
    signatory_title?: string;
    served_at?: string;
    served_by?: string;
    student_id?: string;
}

export type IncidentStats = {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
};

export type TypeFilter =
    | 'all'
    | 'warning'
    | 'suspension'
    | 'exclusion'
    | 'expulsion';
export type StatusFilter = 'all' | IncidentRow['status'];

export type KpiCard = {
    title: string;
    value: number;
    change: string;
    accent: string;
    iconWrap: string;
    subtitle?: string;
};

export type DisciplinaryActionType =
    | 'Warning'
    | 'Suspension'
    | 'Exclusion'
    | 'Expulsion';

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
