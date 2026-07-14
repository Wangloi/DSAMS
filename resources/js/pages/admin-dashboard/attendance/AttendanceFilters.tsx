import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type DateRange = {
    start: string;
    end: string;
};

type Props = {
    dateRange: DateRange;
    setDateRange: (range: DateRange | ((prev: DateRange) => DateRange)) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
};

export default function AttendanceFilters({ 
    dateRange, 
    setDateRange, 
    searchQuery, 
    setSearchQuery 
}: Props) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span>Date:</span>
                    <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                        className="h-9 w-[160px] border border-slate-200 bg-white"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span>To:</span>
                    <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                        className="h-9 w-[160px] border border-slate-200 bg-white"
                    />
                </div>
            </div>

            <div className="relative w-full sm:ml-auto sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search"
                    className="h-9 w-full border border-slate-200 bg-white pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
}
