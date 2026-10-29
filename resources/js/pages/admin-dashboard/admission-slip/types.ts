export type SlipRow = {
    id: number;
    studentId?: number | string;
    studentName: string;
    programYear: string;
    dateIssued: string;
    caseText: string;
    reasonText: string;
    validUntil: string;
    status: string;
    slipCount?: string;
    allTimeCount?: string;
    monthlySlipCount?: number;
};

export type AdmissionSlipRecord = {
    id: number;
    student_id?: number | string;
    student_name: string;
    program_year_level: string;
    date_issued: string;
    case_text: string;
    reason_text: string;
    valid_until: string;
    status: string;
    slip_count?: string;
    all_time_slip_count?: string;
    monthly_slip_count?: number;
};

export type PageProps = {
    slips: AdmissionSlipRecord[];
    deanName?: string;
    auth?: {
        user?: {
            id?: number | string;
            name?: string;
            email?: string;
            role?: string;
        };
    };
    errors?: Record<string, string>;
};

export type CreateSlipFormState = {
    userId: string;
    studentName: string;
    programYear: string;
    dateIssued: string;
    caseText: string;
    reasonText: string;
    validUntil: string;
};
