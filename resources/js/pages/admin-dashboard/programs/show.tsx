import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminPrograms, adminProgramsUpdate } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    BookOpen,
    Building2,
    CheckCircle,
    Clock,
    Edit,
    GraduationCap,
    UserCheck,
    Users,
} from 'lucide-react';
import AdminLayout from '../admin-layout';

interface Student {
    id: string;
    student_id: string;
    name: string;
    email: string;
    year_level: string;
}

interface Program {
    id: string;
    name: string;
    code: string;
    department: string;
    description: string;
    duration: string;
    status: string;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
    students: Student[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

interface ShowPageProps {
    program: Program;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin-dashboard',
    },
    {
        title: 'Programs',
        href: adminPrograms(),
    },
    {
        title: 'Program Details',
        href: '#',
    },
];

export default function AdminProgramsShowPage({ program }: ShowPageProps) {
    const handleEdit = () => {
        router.visit(adminProgramsUpdate(program.id));
    };

    const handlePageChange = (page: number) => {
        router.get(
            `/admin/programs/${program.id}?page=${page}`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={program.name} />

            {/* Main Content */}
            <div className="flex w-full flex-col gap-6 px-6 py-6">
                {/* Hero Section */}
                <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-black/15">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div className="leading-tight">
                                <div className="text-lg font-semibold">
                                    {program.name}
                                </div>
                                <div className="text-sm text-white/80">
                                    Program details and enrolled students
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2">
                                <Badge className="border-white/30 bg-white/20 text-white hover:bg-white/30">
                                    {program.code}
                                </Badge>
                                <Badge
                                    className={` ${
                                        program.status === 'active'
                                            ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-100'
                                            : 'border-amber-400/30 bg-amber-500/20 text-amber-100'
                                    } `}
                                >
                                    <div className="flex items-center space-x-1">
                                        {program.status === 'active' ? (
                                            <CheckCircle className="h-3 w-3" />
                                        ) : (
                                            <AlertCircle className="h-3 w-3" />
                                        )}
                                        <span>
                                            {program.status === 'active'
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </div>
                                </Badge>
                            </div>
                            <Button
                                onClick={handleEdit}
                                className="bg-white/15 text-white hover:bg-white/25"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Program
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit(adminPrograms())}
                                className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Program Information */}
                <Card className="border-0 bg-white shadow-lg dark:bg-slate-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900">
                                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                Program Information
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Description
                                    </h4>
                                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                        {program.description ||
                                            'No description available for this program.'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
                                    <div className="mb-2 flex items-center space-x-2">
                                        <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Program Code
                                        </span>
                                    </div>
                                    <p className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {program.code}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
                                    <div className="mb-2 flex items-center space-x-2">
                                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Department
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {program.department || 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700">
                                    <div className="mb-2 flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Duration
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                        {program.duration || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enrolled Students */}
                <Card className="border-0 bg-white shadow-lg dark:bg-slate-800">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
                                    Enrolled Students (
                                    {program.pagination.total})
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className="border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200"
                                >
                                    Page {program.pagination.current_page} of{' '}
                                    {program.pagination.last_page}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {program.students.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                    <Users className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                                    No Students Enrolled
                                </h3>
                                <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                                    This program doesn't have any students
                                    enrolled yet. Students will appear here once
                                    they are assigned to this program.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 dark:border-slate-600 dark:from-slate-700 dark:to-slate-800">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                                                Student List
                                            </h4>
                                            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-700 dark:bg-blue-900/30">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                    {program.pagination.total}{' '}
                                                    Total Students
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50 dark:bg-slate-700">
                                                <tr className="border-b border-slate-200 dark:border-slate-600">
                                                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                        #
                                                    </th>
                                                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                        Student Name
                                                    </th>
                                                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                        Student ID
                                                    </th>
                                                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                        Email
                                                    </th>
                                                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                        Year Level
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {program.students.map(
                                                    (student, index) => (
                                                        <tr
                                                            key={student.id}
                                                            className={`transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${index === 0 ? 'bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/20' : ''}`}
                                                        >
                                                            <td className="px-5 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                                                                {(program
                                                                    .pagination
                                                                    .current_page -
                                                                    1) *
                                                                    10 +
                                                                    index +
                                                                    1}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div>
                                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                                        {
                                                                            student.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {
                                                                            student.email
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                                                                        <UserCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-300" />
                                                                    </div>
                                                                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                                                                        {
                                                                            student.student_id
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                                    {
                                                                        student.email
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 transition-all duration-200 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40">
                                                                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                                                    {
                                                                        student.year_level
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination */}
                                <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 bg-white px-5 pb-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <div>
                                        Showing {program.pagination.from} to{' '}
                                        {program.pagination.to} of{' '}
                                        {program.pagination.total} students
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-slate-600 dark:text-slate-400">
                                                Show
                                            </div>
                                            <select
                                                value="10"
                                                className="h-9 w-[70px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                disabled
                                            >
                                                <option value="10">10</option>
                                            </select>
                                            <div className="text-slate-600 dark:text-slate-400">
                                                entries
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
                                                onClick={() =>
                                                    handlePageChange(
                                                        program.pagination
                                                            .current_page - 1,
                                                    )
                                                }
                                                disabled={
                                                    program.pagination
                                                        .current_page === 1
                                                }
                                            >
                                                Prev
                                            </button>
                                            {Array.from({
                                                length: program.pagination
                                                    .last_page,
                                            })
                                                .slice(0, 5)
                                                .map((_, idx) => {
                                                    const num = idx + 1;
                                                    return (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    num,
                                                                )
                                                            }
                                                            className={
                                                                'rounded-md px-2 py-1 ' +
                                                                (program
                                                                    .pagination
                                                                    .current_page ===
                                                                num
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
                                                    handlePageChange(
                                                        program.pagination
                                                            .current_page + 1,
                                                    )
                                                }
                                                disabled={
                                                    program.pagination
                                                        .current_page ===
                                                    program.pagination.last_page
                                                }
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
