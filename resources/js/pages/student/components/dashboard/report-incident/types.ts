import type { StudentInvolved, ViolationOption } from '../types';

export type IncidentClassification =
    | 'Warning'
    | 'Suspension'
    | 'Exclusion'
    | 'Expulsion';

export interface ReportIncidentFormData {
    violation_id: number | null;
    incident_type: string;
    incident_date: string;
    incident_time: string;
    location: string;
    reported_by: string;
    students_involved: StudentInvolved[];
    classification: IncidentClassification;
    description: string;
    evidences: File[];
}

export interface ReportIncidentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    violations?: ViolationOption[];
}
