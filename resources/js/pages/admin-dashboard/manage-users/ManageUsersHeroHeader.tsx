import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ChevronDown,
    GraduationCap,
    KeyRound,
    Layers,
    Plus,
    Shield,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';

interface ManageUsersHeroHeaderProps {
    activeTab: 'users' | 'program-heads' | 'programs' | 'password-resets';
    switchTab?: (tab: 'users' | 'program-heads' | 'programs' | 'password-resets') => void;
    totalUsers: number;
    totalProgramHeads?: number;
    totalPrograms: number;
    pendingResetsCount: number;
    openCreateModal: () => void;
    openCreatePHModal: () => void;
    openCreateAdminModal?: () => void;
    openBulkModal: () => void;
    openCreateProgramModal: () => void;
}

export function ManageUsersHeroHeader({
    activeTab,
    openCreateModal,
    openCreatePHModal,
    openCreateAdminModal,
    openBulkModal,
    openCreateProgramModal,
}: ManageUsersHeroHeaderProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
            <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                        {activeTab === 'users' ? (
                            <Users className="h-7 w-7" />
                        ) : activeTab === 'program-heads' ? (
                            <GraduationCap className="h-7 w-7" />
                        ) : activeTab === 'programs' ? (
                            <Layers className="h-7 w-7" />
                        ) : (
                            <KeyRound className="h-7 w-7" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            {activeTab === 'users' && 'Manage Users'}
                            {activeTab === 'program-heads' && 'Personnels'}
                            {activeTab === 'programs' && 'Academic Programs'}
                            {activeTab === 'password-resets' &&
                                'Password Resets'}
                        </h1>
                        <p className="mt-0.5 text-sm font-medium text-blue-200/80">
                            {activeTab === 'users' &&
                                'Manage user accounts, roles, and permissions'}
                            {activeTab === 'program-heads' &&
                                'Manage academic department personnels and account verification'}
                            {activeTab === 'programs' &&
                                'Manage curriculums, departments, and course offerings'}
                            {activeTab === 'password-resets' &&
                                'Review and approve pending password reset requests'}
                        </p>
                    </div>
                </div>

                {/* Right side: Action buttons inside banner */}
                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                    {activeTab === 'users' ? (
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg">
                                        <UserPlus className="h-5 w-5" />
                                        Add User
                                        <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl"
                                >
                                    <DropdownMenuItem
                                        onClick={openCreateModal}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                                    >
                                        <UserPlus className="h-4.5 w-4.5 text-blue-600" />
                                        Add Student / Officer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={openCreatePHModal}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                                    >
                                        <GraduationCap className="h-4.5 w-4.5 text-[#1e3a8a]" />
                                        Add Personnel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={openCreateAdminModal}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-950"
                                    >
                                        <Shield className="h-4.5 w-4.5 text-amber-600" />
                                        <div className="flex flex-col text-left">
                                            <span>Add Administrator</span>
                                            <span className="text-[10px] text-amber-600 font-medium">3-Day Handover Flow</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={openBulkModal}
                                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                                    >
                                        <Layers className="h-4.5 w-4.5 text-blue-600" />
                                        Bulk Actions Manager
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : activeTab === 'program-heads' ? (
                        <Button
                            onClick={openCreatePHModal}
                            className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50"
                        >
                            <Plus className="h-5 w-5" />
                            Add Personnel
                        </Button>
                    ) : activeTab === 'programs' ? (
                        <Button
                            onClick={openCreateProgramModal}
                            className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50"
                        >
                            <Plus className="h-5 w-5" />
                            Add Program
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
