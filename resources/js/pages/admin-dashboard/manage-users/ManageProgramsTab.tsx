import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    adminProgramsArchive,
    adminProgramsStore,
    adminProgramsUnarchive,
} from '@/routes';
import { router, useForm } from '@inertiajs/react';
import { BookOpen, Edit, Eye, Plus, Search, Trash2, Users } from 'lucide-react';
import type { ProgramRow } from './types';

interface ManageProgramsTabProps {
    programs: ProgramRow[];
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
}

export function ManageProgramsTab({
    programs,
    isCreateModalOpen,
    setIsCreateModalOpen,
}: ManageProgramsTabProps) {
    const [progStatusFilter, setProgStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');
    const [progDeptFilter, setProgDeptFilter] = useState<'all' | string>('all');
    const [progSearch, setProgSearch] = useState('');
    const [progPageIndex, setProgPageIndex] = useState(1);
    const [progPageSize, setProgPageSize] = useState(10);

    const {
        data: progData,
        setData: setProgData,
        post: progPost,
        processing: progProcessing,
        errors: progErrors,
        reset: progReset,
    } = useForm({
        name: '',
        code: '',
        department: '',
        description: '',
        duration: '',
        is_active: true,
    });

    function handleProgSubmit(e: React.FormEvent) {
        e.preventDefault();
        progPost(adminProgramsStore(), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                progReset();
            },
        });
    }

    const progFilteredRows = useMemo(() => {
        const q = progSearch.toLowerCase().trim();
        return programs.filter((r) => {
            const matchSearch =
                !q ||
                [r.name, r.code, r.department, r.description]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q);
            const matchStatus =
                progStatusFilter === 'all' || r.status === progStatusFilter;
            const matchDept =
                progDeptFilter === 'all' || r.department === progDeptFilter;
            return matchSearch && matchStatus && matchDept;
        });
    }, [programs, progSearch, progStatusFilter, progDeptFilter]);

    const progTotalPages = Math.max(
        1,
        Math.ceil(progFilteredRows.length / progPageSize),
    );

    const progPagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(progPageIndex, 1), progTotalPages);
        return progFilteredRows.slice(
            (clamped - 1) * progPageSize,
            clamped * progPageSize,
        );
    }, [progFilteredRows, progPageIndex, progTotalPages, progPageSize]);

    const progStats = useMemo(
        () => ({
            total: programs.length,
            active: programs.filter((r) => r.status === 'active').length,
            inactive: programs.filter((r) => r.status === 'inactive').length,
            departments: [...new Set(programs.map((r) => r.department))].length,
        }),
        [programs],
    );

    const progDepartments = useMemo(
        () => [...new Set(programs.map((r) => r.department))].sort(),
        [programs],
    );

    return (
        <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Total Programs
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {progStats.total}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                All Offerings
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Active
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {progStats.active}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                Curriculums
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Inactive
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {progStats.inactive}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                Archived/Disabled
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                    <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-purple-500/5" />
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                Departments
                            </p>
                            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                                {progStats.departments}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                Academic Units
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 ring-1 ring-purple-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-blue-900/30">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600" />
                    </div>
                </div>
            </div>

            {/* Filter Card */}
            <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search program, code, department..."
                                className="h-9 border border-slate-200 bg-white pl-9 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                value={progSearch}
                                onChange={(e) => {
                                    setProgSearch(e.target.value);
                                    setProgPageIndex(1);
                                }}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={progStatusFilter}
                                onValueChange={(v) => {
                                    setProgStatusFilter(v as any);
                                    setProgPageIndex(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[130px] border border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={progDeptFilter}
                                onValueChange={(v) => {
                                    setProgDeptFilter(v);
                                    setProgPageIndex(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px] border border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Departments
                                    </SelectItem>
                                    {progDepartments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Programs grid */}
                    {progPagedRows.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No academic programs found matching your filters.
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {progPagedRows.map((r) => (
                                <Card
                                    key={r.id}
                                    className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-[#0B192C]/50"
                                >
                                    {/* Header banner */}
                                    <div className="relative bg-gradient-to-r from-[#0b2d66] via-[#1e3a8a] to-[#0B4DFF] p-5">
                                        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
                                        <div className="relative z-10">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1">
                                                    <div className="font-mono text-[11px] text-white/90">
                                                        {r.code}
                                                    </div>
                                                </div>
                                                <Badge
                                                    className={
                                                        r.status === 'active'
                                                            ? 'bg-emerald-600 hover:bg-emerald-600'
                                                            : 'bg-amber-500 hover:bg-amber-500'
                                                    }
                                                >
                                                    {r.status}
                                                </Badge>
                                            </div>
                                            <h3 className="mt-3 truncate text-base font-semibold tracking-tight text-white">
                                                {r.name}
                                            </h3>
                                            {r.description ? (
                                                <p className="mt-1 line-clamp-2 text-sm text-white/80">
                                                    {r.description}
                                                </p>
                                            ) : (
                                                <p className="mt-1 line-clamp-2 text-sm text-white/70">
                                                    No description available
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

                                    {/* Card body */}
                                    <div className="px-5 pt-4 pb-14">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                    Department
                                                </div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                    {r.department}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                    Duration
                                                </div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                    {r.duration}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                    Students
                                                </div>
                                                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                    {r.studentCount}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pointer-events-none mt-4 h-1 w-0 bg-gradient-to-r from-[#0b2d66] via-[#23509A] to-[#1e40af] transition-all duration-200 group-hover:w-full" />

                                        {/* Actions */}
                                        <div className="absolute right-4 bottom-4 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.visit(
                                                        `/admin/programs/${r.id}`,
                                                    )
                                                }
                                                className="inline-flex items-center justify-center rounded-lg border border-blue-200/60 p-2 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                                aria-label="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.visit(
                                                        `/admin/programs/${r.id}/edit`,
                                                    )
                                                }
                                                className="inline-flex items-center justify-center rounded-lg border border-emerald-200/60 p-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                                                aria-label="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {r.status === 'active' ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            adminProgramsArchive(
                                                                r.id,
                                                            ),
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center rounded-lg border border-amber-200/60 p-2 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
                                                    aria-label="Archive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            adminProgramsUnarchive(
                                                                r.id,
                                                            ),
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center rounded-lg border border-blue-200/60 p-2 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                                    aria-label="Unarchive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
                        <div>
                            Showing{' '}
                            {progFilteredRows.length === 0
                                ? 0
                                : (Math.min(
                                      Math.max(progPageIndex, 1),
                                      progTotalPages,
                                  ) -
                                      1) *
                                      progPageSize +
                                  1}{' '}
                            to{' '}
                            {Math.min(
                                Math.min(
                                    Math.max(progPageIndex, 1),
                                    progTotalPages,
                                ) * progPageSize,
                                progFilteredRows.length,
                            )}{' '}
                            of {progFilteredRows.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                Show
                                <select
                                    value={progPageSize}
                                    onChange={(e) =>
                                        setProgPageSize(
                                            Number(e.target.value) || 5,
                                        )
                                    }
                                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
                                    className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                                    onClick={() =>
                                        setProgPageIndex((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={progPageIndex <= 1}
                                >
                                    Prev
                                </button>
                                {Array.from({
                                    length: progTotalPages,
                                })
                                    .slice(0, 5)
                                    .map((_, idx) => {
                                        const num = idx + 1;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() =>
                                                    setProgPageIndex(num)
                                                }
                                                className={
                                                    'rounded-md px-2 py-1 ' +
                                                    (progPageIndex === num
                                                        ? 'bg-[#23509A] text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700')
                                                }
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                <button
                                    type="button"
                                    className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                                    onClick={() =>
                                        setProgPageIndex((p) =>
                                            Math.min(progTotalPages, p + 1),
                                        )
                                    }
                                    disabled={progPageIndex >= progTotalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Program Dialog */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 shadow-2xl sm:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                    <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                                <BookOpen className="h-6 w-6 text-blue-200" />
                                Create New Program
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm text-white/80">
                                Add a new academic program to the curriculum database.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleProgSubmit}>
                        <div className="space-y-6 px-6 py-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="prog-name"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Program Name *
                                    </Label>
                                    <Input
                                        id="prog-name"
                                        type="text"
                                        value={progData.name}
                                        onChange={(e) =>
                                            setProgData('name', e.target.value)
                                        }
                                        className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="e.g., Bachelor of Science in Computer Science"
                                        required
                                    />
                                    {progErrors.name && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {progErrors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="prog-code"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Program Code *
                                    </Label>
                                    <Input
                                        id="prog-code"
                                        type="text"
                                        value={progData.code}
                                        onChange={(e) =>
                                            setProgData('code', e.target.value)
                                        }
                                        className="border-slate-200 bg-white font-mono text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="e.g., BSCS"
                                        required
                                    />
                                    {progErrors.code && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {progErrors.code}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="prog-dept"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Department
                                    </Label>
                                    <Input
                                        id="prog-dept"
                                        type="text"
                                        value={progData.department}
                                        onChange={(e) =>
                                            setProgData(
                                                'department',
                                                e.target.value,
                                            )
                                        }
                                        className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="e.g., College of Engineering"
                                    />
                                    {progErrors.department && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {progErrors.department}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="prog-duration"
                                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Duration
                                    </Label>
                                    <Input
                                        id="prog-duration"
                                        type="text"
                                        value={progData.duration}
                                        onChange={(e) =>
                                            setProgData(
                                                'duration',
                                                e.target.value,
                                            )
                                        }
                                        className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="e.g., 4 years"
                                    />
                                    {progErrors.duration && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {progErrors.duration}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="prog-desc"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Description
                                </Label>
                                <Textarea
                                    id="prog-desc"
                                    value={progData.description}
                                    onChange={(e) =>
                                        setProgData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="min-h-[100px] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                    placeholder="Enter a detailed description of the program..."
                                    rows={4}
                                />
                                {progErrors.description && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {progErrors.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="prog-active"
                                    checked={progData.is_active}
                                    onCheckedChange={(checked: boolean) =>
                                        setProgData('is_active', checked)
                                    }
                                />
                                <Label
                                    htmlFor="prog-active"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Active Program
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    progReset();
                                }}
                                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={progProcessing}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {progProcessing
                                    ? 'Creating...'
                                    : 'Create Program'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
