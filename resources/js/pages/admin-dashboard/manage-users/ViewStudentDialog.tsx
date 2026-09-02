import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import { useMemo } from 'react';
import type { UserRow } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: UserRow | null;
};

export default function ViewStudentDialog({
    open,
    onOpenChange,
    student,
}: Props) {
    const printableHtml = useMemo(() => {
        if (!student) return '';

        const year1 = student.year_level === '1st Year' ? '[x]' : '[ ]';
        const year2 = student.year_level === '2nd Year' ? '[x]' : '[ ]';
        const year3 = student.year_level === '3rd Year' ? '[x]' : '[ ]';
        const year4 = student.year_level === '4th Year' ? '[x]' : '[ ]';
        const freshman = student.entry_status === 'Freshman' ? '[x]' : '[ ]';
        const returnee = student.entry_status === 'Returnee' ? '[x]' : '[ ]';
        const transferee =
            student.entry_status === 'Transferee' ? '[x]' : '[ ]';
        const oldStudent =
            student.entry_status === 'Old Student' ? '[x]' : '[ ]';

        const genderMale =
            student.gender?.toLowerCase() === 'male' ? '[x]' : '[ ]';
        const genderFemale =
            student.gender?.toLowerCase() === 'female' ? '[x]' : '[ ]';

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Student Information Sheet</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #0b2d66; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-left { height: 75px; width: 75px; object-fit: contain; }
    .logo-right { height: 75px; width: 75px; object-fit: contain; }
    .header-text { flex: 1; text-align: center; }
    .header-text h2 { font-size: 13px; font-weight: 900; margin: 0; color: #0b2d66; }
    .header-text p { margin: 2px 0; color: #334155; font-size: 10px; }
    .title { text-align: center; margin: 20px 0; }
    .title h1 { font-size: 16px; font-weight: 900; color: #0b2d66; margin: 0; letter-spacing: 1px; }
    .title p { font-size: 10px; font-weight: 600; color: #64748b; margin: 4px 0 0; }
    
    .section-title { text-align: center; font-weight: bold; color: #0b2d66; border-bottom: 1px dashed #0b2d66; padding-bottom: 3px; margin: 20px 0 12px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
    
    table.info-table { width: 100%; border-collapse: collapse; border: 1px solid #bfdbfe; margin-bottom: 15px; }
    table.info-table td { border: 1px solid #bfdbfe; padding: 8px; vertical-align: middle; }
    table.info-table td.k { width: 180px; font-weight: bold; color: #0b2d66; background: #eff6ff; font-size: 10px; }
    table.info-table td.k span.sub { font-size: 8px; font-weight: normal; color: #64748b; display: block; margin-top: 1px; }
    
    .checkbox-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .checkbox-item { display: flex; items-center gap: 5px; }
    .checkbox-item span.box { font-family: monospace; font-size: 12px; }
    
    .form-group { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 10px; }
    .form-group.double { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px; }
    .form-group.triple { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 10px; }
    .form-label { font-weight: bold; color: #0b2d66; white-space: nowrap; }
    .form-value { flex: 1; border-bottom: 1px solid #94a3b8; padding-bottom: 1px; font-weight: 600; min-height: 15px; }
    
    .sub-labels { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; font-size: 8px; color: #94a3b8; margin-top: -8px; margin-bottom: 8px; }
    
    table.bg-table { width: 100%; border-collapse: collapse; border: 1px solid #bfdbfe; }
    table.bg-table th, table.bg-table td { border: 1px solid #bfdbfe; padding: 7px 9px; }
    table.bg-table th { background: #eff6ff; color: #0b2d66; font-weight: bold; text-align: center; }
    table.bg-table td.level { font-weight: bold; color: #0b2d66; background: #eff6ff; width: 180px; }
    table.bg-table td.year { text-align: center; width: 120px; }
    
    .signature-block { margin-top: 35px; text-align: center; }
    .signature-line { border-bottom: 1px solid #cbd5e1; width: 240px; margin: 0 auto 4px; font-weight: bold; color: #0b2d66; text-transform: uppercase; padding-bottom: 2px; }
    .signature-label { font-size: 8px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
    
    .footer { margin-top: 50px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
    .footer h3 { font-family: Georgia, serif; font-weight: bold; color: #0b2d66; font-style: italic; margin: 0; font-size: 12px; }
    .footer p { font-size: 9px; color: #64748b; font-style: italic; margin: 3px 0 0; }
    .footer a { color: #2563eb; text-decoration: underline; }
    
    @media print {
        body { padding: 0; }
    }
</style>
</head>
<body>

<div class="header">
    <img src="/images/SRCB.png" class="logo-left" alt="SRCB Logo" />
    <div class="header-text">
        <h2>ST. RITA'S COLLEGE OF BALINGASAG, INC.</h2>
        <p>Balingasag, Misamis Oriental</p>
        <p>Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph</p>
        <p>Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe)</p>
        <p>PAASCU Level II Re-Accredited: Junior High School</p>
        <p>PAASCU Level I: Teacher Education Program & Business Administration Program</p>
        <p style="font-style: italic; color: #64748b;">(Philippine Accrediting Association of Schools, Colleges, and Universities)</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>

<div class="title">
    <h1>STUDENT INFORMATION SHEET</h1>
    <p>Academic Year 2024 &ndash; 2025</p>
</div>

<table class="info-table">
    <tr>
        <td class="k">
            ENTRY STATUS
            <span class="sub">(please check)</span>
        </td>
        <td>
            <div class="checkbox-grid">
                <div class="checkbox-item"><span class="box">${year1}</span> 1st Year</div>
                <div class="checkbox-item"><span class="box">${year2}</span> 2nd Year</div>
                <div class="checkbox-item"><span class="box">${year3}</span> 3rd Year</div>
                <div class="checkbox-item"><span class="box">${year4}</span> 4th Year</div>
                <div class="checkbox-item"><span class="box">${freshman}</span> Freshman</div>
                <div class="checkbox-item"><span class="box">${returnee}</span> Returnee</div>
                <div class="checkbox-item"><span class="box">${transferee}</span> Transferee</div>
                <div class="checkbox-item"><span class="box">${oldStudent}</span> Old Student</div>
            </div>
        </td>
    </tr>
    <tr>
        <td class="k">
            PROGRAM
            <span class="sub">(do not abbreviate)</span>
        </td>
        <td style="font-weight: bold;">
            ${student.program || student.course || 'N/A'}
        </td>
    </tr>
    <tr>
        <td class="k">
            MAJOR
            <span class="sub">(if applicable & do not abbreviate)</span>
        </td>
        <td style="font-weight: bold;">
            ${student.major || 'N/A'}
        </td>
    </tr>
</table>

<div class="section-title">Personal Information</div>

<div class="form-group">
    <span class="form-label">Name:</span>
    <div class="form-value" style="text-align: center; text-transform: uppercase;">${student.name}</div>
</div>
<div class="sub-labels">
    <div>(Surname)</div>
    <div>(Given Name)</div>
    <div>(Middle Name)</div>
</div>

<div class="form-group">
    <span class="form-label">Home Address:</span>
    <div class="form-value">${student.home_address || 'N/A'}</div>
</div>

<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Birthday:</span>
        <div class="form-value">${student.birthday || 'N/A'}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Place of Birth:</span>
        <div class="form-value">${student.place_of_birth || 'N/A'}</div>
    </div>
</div>

<div class="form-group triple">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Religion:</span>
        <div class="form-value">${student.religion || 'N/A'}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Gender:</span>
        <div class="form-value" style="display: flex; gap: 10px; justify-content: center;">
            <span style="display: flex; align-items: center; gap: 3px;"><span style="font-family: monospace; font-size: 13px;">${genderMale}</span> Male</span>
            <span style="display: flex; align-items: center; gap: 3px;"><span style="font-family: monospace; font-size: 13px;">${genderFemale}</span> Female</span>
        </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Contact No.:</span>
        <div class="form-value">${student.contact_no || 'N/A'}</div>
    </div>
</div>

<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">E-mail:</span>
        <div class="form-value">${student.email}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Nationality:</span>
        <div class="form-value">${student.nationality || 'Filipino'}</div>
    </div>
</div>

<div class="section-title">Academic Background</div>

<table class="bg-table">
    <thead>
        <tr>
            <th>LEVEL</th>
            <th>SCHOOL ATTENDED</th>
            <th>YEAR GRADUATED</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="level">Elementary</td>
            <td style="font-weight: 600;">${student.elementary_school || 'N/A'}</td>
            <td class="year" style="font-weight: 600;">${student.elementary_year_graduated || 'N/A'}</td>
        </tr>
        <tr>
            <td class="level">Junior High School</td>
            <td style="font-weight: 600;">${student.junior_high_school || 'N/A'}</td>
            <td class="year" style="font-weight: 600;">${student.junior_high_year_graduated || 'N/A'}</td>
        </tr>
        <tr>
            <td class="level">Senior High School</td>
            <td style="font-weight: 600;">${student.senior_high_school || 'N/A'}</td>
            <td class="year" style="font-weight: 600;">${student.senior_high_year_graduated || 'N/A'}</td>
        </tr>
    </tbody>
</table>

<div class="section-title">Family Background</div>

<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Mother:</span>
        <div class="form-value">${student.mother_name || 'N/A'}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Contact Number:</span>
        <div class="form-value">${student.mother_contact || 'N/A'}</div>
    </div>
</div>

<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Father:</span>
        <div class="form-value">${student.father_name || 'N/A'}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Contact Number:</span>
        <div class="form-value">${student.father_contact || 'N/A'}</div>
    </div>
</div>

<div class="form-group">
    <span class="form-label">Name of Guardian:</span>
    <div class="form-value">${student.guardian_name || 'N/A'}</div>
</div>

<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Relation:</span>
        <div class="form-value">${student.guardian_relation || 'N/A'}</div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Contact Number:</span>
        <div class="form-value">${student.guardian_contact || 'N/A'}</div>
    </div>
</div>

<div class="signature-block">
    <div class="signature-line">${student.name}</div>
    <div class="signature-label">Student Signature</div>
</div>

<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
    <p>E-mail Address: <a href="mailto:heddsa@srcb.edu.ph">heddsa@srcb.edu.ph</a></p>
</div>

<script>
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.print();
        }, 300);
    });
</script>

</body>
</html>`;
    }, [student]);

    const print = () => {
        if (!student) return;
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        w.document.open();
        w.document.write(printableHtml);
        w.document.close();
        w.focus();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-full !max-w-4xl flex-col overflow-hidden rounded-3xl border-0 bg-slate-100 p-0 shadow-2xl dark:bg-slate-900">
                {!student ? (
                    <div className="p-8 text-center text-slate-500">
                        No student selected.
                    </div>
                ) : (
                    <>
                        {/* STICKY STATUS BAR & PRINT ACTIONS */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white pl-6 pr-12 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-2 text-sm font-bold text-slate-900 dark:text-white">
                                    Status Indicators:
                                </span>
                                <Badge
                                    className={
                                        student.is_active
                                            ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'
                                            : 'rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400'
                                    }
                                >
                                    {student.is_active
                                        ? 'Active Account'
                                        : 'Inactive Account'}
                                </Badge>
                                <Badge
                                    className={
                                        student.status === 'approved'
                                            ? 'rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400'
                                            : student.status === 'rejected'
                                              ? 'rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400'
                                              : 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400'
                                    }
                                >
                                    {student.status === 'approved'
                                        ? 'Verified'
                                        : student.status === 'rejected'
                                          ? 'Rejected'
                                          : 'Pending Verification'}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={print}
                                    className="h-8.5 gap-1.5 bg-[#0b2d66] text-xs font-semibold text-white shadow-md transition-all hover:translate-y-[-1px] hover:bg-[#1e40af] active:translate-y-0"
                                >
                                    <Printer className="h-4.5 w-4.5" />
                                    Print Form
                                </Button>
                            </div>
                        </div>

                        {/* SCROLLABLE SHEET PREVIEW */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-10">
                            {/* SHEET CONTAINER */}
                            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-slate-800 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                                {/* School Header branding */}
                                <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-[#0b2d66] pb-4">
                                    <img
                                        src="/images/SRCB.png"
                                        className="h-16 w-16 shrink-0 object-contain md:h-20 md:w-20"
                                        alt="SRCB Logo"
                                    />
                                    <div className="flex-1 text-center text-[10px] leading-normal md:text-xs">
                                        <h2 className="text-xs font-black tracking-wide text-[#0b2d66] md:text-sm dark:text-blue-400">
                                            ST. RITA'S COLLEGE OF BALINGASAG,
                                            INC.
                                        </h2>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">
                                            Balingasag, Misamis Oriental
                                        </p>
                                        <p className="text-slate-500">
                                            Email: ritarian@srcb.edu.ph |
                                            Website: www.srcb.edu.ph
                                        </p>
                                        <p className="text-slate-500">
                                            Tel. (088)323-7159 / Mobile:
                                            +63-929-734-0012 (SMART);
                                            +63-975-637-9948 (Globe)
                                        </p>
                                        <p className="text-slate-500">
                                            PAASCU Level II Re-Accredited:
                                            Junior High School
                                        </p>
                                        <p className="text-slate-500">
                                            PAASCU Level I: Teacher Education
                                            Program & Business Administration
                                            Program
                                        </p>
                                        <p className="text-slate-400 italic">
                                            (Philippine Accrediting Association
                                            of Schools, Colleges, and
                                            Universities)
                                        </p>
                                    </div>
                                    <img
                                        src="/images/DSA.png"
                                        className="h-16 w-16 shrink-0 object-contain md:h-20 md:w-20"
                                        alt="DSA Logo"
                                    />
                                </div>

                                {/* Form Title */}
                                <div className="my-5 text-center">
                                    <h1 className="text-lg font-black tracking-wider text-[#0b2d66] md:text-xl dark:text-blue-400">
                                        STUDENT INFORMATION SHEET
                                    </h1>
                                    <p className="mt-1 text-[10px] font-semibold tracking-widest text-slate-400 uppercase md:text-xs">
                                        Academic Year 2024 &ndash; 2025
                                    </p>
                                </div>

                                {/* Checkbox / Program Grid */}
                                <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 text-xs dark:border-blue-900">
                                    <div className="grid grid-cols-[180px_1fr] border-b border-blue-200 dark:border-blue-900">
                                        <div className="flex flex-col justify-center border-r border-blue-200 bg-blue-50/50 p-3 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                                            <span>ENTRY STATUS</span>
                                            <span className="text-[9px] font-normal text-slate-400 italic">
                                                (please check)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 p-3 text-slate-700 sm:grid-cols-4 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.year_level ===
                                                    '1st Year'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>1st Year</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.year_level ===
                                                    '2nd Year'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>2nd Year</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.year_level ===
                                                    '3rd Year'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>3rd Year</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.year_level ===
                                                    '4th Year'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>4th Year</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.entry_status ===
                                                    'Freshman'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>Freshman</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.entry_status ===
                                                    'Returnee'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>Returnee</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.entry_status ===
                                                    'Transferee'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>Transferee</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                    {student.entry_status ===
                                                    'Old Student'
                                                        ? '[x]'
                                                        : '[ ]'}
                                                </span>
                                                <span>Old Student</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[180px_1fr] border-b border-blue-200 dark:border-blue-900">
                                        <div className="flex flex-col justify-center border-r border-blue-200 bg-blue-50/50 p-3 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                                            <span>PROGRAM</span>
                                            <span className="text-[9px] font-normal text-slate-400 italic">
                                                (do not abbreviate)
                                            </span>
                                        </div>
                                        <div className="flex items-center p-3 font-bold text-slate-800 dark:text-slate-100">
                                            {student.program ||
                                                student.course ||
                                                'N/A'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[180px_1fr]">
                                        <div className="flex flex-col justify-center border-r border-blue-200 bg-blue-50/50 p-3 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                                            <span>MAJOR</span>
                                            <span className="text-[9px] font-normal text-slate-400 italic">
                                                (if applicable & do not
                                                abbreviate)
                                            </span>
                                        </div>
                                        <div className="flex items-center p-3 font-semibold text-slate-700 dark:text-slate-200">
                                            {student.major || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info Section */}
                                <div className="mt-6 text-left">
                                    <div className="border-b border-dashed border-[#0b2d66] pb-1 text-center text-xs font-bold tracking-widest text-[#0b2d66] uppercase dark:border-blue-900 dark:text-blue-400">
                                        PERSONAL INFORMATION
                                    </div>
                                    <div className="mt-4 space-y-4 text-xs">
                                        <div className="flex items-end gap-2">
                                            <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                Name:
                                            </span>
                                            <div className="flex-1 border-b border-slate-300 pb-0.5 text-center font-black text-slate-900 uppercase dark:border-slate-700 dark:text-white">
                                                {student.name}
                                            </div>
                                        </div>
                                        <div className="-mt-2 grid grid-cols-3 text-center text-[9px] text-slate-400">
                                            <div>(Surname)</div>
                                            <div>(Given Name)</div>
                                            <div>(Middle Name)</div>
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                Home Address:
                                            </span>
                                            <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                {student.home_address || 'N/A'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Birthday:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.birthday || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Place of Birth:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.place_of_birth ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Religion:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.religion || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Gender:
                                                </span>
                                                <div className="flex flex-1 justify-center gap-4 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                            {student.gender?.toLowerCase() ===
                                                            'male'
                                                                ? '[x]'
                                                                : '[ ]'}
                                                        </span>{' '}
                                                        Male
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                            {student.gender?.toLowerCase() ===
                                                            'female'
                                                                ? '[x]'
                                                                : '[ ]'}
                                                        </span>{' '}
                                                        Female
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Contact No.:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.contact_no ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    E-mail:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.email}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Nationality:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.nationality ||
                                                        'Filipino'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Background Section */}
                                <div className="mt-8 text-left">
                                    <div className="border-b border-dashed border-[#0b2d66] pb-1 text-center text-xs font-bold tracking-widest text-[#0b2d66] uppercase dark:border-blue-900 dark:text-blue-400">
                                        ACADEMIC BACKGROUND
                                    </div>
                                    <div className="mt-4 overflow-hidden rounded-xl border border-blue-200 text-xs dark:border-blue-900">
                                        <div className="grid grid-cols-[160px_1fr_120px] border-b border-blue-200 bg-blue-50/50 text-center font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                                            <div className="border-r border-blue-200 p-2 dark:border-blue-900">
                                                LEVEL
                                            </div>
                                            <div className="border-r border-blue-200 p-2 dark:border-blue-900">
                                                SCHOOL ATTENDED
                                            </div>
                                            <div className="p-2">
                                                YEAR GRADUATED
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[160px_1fr_120px] border-b border-blue-200 dark:border-blue-900">
                                            <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                Elementary
                                            </div>
                                            <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                {student.elementary_school ||
                                                    'N/A'}
                                            </div>
                                            <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                {student.elementary_year_graduated ||
                                                    'N/A'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[160px_1fr_120px] border-b border-blue-200 dark:border-blue-900">
                                            <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                Junior High School
                                            </div>
                                            <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                {student.junior_high_school ||
                                                    'N/A'}
                                            </div>
                                            <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                {student.junior_high_year_graduated ||
                                                    'N/A'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[160px_1fr_120px]">
                                            <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                Senior High School
                                            </div>
                                            <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                {student.senior_high_school ||
                                                    'N/A'}
                                            </div>
                                            <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                {student.senior_high_year_graduated ||
                                                    'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Family Background Section */}
                                <div className="mt-8 text-left">
                                    <div className="border-b border-dashed border-[#0b2d66] pb-1 text-center text-xs font-bold tracking-widest text-[#0b2d66] uppercase dark:border-blue-900 dark:text-blue-400">
                                        FAMILY BACKGROUND
                                    </div>
                                    <div className="mt-4 space-y-4 text-xs">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Mother:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.mother_name ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Contact Number:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.mother_contact ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Father:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.father_name ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Contact Number:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.father_contact ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                Name of Guardian:
                                            </span>
                                            <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                {student.guardian_name || 'N/A'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Relation:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.guardian_relation ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                    Contact Number:
                                                </span>
                                                <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                    {student.guardian_contact ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student Signature line */}
                                <div className="mt-12 text-center">
                                    <div className="mx-auto w-64 border-b border-slate-300 pb-1 text-sm font-bold tracking-wide text-[#0b2d66] uppercase dark:border-slate-700 dark:text-blue-400">
                                        {student.name}
                                    </div>
                                    <div className="mt-1 text-[9px] font-semibold text-slate-400 uppercase">
                                        Student Signature
                                    </div>
                                </div>

                                {/* Office of Student Affairs logo seal */}
                                <div className="mt-14 border-t border-slate-100 pt-5 text-center dark:border-slate-900">
                                    <h3 className="font-serif text-sm font-bold text-[#0b2d66] italic dark:text-blue-400">
                                        Office of Student Affairs
                                    </h3>
                                    <p className="mt-0.5 text-[10px] text-slate-500 italic">
                                        2nd Level, St. Rita Building, St. Rita's
                                        College of Balingasag
                                    </p>
                                    <p className="text-[10px] text-slate-500 italic">
                                        E-mail Address:{' '}
                                        <a
                                            href="mailto:heddsa@srcb.edu.ph"
                                            className="text-blue-600 underline dark:text-blue-400"
                                        >
                                            heddsa@srcb.edu.ph
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
