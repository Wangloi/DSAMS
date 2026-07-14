import React from 'react';
import EvaluationPreviewDialog from '../EvaluationPreviewDialog';
import AutoEvaluationUploadDialog from '../AutoEvaluationUploadDialog';
import { EvaluationForm, EventOption } from './types';

interface EvaluationDialogsProps {
    previewDialogOpen: boolean;
    setPreviewDialogOpen: (open: boolean) => void;
    previewEvaluation: EvaluationForm | null;
    autoUploadOpen: boolean;
    setAutoUploadOpen: (open: boolean) => void;
    events: EventOption[];
    onAutoUploadSuccess: (data: any, eventId: number) => void;
}

export default function EvaluationDialogs({
    previewDialogOpen,
    setPreviewDialogOpen,
    previewEvaluation,
    autoUploadOpen,
    setAutoUploadOpen,
    events,
    onAutoUploadSuccess,
}: EvaluationDialogsProps) {
    return (
        <>
            <EvaluationPreviewDialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
                evaluation={previewEvaluation as any}
            />

            <AutoEvaluationUploadDialog
                isOpen={autoUploadOpen}
                onClose={() => setAutoUploadOpen(false)}
                onSuccess={onAutoUploadSuccess}
                events={events as any}
            />
        </>
    );
}
