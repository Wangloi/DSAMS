import { Head, Link } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { Users, Search, ChevronRight, GraduationCap, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

    // Calculate pagination values
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

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
                    <Card className="overflow-hidden border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2rem]">
                        <CardContent className="p-0">
                            {/* Toolbar for Search and Filter */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                <div className="relative max-w-sm w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                    <select
                                        value={yearFilter}
                                        onChange={(e) => setYearFilter(e.target.value)}
                                        className="block w-full py-2 pl-3 pr-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    >
                                        {yearLevels.map(year => (
                                            <option key={year} value={year}>{year === 'All' ? 'All Year Levels' : year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

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
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                            <tr>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Student ID</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Name</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Program</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">Year Level</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {paginatedStudents.map((student) => (
                                                <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                        {student.student_id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/20">
                                                                {student.name.charAt(0).toUpperCase()}
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
                                                    <td className="px-6 py-4 text-right">
                                                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] uppercase tracking-widest font-black">
                                                            {student.status || 'Active'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {filteredStudents.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
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
