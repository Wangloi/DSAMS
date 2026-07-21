import { Head, Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { Users, Search, ChevronRight, GraduationCap, Filter, CheckCircle, XCircle, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';
import ProgramHeadLayout from './components/ProgramHeadLayout';

type StudentRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    status: string;
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
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const itemsPerPage = 10;

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesYear = yearFilter === 'All' || student.year_level === yearFilter;
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
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const ids = paginatedStudents.map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
            setSelectedUserIds(ids);
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedUserIds((prev) => [...prev, id]);
        } else {
            setSelectedUserIds((prev) => prev.filter((i) => i !== id));
        }
    };

    // Extract unique year levels for the filter dropdown
    const yearLevels = useMemo(() => {
        const levels = new Set(students.map(s => s.year_level).filter(Boolean));
        return ['All', ...Array.from(levels).sort()];
    }, [students]);

    return (
        <ProgramHeadLayout>
            <Head title="All Students - Program Head" />

            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500">
                {/* Visual Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
                </div>

                <div className="relative flex w-full flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
                    
                    {/* Breadcrumbs */}
                    <nav className="flex items-center space-x-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <Link href="/program-head-dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Dashboard
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-slate-900 dark:text-white font-bold tracking-tight">Students</span>
                    </nav>

                    {/* Premium Hero Header */}
                    <div className="group relative overflow-hidden rounded-[2.5rem] bg-[#0b2d66] p-8 text-white shadow-2xl dark:bg-[#051139] border border-white/5 transition-all duration-500">
                        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                        
                        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-inner group-hover:rotate-3 transition-transform duration-500">
                                    <Users className="h-8 w-8 text-blue-100" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                        All Students
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 text-blue-100/70 font-medium">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        {program || 'Program'} Directory
                                    </p>
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
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="relative max-w-sm w-full">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Filter className="h-4 w-4 text-slate-400" />
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => setYearFilter(e.target.value)}
                                            className="h-9 pl-3 pr-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        >
                                            {yearLevels.map(year => (
                                                <option key={year} value={year}>{year === 'All' ? 'All Year Levels' : year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </CardHeader>
                        {selectedUserIds.length > 0 && (
                            <div className="flex items-center justify-between border-y border-emerald-200 bg-emerald-50/50 px-6 py-3 dark:border-emerald-800/30 dark:bg-emerald-900/10 transition-all">
                                <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                                    {selectedUserIds.length} student(s) selected
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
                                                        text: 'This will approve the verification status of the selected students.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#059669',
                                                        confirmButtonText: 'Yes, approve them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/program-head/students/bulk/verification/approve', { ids: selectedUserIds }, {
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
                                                        text: 'This will reject the verification status of the selected students.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#dc2626',
                                                        confirmButtonText: 'Yes, reject them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/program-head/students/bulk/verification/reject', { ids: selectedUserIds }, {
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
                                                        text: 'This will set the account status of the selected students to Active.',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#2563eb',
                                                        confirmButtonText: 'Yes, activate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/program-head/students/bulk/status/activate', { ids: selectedUserIds }, {
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
                                                        text: 'This will set the account status of the selected students to Inactive.',
                                                        icon: 'warning',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#475569',
                                                        confirmButtonText: 'Yes, deactivate them',
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            router.post('/program-head/students/bulk/status/deactivate', { ids: selectedUserIds }, {
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
                        <CardContent className={selectedUserIds.length > 0 ? "p-0 pt-4" : "p-0"}>
                            {filteredStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 ring-4 ring-white dark:ring-slate-800">
                                            <Search className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                        No Students Found
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                        {students.length === 0 
                                            ? "There are currently no students registered under this program."
                                            : "No students match your current search and filter criteria."}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm dark:border-slate-800">
                                    <table className="min-w-full border-collapse">
                                        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="w-12 px-6 py-4">
                                                    <Checkbox
                                                        checked={paginatedStudents.length > 0 && selectedUserIds.length === paginatedStudents.length}
                                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                        aria-label="Select all"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Student ID</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Program</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Year Level</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Account Status</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider">Verification Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
                                            {paginatedStudents.map((student) => {
                                                const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                                return (
                                                    <tr key={student.id} className="transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                                        <td className="px-6 py-4">
                                                            <Checkbox
                                                                checked={selectedUserIds.includes(Number(student.id))}
                                                                onCheckedChange={(checked) => handleSelectRow(Number(student.id), checked as boolean)}
                                                                aria-label={`Select ${student.name}`}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                            {student.student_id}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                                    {initials}
                                                                </div>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                            {student.course}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-[10px] uppercase tracking-widest font-black">
                                                                <GraduationCap className="h-3 w-3 mr-1" />
                                                                {student.year_level}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-left">
                                                            {isActive(Number(student.id)) ? (
                                                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] uppercase tracking-widest font-black">
                                                                    Active
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-widest font-black">
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-left">
                                                            <Badge variant="outline" className={
                                                                student.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] uppercase tracking-widest font-black'
                                                                : student.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-[10px] uppercase tracking-widest font-black'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-[10px] uppercase tracking-widest font-black'
                                                            }>
                                                                {student.status ? student.status : 'Pending'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {filteredStudents.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredStudents.length)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{filteredStudents.length}</span> students
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 px-2">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </ProgramHeadLayout>
    );
}
