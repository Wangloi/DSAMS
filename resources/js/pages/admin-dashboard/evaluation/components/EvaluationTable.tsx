import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Download, Eye, LayoutGrid, Pencil, QrCode, Send, XCircle } from 'lucide-react';
import { EvaluationForm, EventOption } from './types';

interface EvaluationTableProps {
    evaluations: EvaluationForm[];
    evaluationForms: Array<{ id: string; name: string; event: string }>;
    events: EventOption[];
    eventFilter: string;
    setEventFilter: (value: string) => void;
    handlePublish: (evaluation: EvaluationForm) => void;
    handleUnpublish: (evaluation: EvaluationForm) => void;
    handleDownloadQR: (evaluation: EvaluationForm) => void;
    handlePreviewEvaluation: (evaluation: EvaluationForm) => void;
    handleEditEvaluation: (evaluation: EvaluationForm) => void;
    handleArchiveEvaluation: (evaluation: EvaluationForm) => void;
}

export default function EvaluationTable({
    evaluations,
    evaluationForms,
    events,
    eventFilter,
    setEventFilter,
    handlePublish,
    handleUnpublish,
    handleDownloadQR,
    handlePreviewEvaluation,
    handleEditEvaluation,
    handleArchiveEvaluation,
}: EvaluationTableProps) {
    return (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Event Organization</CardTitle>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Manage feedback forms for specific events</div>
                        </div>
                    </div>

                    <Select value={eventFilter} onValueChange={setEventFilter}>
                        <SelectTrigger className="h-9 min-w-[240px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                            <SelectValue placeholder="All Events" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map((event) => (
                                <SelectItem key={event.id} value={event.id.toString()}>
                                    {event.name} ({event.date})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            {/* Active Filter Indicator */}
            {eventFilter && eventFilter !== 'all' && (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Filtered by:</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                        {events.find((e) => e.id.toString() === eventFilter)?.name ?? 'Selected Event'}
                    </span>
                    <button
                        type="button"
                        onClick={() => setEventFilter('all')}
                        className="ml-auto text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline underline-offset-2 transition-colors"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            <CardContent>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B192C]/50">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Form Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">QR Code</th>
                                <th className="px-4 py-3">Event Association</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {evaluationForms.map((f) => {
                                const evaluation = evaluations.find((e) => e.id.toString() === f.id);
                                return (
                                    <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{f.name}</div>
                                            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                {evaluation?.created_at
                                                    ? `CREATED ${new Date(evaluation.created_at)
                                                          .toLocaleDateString('en-US', {
                                                              month: 'short',
                                                              day: '2-digit',
                                                              year: 'numeric',
                                                          })
                                                          .toUpperCase()}`
                                                    : ''}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {evaluation?.is_active ? (
                                                <Badge className="bg-emerald-600 hover:bg-emerald-600">Published</Badge>
                                            ) : (
                                                <Badge variant="outline">Draft</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <QrCode className="h-4 w-4" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {f.event}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {evaluation && !evaluation.is_active ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => handlePublish(evaluation)}
                                                    >
                                                        <Send className="h-3.5 w-3.5" />
                                                        Publish
                                                    </Button>
                                                ) : null}
                                                {evaluation?.is_active ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 gap-1 text-amber-700"
                                                        onClick={() => handleUnpublish(evaluation)}
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Unpublish
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-2 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    onClick={() => evaluation && handleDownloadQR(evaluation)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    onClick={() => evaluation && handlePreviewEvaluation(evaluation)}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    onClick={() => evaluation && handleEditEvaluation(evaluation)}
                                                    title="Edit form"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-amber-700 hover:text-amber-800 border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 backdrop-blur-sm hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                                    onClick={() => evaluation && handleArchiveEvaluation(evaluation)}
                                                    title="Archive form"
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
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
