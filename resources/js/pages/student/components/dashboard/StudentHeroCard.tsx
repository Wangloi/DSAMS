import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, CalendarCheck2, Clock, FileText, GraduationCap } from 'lucide-react';
import type { User } from '@/types/auth';
import { getRealAcademicYearInfo } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { studentInformationSheet } from '@/routes';

interface StudentHeroCardProps {
    user?: User | null;
    displayName: string;
    studentId: string;
    program: string;
    academicYear: string;
    setAcademicYear: (val: string) => void;
    getInitials: (name: string) => string;
}

export function StudentHeroCard({
    user,
    displayName,
    studentId,
    program,
    academicYear,
    setAcademicYear,
    getInitials,
}: StudentHeroCardProps) {
    const sessionInfo = useMemo(() => getRealAcademicYearInfo(), []);
    const selectedAY = academicYear || sessionInfo.currentAY;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b2d66] via-[#0d3478] to-[#1e40af] p-6 text-left shadow-2xl sm:p-8 md:p-10">
            {/* Interactive glow effect */}
            <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl transition-transform duration-1000" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* Left side: Student details */}
                <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                    <div className="relative">
                        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-400 opacity-20 blur transition duration-500" />
                        <Avatar className="relative h-16 w-16 rounded-2xl border-4 border-white/10 shadow-2xl ring-1 ring-white/20 sm:h-20 sm:w-20">
                            <AvatarImage
                                src={user?.avatar ?? undefined}
                                alt={displayName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-2xl font-black text-white">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute -right-1 -bottom-1 h-5 w-5 animate-pulse rounded-full border-4 border-[#0b2d66] bg-emerald-500 shadow-lg"
                            title="Active Portal Session"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[8px] font-black tracking-widest text-blue-200 uppercase backdrop-blur-md">
                                Student Dashboard
                            </span>
                            <h1 className="text-xl leading-tight font-black tracking-tight text-white sm:text-3xl">
                                Welcome back,{' '}
                                <span className="bg-gradient-to-r from-blue-200 via-indigo-100 to-white bg-clip-text text-transparent">
                                    {displayName}
                                </span>
                                !
                            </h1>
                            <p className="max-w-lg text-xs leading-relaxed font-semibold text-blue-100/70">
                                Your academic standing is active and all attendance
                                modules are up-to-date. Below is your current
                                standing today.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <Badge
                                variant="outline"
                                className="gap-1.5 rounded-lg border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase backdrop-blur-md"
                            >
                                <GraduationCap className="h-3 w-3 text-blue-300" />
                                {program}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="gap-1.5 rounded-lg border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase backdrop-blur-md"
                            >
                                <Clock className="h-3 w-3 text-blue-300" />
                                ID: {studentId}
                            </Badge>
                            <Link
                                href={studentInformationSheet()}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-blue-100 uppercase backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                            >
                                <FileText className="h-3 w-3 text-blue-300" />
                                Information Sheet
                            </Link>
                            <a
                                href="#event-history"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-blue-100 uppercase backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                            >
                                <CalendarCheck2 className="h-3 w-3 text-blue-300" />
                                Event History
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right side: Academic year select */}
                <div className="flex shrink-0 flex-col items-center justify-center md:items-end">
                    <div className="w-full sm:w-52">
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <label className="text-[8px] font-black tracking-[0.25em] text-blue-200/50 uppercase">
                                Academic Session
                            </label>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {sessionInfo.semester}
                            </span>
                        </div>
                        <Select
                            value={selectedAY}
                            onValueChange={setAcademicYear}
                        >
                            <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/10">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-blue-300" />
                                    <SelectValue placeholder="Academic Year">
                                        AY {selectedAY}
                                    </SelectValue>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/10 bg-[#0b2d66] text-white backdrop-blur-2xl">
                                {sessionInfo.options.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-xs focus:bg-white/10 focus:text-white"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="mt-1 text-center text-[10px] font-medium text-blue-200/50 sm:text-left md:text-right">
                            Today • {sessionInfo.todayFormatted}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
