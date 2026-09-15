export type UserRow = {
    id: number;
    program_head_id?: number;
    admin_user_id?: number;
    student_id: string;
    name: string;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    email: string;
    course: string;
    year_level: string;
    role?: string | null;
    is_active?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    qr_code_path?: string | null;
    entry_status?: string | null;
    program?: string | null;
    major?: string | null;
    home_address?: string | null;
    birthday?: string | null;
    place_of_birth?: string | null;
    religion?: string | null;
    gender?: string | null;
    contact_no?: string | null;
    nationality?: string | null;
    elementary_school?: string | null;
    elementary_year_graduated?: string | number | null;
    junior_high_school?: string | null;
    junior_high_year_graduated?: string | number | null;
    senior_high_school?: string | null;
    senior_high_year_graduated?: string | number | null;
    mother_name?: string | null;
    mother_contact?: string | null;
    father_name?: string | null;
    father_contact?: string | null;
    guardian_name?: string | null;
    guardian_relation?: string | null;
    guardian_contact?: string | null;
    is_archived?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    userType?: 'student' | 'program_head' | 'admin' | string;
    officer_features?: string[] | null;
    handover_expires_at?: string | null;
    handover_expires_at_formatted?: string | null;
    is_handover_active?: boolean;
    is_handover_expired?: boolean;
};

export type ProgramRow = {
    id: string;
    name: string;
    code: string;
    department: string;
    description: string;
    duration: string;
    status: 'active' | 'inactive';
    studentCount: number;
    createdAt: string;
    updatedAt: string;
};

export type PasswordResetRequest = {
    id: number;
    email: string;
    user_type: string;
    status: string;
    created_at: string;
};

export type PageProps = {
    students: UserRow[];
    programs?: ProgramRow[];
    passwordResetRequests?: PasswordResetRequest[];
    errors?: Record<string, string>;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export type UserForm = {
    name?: string;
    program?: string;
    student_id: string;
    email: string;
    password: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    course: string;
    year_level: string;
    role: string;
    officer_features?: string[];
};
