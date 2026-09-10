import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { ChevronDown, Eye, Layers, Pencil, Search } from 'lucide-react';
import type { UserRow } from './types';

interface ManageUsersTableCardProps {
    totalUsers: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    roleFilter: string;
    setRoleFilter: (role: string) => void;
    courseFilter: string;
    setCourseFilter: (course: string) => void;
    availableCourses: string[];
    selectedUserIds: number[];
    setSelectedUserIds: React.Dispatch<React.SetStateAction<number[]>>;
    handleSelectAll: (checked: boolean) => void;
    handleSelectRow: (id: number, checked: boolean) => void;
    handleSelectByYear: (level: string) => void;
    pagedStudents: UserRow[];
    filteredStudents: UserRow[];
    pageSize: number;
    setPageSize: (size: number) => void;
    pageIndex: number;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    onViewUser: (user: UserRow) => void;
    onEditUser: (user: UserRow) => void;
    onOpenBulkModal: () => void;
    getInitials: (name: string) => string;
    isProgramHeadRow: (user: UserRow) => boolean;
    isAdminRow: (user: UserRow) => boolean;
}

export function ManageUsersTableCard({
    totalUsers,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    courseFilter,
    setCourseFilter,
    availableCourses,
    selectedUserIds,
    setSelectedUserIds,
    handleSelectAll,
    handleSelectRow,
    handleSelectByYear,
    pagedStudents,
    filteredStudents,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    totalPages,
    onViewUser,
    onEditUser,
    onOpenBulkModal,
    getInitials,
    isProgramHeadRow,
    isAdminRow,
}: ManageUsersTableCardProps) {
    return (
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
                                className="h-8.5 border border-slate-200 bg-white pl-8 text-xs dark:border-slate-600 dark:bg-slate-800"
                                name="manage_users_search"
                                type="search"
                                autoComplete="new-password"
                                autoCorrect="off"
                                spellCheck={false}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select
                            value={roleFilter}
                            onValueChange={(v) => {
                                setRoleFilter(v);
                                setPageIndex(1);
                            }}
                        >
                            <SelectTrigger className="h-8.5 w-[140px] border border-slate-200 bg-white text-xs dark:border-slate-600 dark:bg-slate-800">
                                <SelectValue placeholder="All Users" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="students">Students</SelectItem>
                                <SelectItem value="program">
                                    Program Heads
                                </SelectItem>
                                <SelectItem value="1st Year">1st Year</SelectItem>
                                <SelectItem value="2nd Year">2nd Year</SelectItem>
                                <SelectItem value="3rd Year">3rd Year</SelectItem>
                                <SelectItem value="4th Year">4th Year</SelectItem>
                                <SelectItem value="Irregular">Irregular</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={courseFilter}
                            onValueChange={(v) => {
                                setCourseFilter(v);
                                setPageIndex(1);
                            }}
                        >
                            <SelectTrigger className="h-8.5 w-[130px] border border-slate-200 bg-white text-xs dark:border-slate-600 dark:bg-slate-800">
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

                        <Button
                            type="button"
                            className="h-8.5 bg-[#1e3a8a] text-white hover:bg-blue-900 font-bold text-xs shadow-sm gap-1.5"
                            onClick={onOpenBulkModal}
                        >
                            <Layers className="h-4 w-4" />
                            Bulk Actions
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {selectedUserIds.length > 0 && (
                <div className="flex items-center justify-between border-y border-emerald-200 bg-emerald-50/50 px-6 py-3 transition-all dark:border-emerald-800/30 dark:bg-emerald-900/10">
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                        {selectedUserIds.length} user(s) selected
                    </div>
                    <div>
                        <Button
                            type="button"
                            className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1e3a8a] text-white hover:opacity-95 font-bold shadow-md shadow-slate-950/20 text-xs px-4"
                            onClick={onOpenBulkModal}
                        >
                            <Layers className="mr-2 h-4 w-4 text-amber-400" />
                            Bulk Actions
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
                                    <th className="w-20 px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Checkbox
                                                checked={
                                                    pagedStudents.length > 0 &&
                                                    pagedStudents.every((u) =>
                                                        selectedUserIds.includes(
                                                            Number((u as any).id),
                                                        ),
                                                    )
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleSelectAll(
                                                        checked as boolean,
                                                    )
                                                }
                                                aria-label="Select all"
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-300">
                                                        <ChevronDown className="h-3 w-3" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                                                        Select By Year
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {[
                                                        '1st Year',
                                                        '2nd Year',
                                                        '3rd Year',
                                                        '4th Year',
                                                        'Irregular',
                                                    ].map((level) => (
                                                        <DropdownMenuItem
                                                            key={level}
                                                            onClick={() =>
                                                                handleSelectByYear(
                                                                    level,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            {level}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setSelectedUserIds([])
                                                        }
                                                        className="cursor-pointer text-red-600 focus:text-red-700"
                                                    >
                                                        Clear Selection
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </th>
                                    <th className="w-12 px-2 py-4 text-[10px] font-bold tracking-wider uppercase">
                                        #
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
                                        Year Level
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                                        Department / Program
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
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
                                                    checked={selectedUserIds.includes(
                                                        Number((u as any).id),
                                                    )}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectRow(
                                                            Number(
                                                                (u as any).id,
                                                            ),
                                                            checked as boolean,
                                                        )
                                                    }
                                                    aria-label={`Select ${u.name}`}
                                                />
                                            </td>
                                            <td className="px-2 py-4 text-slate-500 dark:text-slate-400">
                                                {(Math.min(
                                                    Math.max(pageIndex, 1),
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
                                                            {getInitials(u.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {u.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                        u.role
                                                            ?.toLowerCase()
                                                            .includes('admin')
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            : u.role
                                                                    ?.toLowerCase()
                                                                    .includes(
                                                                        'program',
                                                                    )
                                                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}
                                                >
                                                    {u.role ?? 'Student'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.year_level ? (
                                                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
                                                        {u.year_level}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {String(
                                                        u.course ?? '',
                                                    ).trim() || '—'}
                                                </div>
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
                                                                isAdminRow(u)
                                                            ) {
                                                                return;
                                                            }
                                                            onViewUser(u);
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
                                                                isAdminRow(u)
                                                            ) {
                                                                return;
                                                            }
                                                            onEditUser(u);
                                                        }}
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </Button>
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
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {[10, 25, 50, 100, 255].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="text-slate-400 dark:text-slate-600">
                            |
                        </span>
                        <span>
                            Showing{' '}
                            {filteredStudents.length === 0
                                ? 0
                                : (Math.min(Math.max(pageIndex, 1), totalPages) -
                                      1) *
                                      pageSize +
                                  1}{' '}
                            to{' '}
                            {Math.min(
                                Math.min(Math.max(pageIndex, 1), totalPages) *
                                    pageSize,
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
                                setPageIndex((p) => Math.max(1, p - 1))
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
                                setPageIndex((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={pageIndex >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
