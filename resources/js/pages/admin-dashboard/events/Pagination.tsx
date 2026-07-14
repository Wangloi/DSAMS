type Props = {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
};

export default function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}: Props) {
    const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
    const endItem = Math.min(clampedPage * pageSize, totalItems);

    return (
        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
                Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                    <div className="text-slate-600 dark:text-slate-400">Show</div>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value) || 5)}
                        className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="rounded-md px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }).slice(0, 3).map((_, idx) => {
                        const page = idx + 1;
                        return (
                            <button
                                key={page}
                                type="button"
                                className={`rounded-md px-2 py-1 ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        );
                    })}
                    {totalPages > 3 && (
                        <>
                            <span className="text-slate-400">...</span>
                            <button
                                type="button"
                                className={`rounded-md px-2 py-1 ${
                                    currentPage === totalPages
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                                onClick={() => onPageChange(totalPages)}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="rounded-md px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
