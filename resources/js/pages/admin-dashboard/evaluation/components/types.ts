import React from 'react';

export type CommentRow = {
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
    status: 'approved' | 'pending' | 'rejected';
};

export type EvaluationForm = {
    id: number;
    name: string;
    event: string;
    event_id?: number | null;
    form_data?: any;
    qr_code_path?: string;
    is_active: boolean;
    published_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type ProgramStatRow = {
    program: string;
    eligible: number;
    submitted: number;
    percent: number;
    meets_threshold: boolean;
    approved: boolean;
    approved_at?: string | null;
};

export type EventOption = {
    id: number;
    name: string;
    date: string;
    time: string;
};

export type EvaluationStats = {
    totalResponses: number;
    uniqueSubmitters: number;
    attendanceCount: number;
    responseRate: number | null;
    averageRating: number | null;
    ratingSummary: Array<{ label: string; value: number }>;
    sentiments: { positive: number; neutral: number; negative: number };
    latestComments: Array<{ 
        student: string; 
        rating: number | null; 
        sentiment: 'positive' | 'neutral' | 'negative'; 
        comment: string; 
        submitted_at: string | null 
    }>;
    averageResponseTime?: string;
};

export type Kpi = { 
    title: string; 
    value: number | string; 
    change?: string; 
    accent: string; 
    icon: React.ComponentType<any> 
};
