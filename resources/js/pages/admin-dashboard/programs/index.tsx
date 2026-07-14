import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BookOpen, Edit, Eye, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
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
    adminDashboard,
    adminPrograms,
    adminProgramsArchive,
    adminProgramsStore,
    adminProgramsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Programs',
        href: adminPrograms(),
    },
];

type ProgramRow = {
    id: string;
    name: string;
    code: string;
    department: string;
    description: string;
    duration: string;
    status: 'active' | 'inactive';
    studentCount: number;
    createdAt: string;
    updatedAt: string;
};

export default function AdminProgramsPage() {
    const page = usePage();
    const programs = ((page.props as any)?.programs || []) as ProgramRow[];

    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');
    const [departmentFilter, setDepartmentFilter] = useState<'all' | string>(
        'all',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        department: '',
        description: '',
        duration: '',
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(adminProgramsStore(), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    }

    useEffect(() => {
        setPageIndex(1);
    }, [pageSize]);

    const filteredRows = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        const matchesSearch = (r: ProgramRow) => {
            if (!q) return true;
            const haystack = [r.name, r.code, r.department, r.description]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        const matchesStatus = (r: ProgramRow) => {
            return statusFilter === 'all' || r.status === statusFilter;
        };

        const matchesDepartment = (r: ProgramRow) => {
            return (
                departmentFilter === 'all' || r.department === departmentFilter
            );
        };

        return programs.filter(
            (r) => matchesSearch(r) && matchesStatus(r) && matchesDepartment(r),
        );
    }, [statusFilter, departmentFilter, searchQuery, programs]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

    useEffect(() => {
        setPageIndex((p) => Math.min(Math.max(p, 1), totalPages));
    }, [totalPages]);

    const pagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, pageIndex, totalPages]);

    const stats = useMemo(() => {
        const total = programs.length;
        const active = programs.filter((r) => r.status === 'active').length;
        const inactive = programs.filter((r) => r.status === 'inactive').length;
        const departments = [...new Set(programs.map((r) => r.department))]
            .length;
        return { total, active, inactive, departments };
    }, [programs]);

    const departments = useMemo(() => {
        return [...new Set(programs.map((r) => r.department))].sort();
    }, [programs]);

    const handleCreate = () => {
        setIsCreateModalOpen(true);
    };

    const handleEdit = (id: string) => {
        router.visit(`/admin/programs/${id}/edit`);
    };

    const handleView = (id: string) => {
        router.visit(`/admin/programs/${id}`);
    };

    const handleArchive = (id: string) => {
        router.post(adminProgramsArchive(id));
    };

    const handleUnarchive = (id: string) => {
        router.post(adminProgramsUnarchive(id));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Programs" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Academic Programs
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Manage curriculums, departments, and course offerings
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="h-11 shrink-0 gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5" />
                            Add Program
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                        {/* Total Programs */}
                        <Card className="overflow-hidden border border-blue-100 bg-blue-50/50 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 opacity-70">
                                            Total Programs
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.total}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Programs */}
                        <Card className="overflow-hidden border border-emerald-100 bg-emerald-50/50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 opacity-70">
                                            Active
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.active}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inactive Programs */}
                        <Card className="overflow-hidden border border-amber-100 bg-amber-50/50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 opacity-70">
                                            Inactive
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.inactive}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Departments */}
                        <Card className="overflow-hidden border border-purple-100 bg-purple-50/50 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 opacity-70">
                                            Departments
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {stats.departments}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="text-sm text-slate-800 dark:text-white">
                                    All Programs
                                </CardTitle>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-9 bg-white dark:bg-slate-700">
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
                                        value={departmentFilter}
                                        onValueChange={(v) =>
                                            setDepartmentFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-9 bg-white dark:bg-slate-700">
                                            <SelectValue placeholder="All Departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Departments
                                            </SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem
                                                    key={dept}
                                                    value={dept}
                                                >
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="relative col-span-2">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search programs..."
                                            className="h-9 bg-white pl-9 dark:bg-slate-700 dark:text-slate-300"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            {pagedRows.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="text-slate-500 dark:text-slate-400">
                                        No programs found.
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pagedRows.map((r) => (
                                        <Card
                                            key={r.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-[#0B192C]/50"
                                        >
                                            {/* Card header */}
                                            <div className="relative rounded-t-2xl bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] px-5 pt-5 pb-4">
                                                <div className="min-w-0 pr-24">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1">
                                                            <div className="font-mono text-[11px] text-white/90">
                                                                {r.code}
                                                            </div>
                                                        </div>

                                                        <Badge
                                                            className={
                                                                r.status ===
                                                                'active'
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
                                                            No description
                                                            available
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

                                            {/* Body */}
                                            <div className="px-5 pt-4 pb-14">
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    <div className="sm:col-span-1">
                                                        <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                            Department
                                                        </div>
                                                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {r.department}
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-1">
                                                        <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                            Duration
                                                        </div>
                                                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {r.duration}
                                                        </div>
                                                    </div>

                                                    <div className="sm:col-span-1">
                                                        <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                                            Students
                                                        </div>
                                                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                                            {r.studentCount}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Subtle hover highlight */}
                                                <div className="pointer-events-none mt-4 h-1 w-0 bg-gradient-to-r from-[#0b2d66] via-[#23509A] to-[#1e40af] transition-all duration-200 group-hover:w-full" />

                                                {/* Actions (bottom-right, horizontal) */}
                                                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleView(r.id)
                                                        }
                                                        className="inline-flex items-center justify-center rounded-lg border border-blue-200/60 p-2 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40 dark:hover:text-blue-200"
                                                        aria-label="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(r.id)
                                                        }
                                                        className="inline-flex items-center justify-center rounded-lg border border-emerald-200/60 p-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-200"
                                                        aria-label="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>

                                                    {r.status === 'active' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleArchive(
                                                                    r.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center rounded-lg border border-amber-200/60 p-2 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/40 dark:hover:text-amber-200"
                                                            aria-label="Archive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleUnarchive(
                                                                    r.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center rounded-lg border border-blue-200/60 p-2 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40 dark:hover:text-blue-200"
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

                            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
                                <div>
                                    Showing{' '}
                                    {filteredRows.length === 0
                                        ? 0
                                        : (Math.min(
                                              Math.max(pageIndex, 1),
                                              totalPages,
                                          ) -
                                              1) *
                                              pageSize +
                                          1}{' '}
                                    to{' '}
                                    {Math.min(
                                        Math.min(
                                            Math.max(pageIndex, 1),
                                            totalPages,
                                        ) * pageSize,
                                        filteredRows.length,
                                    )}{' '}
                                    of {filteredRows.length} entries
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="text-slate-600 dark:text-slate-400">
                                            Show
                                        </div>
                                        <select
                                            value={pageSize}
                                            onChange={(e) =>
                                                setPageSize(
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
                                                setPageIndex((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            disabled={pageIndex <= 1}
                                        >
                                            Prev
                                        </button>
                                        {Array.from({ length: totalPages })
                                            .slice(0, 3)
                                            .map((_, idx) => {
                                                const num = idx + 1;
                                                return (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() =>
                                                            setPageIndex(num)
                                                        }
                                                        className={
                                                            'rounded-md px-2 py-1 ' +
                                                            (pageIndex === num
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
                                                setPageIndex((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                            disabled={pageIndex >= totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Program Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent className="bg-white sm:max-w-[600px] dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">
                            Create New Program
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Program Name *
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., Bachelor of Science in Computer Science"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="code"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Program Code *
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                    className="bg-white font-mono dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., BSCS"
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.code}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="department"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Department
                                </Label>
                                <Input
                                    id="department"
                                    type="text"
                                    value={data.department}
                                    onChange={(e) =>
                                        setData('department', e.target.value)
                                    }
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., College of Engineering"
                                />
                                {errors.department && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="duration"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Duration
                                </Label>
                                <Input
                                    id="duration"
                                    type="text"
                                    value={data.duration}
                                    onChange={(e) =>
                                        setData('duration', e.target.value)
                                    }
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., 4 years"
                                />
                                {errors.duration && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.duration}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="description"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className="min-h-[100px] bg-white dark:bg-slate-700 dark:text-slate-300"
                                placeholder="Enter a detailed description of the program..."
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked: boolean) =>
                                    setData('is_active', checked)
                                }
                            />
                            <Label
                                htmlFor="is_active"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Active Program
                            </Label>
                        </div>

                        <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    reset();
                                }}
                                className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {processing ? 'Creating...' : 'Create Program'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
