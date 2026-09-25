import React, { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
    Award,
    CheckCircle2,
    ChevronDown,
    Eye,
    GraduationCap,
    Pencil,
    Plus,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react';
import type { ProgramRow, UserRow } from './types';
import { getProgramBadgeClass } from './ManageUsersTableCard';

interface ManageProgramHeadsTabProps {
    programHeads: UserRow[];
    programs: ProgramRow[];
    availablePrograms?: string[];
    onOpenCreatePHModal: () => void;
    onViewProgramHead: (user: UserRow) => void;
    onEditProgramHead: (user: UserRow) => void;
    onDeleteProgramHead: (user: UserRow) => void;
    onApproveProgramHead: (phId: number) => void;
    onRejectProgramHead: (phId: number) => void;
    onSetPendingProgramHead: (phId: number) => void;
    getInitials: (name: string) => string;
}

export function formatLastNameFirst(user: {
    name?: string;
    first_name?: string | null;
    last_name?: string | null;
    middle_name?: string | null;
}): string {
    if (user.last_name && user.first_name) {
        const middle = user.middle_name ? ` ${user.middle_name}` : '';
        return `${user.last_name}, ${user.first_name}${middle}`;
    }
    if (!user.name) return '';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length <= 1) return user.name;
    const lastName = parts.pop();
    const firstNames = parts.join(' ');
    return `${lastName}, ${firstNames}`;
}

