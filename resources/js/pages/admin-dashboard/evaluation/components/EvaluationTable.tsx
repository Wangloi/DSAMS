import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adminEvaluationMetrics } from '@/routes';
import { Link } from '@inertiajs/react';
import {
    Archive,
    BarChart3,
    Eye,
    Pencil,
    Search,
    Send,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { EvaluationForm, EventOption } from './types';

interface EvaluationTableProps {
    evaluations: EvaluationForm[];
    events: EventOption[];
    handlePublish: (evaluation: EvaluationForm) => void;
    handleUnpublish: (evaluation: EvaluationForm) => void;
    handleDownloadQR?: (evaluation: EvaluationForm) => void;
    handlePreviewEvaluation: (evaluation: EvaluationForm) => void;
    handleEditEvaluation: (evaluation: EvaluationForm) => void;
    handleArchiveEvaluation: (evaluation: EvaluationForm) => void;
}

export default function EvaluationTable({
    evaluations,
    events,
    handlePublish,
    handleUnpublish,
    handlePreviewEvaluation,
    handleEditEvaluation,
    handleArchiveEvaluation,
}: EvaluationTableProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEvents = events.filter((event) => {
        const evaluation = evaluations.find((e) => e.event_id === event.id);
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            event.name.toLowerCase().includes(q) ||
            (evaluation?.name && evaluation.name.toLowerCase().includes(q))
        );
    });

    return (
        <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                            Evaluation Forms
                        </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search evaluations..."
                                className="h-9 w-48 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs font-medium focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
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
                                    Evaluation Form
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Date & Time
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase"
                                >
                                    Status
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
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                    >
                                        No evaluations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((event) => {
                                    const evaluation = evaluations.find(
                                        (e) => e.event_id === event.id,
                                    );
                                    const initials = (event.name || 'EV')
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <tr
                                            key={event.id}
                                            onClick={() => {
                                                if (evaluation) {
                                                    handlePreviewEvaluation(
                                                        evaluation,
                                                    );
                                                }
                                            }}
                                            className={
                                                evaluation
                                                    ? 'cursor-pointer transition-colors duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-950/15'
                                                    : 'transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                                            }
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                        {initials}
                                                    </div>
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {event.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {evaluation?.name ||
                                                    'No Evaluation Form'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {event.date} {event.time}
                                            </td>
                                            <td className="px-6 py-4">
                                                {evaluation ? (
                                                    evaluation.is_active ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Published
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                            Draft
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                                        No Form
                                                    </Badge>
                                                )}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                    {evaluation ? (
                                                        <>
                                                            <Link
                                                                href={adminEvaluationMetrics(
                                                                    evaluation.id,
                                                                )}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                                                                    title="View Metrics"
                                                                    aria-label="View Metrics"
                                                                >
                                                                    <BarChart3 className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            {evaluation &&
                                                            !evaluation.is_active ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                                                                    onClick={() =>
                                                                        handlePublish(
                                                                            evaluation,
                                                                        )
                                                                    }
                                                                    title="Publish Evaluation"
                                                                    aria-label="Publish Evaluation"
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                                                                    onClick={() =>
                                                                        handleUnpublish(
                                                                            evaluation,
                                                                        )
                                                                    }
                                                                    title="Unpublish Evaluation"
                                                                    aria-label="Unpublish Evaluation"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                                onClick={() =>
                                                                    handlePreviewEvaluation(
                                                                        evaluation,
                                                                    )
                                                                }
                                                                title="View Details"
                                                                aria-label="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-slate-500 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                                                                onClick={() =>
                                                                    handleEditEvaluation(
                                                                        evaluation,
                                                                    )
                                                                }
                                                                title="Edit Form"
                                                                aria-label="Edit Form"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                                                                onClick={() =>
                                                                    handleArchiveEvaluation(
                                                                        evaluation,
                                                                    )
                                                                }
                                                                title="Archive Evaluation"
                                                                aria-label="Archive Evaluation"
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 cursor-not-allowed rounded-md text-slate-300"
                                                            disabled
                                                        >
                                                            <BarChart3 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
