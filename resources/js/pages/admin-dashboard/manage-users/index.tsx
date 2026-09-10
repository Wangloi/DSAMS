import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { adminDashboard, adminManageUsers } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import Swal from 'sweetalert2';

import AdminLayout from '../admin-layout';
import AddEditUserDialog from './AddEditUserDialog';
import AddProgramHeadDialog from './AddProgramHeadDialog';
import BulkActionsModal from './BulkActionsModal';
import BulkAddUsersDialog from './BulkAddUsersDialog';
import { BulkYearLevelDialog } from './BulkYearLevelDialog';
import { ManagePasswordResetsTab } from './ManagePasswordResetsTab';
import { ManageProgramsTab } from './ManageProgramsTab';
import { ManageUsersHeroHeader } from './ManageUsersHeroHeader';
import { ManageUsersStatsCards } from './ManageUsersStatsCards';
import { ManageUsersTableCard } from './ManageUsersTableCard';
import type { PageProps, ProgramRow, UserRow } from './types';
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
    const initialTab = ['programs', 'users', 'password-resets'].includes(
        initialTabParam ?? '',
    )
        ? (initialTabParam as 'users' | 'programs' | 'password-resets')
        : 'users';
    const [activeTab, setActiveTab] = useState<
        'users' | 'programs' | 'password-resets'
    >(initialTab);
    const { url } = usePage();

    useEffect(() => {
        const search = url.split('?')[1];
        const params = new URLSearchParams(search || '');
        const tab = params.get('tab');
        if (
            tab &&
            ['programs', 'users', 'password-resets'].includes(tab) &&
            tab !== activeTab
        ) {
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

    const roleCounts = useMemo(() => {
        return students.reduce(
            (acc, u) => {
                const roleRaw = (u.role ?? 'Student').toLowerCase();
                if (roleRaw.includes('admin')) acc.admin += 1;
                else if (roleRaw.includes('program')) acc.programHead += 1;
                else acc.student += 1;
                return acc;
            },
            { student: 0, programHead: 0, admin: 0 },
        );
    }, [students]);

    const totalUsers = students.length;

    const {
        open,
        setOpen,
        phOpen,
        setPhOpen,
        editingUser,
        form,
        setForm,
        hasAnyError,
        closeModal,
        openCreateModal,
        openCreatePHModal,
        openEditModal,
        submit,
        submitProgramHead,
    } = useManageUsers(errors);

    const [activeById, setActiveById] = useState<Record<number, boolean>>({});

    const isProgramHeadRow = (u: UserRow) =>
        String((u as any)?.userType ?? '').toLowerCase() === 'program_head';
    const isAdminRow = (u: UserRow) =>
        String((u as any)?.userType ?? '').toLowerCase() === 'admin';

    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<
        'active' | 'inactive' | 'all'
    >('all');
    const [courseFilter, setCourseFilter] = useState<'all' | string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewStudent, setViewStudent] = useState<UserRow | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkAddOpen, setBulkAddOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkYearLevelOpen, setBulkYearLevelOpen] = useState(false);
    const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);

    useEffect(() => {
        setActiveById((prev) => {
            const next = { ...prev };
            for (const u of students) {
                if (next[u.id] === undefined) next[u.id] = u.is_active ?? true;
            }
            return next;
        });
    }, [students]);

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

        const matchesRole = (u: UserRow) => {
            const roleRaw = String(u.role ?? 'Student').toLowerCase();
            if (roleRaw.includes('admin')) return false;

            if (roleFilter === 'all') return true;
            if (roleFilter === 'students')
                return (
                    !roleRaw.includes('admin') && !roleRaw.includes('program')
                );
            if (roleFilter === 'program') return roleRaw.includes('program');
            if (
                [
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                    'Irregular',
                ].includes(roleFilter)
            ) {
                return (u.year_level ?? '') === roleFilter;
            }
            return true;
        };

        const matchesStatus = (u: UserRow) => {
            if (statusFilter === 'all') return true;
            if (isProgramHeadRow(u)) return statusFilter === 'active';
            const active = isActive(u.id);
            return statusFilter === 'active' ? active : !active;
        };

        const matchesCourse = (u: UserRow) => {
            if (courseFilter === 'all') return true;
            return (
                String(u.course ?? '')
                    .trim()
                    .toLowerCase() === courseFilter.trim().toLowerCase()
            );
        };

        const matchesSearch = (u: UserRow) => {
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
            .filter(
                (u) =>
                    matchesRole(u) &&
                    matchesStatus(u) &&
                    matchesCourse(u) &&
                    matchesSearch(u),
            )
            .sort((a, b) => {
                const nameA = (a.last_name || a.name || '')
                    .trim()
                    .toLowerCase();
                const nameB = (b.last_name || b.name || '')
                    .trim()
                    .toLowerCase();
                return nameA.localeCompare(nameB);
            });
    }, [students, roleFilter, statusFilter, courseFilter, searchQuery, isActive]);

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
    }, [filteredStudents, pageIndex, totalPages, pageSize]);

    const handleSelectAll = (checked: boolean) => {
        const pageIds = pagedStudents
            .map((u) => Number((u as any).id))
            .filter((id) => !Number.isNaN(id));
        if (checked) {
            setSelectedUserIds((prev) =>
                Array.from(new Set([...prev, ...pageIds])),
            );
        } else {
            setSelectedUserIds((prev) =>
                prev.filter((id) => !pageIds.includes(id)),
            );
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

    const pendingResetsCount = useMemo(() => {
        return (
            (props.passwordResetRequests as any[])?.filter(
                (r: any) => r.status === 'pending',
            ).length ?? 0
        );
    }, [props.passwordResetRequests]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users & Programs" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* ── Hero Header ── */}
                    <ManageUsersHeroHeader
                        activeTab={activeTab}
                        switchTab={switchTab}
                        totalUsers={totalUsers}
                        totalPrograms={programs.length}
                        pendingResetsCount={pendingResetsCount}
                        openCreateModal={openCreateModal}
                        openCreatePHModal={openCreatePHModal}
                        openBulkModal={() => setBulkModalOpen(true)}
                        openCreateProgramModal={() =>
                            setIsCreateProgramModalOpen(true)
                        }
                    />

                    {/* ── USERS TAB ── */}
                    {activeTab === 'users' && (
                        <>
                            <ManageUsersStatsCards roleCounts={roleCounts} />

                            <ManageUsersTableCard
                                totalUsers={totalUsers}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                roleFilter={roleFilter}
                                setRoleFilter={setRoleFilter}
                                courseFilter={courseFilter}
                                setCourseFilter={setCourseFilter}
                                availableCourses={availableCourses}
                                selectedUserIds={selectedUserIds}
                                setSelectedUserIds={setSelectedUserIds}
                                handleSelectAll={handleSelectAll}
                                handleSelectRow={handleSelectRow}
                                handleSelectByYear={handleSelectByYear}
                                pagedStudents={pagedStudents}
                                filteredStudents={filteredStudents}
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                pageIndex={pageIndex}
                                setPageIndex={setPageIndex}
                                totalPages={totalPages}
                                onViewUser={(user) => {
                                    setViewStudent(user);
                                    setViewOpen(true);
                                }}
                                onEditUser={openEditModal}
                                onOpenBulkModal={() => setBulkModalOpen(true)}
                                getInitials={getInitials}
                                isProgramHeadRow={isProgramHeadRow}
                                isAdminRow={isAdminRow}
                            />
                        </>
                    )}

                    {/* ── PROGRAMS TAB ── */}
                    {activeTab === 'programs' && (
                        <ManageProgramsTab
                            programs={programs}
                            isCreateModalOpen={isCreateProgramModalOpen}
                            setIsCreateModalOpen={setIsCreateProgramModalOpen}
                        />
                    )}

                    {/* ── PASSWORD RESETS TAB ── */}
                    {activeTab === 'password-resets' && (
                        <ManagePasswordResetsTab
                            passwordResetRequests={
                                props.passwordResetRequests as any
                            }
                        />
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <ViewStudentDialog
                open={viewOpen}
                onOpenChange={setViewOpen}
                student={viewStudent as any}
            />

            <AddEditUserDialog
                open={open}
                onOpenChange={setOpen}
                editingUser={editingUser}
                hasAnyError={hasAnyError}
                errors={errors}
                form={form}
                setForm={setForm}
                onClose={closeModal}
                onSubmit={submit}
                onOpenBulkAdd={() => setBulkAddOpen(true)}
            />

            <AddProgramHeadDialog
                open={phOpen}
                onOpenChange={setPhOpen}
                editingUser={editingUser}
                hasAnyError={hasAnyError}
                errors={errors}
                form={form}
                setForm={setForm}
                onClose={closeModal}
                onSubmit={submitProgramHead}
            />

            <BulkAddUsersDialog
                open={bulkAddOpen}
                onOpenChange={setBulkAddOpen}
            />

            <BulkActionsModal
                open={bulkModalOpen}
                onOpenChange={setBulkModalOpen}
                users={students as any}
                selectedUserIds={selectedUserIds}
                setSelectedUserIds={setSelectedUserIds}
                availablePrograms={availableCourses}
                onSuccess={() => setSelectedUserIds([])}
            />

            <BulkYearLevelDialog
                open={bulkYearLevelOpen}
                onOpenChange={setBulkYearLevelOpen}
                selectedUserIds={selectedUserIds}
                onSuccess={() => setSelectedUserIds([])}
            />
        </AdminLayout>
    );
}
