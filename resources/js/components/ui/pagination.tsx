import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

export default function Pagination({ 
    currentPage, 
    totalPages, 
    pageSize, 
    totalItems, 
    onPageChange, 
    onPageSizeChange 
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700/80">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing {startItem} to {endItem} of {totalItems} entries
            </div>

            <div className="flex items-center gap-4">
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Show
                        </span>

                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() =>
                            onPageChange(
                                Math.max(1, currentPage - 1),
                            )
                        }
                        disabled={currentPage === 1}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            currentPage === 1
                                ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                    >
                        Prev
                    </button>

                    {Array.from(
                        { length: totalPages },
                        (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() =>
                                    onPageChange(i + 1)
                                }
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                    currentPage === i + 1
                                        ? 'bg-[#1e40af] text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ),
                    )}

                    <button
                        onClick={() =>
                            onPageChange(
                                Math.min(
                                    totalPages,
                                    currentPage + 1,
                                ),
                            )
                        }
                        disabled={currentPage === totalPages}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            currentPage === totalPages
                                ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
