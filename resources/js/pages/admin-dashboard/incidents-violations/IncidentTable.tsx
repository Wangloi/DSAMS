import { router } from '@inertiajs/react';
import { Archive, Eye, Gavel, Pencil, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { IncidentRow, TypeFilter, StatusFilter } from './types';

type Props = {
    incidents: IncidentRow[];
    typeFilter: TypeFilter;
    statusFilter: StatusFilter;
    searchQuery: string;
    onView?: (incident: IncidentRow) => void;
    onViewDetail?: (incident: IncidentRow) => void;
    onEdit?: (incident: IncidentRow) => void;
    onArchive?: (incident: IncidentRow) => void;
    onTypeFilterChange: (value: TypeFilter) => void;
    onStatusFilterChange: (value: StatusFilter) => void;
    onSearchChange: (value: string) => void;
};

export default function IncidentTable({
    incidents,
    typeFilter,
    statusFilter,
    searchQuery,
    onView,
    onViewDetail,
    onEdit,
    onArchive,
    onTypeFilterChange,
    onStatusFilterChange,
    onSearchChange,
}: Props) {
    const statusClassName = (status: IncidentRow['status']) => {
        if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (status === 'Pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        if (status === 'Ongoing') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (status === 'Escalated') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    };

    return (
        <Card className="w-full bg-white dark:bg-[#0B192C]/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Incident List</CardTitle>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Total: {incidents.length} incidents found</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:items-center">
                        <Select
                            value={typeFilter}
                            onValueChange={(value) => onTypeFilterChange(value as TypeFilter)}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="major">Major</SelectItem>
                                <SelectItem value="minor">Minor</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
                                <SelectValue placeholder={statusFilter === 'all' ? 'All Status' : `Status: ${statusFilter}`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Escalated">Escalated</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search incidents..."
                                className="h-9 pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="w-12 px-6 py-4 text-[10px] font-bold uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Case ID</th>
                                <th className="min-w-[260px] px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Violation Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Classification</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {incidents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No incidents found.
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((row, index) => (
                                    <tr key={row.id} className="transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{row.caseId}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                                                    {row.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{row.student}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">ID: {row.studentId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{row.type}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                                                row.classification === 'Major' 
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {row.classification}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-0 ${statusClassName(row.status)}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {onView && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                                                        onClick={() => onView(row)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onViewDetail && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        title="View Disciplinary Case Detail"
                                                        className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                                        onClick={() => onViewDetail(row)}
                                                    >
                                                        <Gavel className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onEdit && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                        onClick={() => onEdit(row)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onArchive && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                        onClick={() => onArchive(row)}
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
