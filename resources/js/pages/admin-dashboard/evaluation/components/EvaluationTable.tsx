import React from 'react';
import { Link } from '@inertiajs/react';
import { adminEvaluationMetrics } from '@/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Download, Eye, Pencil, QrCode, Send, XCircle, BarChart3 } from 'lucide-react';
import { EvaluationForm, EventOption } from './types';

interface EvaluationTableProps {
    evaluations: EvaluationForm[];
    events: EventOption[];
    handlePublish: (evaluation: EvaluationForm) => void;
    handleUnpublish: (evaluation: EvaluationForm) => void;
    handleDownloadQR: (evaluation: EvaluationForm) => void;
    handlePreviewEvaluation: (evaluation: EvaluationForm) => void;
    handleEditEvaluation: (evaluation: EvaluationForm) => void;
    handleArchiveEvaluation: (evaluation: EvaluationForm) => void;
}

export default function EvaluationTable({
    evaluations,
    events,
    handlePublish,
    handleUnpublish,
    handleDownloadQR,
    handlePreviewEvaluation,
    handleEditEvaluation,
    handleArchiveEvaluation,
}: EvaluationTableProps) {
    return (
        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                            Events
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                    <table className="min-w-full border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Event Name
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Date & Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                            {events.map((event) => {
                                const evaluation = evaluations.find((e) => e.event_id === event.id);
                                const initials = (event.name || 'EV')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <tr key={event.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#1e40af] dark:text-white dark:hover:text-blue-400">
                                                        {event.name}
                                                    </span>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {evaluation?.name || 'No Evaluation Form'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {event.date} {event.time}
                                                </span>
                                                <div>
                                                    {evaluation ? (
                                                        evaluation.is_active ? (
                                                            <Badge className="bg-emerald-600 hover:bg-emerald-600">Published</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Draft</Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="outline" className="text-slate-400">No Form</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                {evaluation ? (
                                                    <>
                                                        <Link href={adminEvaluationMetrics(evaluation.id)}>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                                                                title="View Metrics"
                                                            >
                                                                <BarChart3 className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        {evaluation && !evaluation.is_active ? (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                                                                onClick={() => handlePublish(evaluation)}
                                                                title="Publish Evaluation"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                                                                onClick={() => handleUnpublish(evaluation)}
                                                                title="Unpublish Evaluation"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-sky-50 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
                                                            onClick={() => handleDownloadQR(evaluation)}
                                                            title="Download QR Code"
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                            onClick={() => handlePreviewEvaluation(evaluation)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                                                            onClick={() => handleEditEvaluation(evaluation)}
                                                            title="Edit Form"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                            onClick={() => handleArchiveEvaluation(evaluation)}
                                                            title="Archive Evaluation"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md text-slate-300 cursor-not-allowed"
                                                        disabled
                                                    >
                                                        <BarChart3 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}