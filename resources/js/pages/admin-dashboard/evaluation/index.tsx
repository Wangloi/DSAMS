import { Head, Link, router, usePage } from '@inertiajs/react';
import { Archive, CheckCircle2, Download, Eye, LayoutGrid, PlusCircle, QrCode, Send, Star, ThumbsDown, ThumbsUp, UserRoundCog, Pencil, XCircle, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    adminDashboard,
    adminEvaluation,
    adminEvaluationApproveProgram,
    adminEvaluationDestroy,
    adminEvaluationMetrics,
    adminEvaluationPublish,
    adminEvaluationShow,
    adminEvaluationStore,
    adminEvaluationUnpublish,
    adminEvaluationUpdate,
    studentEvaluationShow,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import AutoEvaluationUploadDialog from './AutoEvaluationUploadDialog';
import EvaluationFormDialog from './EvaluationFormDialog';
import EvaluationPreviewDialog from './EvaluationPreviewDialog';
import KpiCards from './components/KpiCards';
import EvaluationTable from './components/EvaluationTable';
import EvaluationDialogs from './components/EvaluationDialogs';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Evaluation',
        href: adminEvaluation(),
    },
];

import { CommentRow, EvaluationForm, ProgramStatRow, EventOption, EvaluationStats } from './components/types';

type PageProps = {
    evaluations: EvaluationForm[];
    events: EventOption[];
    selectedEventId?: number | null;
    evaluationStats?: EvaluationStats;
    programStats?: ProgramStatRow[];
    completionThreshold?: number;
    errors?: Record<string, string>;
};

