import { Button } from '@/components/ui/button';
import {
    adminDashboard,
    adminEvaluation,
    adminEvaluationApproveProgram,
    adminEvaluationDestroy,
    adminEvaluationPublish,
    adminEvaluationShow,
    adminEvaluationStore,
    adminEvaluationUnpublish,
    studentEvaluationShow,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { PlusCircle, ThumbsDown, ThumbsUp, UserRoundCog } from 'lucide-react';
import QRCode from 'qrcode';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import EvaluationFormDialog from './EvaluationFormDialog';
import EvaluationDialogs from './components/EvaluationDialogs';
import EvaluationTable from './components/EvaluationTable';
import KpiCards from './components/KpiCards';
import { DEFAULT_STATIC_QUESTIONS } from './types';

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

import {
    EvaluationForm,
    EvaluationStats,
    EventOption,
    ProgramStatRow,
} from './components/types';

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
    const { props } = usePage() as { props: PageProps };
    const evaluations = props.evaluations ?? [];
    const events = props.events ?? [];
    const selectedEventId = props.selectedEventId ?? null;
    const evaluationStats = props.evaluationStats;
    const programStats = props.programStats ?? [];
    const completionThreshold = props.completionThreshold ?? 85;

    const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] =
        useState<EvaluationForm | null>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewEvaluation, setPreviewEvaluation] =
        useState<EvaluationForm | null>(null);
    const [autoUploadOpen, setAutoUploadOpen] = useState(false);
    const [initialFormState, setInitialFormState] = useState<any>(null);

    const kpis = useMemo(() => {
        const totalResponses = evaluationStats?.totalResponses ?? 0;
        const responseRate = evaluationStats?.responseRate;
        const averageRating = evaluationStats?.averageRating;
        const positiveFeedback = evaluationStats?.sentiments?.positive ?? 0;
        const negativeFeedback = evaluationStats?.sentiments?.negative ?? 0;

        return [
            {
                title: 'Total Responses',
                value: totalResponses,
                change: '',
                accent: 'bg-blue-600',
                icon: UserRoundCog,
            },
            {
                title: 'Response Rate',
                value:
                    responseRate === null || responseRate === undefined
                        ? 'N/A'
                        : `${responseRate}%`,
                change: '',
                accent: 'bg-emerald-600',
                icon: ThumbsUp,
            },
            {
                title: 'Average Rating',
                value:
                    averageRating === null || averageRating === undefined
                        ? 'N/A'
                        : String(averageRating),
                change: '',
                accent: 'bg-amber-500',
                icon: UserRoundCog,
            },
            {
                title: 'Positive Feedback',
                value: positiveFeedback,
                change: '',
                accent: 'bg-emerald-600',
                icon: ThumbsUp,
            },
            {
                title: 'Negative Feedback',
                value: negativeFeedback,
                change: '',
                accent: 'bg-rose-500',
                icon: ThumbsDown,
            },
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
                router.post(
                    adminEvaluationDestroy(evaluation.id),
                    {},
                    {
                        preserveScroll: true,
                    },
                );
            }
        });
    };

    const handleCreateEvaluation = () => {
        setEditingEvaluation(null);
        setEvaluationDialogOpen(true);
    };

    const handleQuickCreateEvaluation = (event: EventOption) => {
        Swal.fire({
            title: 'Generate Evaluation?',
            text: `Generate the standard evaluation for "${event.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Generate',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    adminEvaluationStore(),
                    {
                        name: `${event.name} Evaluation Form`,
                        description: `Standard institutional evaluation form for ${event.name} assessing the presenter, presentation objectives, and participant feedback.`,
                        eventId: event.id,
                        is_active: false,
                        form_data: {
                            questions: DEFAULT_STATIC_QUESTIONS,
                        },
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Evaluation Generated!',
                                text: `Standard evaluation generated for ${event.name}. You can preview, edit, or publish it.`,
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: (err) => {
                            console.error('Failed to generate evaluation:', err);
                            Swal.fire({
                                icon: 'error',
                                title: 'Failed to generate evaluation',
                                text: 'Please check your connection and try again.',
                            });
                        },
                    },
                );
            }
        });
    };

    const handleOpenCreateForEvent = (event: EventOption) => {
        setInitialFormState({
            name: `${event.name} Evaluation Form`,
            description: `Standard institutional evaluation form for ${event.name} assessing the presenter, presentation objectives, and participant feedback.`,
            eventId: String(event.id),
            is_active: false,
            form_data: {
                questions: DEFAULT_STATIC_QUESTIONS,
            },
        });
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
                router.post(
                    adminEvaluationPublish(evaluation.id),
                    {},
                    { preserveScroll: true },
                );
            }
        });
    };

    const handleUnpublish = (evaluation: EvaluationForm) => {
        router.post(
            adminEvaluationUnpublish(evaluation.id),
            {},
            { preserveScroll: true },
        );
    };

    const handleApproveProgram = (
        evaluation: EvaluationForm,
        program: string,
    ) => {
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
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            // After approval, refresh metrics if the dialog is open
                            router.reload({ only: ['programStats'] });
                        },
                    },
                );
            }
        });
    };

    const primaryEvaluation = useMemo(() => {
        if (!selectedEventId) return null;
        return (
            evaluations.find((e) => e.event_id === selectedEventId) ??
            evaluations[0] ??
            null
        );
    }, [evaluations, selectedEventId]);

    const handleDownloadQR = async (evaluation: EvaluationForm) => {
        try {
            const evaluationUrl = `${window.location.origin}${studentEvaluationShow(evaluation.id)}`;

            const qrCodeDataUrl = await QRCode.toDataURL(evaluationUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
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
                            {/* ── Hero Header ── */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                                <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                                <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                                <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                            <UserRoundCog className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black tracking-tight text-white">
                                                Evaluation System
                                            </h1>
                                            <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                                Track evaluation forms, survey
                                                responses, and student feedback
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        className="h-11 gap-2 self-start rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg sm:self-auto"
                                        onClick={handleCreateEvaluation}
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                        Add Evaluation
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
                                handlePreviewEvaluation={
                                    handlePreviewEvaluation
                                }
                                handleEditEvaluation={handleEditEvaluation}
                                handleArchiveEvaluation={
                                    handleArchiveEvaluation
                                }
                                handleQuickCreateEvaluation={
                                    handleQuickCreateEvaluation
                                }
                                handleOpenCreateForEvent={
                                    handleOpenCreateForEvent
                                }
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
                            questions: data.questions,
                        },
                    });
                    setEditingEvaluation(null);
                    setEvaluationDialogOpen(true);
                }}
            />
        </AdminLayout>
    );
}
