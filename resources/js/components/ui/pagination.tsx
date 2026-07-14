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
    <div className="flex items-center justify-between border-t border-slate-700 px-4 py-4">
        <div className="text-sm text-slate-400">
            Showing {startItem} to {endItem} of {totalItems} entries
        </div>

        <div className="flex items-center gap-6">
            {onPageSizeChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">
                        Show
                    </span>

                    <select
                        value={pageSize}
                        onChange={(e) =>
                            onPageSizeChange(Number(e.target.value))
                        }
                        className="h-10 rounded-lg border border-slate-600 bg-[#1b2c4a] px-3 text-white"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() =>
                        onPageChange(
                            Math.max(1, currentPage - 1),
                        )
                    }
                    disabled={currentPage === 1}
                    className={`text-sm ${
                        currentPage === 1
                            ? 'cursor-not-allowed text-slate-600'
                            : 'text-slate-300 hover:text-white'
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
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                                currentPage === i + 1
                                    ? 'bg-[#23509A] text-white'
                                    : 'text-slate-300 hover:bg-slate-700'
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
                    className={`text-sm ${
                        currentPage === totalPages
                            ? 'cursor-not-allowed text-slate-600'
                            : 'text-slate-300 hover:text-white'
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    </div>
);
}