export default function AdminEvaluationPage() {
    const { props } = (usePage() as { props: PageProps });
    const evaluations = props.evaluations ?? [];
    const events = props.events ?? [];
    const selectedEventId = props.selectedEventId ?? null;
    const evaluationStats = props.evaluationStats;
    const programStats = props.programStats ?? [];
    const completionThreshold = props.completionThreshold ?? 85;

    const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] = useState<EvaluationForm | null>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewEvaluation, setPreviewEvaluation] = useState<EvaluationForm | null>(null);
    const [autoUploadOpen, setAutoUploadOpen] = useState(false);
    const [initialFormState, setInitialFormState] = useState<any>(null);



    const kpis = useMemo(() => {
        const totalResponses = evaluationStats?.totalResponses ?? 0;
        const responseRate = evaluationStats?.responseRate;
        const averageRating = evaluationStats?.averageRating;
        const positiveFeedback = evaluationStats?.sentiments?.positive ?? 0;
        const negativeFeedback = evaluationStats?.sentiments?.negative ?? 0;

        return [
            { title: 'Total Responses', value: totalResponses, change: '', accent: 'bg-blue-600', icon: UserRoundCog },
            {
                title: 'Response Rate',
                value: responseRate === null || responseRate === undefined ? 'N/A' : `${responseRate}%`,
                change: '',
                accent: 'bg-emerald-600',
                icon: ThumbsUp,
            },
            {
                title: 'Average Rating',
                value: averageRating === null || averageRating === undefined ? 'N/A' : String(averageRating),
                change: '',
                accent: 'bg-amber-500',
                icon: UserRoundCog,
            },
            { title: 'Positive Feedback', value: positiveFeedback, change: '', accent: 'bg-emerald-600', icon: ThumbsUp },
            { title: 'Negative Feedback', value: negativeFeedback, change: '', accent: 'bg-rose-500', icon: ThumbsDown },
        ];
    }, [evaluationStats]);

    const handleArchiveEvaluation = (evaluation: EvaluationForm) => {
        Swal.fire({
            title: 'Archive evaluation form?',
            text: `This will move "${evaluation.name}" to the archive. You can restore it later from the Archive page.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Archive',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(adminEvaluationDestroy(evaluation.id), {}, {
                    preserveScroll: true,
                });
            }
        });
    };

    const handleCreateEvaluation = () => {
        setEditingEvaluation(null);
        setEvaluationDialogOpen(true);
    };

    const handleEditEvaluation = (evaluation: EvaluationForm) => {
        setEditingEvaluation(evaluation);
        setEvaluationDialogOpen(true);
    };

    const handlePreviewEvaluation = (evaluation: EvaluationForm) => {
        router.visit(adminEvaluationShow(evaluation.id));
    };

    const handlePublish = (evaluation: EvaluationForm) => {
        Swal.fire({
            title: 'Publish evaluation?',
            text: 'Eligible students (present at the event, matching course/year) will be notified.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Publish',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(adminEvaluationPublish(evaluation.id), {}, { preserveScroll: true });
            }
        });
    };

    const handleUnpublish = (evaluation: EvaluationForm) => {
        router.post(adminEvaluationUnpublish(evaluation.id), {}, { preserveScroll: true });
    };

    const handleApproveProgram = (evaluation: EvaluationForm, program: string) => {
        Swal.fire({
            title: 'Approve next activity?',
            html: `Confirm that at least <strong>${completionThreshold}%</strong> of eligible students in <strong>${program}</strong> have completed the evaluation.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminEvaluationApproveProgram(evaluation.id),
                    { program },
                    { preserveScroll: true, onSuccess: () => {
                        // After approval, refresh metrics if the dialog is open
                        router.reload({ only: ['programStats'] });
                    } },
                );
            }
        });
    };

    const primaryEvaluation = useMemo(() => {
        if (!selectedEventId) return null;
        return evaluations.find((e) => e.event_id === selectedEventId) ?? evaluations[0] ?? null;
    }, [evaluations, selectedEventId]);

    const handleDownloadQR = async (evaluation: EvaluationForm) => {
        try {
            const evaluationUrl = `${window.location.origin}${studentEvaluationShow(evaluation.id)}`;

            const qrCodeDataUrl = await QRCode.toDataURL(evaluationUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            const link = document.createElement('a');
            link.href = qrCodeDataUrl;
            link.download = `evaluation-${evaluation.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
                icon: 'success',
                title: 'QR Code Downloaded',
                text: `QR code for "${evaluation.name}" has been downloaded successfully.`,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate QR code. Please try again.',
            });
        }
    };



    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluation" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* Inline Form View */}
                    {evaluationDialogOpen ? (
                        <EvaluationFormDialog
                            onClose={() => {
                                setEvaluationDialogOpen(false);
                                setEditingEvaluation(null);
                                setInitialFormState(null);
                            }}
                            editingEvaluation={editingEvaluation}
                            events={events}
                            initialFormState={initialFormState}
                        />
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-black dark:bg-blue-600/20 dark:text-white">
                                        <UserRoundCog className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            Evaluation System
                                        </h1>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Track evaluation forms and student feedback
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        onClick={handleCreateEvaluation}
                                        className="h-10 shrink-0 gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Create Form
                                    </Button>
                                </div>
                            </div>

                            <KpiCards kpis={kpis} />

                            <EvaluationTable 
                                evaluations={evaluations}
                                events={events}
                                handlePublish={handlePublish}
                                handleUnpublish={handleUnpublish}
                                handleDownloadQR={handleDownloadQR}
                                handlePreviewEvaluation={handlePreviewEvaluation}
                                handleEditEvaluation={handleEditEvaluation}
                                handleArchiveEvaluation={handleArchiveEvaluation}
                            />
                        </>
                    )}
                </div>
            </div>

            <EvaluationDialogs
                previewDialogOpen={previewDialogOpen}
                setPreviewDialogOpen={setPreviewDialogOpen}
                previewEvaluation={previewEvaluation}
                autoUploadOpen={autoUploadOpen}
                setAutoUploadOpen={setAutoUploadOpen}
                events={events}
                onAutoUploadSuccess={(data, eventId) => {
                    setInitialFormState({
                        name: data.name,
                        description: data.description,
                        eventId: eventId,
                        is_active: false,
                        form_data: {
                            questions: data.questions
                        }
                    });
                    setEditingEvaluation(null);
                    setEvaluationDialogOpen(true);
                }}
            />
        </AdminLayout>
    );
}