import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    BookOpen,
    GraduationCap,
    Printer,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import type { UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: UserRow | null;
};

function formatValue(v: any) {
    if (v === null || v === undefined) return '';
    return String(v);
}

export default function ViewStudentDialog({
    open,
    onOpenChange,
    student,
}: Props) {
    const printableHtml = useMemo(() => {
        if (!student) return '';

        const rows = (
            [
                ['Student ID', formatValue(student.student_id)],
                ['Name', formatValue(student.name)],
                ['Email', formatValue(student.email)],
                ['Course', formatValue(student.course)],
                ['Year Level', formatValue(student.year_level)],
                ['Role', formatValue(student.role ?? 'Student')],
                ['Entry Status', formatValue(student.entry_status)],
                ['Program', formatValue(student.program)],
                ['Major', formatValue(student.major)],
                ['Home Address', formatValue(student.home_address)],
                ['Birthday', formatValue(student.birthday)],
                ['Place of Birth', formatValue(student.place_of_birth)],
                ['Religion', formatValue(student.religion)],
                ['Gender', formatValue(student.gender)],
                ['Contact No.', formatValue(student.contact_no)],
                ['Nationality', formatValue(student.nationality)],
                ['Elementary School', formatValue(student.elementary_school)],
                [
                    'Elementary Year Graduated',
                    formatValue(student.elementary_year_graduated),
                ],
                ['Junior High School', formatValue(student.junior_high_school)],
                [
                    'Junior High Year Graduated',
                    formatValue(student.junior_high_year_graduated),
                ],
                ['Senior High School', formatValue(student.senior_high_school)],
                [
                    'Senior High Year Graduated',
                    formatValue(student.senior_high_year_graduated),
                ],
                ['Mother Name', formatValue(student.mother_name)],
                ['Mother Contact', formatValue(student.mother_contact)],
                ['Father Name', formatValue(student.father_name)],
                ['Father Contact', formatValue(student.father_contact)],
                ['Guardian Name', formatValue(student.guardian_name)],
                ['Guardian Relation', formatValue(student.guardian_relation)],
                ['Guardian Contact', formatValue(student.guardian_contact)],
            ] as [string, string][]
        ).filter(([, value]) => value.trim() !== '');

        const tableRows = rows
            .map(
                ([k, v]) =>
                    `<tr><td class="k">${k}</td><td class="v">${v.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`,
            )
            .join('');

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Student Information</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { color: #475569; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
    td.k { width: 240px; font-weight: 700; background: #f8fafc; }
    td.v { white-space: pre-wrap; }
</style>
</head>
<body>
<h1>Student Information</h1>
<div class="sub">${formatValue(student.name)} • ${formatValue(student.student_id)}</div>
<table>
${tableRows}
</table>
</body>
</html>`;
    }, [student]);

    const print = () => {
        if (!student) return;
        const w = window.open(
            '',
            '_blank',
            'noopener,noreferrer,width=900,height=700',
        );
        if (!w) return;
        w.document.open();
        w.document.write(printableHtml);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full !max-w-4xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
                {!student ? (
                    <div className="p-8 text-center text-slate-500">
                        No student selected.
                    </div>
                ) : (
                    <>
                        {/* PREMIUM HEADER BANNER */}
                        <div className="relative flex-shrink-0 bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-7 text-white">
                            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4.5">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold tracking-wider text-white shadow-inner backdrop-blur-xl">
                                        {student.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                            {student.name}
                                        </DialogTitle>
                                        <DialogDescription className="mt-1 flex items-center gap-2 text-xs font-semibold text-blue-100/80">
                                            <span>
                                                ID: {student.student_id}
                                            </span>
                                            <span>•</span>
                                            <span>{student.email}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-white/25">
                                        {student.course} - {student.year_level}
                                    </Badge>
                                    <Badge
                                        className={
                                            student.is_active
                                                ? 'rounded-full border border-emerald-500/30 bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/35'
                                                : 'rounded-full border border-slate-500/30 bg-slate-500/25 px-2.5 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-slate-500/35'
                                        }
                                    >
                                        {student.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                    <Badge
                                        className={
                                            student.status === 'approved'
                                                ? 'rounded-full border border-teal-500/30 bg-teal-500/25 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 hover:bg-teal-500/35'
                                                : student.status === 'rejected'
                                                  ? 'rounded-full border border-rose-500/30 bg-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/35'
                                                  : 'rounded-full border border-amber-500/30 bg-amber-500/25 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/35'
                                        }
                                    >
                                        {student.status === 'approved'
                                            ? 'Approved'
                                            : student.status === 'rejected'
                                              ? 'Rejected'
                                              : 'Pending'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* DETAILED INFORMATION GRID */}
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-8 dark:bg-slate-900/50">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* ACADEMIC PROFILE */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#0b2d66] dark:bg-blue-950/40 dark:text-blue-400">
                                            <GraduationCap className="h-4.5 w-4.5" />
                                        </div>
                                        <span className="text-xs font-black tracking-widest text-slate-800 uppercase dark:text-slate-200">
                                            Academic Profile
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Entry Status
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.entry_status ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Program
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.program ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Major
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.major ?? 'General'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                System Role
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.role ?? 'Student'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* PERSONAL INFORMATION */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#000d6a]/5 text-[#000d6a] dark:bg-indigo-950/40 dark:text-indigo-400">
                                            <UserRound className="h-4.5 w-4.5" />
                                        </div>
                                        <span className="text-xs font-black tracking-widest text-slate-800 uppercase dark:text-slate-200">
                                            Personal Details
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Home Address
                                            </span>
                                            <span className="max-w-[200px] text-right leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.home_address ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Gender / Religion
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.gender ?? 'N/A'}{' '}
                                                {student.religion
                                                    ? `• ${student.religion}`
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Contact No.
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.contact_no ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Nationality
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.nationality ??
                                                    'Filipino'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                Birth Date / Place
                                            </span>
                                            <span className="text-right leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.birthday ?? 'N/A'}{' '}
                                                <br />
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    {student.place_of_birth ??
                                                        ''}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* PRIOR EDUCATION */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs md:col-span-2 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="dark:text-amber-450 grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40">
                                            <BookOpen className="h-4.5 w-4.5" />
                                        </div>
                                        <span className="text-xs font-black tracking-widest text-slate-800 uppercase dark:text-slate-200">
                                            Prior Educational History
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Elementary School
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.elementary_school ??
                                                    'N/A'}
                                            </div>
                                            {student.elementary_year_graduated && (
                                                <div className="text-xs font-medium text-slate-500">
                                                    Graduated:{' '}
                                                    {
                                                        student.elementary_year_graduated
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Junior High School
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.junior_high_school ??
                                                    'N/A'}
                                            </div>
                                            {student.junior_high_year_graduated && (
                                                <div className="text-xs font-medium text-slate-500">
                                                    Graduated:{' '}
                                                    {
                                                        student.junior_high_year_graduated
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Senior High School
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.senior_high_school ??
                                                    'N/A'}
                                            </div>
                                            {student.senior_high_year_graduated && (
                                                <div className="text-xs font-medium text-slate-500">
                                                    Graduated:{' '}
                                                    {
                                                        student.senior_high_year_graduated
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* FAMILY BACKGROUND & EMERGENCY CONTACTS */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs md:col-span-2 dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                                            <Users className="h-4.5 w-4.5" />
                                        </div>
                                        <span className="text-xs font-black tracking-widest text-slate-800 uppercase dark:text-slate-200">
                                            Family & Emergency Contacts
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Mother's Details
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.mother_name ?? 'N/A'}
                                            </div>
                                            {student.mother_contact && (
                                                <div className="text-xs font-semibold text-slate-500">
                                                    {student.mother_contact}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Father's Details
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.father_name ?? 'N/A'}
                                            </div>
                                            {student.father_contact && (
                                                <div className="text-xs font-semibold text-slate-500">
                                                    {student.father_contact}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Emergency Guardian
                                            </div>
                                            <div className="text-sm leading-snug font-semibold text-slate-900 dark:text-white">
                                                {student.guardian_name ?? 'N/A'}
                                                {student.guardian_relation
                                                    ? ` (${student.guardian_relation})`
                                                    : ''}
                                            </div>
                                            {student.guardian_contact && (
                                                <div className="text-xs font-semibold text-slate-500">
                                                    {student.guardian_contact}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DIALOG ACTIONS FOOTER */}
                        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50 px-8 py-4 dark:border-slate-800 dark:bg-slate-950">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Close Profile
                            </Button>
                            <Button
                                type="button"
                                className="gap-2 bg-[#0b2d66] font-semibold text-white shadow-md transition-all hover:translate-y-[-1px] hover:bg-[#1e40af] active:translate-y-0"
                                onClick={print}
                            >
                                <Printer className="h-4.5 w-4.5" />
                                Print Slip
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
