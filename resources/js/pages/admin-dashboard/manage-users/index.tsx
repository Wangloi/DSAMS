import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Archive, BookOpen, Edit, Eye, KeyRound, Pencil, Plus, Search, Trash2, Users, CheckCircle, XCircle, UserCheck, UserX, ChevronDown, GraduationCap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
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
    adminManageUsers,
    adminProgramsArchive,
    adminProgramsStore,
    adminProgramsUnarchive,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import AddEditUserDialog from './AddEditUserDialog';
import BulkAddUsersDialog from './BulkAddUsersDialog';
import type { PageProps } from './types';
import { useManageUsers } from './useManageUsers';
import ViewStudentDialog from './ViewStudentDialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Manage Users & Programs',
        href: adminManageUsers(),
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

export default function AdminManageUsersPage() {
    const { props } = usePage<PageProps>();
    const students = props.students ?? [];
    const programs = ((props as any).programs || []) as ProgramRow[];
    const errors = props.errors ?? {};
    const flash = props.flash;

    useEffect(() => {
        const message = (flash?.success ?? '').trim();
        if (!message) return;

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false,
        });
    }, [flash?.success]);

    useEffect(() => {
        const message = (flash?.error ?? '').trim();
        if (!message) return;

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }, [flash?.error]);

    // ── Tab state (persisted in URL) ──────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const initialTabParam = urlParams.get('tab');
    const initialTab = ['programs', 'users', 'password-resets'].includes(initialTabParam ?? '') 
        ? (initialTabParam as 'users' | 'programs' | 'password-resets') 
        : 'users';
    const [activeTab, setActiveTab] = useState<'users' | 'programs' | 'password-resets'>(initialTab);
    const { url } = usePage();

    useEffect(() => {
        const search = url.split('?')[1];
        const params = new URLSearchParams(search || '');
        const tab = params.get('tab');
        if (tab && ['programs', 'users', 'password-resets'].includes(tab) && tab !== activeTab) {
            setActiveTab(tab as any);
        }
    }, [url]);

    const switchTab = (tab: 'users' | 'programs' | 'password-resets') => {
        setActiveTab(tab);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tab', tab);
        window.history.replaceState({}, '', currentUrl.toString());
    };

    const getInitials = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join('');

    const roleCounts = students.reduce(
        (acc, u) => {
            const roleRaw = (u.role ?? 'Student').toLowerCase();
            if (roleRaw.includes('admin')) acc.admin += 1;
            else if (roleRaw.includes('program')) acc.programHead += 1;
            else acc.student += 1;
            return acc;
        },
        { student: 0, programHead: 0, admin: 0 },
    );

    const totalUsers = students.length;

    const {
        open,
        setOpen,
        editingUser,
        form,
        setForm,
        hasAnyError,
        closeModal,
        openCreateModal,
        openEditModal,
        submit,
        approveStudent,
        rejectStudent,
        setPendingStudent,
    } = useManageUsers(errors);

    const [activeById, setActiveById] = useState<Record<number, boolean>>({});

    // ── Users tab state ────────────────────────────────────────────────────────
    const isProgramHeadRow = (u: (typeof students)[number]) =>
        String((u as any)?.userType ?? '').toLowerCase() === 'program_head';
    const isAdminRow = (u: (typeof students)[number]) =>
        String((u as any)?.userType ?? '').toLowerCase() === 'admin';

    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [courseFilter, setCourseFilter] = useState<'all' | string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewStudent, setViewStudent] = useState<(typeof students)[number] | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkAddOpen, setBulkAddOpen] = useState(false);

    const handleSelectAll = (checked: boolean) => {
        const pageIds = pagedStudents.map((u) => Number((u as any).id)).filter((id) => !Number.isNaN(id));
        if (checked) {
            setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        } else {
            setSelectedUserIds((prev) => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedUserIds((prev) => [...prev, id]);
        } else {
            setSelectedUserIds((prev) => prev.filter((i) => i !== id));
        }
    };

    const handleSelectByYear = (level: string) => {
        const ids = students
            .filter((s: any) => s.yearLevel === level || s.year_level === level)
            .map((s: any) => Number(s.id))
            .filter((id) => !Number.isNaN(id));
        
        setSelectedUserIds((prev) => Array.from(new Set([...prev, ...ids])));
    };

    // ── Programs tab state ─────────────────────────────────────────────────────
    const [progStatusFilter, setProgStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [progDeptFilter, setProgDeptFilter] = useState<'all' | string>('all');
    const [progSearch, setProgSearch] = useState('');
    const [progPageIndex, setProgPageIndex] = useState(1);
    const [progPageSize, setProgPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: progData, setData: setProgData, post: progPost, processing: progProcessing, errors: progErrors, reset: progReset } = useForm({
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
            const matchSearch = !q || [r.name, r.code, r.department, r.description].filter(Boolean).join(' ').toLowerCase().includes(q);
            const matchStatus = progStatusFilter === 'all' || r.status === progStatusFilter;
            const matchDept = progDeptFilter === 'all' || r.department === progDeptFilter;
            return matchSearch && matchStatus && matchDept;
        });
    }, [programs, progSearch, progStatusFilter, progDeptFilter]);

    const progTotalPages = Math.max(1, Math.ceil(progFilteredRows.length / progPageSize));

    const progPagedRows = useMemo(() => {
        const clamped = Math.min(Math.max(progPageIndex, 1), progTotalPages);
        return progFilteredRows.slice((clamped - 1) * progPageSize, clamped * progPageSize);
    }, [progFilteredRows, progPageIndex, progTotalPages, progPageSize]);

    const progStats = useMemo(() => ({
        total: programs.length,
        active: programs.filter((r) => r.status === 'active').length,
        inactive: programs.filter((r) => r.status === 'inactive').length,
        departments: [...new Set(programs.map((r) => r.department))].length,
    }), [programs]);

    const progDepartments = useMemo(() => [...new Set(programs.map((r) => r.department))].sort(), [programs]);

    useEffect(() => {
        setActiveById((prev) => {
            const next = { ...prev };
            for (const u of students) {
                if (next[u.id] === undefined) next[u.id] = u.is_active ?? true;
            }
            return next;
        });
    }, [students]);

    useEffect(() => {
        if (searchQuery.trim().toLowerCase() === 'admin@example.com') {
            setSearchQuery('');
        }
    }, [searchQuery]);

    const isActive = useMemo(() => {
        return (userId: number) => activeById[userId] !== false;
    }, [activeById]);

    const availableCourses = useMemo(() => {
        const list = ['BSIT', 'BSBA', 'BEED', 'BSED', 'BSCrim', 'BSHM'];
        students.forEach((s) => {
            const c = String(s.course ?? '').trim();
            if (c && !list.includes(c) && !c.toLowerCase().includes('admin')) {
                list.push(c);
            }
        });
        return list.filter((c) => !c.toLowerCase().includes('admin'));
    }, [students]);

    const filteredStudents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const matchesRole = (u: (typeof students)[number]) => {
            const roleRaw = String(u.role ?? 'Student').toLowerCase();
            // Exclude System Admin accounts from the user table list
            if (roleRaw.includes('admin')) return false;

            if (roleFilter === 'all') return true;
            if (roleFilter === 'students')
                return (
                    !roleRaw.includes('admin') && !roleRaw.includes('program')
                );
            if (roleFilter === 'program') return roleRaw.includes('program');
            // Year level filters
            if (['1st Year', '2nd Year', '3rd Year', '4th Year', 'Irregular'].includes(roleFilter)) {
                return (u.year_level ?? '') === roleFilter;
            }
            return true;
        };

        const matchesStatus = (u: (typeof students)[number]) => {
            if (statusFilter === 'all') return true;
            if (isProgramHeadRow(u)) return statusFilter === 'active';
            const active = isActive(u.id);
            return statusFilter === 'active' ? active : !active;
        };

        const matchesCourse = (u: (typeof students)[number]) => {
            if (courseFilter === 'all') return true;
            return String(u.course ?? '').trim().toLowerCase() === courseFilter.trim().toLowerCase();
        };

        const matchesSearch = (u: (typeof students)[number]) => {
            if (!q) return true;
            const haystack = [
                u.student_id,
                u.name,
                u.email,
                u.course,
                u.year_level,
                u.role ?? '',
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        };

        return [...students]
            .filter((u) => matchesRole(u) && matchesStatus(u) && matchesCourse(u) && matchesSearch(u))
            .sort((a, b) => {
                const nameA = (a.last_name || a.name || '').trim().toLowerCase();
                const nameB = (b.last_name || b.name || '').trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [students, roleFilter, statusFilter, courseFilter, searchQuery]);

    const [pageSize, setPageSize] = useState(10);
    const totalPages = Math.max(
        1,
        Math.ceil(filteredStudents.length / pageSize),
    );

    useEffect(() => {
        setPageIndex((p) => Math.min(Math.max(p, 1), totalPages));
    }, [totalPages]);

    useEffect(() => {
        setSelectedUserIds([]);
    }, [pageIndex, roleFilter, statusFilter, searchQuery]);

    const pagedStudents = useMemo(() => {
        const clamped = Math.min(Math.max(pageIndex, 1), totalPages);
        const start = (clamped - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, pageIndex, totalPages]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users & Programs" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* ── Hero Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/20">
                                    {activeTab === 'users' ? <Users className="h-7 w-7" /> : activeTab === 'programs' ? <GraduationCap className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        {activeTab === 'users' && 'Manage Users'}
                                        {activeTab === 'programs' && 'Academic Programs'}
                                        {activeTab === 'password-resets' && 'Password Resets'}
                                    </h1>
                                    <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                                        {activeTab === 'users' && 'Manage user accounts, roles, and permissions'}
                                        {activeTab === 'programs' && 'Manage curriculums, departments, and course offerings'}
                                        {activeTab === 'password-resets' && 'Review and approve pending password reset requests'}
                                    </p>
                                </div>
                            </div>

                            {/* Right side: Tab buttons & Action buttons inside banner */}
                            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                                {/* Tab switcher logos inside banner */}
                                <div className="flex items-center rounded-xl bg-white/10 p-1 backdrop-blur-md ring-1 ring-white/20">
                                    <button
                                        type="button"
                                        onClick={() => switchTab('users')}
                                        title="Users"
                                        aria-label="Users"
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                            activeTab === 'users'
                                                ? 'bg-white text-[#1e3a8a] shadow-sm'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <UserCheck className="h-5 w-5" />
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                            activeTab === 'users' ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]' : 'bg-white/10 text-white'
                                        }`}>
                                            {totalUsers}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchTab('programs')}
                                        title="Programs"
                                        aria-label="Programs"
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                            activeTab === 'programs'
                                                ? 'bg-white text-[#1e3a8a] shadow-sm'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <GraduationCap className="h-5 w-5" />
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                            activeTab === 'programs' ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]' : 'bg-white/10 text-white'
                                        }`}>
                                            {progStats.total}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchTab('password-resets')}
                                        title="Password Resets"
                                        aria-label="Password Resets"
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                            activeTab === 'password-resets'
                                                ? 'bg-white text-[#1e3a8a] shadow-sm'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <KeyRound className="h-5 w-5" />
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                            activeTab === 'password-resets' ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]' : 'bg-white/10 text-white'
                                        }`}>
                                            {(props.passwordResetRequests as any[])?.filter((r: any) => r.status === 'pending').length ?? 0}
                                        </span>
                                    </button>
                                </div>

                                {/* Action buttons */}
                                {activeTab === 'users' ? (
                                    <div className="flex items-center gap-2">
                                        <AddEditUserDialog
                                            open={open}
                                            onOpenChange={setOpen}
                                            editingUser={editingUser}
                                            hasAnyError={hasAnyError}
                                            errors={errors}
                                            form={form}
                                            setForm={setForm}
                                            onOpenCreate={openCreateModal}
                                            onClose={closeModal}
                                            onSubmit={submit}
                                            onOpenBulkAdd={() => setBulkAddOpen(true)}
                                        />
                                        <BulkAddUsersDialog
                                            open={bulkAddOpen}
                                            onOpenChange={setBulkAddOpen}
                                        />
                                    </div>
                                ) : activeTab === 'programs' ? (
                                    <Button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Add Program
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* ── USERS TAB ──────────────────────────────────────────────────────────── */}
                    {activeTab === 'users' && (
                    <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Students Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Students</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{roleCounts.student}</p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Active</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                            </div>
                        </div>

                        {/* Program Heads Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Program Heads</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{roleCounts.programHead}</p>
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Assigned</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                            </div>
                        </div>

                        {/* Administrators Card */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5" />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Administrators</p>
                                    <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{roleCounts.admin}</p>
                                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">System Admins</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                        <CardHeader className="p-2.5 px-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">
                                        User List
                                    </CardTitle>
                                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Total: {totalUsers} users
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <div className="relative min-w-[180px] sm:w-[220px]">
                                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="fake_username"
                                            autoComplete="username"
                                            tabIndex={-1}
                                            className="hidden"
                                        />
                                        <input
                                            type="password"
                                            name="fake_password"
                                            autoComplete="current-password"
                                            tabIndex={-1}
                                            className="hidden"
                                        />
                                        <Input
                                            placeholder="Search user..."
                                            className="h-8.5 text-xs border border-slate-200 bg-white pl-8 dark:border-slate-600 dark:bg-slate-800"
                                            name="manage_users_search"
                                            type="search"
                                            autoComplete="new-password"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                        />
                                    </div>

                                    <Select
                                        value={roleFilter}
                                        onValueChange={(v) => {
                                            setRoleFilter(v as any);
                                            setPageIndex(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8.5 text-xs w-[140px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Users
                                            </SelectItem>
                                            <SelectItem value="students">
                                                Students
                                            </SelectItem>
                                            <SelectItem value="program">
                                                Program Heads
                                            </SelectItem>
                                            <SelectItem value="1st Year">
                                                1st Year
                                            </SelectItem>
                                            <SelectItem value="2nd Year">
                                                2nd Year
                                            </SelectItem>
                                            <SelectItem value="3rd Year">
                                                3rd Year
                                            </SelectItem>
                                            <SelectItem value="4th Year">
                                                4th Year
                                            </SelectItem>
                                            <SelectItem value="Irregular">
                                                Irregular
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={courseFilter}
                                        onValueChange={(v) => {
                                            setCourseFilter(v);
                                            setPageIndex(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-8.5 text-xs w-[130px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                                            <SelectValue placeholder="All Courses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Courses</SelectItem>
                                            {availableCourses.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as any)
                                        }
                                    >
                                        <SelectTrigger className="h-8.5 text-xs w-[130px] border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                                            <SelectValue placeholder="Status: Active" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Status: All
                                            </SelectItem>
                                            <SelectItem value="active">
                                                Status: Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Status: Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        {selectedUserIds.length > 0 && (
                            <div className="flex items-center justify-between border-y border-emerald-200 bg-emerald-50/50 px-6 py-3 dark:border-emerald-800/30 dark:bg-emerald-900/10 transition-all">
                                <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                                    {selectedUserIds.length} user(s) selected
                                </div>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="ml-auto bg-white dark:bg-slate-800">
                                                Bulk Actions <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel className="text-xs uppercase text-slate-500">Verification</DropdownMenuLabel>
                                            <DropdownMenuItem 
                                                className="cursor-pointer font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Approve Selected?',
                                                        text: 'This will approve the verification status of the selected users.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#059669',
                                                        confirmButtonText: 'Yes, approve them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/admin/manage-users/bulk/verification/approve', { ids: selectedUserIds }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => setSelectedUserIds([])
                                                            });
                                                        }
                                                    });
                                                }}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Reject Selected?',
                                                        text: 'This will reject the verification status of the selected users.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#dc2626',
                                                        confirmButtonText: 'Yes, reject them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/admin/manage-users/bulk/verification/reject', { ids: selectedUserIds }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => setSelectedUserIds([])
                                                            });
                                                        }
                                                    });
                                                }}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" /> Reject
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-xs uppercase text-slate-500">Account Status</DropdownMenuLabel>
                                            <DropdownMenuItem 
                                                className="cursor-pointer font-medium text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Activate Selected?',
                                                        text: 'This will set the account status of the selected users to Active.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#2563eb',
                                                        confirmButtonText: 'Yes, activate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/admin/manage-users/bulk/status/activate', { ids: selectedUserIds }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => setSelectedUserIds([])
                                                            });
                                                        }
                                                    });
                                                }}
                                            >
                                                <UserCheck className="mr-2 h-4 w-4" /> Activate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="cursor-pointer font-medium text-slate-700 focus:text-slate-900 focus:bg-slate-100 dark:text-slate-300 dark:focus:bg-slate-800"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Deactivate Selected?',
                                                        text: 'This will set the account status of the selected users to Inactive.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#475569',
                                                        confirmButtonText: 'Yes, deactivate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/admin/manage-users/bulk/status/deactivate', { ids: selectedUserIds }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => setSelectedUserIds([])
                                                            });
                                                        }
                                                    });
                                                }}
                                            >
                                                <UserX className="mr-2 h-4 w-4" /> Deactivate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}
                        <CardContent className={selectedUserIds.length > 0 ? "pt-4" : ""}>
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="w-20 px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Checkbox
                                                            checked={pagedStudents.length > 0 && pagedStudents.every(u => selectedUserIds.includes(Number((u as any).id)))}
                                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                            aria-label="Select all"
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none">
                                                                    <ChevronDown className="h-3 w-3" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                <DropdownMenuLabel className="text-xs text-slate-500 uppercase">Select By Year</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Irregular'].map(level => (
                                                                    <DropdownMenuItem key={level} onClick={() => handleSelectByYear(level)} className="cursor-pointer">
                                                                        {level}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setSelectedUserIds([])} className="cursor-pointer text-red-600 focus:text-red-700">
                                                                    Clear Selection
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </th>
                                                <th className="w-12 px-2 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    #
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    User ID
                                                </th>
                                                <th className="min-w-[260px] px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Full Name
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Department / Program
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Account Status
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Verification Status
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {pagedStudents.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={8}
                                                        className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                                                    >
                                                        No users found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                pagedStudents.map((u, idx) => (
                                                    <tr
                                                        key={u.id}
                                                        className="transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <Checkbox
                                                                checked={selectedUserIds.includes(Number((u as any).id))}
                                                                onCheckedChange={(checked) => handleSelectRow(Number((u as any).id), checked as boolean)}
                                                                aria-label={`Select ${u.name}`}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-4 text-slate-500 dark:text-slate-400">
                                                            {(Math.min(
                                                                Math.max(
                                                                    pageIndex,
                                                                    1,
                                                                ),
                                                                totalPages,
                                                            ) -
                                                                1) *
                                                                pageSize +
                                                                idx +
                                                                1}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                            {u.student_id}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="size-10 ring-2 ring-white dark:ring-slate-800">
                                                                    <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                                        {getInitials(
                                                                            u.name,
                                                                        )}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                                        {u.name}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        {
                                                                            u.email
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                                                                u.role?.toLowerCase().includes('admin') 
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                                                    : u.role?.toLowerCase().includes('program')
                                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}>
                                                                {u.role ?? 'Student'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                                {String(u.course ?? '').trim() || '—'}
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const id =
                                                                        Number(
                                                                            (
                                                                                u as any
                                                                            )
                                                                                ?.id,
                                                                        );
                                                                    if (
                                                                        isProgramHeadRow(
                                                                            u,
                                                                        )
                                                                    ) {
                                                                        Swal.fire(
                                                                            {
                                                                                icon: 'info',
                                                                                title: 'Not available',
                                                                                text: 'Status toggle is not yet supported for Program Head accounts.',
                                                                            },
                                                                        );
                                                                        return;
                                                                    }
                                                                    if (
                                                                        isAdminRow(
                                                                            u,
                                                                        )
                                                                    ) {
                                                                        Swal.fire(
                                                                            {
                                                                                icon: 'info',
                                                                                title: 'Not available',
                                                                                text: 'Status toggle is not yet supported for Administrator accounts.',
                                                                            },
                                                                        );
                                                                        return;
                                                                    }
                                                                    if (
                                                                        !id ||
                                                                        Number.isNaN(
                                                                            id,
                                                                        )
                                                                    ) {
                                                                        Swal.fire(
                                                                            {
                                                                                icon: 'error',
                                                                                title: 'Update failed',
                                                                                text: 'Missing user id. Please refresh the page and try again.',
                                                                            },
                                                                        );
                                                                        return;
                                                                    }

                                                                    const nextActive =
                                                                        !isActive(
                                                                            u.id,
                                                                        );
                                                                    setActiveById(
                                                                        (
                                                                            p,
                                                                        ) => ({
                                                                            ...p,
                                                                            [u.id]: nextActive,
                                                                        }),
                                                                    );

                                                                    router.post(
                                                                        `/admin/manage-users/${id}/status`,
                                                                        {
                                                                            is_active:
                                                                                nextActive,
                                                                        },
                                                                        {
                                                                            preserveScroll: true,
                                                                            onError:
                                                                                () => {
                                                                                    setActiveById(
                                                                                        (
                                                                                            p,
                                                                                        ) => ({
                                                                                            ...p,
                                                                                            [u.id]: !nextActive,
                                                                                        }),
                                                                                    );
                                                                                    Swal.fire(
                                                                                        {
                                                                                            icon: 'error',
                                                                                            title: 'Update failed',
                                                                                            text: 'Unable to update student status. Please try again.',
                                                                                        },
                                                                                    );
                                                                                },
                                                                        },
                                                                    );
                                                                }}
                                                                aria-pressed={isActive(
                                                                    u.id,
                                                                )}
                                                                className={
                                                                    'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-[#1e40af] focus-visible:ring-offset-2 focus-visible:outline-none ' +
                                                                    (isActive(
                                                                        u.id,
                                                                    )
                                                                        ? 'border-emerald-600 bg-emerald-600'
                                                                        : 'border-slate-300 bg-slate-200')
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ' +
                                                                        (isActive(
                                                                            u.id,
                                                                        )
                                                                            ? 'translate-x-5'
                                                                            : 'translate-x-0.5')
                                                                    }
                                                                />
                                                            </button>
                                                        </td>

                                                        <td className="space-x-2 px-4 py-3">
                                                            {!isProgramHeadRow(
                                                                u,
                                                            ) &&
                                                                !isAdminRow(
                                                                    u,
                                                                ) && (
                                                                    <>
                                                                        <Select
                                                                            value={
                                                                                u.status ??
                                                                                'pending'
                                                                            }
                                                                            onValueChange={(
                                                                                value,
                                                                            ) => {
                                                                                const id =
                                                                                    Number(
                                                                                        (
                                                                                            u as any
                                                                                        )
                                                                                            ?.id,
                                                                                    );
                                                                                if (
                                                                                    !id ||
                                                                                    Number.isNaN(
                                                                                        id,
                                                                                    )
                                                                                )
                                                                                    return;

                                                                                // Map status to the appropriate action
                                                                                if (
                                                                                    value ===
                                                                                    'approved'
                                                                                ) {
                                                                                    approveStudent(
                                                                                        id,
                                                                                    );
                                                                                } else if (
                                                                                    value ===
                                                                                    'rejected'
                                                                                ) {
                                                                                    rejectStudent(
                                                                                        id,
                                                                                    );
                                                                                } else if (
                                                                                    value ===
                                                                                    'pending'
                                                                                ) {
                                                                                    setPendingStudent(
                                                                                        id,
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="border-slate-300 dark:border-slate-600">
                                                                                <SelectValue placeholder="Status" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="pending">
                                                                                    Pending
                                                                                </SelectItem>
                                                                                <SelectItem value="approved">
                                                                                    Approved
                                                                                </SelectItem>
                                                                                <SelectItem value="rejected">
                                                                                    Rejected
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </>
                                                                )}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 border-slate-300 bg-white transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                                    onClick={() => {
                                                                        if (
                                                                            isProgramHeadRow(
                                                                                u,
                                                                            ) ||
                                                                            isAdminRow(
                                                                                u,
                                                                            )
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        setViewStudent(
                                                                            u,
                                                                        );
                                                                        setViewOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    aria-label="View"
                                                                >
                                                                    <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 border-slate-300 bg-white transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                                    onClick={() => {
                                                                        if (
                                                                            isProgramHeadRow(
                                                                                u,
                                                                            ) ||
                                                                            isAdminRow(
                                                                                u,
                                                                            )
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        openEditModal(
                                                                            u,
                                                                        );
                                                                    }}
                                                                    aria-label="Edit"
                                                                >
                                                                    <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                                </Button>
                                                                {!isProgramHeadRow(
                                                                    u,
                                                                ) &&
                                                                    !isAdminRow(
                                                                        u,
                                                                    ) && (
                                                                        <button
                                                                            type="button"
                                                                            className="text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                                                            aria-label="Archive user"
                                                                            onClick={() => {
                                                                                if (
                                                                                    isProgramHeadRow(
                                                                                        u,
                                                                                    )
                                                                                ) {
                                                                                    Swal.fire(
                                                                                        {
                                                                                            icon: 'info',
                                                                                            title: 'Not available',
                                                                                            text: 'Archiving is not yet supported for Program Head accounts.',
                                                                                        },
                                                                                    );
                                                                                } else if (
                                                                                    isAdminRow(
                                                                                        u,
                                                                                    )
                                                                                ) {
                                                                                    Swal.fire(
                                                                                        {
                                                                                            icon: 'info',
                                                                                            title: 'Not available',
                                                                                            text: 'Archiving is not yet supported for Administrator accounts.',
                                                                                        },
                                                                                    );
                                                                                } else {
                                                                                    Swal.fire(
                                                                                        {
                                                                                            title: 'Archive account?',
                                                                                            text: `This will move ${u.name} to the archive. You can restore the account later from the Archive page.`,
                                                                                            icon: 'question',
                                                                                            showCancelButton: true,
                                                                                            confirmButtonColor:
                                                                                                '#f59e0b',
                                                                                            cancelButtonColor:
                                                                                                '#d33',
                                                                                            confirmButtonText:
                                                                                                'Archive',
                                                                                            cancelButtonText:
                                                                                                'Cancel',
                                                                                        },
                                                                                    ).then(
                                                                                        (
                                                                                            result,
                                                                                        ) => {
                                                                                            if (
                                                                                                result.isConfirmed
                                                                                            ) {
                                                                                                const id =
                                                                                                    Number(
                                                                                                        (
                                                                                                            u as any
                                                                                                        )
                                                                                                            ?.id,
                                                                                                    );
                                                                                                if (
                                                                                                    !id ||
                                                                                                    Number.isNaN(
                                                                                                        id,
                                                                                                    )
                                                                                                ) {
                                                                                                    Swal.fire(
                                                                                                        {
                                                                                                            icon: 'error',
                                                                                                            title: 'Archive failed',
                                                                                                            text: 'Missing user id. Please refresh the page and try again.',
                                                                                                        },
                                                                                                    );
                                                                                                    return;
                                                                                                }

                                                                                                router.post(
                                                                                                    `/admin/manage-users/${id}/archive`,
                                                                                                    {},
                                                                                                    {
                                                                                                        preserveScroll: true,
                                                                                                        onSuccess:
                                                                                                            () => {
                                                                                                                router.reload(
                                                                                                                    {
                                                                                                                        only: [
                                                                                                                            'students',
                                                                                                                        ],
                                                                                                                    },
                                                                                                                );
                                                                                                            },
                                                                                                        onError:
                                                                                                            () => {
                                                                                                                Swal.fire(
                                                                                                                    {
                                                                                                                        icon: 'error',
                                                                                                                        title: 'Archive failed',
                                                                                                                        text: 'Unable to archive the account. Please try again.',
                                                                                                                    },
                                                                                                                );
                                                                                                            },
                                                                                                    },
                                                                                                );
                                                                                            }
                                                                                        },
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Archive className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

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
                                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            {[10, 25, 50, 100, 255].map((size) => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-slate-400 dark:text-slate-600">|</span>
                                    <span>
                                        Showing{' '}
                                        {filteredStudents.length === 0
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
                                            filteredStudents.length,
                                        )}{' '}
                                        of {filteredStudents.length} entries
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        onClick={() =>
                                            setPageIndex((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
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
                                        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
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
                        </CardContent>
                    </Card>
                    </>
                    )} {/* end activeTab === 'users' */}

                    {/* ── PROGRAMS TAB ─────────────────────────────────────── */}
                    {activeTab === 'programs' && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5" />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Programs</p>
                                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{progStats.total}</p>
                                        <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">All Offerings</p>
                                    </div>
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5" />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active</p>
                                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{progStats.active}</p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Curriculums</p>
                                    </div>
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                                        <Users className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5" />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Inactive</p>
                                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{progStats.inactive}</p>
                                        <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Archived/Disabled</p>
                                    </div>
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full w-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/5" />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Departments</p>
                                        <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{progStats.departments}</p>
                                        <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">Academic Units</p>
                                    </div>
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 ring-1 ring-purple-200/50 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-purple-900/30 transition-transform duration-300 group-hover:scale-110">
                                        <Users className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full w-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {/* Programs table card */}
                        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="text-sm text-slate-800 dark:text-white">All Programs</CardTitle>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center">
                                        <Select value={progStatusFilter} onValueChange={(v) => setProgStatusFilter(v as any)}>
                                            <SelectTrigger className="h-9 bg-white dark:bg-slate-700">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={progDeptFilter} onValueChange={(v) => setProgDeptFilter(v as any)}>
                                            <SelectTrigger className="h-9 bg-white dark:bg-slate-700">
                                                <SelectValue placeholder="All Departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {progDepartments.map((dept) => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="relative col-span-2">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                placeholder="Search programs..."
                                                className="h-9 bg-white pl-9 dark:bg-slate-700 dark:text-slate-300"
                                                value={progSearch}
                                                onChange={(e) => setProgSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {progPagedRows.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">No programs found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {progPagedRows.map((r) => (
                                            <Card key={r.id} className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-[#0B192C]/50">
                                                {/* Card header gradient */}
                                                <div className="relative rounded-t-2xl bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] px-5 pt-5 pb-4">
                                                    <div className="min-w-0 pr-24">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1">
                                                                <div className="font-mono text-[11px] text-white/90">{r.code}</div>
                                                            </div>
                                                            <Badge className={r.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-500'}>
                                                                {r.status}
                                                            </Badge>
                                                        </div>
                                                        <h3 className="mt-3 truncate text-base font-semibold tracking-tight text-white">{r.name}</h3>
                                                        {r.description ? (
                                                            <p className="mt-1 line-clamp-2 text-sm text-white/80">{r.description}</p>
                                                        ) : (
                                                            <p className="mt-1 line-clamp-2 text-sm text-white/70">No description available</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

                                                {/* Card body */}
                                                <div className="px-5 pt-4 pb-14">
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Department</div>
                                                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{r.department}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Duration</div>
                                                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{r.duration}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Students</div>
                                                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{r.studentCount}</div>
                                                        </div>
                                                    </div>
                                                    <div className="pointer-events-none mt-4 h-1 w-0 bg-gradient-to-r from-[#0b2d66] via-[#23509A] to-[#1e40af] transition-all duration-200 group-hover:w-full" />

                                                    {/* Actions */}
                                                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.visit(`/admin/programs/${r.id}`)}
                                                            className="inline-flex items-center justify-center rounded-lg border border-blue-200/60 p-2 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                                            aria-label="View"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => router.visit(`/admin/programs/${r.id}/edit`)}
                                                            className="inline-flex items-center justify-center rounded-lg border border-emerald-200/60 p-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                                                            aria-label="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        {r.status === 'active' ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.post(adminProgramsArchive(r.id))}
                                                                className="inline-flex items-center justify-center rounded-lg border border-amber-200/60 p-2 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
                                                                aria-label="Archive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.post(adminProgramsUnarchive(r.id))}
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
                                        Showing {progFilteredRows.length === 0 ? 0 : (Math.min(Math.max(progPageIndex, 1), progTotalPages) - 1) * progPageSize + 1} to{' '}
                                        {Math.min(Math.min(Math.max(progPageIndex, 1), progTotalPages) * progPageSize, progFilteredRows.length)} of {progFilteredRows.length} entries
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                            Show
                                            <select
                                                value={progPageSize}
                                                onChange={(e) => setProgPageSize(Number(e.target.value) || 5)}
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
                                                onClick={() => setProgPageIndex((p) => Math.max(1, p - 1))}
                                                disabled={progPageIndex <= 1}
                                            >Prev</button>
                                            {Array.from({ length: progTotalPages }).slice(0, 5).map((_, idx) => {
                                                const num = idx + 1;
                                                return (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setProgPageIndex(num)}
                                                        className={'rounded-md px-2 py-1 ' + (progPageIndex === num ? 'bg-[#23509A] text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700')}
                                                    >{num}</button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                                                onClick={() => setProgPageIndex((p) => Math.min(progTotalPages, p + 1))}
                                                disabled={progPageIndex >= progTotalPages}
                                            >Next</button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                    )} {/* end activeTab === 'programs' */}

                    {/* ── PASSWORD RESETS TAB ──────────────────────────────────────────────────────────── */}
                    {activeTab === 'password-resets' && (
                        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#0B192C]/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                    Pending Password Reset Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">User Email</th>
                                                <th className="px-4 py-3 font-medium">User Type</th>
                                                <th className="px-4 py-3 font-medium">Requested At</th>
                                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/50">
                                            {(props.passwordResetRequests as any[])?.filter((r: any) => r.status === 'pending').map((request: any) => (
                                                <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                                                        {request.email}
                                                    </td>
                                                    <td className="px-4 py-3 capitalize">
                                                        {request.user_type.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {new Date(request.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right space-x-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to approve this request and reset the password to the default static password?')) {
                                                                    router.post(`/admin/password-resets/${request.id}/approve`);
                                                                }
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to reject this request?')) {
                                                                    router.post(`/admin/password-resets/${request.id}/reject`);
                                                                }
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!props.passwordResetRequests || (props.passwordResetRequests as any[]).filter((r: any) => r.status === 'pending').length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                        No pending password reset requests.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}


                </div>
            </div>

            {/* View Student Dialog (Users tab) */}
            <ViewStudentDialog
                open={viewOpen}
                onOpenChange={setViewOpen}
                student={viewStudent as any}
            />

            {/* Create Program Modal (Programs tab) */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="bg-white sm:max-w-[600px] dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Create New Program</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProgSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="prog-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Program Name *</Label>
                                <Input
                                    id="prog-name"
                                    type="text"
                                    value={progData.name}
                                    onChange={(e) => setProgData('name', e.target.value)}
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., Bachelor of Science in Computer Science"
                                    required
                                />
                                {progErrors.name && <p className="text-sm text-red-600 dark:text-red-400">{progErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prog-code" className="text-sm font-medium text-slate-700 dark:text-slate-300">Program Code *</Label>
                                <Input
                                    id="prog-code"
                                    type="text"
                                    value={progData.code}
                                    onChange={(e) => setProgData('code', e.target.value)}
                                    className="bg-white font-mono dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., BSCS"
                                    required
                                />
                                {progErrors.code && <p className="text-sm text-red-600 dark:text-red-400">{progErrors.code}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prog-dept" className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</Label>
                                <Input
                                    id="prog-dept"
                                    type="text"
                                    value={progData.department}
                                    onChange={(e) => setProgData('department', e.target.value)}
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., College of Engineering"
                                />
                                {progErrors.department && <p className="text-sm text-red-600 dark:text-red-400">{progErrors.department}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prog-duration" className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</Label>
                                <Input
                                    id="prog-duration"
                                    type="text"
                                    value={progData.duration}
                                    onChange={(e) => setProgData('duration', e.target.value)}
                                    className="bg-white dark:bg-slate-700 dark:text-slate-300"
                                    placeholder="e.g., 4 years"
                                />
                                {progErrors.duration && <p className="text-sm text-red-600 dark:text-red-400">{progErrors.duration}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prog-desc" className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                            <Textarea
                                id="prog-desc"
                                value={progData.description}
                                onChange={(e) => setProgData('description', e.target.value)}
                                className="min-h-[100px] bg-white dark:bg-slate-700 dark:text-slate-300"
                                placeholder="Enter a detailed description of the program..."
                                rows={4}
                            />
                            {progErrors.description && <p className="text-sm text-red-600 dark:text-red-400">{progErrors.description}</p>}
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="prog-active"
                                checked={progData.is_active}
                                onCheckedChange={(checked: boolean) => setProgData('is_active', checked)}
                            />
                            <Label htmlFor="prog-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Program</Label>
                        </div>
                        <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setIsCreateModalOpen(false); progReset(); }}
                                className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                            >Cancel</Button>
                            <Button
                                type="submit"
                                disabled={progProcessing}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {progProcessing ? 'Creating...' : 'Create Program'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
