import { Printer, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

export default function ViewStudentDialog({ open, onOpenChange, student }: Props) {
    const printableHtml = useMemo(() => {
        if (!student) return '';

        const rows: Array<[string, string]> = [
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
            ['Elementary Year Graduated', formatValue(student.elementary_year_graduated)],
            ['Junior High School', formatValue(student.junior_high_school)],
            ['Junior High Year Graduated', formatValue(student.junior_high_year_graduated)],
            ['Senior High School', formatValue(student.senior_high_school)],
            ['Senior High Year Graduated', formatValue(student.senior_high_year_graduated)],
            ['Mother Name', formatValue(student.mother_name)],
            ['Mother Contact', formatValue(student.mother_contact)],
            ['Father Name', formatValue(student.father_name)],
            ['Father Contact', formatValue(student.father_contact)],
            ['Guardian Name', formatValue(student.guardian_name)],
            ['Guardian Relation', formatValue(student.guardian_relation)],
            ['Guardian Contact', formatValue(student.guardian_contact)],
        ].filter(([, value]) => value.trim() !== '');

        const tableRows = rows
            .map(
                ([k, v]) =>
                    `<tr><td class="k">${k}</td><td class="v">${v.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`
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
        const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
        if (!w) return;
        w.document.open();
        w.document.write(printableHtml);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl bg-white dark:bg-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <UserRound className="h-5 w-5" />
                        </span>
                        Student Information
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">View full student profile details.</DialogDescription>
                </DialogHeader>

                {!student ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 text-sm text-slate-700 dark:text-slate-300">No student selected.</div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="text-base font-semibold text-slate-900 dark:text-white">{student.name}</div>
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{student.email}</div>
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Student ID: {student.student_id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                                    {student.course}
                                </Badge>
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                                    {student.year_level}
                                </Badge>
                                <Badge variant={student.is_active ? 'secondary' : 'outline'} className={student.is_active ? 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'}>
                                    {student.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant={student.status === 'approved' ? 'secondary' : 'outline'} className={student.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : (student.status === 'rejected' ? 'border-rose-300 dark:border-rose-600 text-rose-600 dark:text-rose-400' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400')}>
                                    {student.status === 'approved' ? 'Approved' : (student.status === 'rejected' ? 'Rejected' : 'Pending')}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Student Information</div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Entry Status</span><span className="text-slate-900 dark:text-white">{student.entry_status ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Program</span><span className="text-slate-900 dark:text-white">{student.program ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Major</span><span className="text-slate-900 dark:text-white">{student.major ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Role</span><span className="text-slate-900 dark:text-white">{student.role ?? 'Student'}</span></div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Personal Information</div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Home Address</span><span className="text-slate-900 dark:text-white text-right">{student.home_address ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Birthday</span><span className="text-slate-900 dark:text-white">{student.birthday ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Place of Birth</span><span className="text-slate-900 dark:text-white text-right">{student.place_of_birth ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Religion</span><span className="text-slate-900 dark:text-white">{student.religion ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Gender</span><span className="text-slate-900 dark:text-white">{student.gender ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Contact No.</span><span className="text-slate-900 dark:text-white">{student.contact_no ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Nationality</span><span className="text-slate-900 dark:text-white">{student.nationality ?? ''}</span></div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Academic Background</div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Elementary School</span><span className="text-slate-900 dark:text-white text-right">{student.elementary_school ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Elementary Year Graduated</span><span className="text-slate-900 dark:text-white">{student.elementary_year_graduated ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Junior High School</span><span className="text-slate-900 dark:text-white text-right">{student.junior_high_school ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Junior High Year Graduated</span><span className="text-slate-900 dark:text-white">{student.junior_high_year_graduated ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Senior High School</span><span className="text-slate-900 dark:text-white text-right">{student.senior_high_school ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Senior High Year Graduated</span><span className="text-slate-900 dark:text-white">{student.senior_high_year_graduated ?? ''}</span></div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Family Background</div>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Mother</span><span className="text-slate-900 dark:text-white text-right">{student.mother_name ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Mother Contact</span><span className="text-slate-900 dark:text-white">{student.mother_contact ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Father</span><span className="text-slate-900 dark:text-white text-right">{student.father_name ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Father Contact</span><span className="text-slate-900 dark:text-white">{student.father_contact ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Guardian</span><span className="text-slate-900 dark:text-white text-right">{student.guardian_name ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Guardian Relation</span><span className="text-slate-900 dark:text-white">{student.guardian_relation ?? ''}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Guardian Contact</span><span className="text-slate-900 dark:text-white">{student.guardian_contact ?? ''}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-600 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Close
                            </Button>
                            <Button type="button" className="bg-[#0b2d66] hover:bg-[#1e40af] gap-2" onClick={print}>
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
