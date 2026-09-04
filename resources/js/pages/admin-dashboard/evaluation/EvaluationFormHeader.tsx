import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { adminEvaluation } from '@/routes';
import { Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { EvaluationForm } from './types';

export default function EvaluationFormHeader({
    onClose,
    editingEvaluation,
    previewMode,
    onTogglePreview,
}: {
    onClose: () => void;
    editingEvaluation: EvaluationForm | null;
    previewMode: boolean;
    onTogglePreview: () => void;
}) {
    return (
        <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="leading-tight">
                        <Breadcrumb>
                            <BreadcrumbList className="text-white/80">
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        asChild
                                        className="text-white/80 hover:text-white"
                                    >
                                        <Link href={adminEvaluation()}>
                                            Evaluation
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="text-lg font-semibold">
                            {editingEvaluation
                                ? 'Edit Evaluation'
                                : 'Setup Evaluation'}
                        </div>
                        <div className="text-sm text-white/80">
                            {editingEvaluation
                                ? 'Update the evaluation details and questions.'
                                : 'Configure the evaluation for your event attendees.'}
                        </div>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={onTogglePreview}
                    className="flex items-center gap-2 bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                    {previewMode ? (
                        <>
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            Edit Mode
                        </>
                    ) : (
                        <>
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            Preview
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
