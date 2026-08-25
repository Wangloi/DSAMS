export type EventOption = {
    id: number;
    name: string;
    date: string;
    time: string;
};

export type Question = {
    id: string;
    type:
        | 'rating'
        | 'multiple_choice'
        | 'checkbox'
        | 'short_text'
        | 'long_text';
    label: string;
    required?: boolean;
    options?: string[];
};

export type FormState = {
    name: string;
    description: string;
    eventId: string;
    is_active: boolean;
    form_data: {
        questions: Question[];
    };
};

export type EvaluationForm = {
    id: number;
    name: string;
    description?: string;
    event: string;
    event_id?: number | null;
    form_data?: any;
    qr_code_path?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};
