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
import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Eye,
    Filter,
    GraduationCap,
    Search,
    UserCheck,
    Users,
    UserX,
    XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import ProgramHeadLayout from './components/ProgramHeadLayout';
import ViewStudentDialog from '../admin-dashboard/manage-users/ViewStudentDialog';
import type { UserRow } from '../admin-dashboard/manage-users/types';

type StudentRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    status: string;
    is_active?: boolean;
    email?: string;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    qr_code_path?: string | null;
    entry_status?: string | null;
    program?: string | null;
    major?: string | null;
    home_address?: string | null;
    birthday?: string | null;
    place_of_birth?: string | null;
    religion?: string | null;
    gender?: string | null;
    contact_no?: string | null;
    nationality?: string | null;
    elementary_school?: string | null;
    elementary_year_graduated?: string | number | null;
    junior_high_school?: string | null;
    junior_high_year_graduated?: string | number | null;
    senior_high_school?: string | null;
    senior_high_year_graduated?: string | number | null;
    mother_name?: string | null;
    mother_contact?: string | null;
    father_name?: string | null;
    father_contact?: string | null;
    guardian_name?: string | null;
    guardian_relation?: string | null;
    guardian_contact?: string | null;
};

type Props = {
    user?: { name: string };
    program?: string;
    students: StudentRow[];
};

