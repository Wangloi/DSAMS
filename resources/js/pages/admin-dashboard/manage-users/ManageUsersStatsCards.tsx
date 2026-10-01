import React from 'react';
import { ShieldCheck, UserCheck, Users } from 'lucide-react';

interface ManageUsersStatsCardsProps {
    roleCounts: {
        student: number;
        programHead: number;
        admin: number;
    };
}

export function ManageUsersStatsCards({
    roleCounts,
}: ManageUsersStatsCardsProps) {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Students Card */}
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-emerald-500/5" />
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[8px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Students
                        </p>
                        <p className="mt-1 sm:mt-2 text-lg sm:text-4xl font-black text-slate-900 dark:text-white">
                            {roleCounts.student}
                        </p>
                        <p className="mt-0.5 sm:mt-1 truncate text-[9px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Active
                        </p>
                    </div>
                    <div className="grid h-7 w-7 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-lg sm:rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                        <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                </div>
                <div className="mt-2 sm:mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                </div>
            </div>

            {/* Program Heads Card */}
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-amber-500/5" />
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[8px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Prog Heads
                        </p>
                        <p className="mt-1 sm:mt-2 text-lg sm:text-4xl font-black text-slate-900 dark:text-white">
                            {roleCounts.programHead}
                        </p>
                        <p className="mt-0.5 sm:mt-1 truncate text-[9px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
                            Assigned
                        </p>
                    </div>
                    <div className="grid h-7 w-7 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-lg sm:rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30">
                        <UserCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                </div>
                <div className="mt-2 sm:mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                </div>
            </div>

            {/* Administrators Card */}
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#0B192C]/60 dark:ring-slate-800">
                <div className="pointer-events-none absolute -top-4 -right-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-blue-500/5" />
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[8px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Admins
                        </p>
                        <p className="mt-1 sm:mt-2 text-lg sm:text-4xl font-black text-slate-900 dark:text-white">
                            {roleCounts.admin}
                        </p>
                        <p className="mt-0.5 sm:mt-1 truncate text-[9px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400">
                            System
                        </p>
                    </div>
                    <div className="grid h-7 w-7 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-lg sm:rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                        <ShieldCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                </div>
                <div className="mt-2 sm:mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                </div>
            </div>
        </div>
    );
}

export default ManageUsersStatsCards;
