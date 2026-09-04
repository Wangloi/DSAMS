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
    section?: string;
    section_note?: string;
};

export const DEFAULT_STATIC_QUESTIONS: Question[] = [
    // Standard 1: THE PRESENTER (Rating 1 - 5)
    {
        id: 'std1_q1',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'The goals of the presentation were clear',
        required: true,
    },
    {
        id: 'std1_q2',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'The style of the presentation was organized',
        required: true,
    },
    {
        id: 'std1_q3',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'The presenter was well prepared',
        required: true,
    },
    {
        id: 'std1_q4',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'The presenter was engaging & dynamic',
        required: true,
    },
    {
        id: 'std1_q5',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'I found the presenter easy to interact with',
        required: true,
    },
    {
        id: 'std1_q6',
        section: 'Standard 1: The Presenter',
        section_note: '1 as the lowest (poor) and 5 as the highest (excellent)',
        type: 'rating',
        label: 'My overall evaluation of the presenter - excellent',
        required: true,
    },

    // Standard 2: PRESENTATION (Multiple Choice YES / NO)
    {
        id: 'std2_q1',
        section: 'Standard 2: Presentation',
        section_note: 'Kindly check the corresponding box of your answer.',
        type: 'multiple_choice',
        label: 'Were the objectives of the seminar communicated to you?',
        options: ['YES', 'NO'],
        required: true,
    },
    {
        id: 'std2_q2',
        section: 'Standard 2: Presentation',
        section_note: 'Kindly check the corresponding box of your answer.',
        type: 'multiple_choice',
        label: 'Did the seminar meet all of its stated objectives?',
        options: ['YES', 'NO'],
        required: true,
    },
    {
        id: 'std2_q3',
        section: 'Standard 2: Presentation',
        section_note: 'Kindly check the corresponding box of your answer.',
        type: 'multiple_choice',
        label: 'Did the seminar/training address the concerns of your spiritual being?',
        options: ['YES', 'NO'],
        required: true,
    },
    {
        id: 'std2_q4',
        section: 'Standard 2: Presentation',
        section_note: 'Kindly check the corresponding box of your answer.',
        type: 'multiple_choice',
        label: 'Will the activity help you to improve your whole being?',
        options: ['YES', 'NO'],
        required: true,
    },

    // Standard 3: About the Seminar/Training (Long text)
    {
        id: 'std3_q1',
        section: 'Standard 3: About the Seminar/Training',
        section_note: 'Note: You are required to fill in this portion',
        type: 'long_text',
        label: 'What was the best thing about this training?',
        required: true,
    },
    {
        id: 'std3_q2',
        section: 'Standard 3: About the Seminar/Training',
        section_note: 'Note: You are required to fill in this portion',
        type: 'long_text',
        label: 'What are the specific things you enjoyed LEAST about this presentation?',
        required: true,
    },
    {
        id: 'std3_q3',
        section: 'Standard 3: About the Seminar/Training',
        section_note: 'Note: You are required to fill in this portion',
        type: 'long_text',
        label: 'List any suggestions you have for improving this presentation',
        required: true,
    },
];

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
