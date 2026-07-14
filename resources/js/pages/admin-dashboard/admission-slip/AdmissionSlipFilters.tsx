import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = {
    activeTab: 'all' | 'pending' | 'approved' | 'rejected';
    searchQuery: string;
    onTabChange: (value: 'all' | 'pending' | 'approved' | 'rejected') => void;
    onSearchChange: (value: string) => void;
};

export default function AdmissionSlipFilters({
    activeTab,
    searchQuery,
    onTabChange,
    onSearchChange,
}: Props) {
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="h-9 w-full border-slate-200 bg-white pl-9 text-sm"
                />
            </div>

            <Select
                value={activeTab}
                onValueChange={(v) => onTabChange(v as 'all' | 'pending' | 'approved' | 'rejected')}
            >
                <SelectTrigger className="h-9 w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
