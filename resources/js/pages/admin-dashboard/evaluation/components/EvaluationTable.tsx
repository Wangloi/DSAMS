import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adminEvaluationMetrics } from '@/routes';
import { Link } from '@inertiajs/react';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    Archive,
    BarChart3,
    Eye,
    Pencil,
    PlusCircle,
    Search,
    Send,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
    handleQuickCreateEvaluation?: (event: EventOption) => void;
    handleOpenCreateForEvent?: (event: EventOption) => void;
}

export default function EvaluationTable({
    evaluations,
    events,
    handlePublish,
    handleUnpublish,
    handlePreviewEvaluation,
    handleEditEvaluation,
    handleArchiveEvaluation,
    handleQuickCreateEvaluation,
    handleOpenCreateForEvent,
}: EvaluationTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const evaluation = evaluations.find((e) => e.event_id === event.id);
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return (
                event.name.toLowerCase().includes(q) ||
                (evaluation?.name && evaluation.name.toLowerCase().includes(q))
            );
        });
    }, [events, evaluations, searchQuery]);

    useEffect(() => {
        setPageIndex(1);
    }, [searchQuery]);

    const totalItems = filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const clampedPage = Math.min(Math.max(pageIndex, 1), totalPages);

    const pagedEvents = useMemo(() => {
        const start = (clampedPage - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, clampedPage, pageSize]);

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
                    <table className="w-full min-w-max border-collapse">
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
                                    Evaluation
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
                                pagedEvents.map((event) => {
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
                                            onKeyDown={(e) => {
                                                if ((e.key === 'Enter' || e.key === ' ') && evaluation) {
                                                    e.preventDefault();
                                                    handlePreviewEvaluation(evaluation);
                                                }
                                            }}
                                            tabIndex={evaluation ? 0 : undefined}
                                            role={evaluation ? 'button' : undefined}
                                            aria-label={evaluation ? `View evaluation preview for ${event.name}` : undefined}
                                            className={
                                                evaluation
                                                    ? 'cursor-pointer transition-colors duration-150 hover:bg-blue-50/80 dark:hover:bg-slate-800 dark:hover:bg-blue-950/60 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50'
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
                                                {evaluation?.name ? (
                                                    evaluation.name
                                                ) : (
                                                    <span className="italic text-slate-400 dark:text-slate-500">
                                                        No Evaluation Set
                                                    </span>
                                                )}
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
                                                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        Not Set
                                                    </Badge>
                                                )}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                onKeyDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="ml-auto flex w-fit items-center justify-end gap-1 rounded-lg border border-slate-100/50 bg-slate-50/50 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                                    {evaluation ? (
                                                        <>
                                                            <SimpleTooltip content="View Metrics">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-cyan-600 transition-all duration-200 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={adminEvaluationMetrics(
                                                                            evaluation.id,
                                                                        )}
                                                                        aria-label="View Metrics"
                                                                    >
                                                                        <BarChart3 className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </SimpleTooltip>

                                                            {evaluation &&
                                                            !evaluation.is_active ? (
                                                                <SimpleTooltip content="Publish Evaluation">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-md text-emerald-600 transition-all duration-200 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                        onClick={() =>
                                                                            handlePublish(
                                                                                evaluation,
                                                                            )
                                                                        }
                                                                        aria-label="Publish Evaluation"
                                                                    >
                                                                        <Send className="h-4 w-4" />
                                                                    </Button>
                                                                </SimpleTooltip>
                                                            ) : (
                                                                <SimpleTooltip content="Unpublish Evaluation">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-md text-rose-600 transition-all duration-200 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                        onClick={() =>
                                                                            handleUnpublish(
                                                                                evaluation,
                                                                            )
                                                                        }
                                                                        aria-label="Unpublish Evaluation"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </SimpleTooltip>
                                                            )}

                                                            <SimpleTooltip content="Preview Form">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-blue-600 transition-all duration-200 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                                                    onClick={() =>
                                                                        handlePreviewEvaluation(
                                                                            evaluation,
                                                                        )
                                                                    }
                                                                    aria-label="View Details"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>

                                                            <SimpleTooltip content="Edit Form">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-amber-600 transition-all duration-200 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                                    onClick={() =>
                                                                        handleEditEvaluation(
                                                                            evaluation,
                                                                        )
                                                                    }
                                                                    aria-label="Edit Form"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>

                                                            <SimpleTooltip content="Archive Evaluation">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-orange-600 transition-all duration-200 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                                                                    onClick={() =>
                                                                        handleArchiveEvaluation(
                                                                            evaluation,
                                                                        )
                                                                    }
                                                                    aria-label="Archive Evaluation"
                                                                >
                                                                    <Archive className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="h-7 gap-1 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                                                                onClick={() =>
                                                                    handleQuickCreateEvaluation?.(
                                                                        event,
                                                                    )
                                                                }
                                                                title="Generate standard evaluation for this event"
                                                            >
                                                                <PlusCircle className="h-3.5 w-3.5" />
                                                                <span>Generate</span>
                                                            </Button>
                                                            {handleOpenCreateForEvent && (
                                                                <SimpleTooltip content="Configure Evaluation">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 rounded-md text-amber-600 transition-all duration-200 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                                        onClick={() =>
                                                                            handleOpenCreateForEvent(
                                                                                event,
                                                                            )
                                                                        }
                                                                        aria-label="Configure Evaluation"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </SimpleTooltip>
                                                            )}
                                                        </div>
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

                <div className="flex flex-col gap-3 border-t border-slate-100 p-3.5 sm:px-6 sm:py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] sm:text-xs">Rows:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPageIndex(1);
                                }}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="hidden sm:inline text-slate-400 dark:text-slate-600">|</span>
                        <span className="text-[11px] sm:text-xs">
                            Showing{' '}
                            {totalItems === 0
                                ? 0
                                : (clampedPage - 1) * pageSize + 1}{' '}
                            to {Math.min(clampedPage * pageSize, totalItems)} of {totalItems} entries
                        </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-end gap-1">
                        <button
                            type="button"
                            className="rounded-md px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                            onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                            disabled={clampedPage <= 1}
                        >
                            Prev
                        </button>
                        {(() => {
                            let startPage = Math.max(1, clampedPage - 1);
                            let endPage = Math.min(totalPages, startPage + 2);
                            if (endPage - startPage < 2) {
                                startPage = Math.max(1, endPage - 2);
                            }
                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }
                            return pages.map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setPageIndex(num)}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                                        clampedPage === num
                                            ? 'bg-[#23509A] text-white dark:bg-blue-600 font-bold'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                    )}
                                >
                                    {num}
                                </button>
                            ));
                        })()}
                        <button
                            type="button"
                            className="rounded-md px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                            onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                            disabled={clampedPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