export function ManageProgramHeadsTab({
    programHeads,
    programs,
    availablePrograms = [],
    onOpenCreatePHModal,
    onViewProgramHead,
    onEditProgramHead,
    onDeleteProgramHead,
    onApproveProgramHead,
    onRejectProgramHead,
    onSetPendingProgramHead,
    getInitials,
}: ManageProgramHeadsTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    // Filter program heads
    const filteredProgramHeads = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return programHeads.filter((ph) => {
            const matchesSearch =
                !q ||
                [ph.name, ph.email, ph.program, ph.course, ph.student_id]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q);

            const phProg = String(ph.program || ph.course || '').trim().toLowerCase();
            const matchesProgram =
                programFilter === 'all' || phProg === programFilter.trim().toLowerCase();

            return matchesSearch && matchesProgram;
        }).sort((a, b) => {
            const nameA = (a.last_name || a.name || '').trim().toLowerCase();
            const nameB = (b.last_name || b.name || '').trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [programHeads, searchQuery, programFilter]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredProgramHeads.length / pageSize));
    const clampedPageIndex = Math.min(Math.max(pageIndex, 1), totalPages);

    const pagedProgramHeads = useMemo(() => {
        const start = (clampedPageIndex - 1) * pageSize;
        return filteredProgramHeads.slice(start, start + pageSize);
    }, [filteredProgramHeads, clampedPageIndex, pageSize]);

    // Available program options for filter dropdown
    const programOptions = useMemo(() => {
        const set = new Set<string>();
        programs.forEach((p) => {
            if (p.code) set.add(p.code);
        });
        availablePrograms.forEach((c) => {
            if (c) set.add(c);
        });
        programHeads.forEach((ph) => {
            const prog = ph.program || ph.course;
            if (prog) set.add(prog);
        });
        return Array.from(set).sort();
    }, [programs, availablePrograms, programHeads]);

    // Statistics
    const stats = useMemo(() => {
        const total = programHeads.length;
        const approved = programHeads.filter((ph) => (ph.status ?? 'pending') === 'approved').length;
        const assignedPrograms = new Set(
            programHeads.map((ph) => ph.program || ph.course).filter(Boolean),
        ).size;

        return { total, approved, assignedPrograms };
    }, [programHeads]);

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        const pageIds = pagedProgramHeads
            .map((u) => Number(u.id))
            .filter((id) => !Number.isNaN(id));
        if (checked) {
            setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        } else {
            setSelectedUserIds((prev) => prev.filter((id) => !pageIds.includes(id)));
        }
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedUserIds((prev) => [...prev, id]);
        } else {
            setSelectedUserIds((prev) => prev.filter((i) => i !== id));
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ── Stats Cards in DSAMS Style ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Total Personnels
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {stats.total}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Academic Leaders
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Verified / Approved
                            </p>
                            <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">
                                {stats.approved}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                Active Leadership Access
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                            style={{
                                width: stats.total > 0 ? `${(stats.approved / stats.total) * 100}%` : '0%',
                            }}
                        />
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Programs Covered
                            </p>
                            <p className="mt-2 text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                {stats.assignedPrograms}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Department Representation
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400 dark:ring-indigo-900/30">
                            <Award className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" />
                    </div>
                </div>
            </div>

            {/* ── Table Card matching ManageUsersTableCard structure ── */}
            <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                <CardHeader className="p-2.5 px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">
                                Personnels List
                            </CardTitle>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Total: {programHeads.length} personnels
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Search */}
                            <div className="relative min-w-[180px] sm:w-[220px]">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search personnel..."
                                    className="h-8.5 border border-slate-200 bg-white pl-8 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>


                            {/* Program Filter */}
                            <Select
                                value={programFilter}
                                onValueChange={(v) => {
                                    setProgramFilter(v);
                                    setPageIndex(1);
                                }}
                            >
                                <SelectTrigger className="h-8.5 w-[140px] border border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                    <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programs</SelectItem>
                                    {programOptions.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Add Personnel Button */}
                            <Button
                                type="button"
                                className="h-8.5 gap-1.5 bg-[#1e3a8a] text-xs font-bold text-white shadow-sm hover:bg-blue-900"
                                onClick={onOpenCreatePHModal}
                            >
                                <Plus className="h-4 w-4" />
                                Add Personnel
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {selectedUserIds.length > 0 && (
                    <div className="flex items-center justify-between border-y border-emerald-200 bg-emerald-50/50 px-6 py-3 transition-all dark:border-emerald-800/30 dark:bg-emerald-900/10">
                        <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                            {selectedUserIds.length} personnel(s) selected
                        </div>
                        <div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setSelectedUserIds([])}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                )}

                <CardContent className={selectedUserIds.length > 0 ? 'pt-4' : ''}>
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max border-collapse text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                    <tr>
                                        <th className="w-16 px-4 py-4">
                                            <Checkbox
                                                checked={
                                                    pagedProgramHeads.length > 0 &&
                                                    pagedProgramHeads.every((u) =>
                                                        selectedUserIds.includes(Number(u.id)),
                                                    )
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleSelectAll(checked as boolean)
                                                }
                                                aria-label="Select all"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                            User ID
                                        </th>
                                        <th className="min-w-[260px] px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                            Full Name
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                            Department / Program
                                        </th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pagedProgramHeads.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                            >
                                                No personnels found.
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedProgramHeads.map((u) => {
                                            const rawPhId = Number((u as any)?.program_head_id || u.id);
                                            const phId = rawPhId >= 1000000000 ? rawPhId - 1000000000 : rawPhId;
                                            const status = (u.status ?? 'pending').toLowerCase();
                                            const assignedProg = u.program || u.course || '—';

                                            return (
                                                <tr
                                                    key={u.id}
                                                    onClick={() => onViewProgramHead(u)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            onViewProgramHead(u);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`View details for ${u.name}`}
                                                    className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/80 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50 dark:hover:bg-slate-800 dark:hover:bg-blue-950/60"
                                                >
                                                    <td
                                                        className="px-4 py-4"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    >
                                                        <Checkbox
                                                            checked={selectedUserIds.includes(Number(u.id))}
                                                            onCheckedChange={(checked) =>
                                                                handleSelectRow(Number(u.id), checked as boolean)
                                                            }
                                                            aria-label={`Select ${u.name}`}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                        {u.student_id || `PH-${phId}`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-10 ring-2 ring-white dark:ring-slate-800">
                                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white shadow-inner">
                                                                    {getInitials(u.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white">
                                                                    {formatLastNameFirst(u)}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    {u.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.role === 'Instructor' ? (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-emerald-700 uppercase dark:bg-emerald-950/50 dark:text-emerald-300">
                                                                Instructor
                                                            </span>
                                                        ) : u.role === 'Offices' ? (
                                                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-purple-700 uppercase dark:bg-purple-950/50 dark:text-purple-300">
                                                                Offices
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-tight text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                                                                {u.role ?? 'Program Head'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {assignedProg !== '—' ? (
                                                            <span
                                                                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold tracking-tight ${getProgramBadgeClass(
                                                                    assignedProg,
                                                                )}`}
                                                            >
                                                                {assignedProg}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>

                                                    <td
                                                        className="px-4 py-3 text-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Approve / Reject Quick Action */}
                                                            {status === 'pending' && (
                                                                <>
                                                                    <SimpleTooltip content="Approve Account">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-md text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                            onClick={() => onApproveProgramHead(phId)}
                                                                            aria-label="Approve"
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </SimpleTooltip>
                                                                    <SimpleTooltip content="Reject Account">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-md text-rose-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                            onClick={() => onRejectProgramHead(phId)}
                                                                            aria-label="Reject"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </SimpleTooltip>
                                                                </>
                                                            )}

                                                            {status === 'rejected' && (
                                                                <SimpleTooltip content="Re-approve Account">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-md text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                                                        onClick={() => onApproveProgramHead(phId)}
                                                                        aria-label="Re-approve"
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </Button>
                                                                </SimpleTooltip>
                                                            )}

                                                            {/* View User Details */}
                                                            <SimpleTooltip content="View Program Head Details">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                                                                    onClick={() => onViewProgramHead(u)}
                                                                    aria-label="View"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>

                                                            {/* Edit User */}
                                                            <SimpleTooltip content="Edit Program Head">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-amber-600 transition-all duration-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                                                                    onClick={() => onEditProgramHead(u)}
                                                                    aria-label="Edit"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>

                                                            {/* Delete User */}
                                                            <SimpleTooltip content="Delete Program Head">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-md text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                                                    onClick={() => onDeleteProgramHead(u)}
                                                                    aria-label="Delete"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </SimpleTooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination matching Student table */}
                    <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span>Rows per page:</span>
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
                            <span className="text-slate-400 dark:text-slate-600">|</span>
                            <span>
                                Showing{' '}
                                {filteredProgramHeads.length === 0
                                    ? 0
                                    : (Math.min(Math.max(pageIndex, 1), totalPages) - 1) * pageSize + 1}{' '}
                                to{' '}
                                {Math.min(
                                    Math.min(Math.max(pageIndex, 1), totalPages) * pageSize,
                                    filteredProgramHeads.length,
                                )}{' '}
                                of {filteredProgramHeads.length} entries
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                                disabled={pageIndex <= 1}
                            >
                                Prev
                            </button>
                            {(() => {
                                let startPage = Math.max(1, pageIndex - 1);
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
                                        className={
                                            'rounded-md px-2 py-1 ' +
                                            (pageIndex === num
                                                ? 'bg-[#23509A] text-white dark:bg-blue-600'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800')
                                        }
                                    >
                                        {num}
                                    </button>
                                ));
                            })()}
                            <button
                                type="button"
                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                                disabled={pageIndex >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