export default function StudentsList({ user, program, students }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const [viewingStudent, setViewingStudent] = useState<UserRow | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const handleViewRecord = (student: StudentRow) => {
        setViewingStudent({
            ...student,
            id: Number(student.id),
        } as any);
        setIsViewOpen(true);
    };
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const itemsPerPage = 10;

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesSearch =
                student.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                student.student_id
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesYear =
                yearFilter === 'All' || student.year_level === yearFilter;
            return matchesSearch && matchesYear;
        });
    }, [students, searchQuery, yearFilter]);

    // Reset to page 1 whenever search or filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, yearFilter]);

    React.useEffect(() => {
        setSelectedUserIds([]);
    }, [currentPage, searchQuery, yearFilter]);

    // Calculate pagination values
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(
        startIndex,
        startIndex + itemsPerPage,
    );

    const handleSelectAll = (checked: boolean) => {
        const pageIds = paginatedStudents
            .map((u) => Number(u.id))
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
            .filter((s) => s.year_level === level)
            .map((s) => Number(s.id))
            .filter((id) => !Number.isNaN(id));

        setSelectedUserIds((prev) => Array.from(new Set([...prev, ...ids])));
    };

    // Extract unique year levels for the filter dropdown
    const yearLevels = useMemo(() => {
        const levels = new Set(
            students.map((s) => s.year_level).filter(Boolean),
        );
        return ['All', ...Array.from(levels).sort()];
    }, [students]);

    return (
        <ProgramHeadLayout>
            <Head title="All Students - Program Head" />

            <div className="min-h-screen bg-[#f8fafc] transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Background Elements */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
                    <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
                </div>

                <div className="relative flex w-full flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center space-x-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Link
                            href="/program-head-dashboard"
                            className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            Dashboard
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-bold tracking-tight text-slate-900 dark:text-white">
                            Students
                        </span>
                    </nav>

                    {/* Premium Hero Header */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                                    <Users className="h-7 w-7 text-blue-200" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white">
                                        All Students
                                    </h1>
                                    <div className="mt-0.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <p className="text-sm font-medium text-blue-200/80">
                                            Manage student verification, view lists, and search details.
                                        </p>
                                        {program && (
                                            <Badge
                                                variant="outline"
                                                className="w-fit gap-1 self-center rounded-lg border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:self-auto"
                                            >
                                                <Users className="h-2.5 w-2.5 text-blue-300" />
                                                {program}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Live Date Indicator widget */}
                            <div className="hidden items-center gap-3 self-center rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-md md:flex">
                                <CalendarDays className="h-4 w-4 text-blue-200" />
                                <div className="text-xs font-semibold tracking-wide text-white/90 uppercase">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students List Card */}
                    <Card className="border-0 bg-white shadow-lg dark:bg-[#0B192C]/50">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                        Student Directory
                                    </CardTitle>
                                </div>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="relative w-full max-w-sm">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or ID..."
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="h-9 rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex w-full items-center gap-2 sm:w-auto">
                                        <Filter className="h-4 w-4 text-slate-400" />
                                        <select
                                            value={yearFilter}
                                            onChange={(e) =>
                                                setYearFilter(e.target.value)
                                            }
                                            className="h-9 rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-slate-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            {yearLevels.map((year) => (
                                                <option key={year} value={year}>
                                                    {year === 'All'
                                                        ? 'All Year Levels'
                                                        : year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        {selectedUserIds.length > 0 && (
                            <div className="flex items-center justify-between border-y border-emerald-200 bg-emerald-50/50 px-6 py-3 transition-all dark:border-emerald-800/30 dark:bg-emerald-900/10">
                                <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                                    {selectedUserIds.length} student(s) selected
                                </div>
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="ml-auto bg-white dark:bg-slate-800"
                                            >
                                                Bulk Actions{' '}
                                                <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-48"
                                        >
                                            <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                                                Verification
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem
                                                className="cursor-pointer font-medium text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Approve Selected?',
                                                        text: 'This will approve the verification status of the selected students.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor:
                                                            '#059669',
                                                        confirmButtonText:
                                                            'Yes, approve them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(
                                                                '/program-head/students/bulk/verification/approve',
                                                                {
                                                                    ids: selectedUserIds,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () =>
                                                                            setSelectedUserIds(
                                                                                [],
                                                                            ),
                                                                },
                                                            );
                                                        }
                                                    });
                                                }}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer font-medium text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Reject Selected?',
                                                        text: 'This will reject the verification status of the selected students.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor:
                                                            '#dc2626',
                                                        confirmButtonText:
                                                            'Yes, reject them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(
                                                                '/program-head/students/bulk/verification/reject',
                                                                {
                                                                    ids: selectedUserIds,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () =>
                                                                            setSelectedUserIds(
                                                                                [],
                                                                            ),
                                                                },
                                                            );
                                                        }
                                                    });
                                                }}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />{' '}
                                                Reject
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                                                Account Status
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem
                                                className="cursor-pointer font-medium text-blue-600 focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-950"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Activate Selected?',
                                                        text: 'This will set the account status of the selected students to Active.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor:
                                                            '#2563eb',
                                                        confirmButtonText:
                                                            'Yes, activate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(
                                                                '/program-head/students/bulk/status/activate',
                                                                {
                                                                    ids: selectedUserIds,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () =>
                                                                            setSelectedUserIds(
                                                                                [],
                                                                            ),
                                                                },
                                                            );
                                                        }
                                                    });
                                                }}
                                            >
                                                <UserCheck className="mr-2 h-4 w-4" />{' '}
                                                Activate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer font-medium text-slate-700 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-300 dark:focus:bg-slate-800"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Deactivate Selected?',
                                                        text: 'This will set the account status of the selected students to Inactive.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor:
                                                            '#475569',
                                                        confirmButtonText:
                                                            'Yes, deactivate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post(
                                                                '/program-head/students/bulk/status/deactivate',
                                                                {
                                                                    ids: selectedUserIds,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    onSuccess:
                                                                        () =>
                                                                            setSelectedUserIds(
                                                                                [],
                                                                            ),
                                                                },
                                                            );
                                                        }
                                                    });
                                                }}
                                            >
                                                <UserX className="mr-2 h-4 w-4" />{' '}
                                                Deactivate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}
                        <CardContent
                            className={
                                selectedUserIds.length > 0 ? 'p-0 pt-4' : 'p-0'
                            }
                        >
                            {filteredStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-blue-500/20 blur-2xl" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl ring-4 shadow-blue-500/30 ring-white dark:ring-slate-800">
                                            <Search className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                        No Students Found
                                    </h3>
                                    <p className="max-w-sm text-slate-500 dark:text-slate-400">
                                        {students.length === 0
                                            ? 'There are currently no students registered under this program.'
                                            : 'No students match your current search and filter criteria.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                                    <table className="min-w-full border-collapse">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="w-20 px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Checkbox
                                                            checked={
                                                                paginatedStudents.length >
                                                                    0 &&
                                                                paginatedStudents.every(
                                                                    (u) =>
                                                                        selectedUserIds.includes(
                                                                            Number(
                                                                                u.id,
                                                                            ),
                                                                        ),
                                                                )
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                handleSelectAll(
                                                                    checked as boolean,
                                                                )
                                                            }
                                                            aria-label="Select all"
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <button className="text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-300">
                                                                    <ChevronDown className="h-3 w-3" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start">
                                                                <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                                                                    Select By
                                                                    Year
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {[
                                                                    '1st Year',
                                                                    '2nd Year',
                                                                    '3rd Year',
                                                                    '4th Year',
                                                                    'Irregular',
                                                                ].map(
                                                                    (level) => (
                                                                        <DropdownMenuItem
                                                                            key={
                                                                                level
                                                                            }
                                                                            onClick={() =>
                                                                                handleSelectByYear(
                                                                                    level,
                                                                                )
                                                                            }
                                                                            className="cursor-pointer"
                                                                        >
                                                                            {
                                                                                level
                                                                            }
                                                                        </DropdownMenuItem>
                                                                    ),
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setSelectedUserIds(
                                                                            [],
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-red-600 focus:text-red-700"
                                                                >
                                                                    Clear
                                                                    Selection
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Student ID
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Name
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Program
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Year Level
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Account Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Verification Status
                                                </th>
                                                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                                            {paginatedStudents.map(
                                                (student) => {
                                                    const initials =
                                                        student.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .slice(0, 2)
                                                            .toUpperCase();

                                                    return (
                                                        <tr
                                                            key={student.id}
                                                            className="transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <Checkbox
                                                                    checked={selectedUserIds.includes(
                                                                        Number(
                                                                            student.id,
                                                                        ),
                                                                    )}
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        handleSelectRow(
                                                                            Number(
                                                                                student.id,
                                                                            ),
                                                                            checked as boolean,
                                                                        )
                                                                    }
                                                                    aria-label={`Select ${student.name}`}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                                {
                                                                    student.student_id
                                                                }
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                                        {
                                                                            initials
                                                                        }
                                                                    </div>
                                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                                        {
                                                                            student.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                                {student.course}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-indigo-200 bg-indigo-50 text-[10px] font-black tracking-widest text-indigo-700 uppercase dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
                                                                >
                                                                    <GraduationCap className="mr-1 h-3 w-3" />
                                                                    {
                                                                        student.year_level
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-left">
                                                                {student.is_active ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-emerald-200 bg-emerald-50 text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                                    >
                                                                        Active
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-slate-200 bg-slate-50 text-[10px] font-black tracking-widest text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400"
                                                                    >
                                                                        Inactive
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-left">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        student.status ===
                                                                        'approved'
                                                                            ? 'border-emerald-200 bg-emerald-50 text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                                            : student.status ===
                                                                                'rejected'
                                                                              ? 'border-red-200 bg-red-50 text-[10px] font-black tracking-widest text-red-700 uppercase dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                                                                              : 'border-amber-200 bg-amber-50 text-[10px] font-black tracking-widest text-amber-700 uppercase dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                                                                    }
                                                                >
                                                                    {student.status
                                                                        ? student.status
                                                                        : 'Pending'}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleViewRecord(student)}
                                                                    className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B192C] dark:text-slate-300 dark:hover:bg-slate-800/80"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    View Record
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {filteredStudents.length > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing{' '}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {startIndex + 1}
                                        </span>{' '}
                                        to{' '}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {Math.min(
                                                startIndex + itemsPerPage,
                                                filteredStudents.length,
                                            )}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {filteredStudents.length}
                                        </span>{' '}
                                        students
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Previous
                                        </button>
                                        <div className="px-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <button
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ViewStudentDialog
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                student={viewingStudent}
            />
        </ProgramHeadLayout>
    );
}
