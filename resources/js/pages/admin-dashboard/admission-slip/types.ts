export type SlipRow = {
    id: number;
    studentName: string;
    programYear: string;
    dateIssued: string;
    caseText: string;
    reasonText: string;
    validUntil: string;
    status: string;
};

export type AdmissionSlipRecord = {
    id: number;
    student_name: string;
    program_year_level: string;
    date_issued: string;
    case_text: string;
    reason_text: string;
    valid_until: string;
    status: string;
};

export type PageProps = {
    slips: AdmissionSlipRecord[];
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
