import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TypeFilter, StatusFilter } from './types';

type Props = {
    typeFilter: TypeFilter;
    statusFilter: StatusFilter;
    searchQuery: string;
    onTypeFilterChange: (value: TypeFilter) => void;
    onStatusFilterChange: (value: StatusFilter) => void;
    onSearchChange: (value: string) => void;
};

export default function IncidentFilters({
    typeFilter,
    statusFilter,
    searchQuery,
    onTypeFilterChange,
    onStatusFilterChange,
    onSearchChange,
}: Props) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
                <div className="text-xs font-semibold text-slate-600">Type:</div>
                <select
                    value={typeFilter}
                    onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-52"
                >
                    <option value="all">All</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                </select>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto">
                <div className="text-xs font-semibold text-slate-600">Status:</div>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-52"
                >
                    <option value="all">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                </select>
            </div>

            <div className="relative w-full sm:ml-auto sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="h-10 border-slate-200 bg-white pl-9"
                />
            </div>
        </div>
    );
}
