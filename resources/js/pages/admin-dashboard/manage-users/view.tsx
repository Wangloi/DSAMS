import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    Printer,
    QrCode,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProgramTheme } from '@/lib/program-themes';
import { formatLastNameFirst } from '@/lib/utils';
import { adminDashboard, adminManageUsers } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import type {
    AttendanceSummary,
    StudentAttendanceRecord,
    ViolationRecord,
    ViolationSummary,
} from './ViewStudentDialog';
import type { UserRow } from './types';

type Props = {
    user: UserRow;
};

const getProgramBadgeClass = (program?: string | null) => {
    const p = String(program || '').toUpperCase();
    if (p.includes('BSIT') || p.includes('INFORMATION TECH')) {
        return 'bg-red-600/30 text-white border-red-400/60';
    }
    if (p.includes('BSBA') || p.includes('BUSINESS')) {
        return 'bg-amber-400/20 text-amber-200 border-amber-300/40';
    }
    if (p.includes('BEED') || p.includes('BSED') || p.includes('EDUCATION')) {
        return 'bg-sky-400/20 text-sky-100 border-sky-300/40';
    }
    if (p.includes('CRIM') || p.includes('BSCRIM')) {
        return 'bg-blue-400/25 text-blue-100 border-blue-300/40';
    }
    if (p.includes('BSHM') || p.includes('HOSPITALITY') || p.includes('HM')) {
        return 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40';
    }
    return 'bg-white/15 text-white border-white/20';
};

const SheetCheck = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
        <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-black ${checked
                ? 'border-[#0b2d66] bg-[#0b2d66] text-white dark:border-blue-400 dark:bg-blue-600'
                : 'border-slate-400 bg-white dark:border-slate-600 dark:bg-slate-900'
                }`}
        >
            {checked ? '✓' : ''}
        </span>
        <span
            className={`text-xs ${checked
                ? 'font-bold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
                }`}
        >
            {label}
        </span>
    </div>
);

const SheetField = ({
    label,
    value,
    className = '',
}: {
    label: string;
    value?: React.ReactNode;
    className?: string;
}) => (
    <div className={`flex items-end gap-2 text-xs ${className}`}>
        <span className="font-bold whitespace-nowrap text-[#0b2d66] dark:text-blue-400">
            {label}
        </span>
        <div className="min-h-[20px] flex-1 border-b border-slate-400 pb-px font-semibold text-slate-900 dark:border-slate-600 dark:text-white">
            {value || 'N/A'}
        </div>
    </div>
);

const SheetSection = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-8 mb-4 border-b border-dashed border-[#0b2d66] pb-1 text-center text-xs font-bold tracking-widest text-[#0b2d66] uppercase dark:border-blue-400 dark:text-blue-400">
        {children}
    </div>
);

export default function ViewUserPage() {
    const { props } = usePage<Props & Record<string, unknown>>();
    const user = props.user as UserRow;
    const isProgramHead =
        (user as any)?.userType === 'program_head' ||
        String(user?.role ?? '').toLowerCase().includes('program');

    const backTab = isProgramHead ? 'program-heads' : 'users';
    const backUrl = `/admin/manage-users?tab=${backTab}`;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: adminDashboard() },
        { title: 'Manage Users & Programs', href: adminManageUsers() },
        { title: user?.name ? formatLastNameFirst(user) : 'User Details', href: '#' },
    ];

    const programTheme = getProgramTheme(user ? (user.course || user.program) : null);

    // Default to 'info' (Student Information Sheet) so all user details are immediately visible on page load!
    const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'violations'>('info');

    // Attendance State
    const [attendances, setAttendances] = useState<StudentAttendanceRecord[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary>({
        total_attended: 0,
        present_count: 0,
        late_count: 0,
        excused_count: 0,
        override_count: 0,
        attendance_rate: 0,
    });
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
    const [attendanceSearch, setAttendanceSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'excused' | 'override'>('all');

    // Violations State
    const [violations, setViolations] = useState<ViolationRecord[]>([]);
    const [violationSummary, setViolationSummary] = useState<ViolationSummary>({
        total: 0,
        warning: 0,
        suspension: 0,
        exclusion: 0,
        expulsion: 0,
    });
    const [isLoadingViolations, setIsLoadingViolations] = useState(false);
    const [violationSearch, setViolationSearch] = useState('');
    const [violationSectionFilter, setViolationSectionFilter] = useState<
        'all' | 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion'
    >('all');

    const studentIdentifier = user?.id || user?.student_id;

    // Fetch Attendance
    useEffect(() => {
        if (!user || isProgramHead) return;
        let isMounted = true;
        setIsLoadingAttendance(true);

        fetch(`/students/${encodeURIComponent(String(studentIdentifier))}/attendance-history`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!isMounted || !data) return;
                setAttendances(data.attendances || []);
                if (data.summary) setSummary(data.summary);
            })
            .catch((err) => console.error('Error fetching attendance:', err))
            .finally(() => {
                if (isMounted) setIsLoadingAttendance(false);
            });

        return () => {
            isMounted = false;
        };
    }, [studentIdentifier, isProgramHead, user]);

    // Fetch Violations
    useEffect(() => {
        if (!user || isProgramHead) return;
        let isMounted = true;
        setIsLoadingViolations(true);

        fetch(`/students/${encodeURIComponent(String(studentIdentifier))}/violations`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!isMounted || !data) return;
                setViolations(data.violations || []);
                if (data.summary) setViolationSummary(data.summary);
            })
            .catch((err) => console.error('Error fetching violations:', err))
            .finally(() => {
                if (isMounted) setIsLoadingViolations(false);
            });

        return () => {
            isMounted = false;
        };
    }, [studentIdentifier, isProgramHead, user]);

    // Filtered attendance
    const filteredAttendances = useMemo(() => {
        return attendances.filter((record) => {
            const matchesSearch =
                (record.event_name || '').toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                (record.event_location || '').toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                (record.check_in_method || '').toLowerCase().includes(attendanceSearch.toLowerCase());

            if (!matchesSearch) return false;
            if (statusFilter === 'all') return true;
            if (statusFilter === 'override') return record.is_manual_override;
            return record.status?.toLowerCase() === statusFilter;
        });
    }, [attendances, attendanceSearch, statusFilter]);

    // Filtered violations
    const filteredViolations = useMemo(() => {
        return violations.filter((record) => {
            const matchesSearch =
                (record.violation_name || '').toLowerCase().includes(violationSearch.toLowerCase()) ||
                (record.violation_code || '').toLowerCase().includes(violationSearch.toLowerCase()) ||
                (record.location || '').toLowerCase().includes(violationSearch.toLowerCase()) ||
                (record.description || '').toLowerCase().includes(violationSearch.toLowerCase());

            if (!matchesSearch) return false;
            if (violationSectionFilter === 'all') return true;
            return record.violation_section === violationSectionFilter;
        });
    }, [violations, violationSearch, violationSectionFilter]);

    // Printable HTML for official Information Sheet
    const printableHtml = useMemo(() => {
        if (!user) return '';

        if (isProgramHead) {
            return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Program Head Information Profile - ${user.name}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #0b2d66; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-left, .logo-right { height: 75px; width: 75px; object-fit: contain; }
    .header-text { flex: 1; text-align: center; }
    .header-text h2 { font-size: 13px; font-weight: 900; margin: 0; color: #0b2d66; }
    .header-text p { margin: 2px 0; color: #334155; font-size: 10px; }
    .title { text-align: center; margin: 20px 0; }
    .title h1 { font-size: 16px; font-weight: 900; color: #0b2d66; margin: 0; letter-spacing: 1px; }
    .title p { font-size: 10px; font-weight: 600; color: #64748b; margin: 4px 0 0; }
    table.info-table { width: 100%; border-collapse: collapse; border: 1px solid #bfdbfe; margin-bottom: 20px; }
    table.info-table td { border: 1px solid #bfdbfe; padding: 10px 12px; vertical-align: middle; }
    table.info-table td.k { width: 200px; font-weight: bold; color: #0b2d66; background: #eff6ff; font-size: 11px; }
    .footer { margin-top: 50px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
    .footer h3 { font-family: Georgia, serif; font-weight: bold; color: #0b2d66; font-style: italic; margin: 0; font-size: 12px; }
    @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
    <img src="/images/SRCB.png" class="logo-left" alt="SRCB Logo" />
    <div class="header-text">
        <h2>ST. RITA'S COLLEGE OF BALINGASAG, INC.</h2>
        <p>Balingasag, Misamis Oriental</p>
        <p>Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>
<div class="title">
    <h1>PROGRAM HEAD INFORMATION PROFILE</h1>
    <p>Official Academic Faculty Record</p>
</div>
<table class="info-table">
    <tr><td class="k">FULL NAME:</td><td style="font-weight: 700; font-size: 12px;">${user.name}</td></tr>
    <tr><td class="k">FACULTY / USER ID:</td><td style="font-family: monospace; font-weight: 700;">${user.student_id || `PH-${(user as any).program_head_id || user.id}`}</td></tr>
    <tr><td class="k">ASSIGNED PROGRAM:</td><td style="font-weight: 700;">${user.course || user.program || 'N/A'}</td></tr>
    <tr><td class="k">EMAIL:</td><td>${user.email}</td></tr>
    <tr><td class="k">ACCOUNT STATUS:</td><td>${user.is_active ? 'Active' : 'Inactive'}</td></tr>
</table>
<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body>
</html>`;
        }

        const year1 = user.year_level === '1st Year' ? '[x]' : '[ ]';
        const year2 = user.year_level === '2nd Year' ? '[x]' : '[ ]';
        const year3 = user.year_level === '3rd Year' ? '[x]' : '[ ]';
        const year4 = user.year_level === '4th Year' ? '[x]' : '[ ]';
        const freshman = user.entry_status === 'Freshman' ? '[x]' : '[ ]';
        const returnee = user.entry_status === 'Returnee' ? '[x]' : '[ ]';
        const transferee = user.entry_status === 'Transferee' ? '[x]' : '[ ]';
        const oldStudent = user.entry_status === 'Old Student' ? '[x]' : '[ ]';
        const genderMale = user.gender?.toLowerCase() === 'male' ? '[x]' : '[ ]';
        const genderFemale = user.gender?.toLowerCase() === 'female' ? '[x]' : '[ ]';

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Student Information Sheet - ${user.name}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #0b2d66; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-left, .logo-right { height: 75px; width: 75px; object-fit: contain; }
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
    .checkbox-item { display: flex; align-items: center; gap: 5px; }
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
    @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
    <img src="/images/SRCB.png" class="logo-left" alt="SRCB Logo" />
    <div class="header-text">
        <h2>ST. RITA'S COLLEGE OF BALINGASAG, INC.</h2>
        <p>Balingasag, Misamis Oriental</p>
        <p>Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph</p>
        <p>PAASCU Level II Re-Accredited: Junior High School</p>
        <p>PAASCU Level I: Teacher Education Program & Business Administration Program</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>
<div class="title">
    <h1>STUDENT INFORMATION SHEET</h1>
    <p>Academic Year 2024 &ndash; 2025</p>
</div>
<table class="info-table">
    <tr>
        <td class="k">ENTRY STATUS<span class="sub">(please check)</span></td>
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
        <td class="k">PROGRAM<span class="sub">(do not abbreviate)</span></td>
        <td style="font-weight: bold;">${user.program || user.course || 'N/A'}</td>
    </tr>
    <tr>
        <td class="k">MAJOR<span class="sub">(if applicable & do not abbreviate)</span></td>
        <td style="font-weight: bold;">${user.major || 'N/A'}</td>
    </tr>
</table>
<div class="section-title">Personal Information</div>
<div class="form-group">
    <span class="form-label">Name:</span>
    <div class="form-value" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-transform: uppercase;">
        <div style="text-align: center; font-weight: 900;">${user.last_name || 'N/A'}</div>
        <div style="text-align: center; font-weight: 900;">${user.first_name || 'N/A'}</div>
        <div style="text-align: center; font-weight: 900;">${user.middle_name || 'N/A'}</div>
    </div>
</div>
<div class="sub-labels">
    <div>(Surname)</div><div>(Given Name)</div><div>(Middle Name)</div>
</div>
<div class="form-group">
    <span class="form-label">Home Address:</span>
    <div class="form-value">${user.home_address || 'N/A'}</div>
</div>
<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Birthday:</span><div class="form-value">${user.birthday || 'N/A'}</div></div>
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Place of Birth:</span><div class="form-value">${user.place_of_birth || 'N/A'}</div></div>
</div>
<div class="form-group triple">
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Religion:</span><div class="form-value">${user.religion || 'N/A'}</div></div>
    <div style="display: flex; align-items: flex-end; gap: 8px;">
        <span class="form-label">Gender:</span>
        <div class="form-value" style="display: flex; gap: 10px; justify-content: center;">
            <span style="display: flex; align-items: center; gap: 3px;"><span style="font-family: monospace; font-size: 13px;">${genderMale}</span> Male</span>
            <span style="display: flex; align-items: center; gap: 3px;"><span style="font-family: monospace; font-size: 13px;">${genderFemale}</span> Female</span>
        </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Contact No.:</span><div class="form-value">${user.contact_no || 'N/A'}</div></div>
</div>
<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">E-mail:</span><div class="form-value">${user.email}</div></div>
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Nationality:</span><div class="form-value">${user.nationality || 'Filipino'}</div></div>
</div>
<div class="section-title">Academic Background</div>
<table class="bg-table">
    <thead><tr><th>LEVEL</th><th>SCHOOL ATTENDED</th><th>YEAR ATTENDED / GRADUATED</th></tr></thead>
    <tbody>
        <tr><td class="level">Elementary</td><td style="font-weight: 600;">${user.elementary_school || 'N/A'}</td><td class="year" style="font-weight: 600;">${user.elementary_year_started ? `${user.elementary_year_started} - ` : ''}${user.elementary_year_graduated || 'N/A'}</td></tr>
        <tr><td class="level">Junior High School</td><td style="font-weight: 600;">${user.junior_high_school || 'N/A'}</td><td class="year" style="font-weight: 600;">${user.junior_high_year_started ? `${user.junior_high_year_started} - ` : ''}${user.junior_high_year_graduated || 'N/A'}</td></tr>
        <tr><td class="level">Senior High School</td><td style="font-weight: 600;">${user.senior_high_school || 'N/A'}</td><td class="year" style="font-weight: 600;">${user.senior_high_year_started ? `${user.senior_high_year_started} - ` : ''}${user.senior_high_year_graduated || 'N/A'}</td></tr>
    </tbody>
</table>
<div class="section-title">Family Background</div>
<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Mother:</span><div class="form-value">${user.mother_name || 'N/A'}</div></div>
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Contact Number:</span><div class="form-value">${user.mother_contact || 'N/A'}</div></div>
</div>
<div class="form-group double">
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Father:</span><div class="form-value">${user.father_name || 'N/A'}</div></div>
    <div style="display: flex; align-items: flex-end; gap: 8px;"><span class="form-label">Contact Number:</span><div class="form-value">${user.father_contact || 'N/A'}</div></div>
</div>
<div class="signature-block">
    <div class="signature-line">${user.name}</div>
    <div class="signature-label">Student Signature</div>
</div>
<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body>
</html>`;
    }, [user, isProgramHead]);

    const handlePrint = () => {
        if (!user) return;
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        w.document.open();
        w.document.write(printableHtml);
        w.document.close();
        w.focus();
    };

    const goBack = () => router.visit(backUrl);

    if (!user) {
        return (
            <AdminLayout breadcrumbs={breadcrumbs}>
                <div className="p-12 text-center text-slate-500">No user selected.</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - User Profile & Details`} />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-6 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-4 sm:px-6 lg:px-8">
                    {/* Top Action Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={goBack}
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0b2d66] shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to {isProgramHead ? 'Program Heads' : 'Users Table'}
                        </button>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0b2d66] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#163e8a] dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                <Printer className="h-4 w-4" />
                                <span>
                                    Print {isProgramHead ? 'Profile' : 'Information Sheet'}
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Executive Profile Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                        {/* Header Banner */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#1E3A8A] px-6 py-6 text-white shadow-inner sm:px-8">
                            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-blue-400/15 blur-2xl" />

                            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8CE4FF] shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                        {isProgramHead ? (
                                            <GraduationCap className="h-8 w-8" />
                                        ) : (
                                            <User className="h-8 w-8" />
                                        )}
                                        <span
                                            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-[#000D6A] ${user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-white" />
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                                {formatLastNameFirst(user)}
                                            </h1>
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${getProgramBadgeClass(
                                                    user.course || user.program,
                                                )}`}
                                            >
                                                {user.course || user.program || (isProgramHead ? 'Program Head' : 'Student')}
                                            </span>
                                            {user.year_level && (
                                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
                                                    {user.year_level}
                                                </span>
                                            )}
                                            {user.entry_status && (
                                                <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[11px] font-bold text-[#8CE4FF] backdrop-blur-xs">
                                                    {user.entry_status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/90">
                                            <span>
                                                ID:{' '}
                                                <strong className="font-mono text-white">
                                                    {user.student_id || 'N/A'}
                                                </strong>
                                            </span>
                                            <span>&bull;</span>
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-blue-200" />
                                                {user.email}
                                            </span>
                                            {user.contact_no && (
                                                <>
                                                    <span>&bull;</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="h-3.5 w-3.5 text-blue-200" />
                                                        {user.contact_no}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Department Emblem Badge */}
                                <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-md shadow-sm">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-xs border border-white/80">
                                        <img
                                            src={programTheme.logoUrl}
                                            alt={`${programTheme.name} logo`}
                                            className="h-full w-full object-contain rounded-full"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = '/images/SRCB.png';
                                            }}
                                        />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                                            Academic Program
                                        </div>
                                        <div className="text-xs font-black text-white">
                                            {programTheme.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Summary Ribbon (For Students) */}
                        {!isProgramHead && (
                            <div className="border-b border-slate-200/80 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#000D6A]/10 text-[#000D6A] dark:bg-blue-500/20 dark:text-[#8CE4FF]">
                                            <CalendarCheck2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Events Attended
                                            </span>
                                            <span className="text-lg font-black text-slate-900 dark:text-white">
                                                {summary.total_attended}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                On-Time Rate
                                            </span>
                                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                {summary.attendance_rate}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Late Check-Ins
                                            </span>
                                            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                                                {summary.late_count}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${violations.length > 0
                                                ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                                : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                                                }`}
                                        >
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Violations
                                            </span>
                                            <span
                                                className={`text-lg font-black ${violations.length > 0
                                                    ? 'text-rose-600 dark:text-rose-400'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                {violations.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Page Tabs Header */}
                        {!isProgramHead ? (
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 pt-2 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={`relative flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${activeTab === 'info'
                                        ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Student Information Sheet</span>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                        Primary Details
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('attendance')}
                                    className={`relative flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${activeTab === 'attendance'
                                        ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <CalendarCheck2 className="h-4 w-4" />
                                    <span>Attendance History</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeTab === 'attendance'
                                            ? 'bg-[#000D6A] text-white dark:bg-[#8CE4FF] dark:text-[#000D6A]'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                    >
                                        {attendances.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('violations')}
                                    className={`relative flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${activeTab === 'violations'
                                        ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                    <span>Violations & Disciplinary</span>
                                    {violations.length > 0 && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeTab === 'violations'
                                                ? 'bg-rose-600 text-white dark:bg-rose-500'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                                }`}
                                        >
                                            {violations.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        ) : null}

                        {/* Page Body Content */}
                        <div className="p-6 sm:p-8">
                            {/* ── PROGRAM HEAD PROFILE VIEW ── */}
                            {isProgramHead ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/50">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Assigned Program
                                            </span>
                                            <div className="mt-1 text-sm font-black text-[#000D6A] dark:text-[#8CE4FF]">
                                                {user.course || user.program || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/50">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Faculty ID
                                            </span>
                                            <div className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {user.student_id ||
                                                    `PH-${(user as any).program_head_id || user.id}`}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/50">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Account Status
                                            </span>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                                        }`}
                                                />
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/50">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Role
                                            </span>
                                            <div className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-400">
                                                Program Head
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A] dark:bg-blue-950/60 dark:text-[#8CE4FF]">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                                        Academic Department Scope
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400">
                                                        College department supervision
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-3 text-xs">
                                                <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                                                    <span className="text-slate-500">Program Code:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {user.course || user.program || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                                                    <span className="text-slate-500">Academic Hierarchy:</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        Higher Education Department
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-slate-500">Institution:</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        St. Rita's College of Balingasag
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                                        Official Credentials
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400">
                                                        Academic leadership account
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-3 text-xs">
                                                <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                                                    <span className="text-slate-500">Official Email:</span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {user.email}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                                                    <span className="text-slate-500">Verification:</span>
                                                    <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        {user.status || 'Verified'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-slate-500">Registered On:</span>
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Record'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* ── TAB 1: STUDENT INFORMATION SHEET (Default & Full-Page Clean Presentation) ── */}
                            {!isProgramHead && activeTab === 'info' && (
                                <div className="space-y-6">
                                    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:p-10">
                                        {/* School Header */}
                                        <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-[#0b2d66] pb-5 dark:border-blue-400">
                                            <img
                                                src="/images/SRCB.png"
                                                className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
                                                alt="SRCB Logo"
                                            />
                                            <div className="flex-1 text-center text-xs">
                                                <h2 className="text-base font-black tracking-wide text-[#0b2d66] dark:text-blue-400 sm:text-lg">
                                                    ST. RITA'S COLLEGE OF BALINGASAG, INC.
                                                </h2>
                                                <p className="font-bold text-slate-700 dark:text-slate-300 sm:text-xs">
                                                    Balingasag, Misamis Oriental
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph
                                                </p>
                                                <p className="hidden text-[10px] text-slate-400 sm:block">
                                                    PAASCU Level II Re-Accredited: Junior High School &bull; PAASCU Level I: Teacher Education & Business Admin
                                                </p>
                                            </div>
                                            <img
                                                src="/images/DSA.png"
                                                className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
                                                alt="DSA Logo"
                                            />
                                        </div>

                                        {/* Sheet Title */}
                                        <div className="my-6 text-center">
                                            <h1 className="text-lg font-black tracking-widest text-[#0b2d66] uppercase dark:text-blue-400 sm:text-xl">
                                                STUDENT INFORMATION SHEET
                                            </h1>
                                            <p className="text-xs font-semibold text-slate-500">
                                                Academic Year 2024 &ndash; 2025
                                            </p>
                                        </div>

                                        {/* Entry Status, Program & Major Block */}
                                        <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-slate-700">
                                            <div className="grid grid-cols-[160px_1fr] border-b border-blue-200 dark:border-slate-700">
                                                <div className="bg-blue-50/80 p-3 text-[11px] font-bold text-[#0b2d66] dark:bg-slate-800 dark:text-blue-400">
                                                    ENTRY STATUS
                                                    <span className="block text-[9px] font-normal text-slate-500">
                                                        (please check)
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4">
                                                    <SheetCheck
                                                        checked={user.year_level === '1st Year'}
                                                        label="1st Year"
                                                    />
                                                    <SheetCheck
                                                        checked={user.year_level === '2nd Year'}
                                                        label="2nd Year"
                                                    />
                                                    <SheetCheck
                                                        checked={user.year_level === '3rd Year'}
                                                        label="3rd Year"
                                                    />
                                                    <SheetCheck
                                                        checked={user.year_level === '4th Year'}
                                                        label="4th Year"
                                                    />
                                                    <SheetCheck
                                                        checked={user.entry_status === 'Freshman'}
                                                        label="Freshman"
                                                    />
                                                    <SheetCheck
                                                        checked={user.entry_status === 'Returnee'}
                                                        label="Returnee"
                                                    />
                                                    <SheetCheck
                                                        checked={user.entry_status === 'Transferee'}
                                                        label="Transferee"
                                                    />
                                                    <SheetCheck
                                                        checked={user.entry_status === 'Old Student'}
                                                        label="Old Student"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-[160px_1fr] border-b border-blue-200 dark:border-slate-700">
                                                <div className="bg-blue-50/80 p-3 text-[11px] font-bold text-[#0b2d66] dark:bg-slate-800 dark:text-blue-400">
                                                    PROGRAM
                                                    <span className="block text-[9px] font-normal text-slate-500">
                                                        (do not abbreviate)
                                                    </span>
                                                </div>
                                                <div className="p-3 text-xs font-bold text-slate-900 dark:text-white">
                                                    {user.program || user.course || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-[160px_1fr]">
                                                <div className="bg-blue-50/80 p-3 text-[11px] font-bold text-[#0b2d66] dark:bg-slate-800 dark:text-blue-400">
                                                    MAJOR
                                                    <span className="block text-[9px] font-normal text-slate-500">
                                                        (if applicable)
                                                    </span>
                                                </div>
                                                <div className="p-3 text-xs font-bold text-slate-900 dark:text-white">
                                                    {user.major || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Personal Information */}
                                        <SheetSection>Personal Information</SheetSection>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-xs font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Name:
                                                    </span>
                                                    <div className="grid flex-1 grid-cols-3 gap-2 border-b border-slate-400 pb-px text-center text-xs font-black text-slate-900 uppercase dark:border-slate-600 dark:text-white">
                                                        <div>{user.last_name || 'N/A'}</div>
                                                        <div>{user.first_name || 'N/A'}</div>
                                                        <div>{user.middle_name || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-0.5 ml-14 grid grid-cols-3 text-center text-[9px] text-slate-400">
                                                    <div>(Surname)</div>
                                                    <div>(Given Name)</div>
                                                    <div>(Middle Name)</div>
                                                </div>
                                            </div>

                                            <SheetField label="Student ID:" value={user.student_id} />
                                            <SheetField label="Home Address:" value={user.home_address} />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <SheetField label="Birthday:" value={user.birthday} />
                                                <SheetField label="Place of Birth:" value={user.place_of_birth} />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <SheetField label="Religion:" value={user.religion} />
                                                <div className="flex items-end gap-2 text-xs">
                                                    <span className="font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Gender:
                                                    </span>
                                                    <div className="flex flex-1 items-center justify-center gap-4 border-b border-slate-400 pb-px dark:border-slate-600">
                                                        <SheetCheck
                                                            checked={user.gender?.toLowerCase() === 'male'}
                                                            label="Male"
                                                        />
                                                        <SheetCheck
                                                            checked={user.gender?.toLowerCase() === 'female'}
                                                            label="Female"
                                                        />
                                                    </div>
                                                </div>
                                                <SheetField label="Contact No.:" value={user.contact_no} />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <SheetField label="E-mail:" value={user.email} />
                                                <SheetField
                                                    label="Nationality:"
                                                    value={user.nationality || 'Filipino'}
                                                />
                                            </div>
                                        </div>

                                        {/* Academic Background */}
                                        <SheetSection>Academic Background</SheetSection>
                                        <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-slate-700">
                                            <div className="grid grid-cols-[160px_1fr_130px] bg-blue-50/80 text-center text-[10px] font-bold text-[#0b2d66] dark:bg-slate-800 dark:text-blue-400">
                                                <div className="p-2.5">LEVEL</div>
                                                <div className="border-l border-blue-200 p-2.5 dark:border-slate-700">
                                                    SCHOOL ATTENDED
                                                </div>
                                                <div className="border-l border-blue-200 p-2.5 dark:border-slate-700">
                                                    YEAR GRADUATED
                                                </div>
                                            </div>
                                            {[
                                                [
                                                    'Elementary',
                                                    user.elementary_school,
                                                    user.elementary_year_graduated,
                                                ],
                                                [
                                                    'Junior High School',
                                                    user.junior_high_school,
                                                    user.junior_high_year_graduated,
                                                ],
                                                [
                                                    'Senior High School',
                                                    user.senior_high_school,
                                                    user.senior_high_year_graduated,
                                                ],
                                            ].map(([level, school, year]) => (
                                                <div
                                                    key={String(level)}
                                                    className="grid grid-cols-[160px_1fr_130px] border-t border-blue-200 text-xs dark:border-slate-700"
                                                >
                                                    <div className="bg-blue-50/50 p-2.5 font-bold text-[#0b2d66] dark:bg-slate-800/60 dark:text-blue-400">
                                                        {level}
                                                    </div>
                                                    <div className="border-l border-blue-200 p-2.5 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                                                        {school || 'N/A'}
                                                    </div>
                                                    <div className="border-l border-blue-200 p-2.5 text-center font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                                                        {year || 'N/A'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Family Background */}
                                        <SheetSection>Family Background</SheetSection>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <SheetField label="Mother:" value={user.mother_name} />
                                                <SheetField
                                                    label="Contact Number:"
                                                    value={user.mother_contact}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <SheetField label="Father:" value={user.father_name} />
                                                <SheetField
                                                    label="Contact Number:"
                                                    value={user.father_contact}
                                                />
                                            </div>
                                            {(user.guardian_name || user.guardian_contact) && (
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <SheetField
                                                        label="Guardian:"
                                                        value={user.guardian_name}
                                                    />
                                                    <SheetField
                                                        label="Contact Number:"
                                                        value={user.guardian_contact}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Signature */}
                                        <div className="mt-12 text-center">
                                            <div className="mx-auto w-64 border-b border-slate-400 pb-1 text-sm font-black text-[#0b2d66] uppercase dark:border-slate-500 dark:text-blue-400">
                                                {user.name}
                                            </div>
                                            <div className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                Student Signature
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: ATTENDANCE HISTORY ── */}
                            {!isProgramHead && activeTab === 'attendance' && (
                                <div className="space-y-5">
                                    {/* Filters Bar */}
                                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={attendanceSearch}
                                                onChange={(e) => setAttendanceSearch(e.target.value)}
                                                placeholder="Search event title, venue, or check-in method..."
                                                className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#000D6A] dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter('all')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${statusFilter === 'all'
                                                    ? 'bg-[#000D6A] text-white dark:bg-blue-600'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                All ({attendances.length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter('present')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${statusFilter === 'present'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Present
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter('late')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${statusFilter === 'late'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Late
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter('override')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${statusFilter === 'override'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Override
                                            </button>
                                        </div>
                                    </div>

                                    {/* Attendance Records List */}
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                        {isLoadingAttendance ? (
                                            <div className="space-y-3 py-16 text-center">
                                                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#000D6A] dark:text-[#8CE4FF]" />
                                                <p className="text-xs font-semibold text-slate-500">
                                                    Loading attendance records...
                                                </p>
                                            </div>
                                        ) : filteredAttendances.length === 0 ? (
                                            <div className="space-y-3 py-16 text-center">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                    <Calendar className="h-7 w-7" />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    No Attendance Records Found
                                                </h4>
                                                <p className="mx-auto max-w-sm text-xs text-slate-500">
                                                    {attendances.length === 0
                                                        ? 'This student has not checked in to any campus events yet.'
                                                        : 'No records matched your search or status filter.'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredAttendances.map((record) => (
                                                    <div
                                                        key={record.id}
                                                        className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center dark:hover:bg-slate-800/40"
                                                    >
                                                        <div className="flex-1 space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    {record.event_name}
                                                                </span>
                                                                <Badge
                                                                    className={
                                                                        record.status === 'present'
                                                                            ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'
                                                                            : record.status === 'late'
                                                                                ? 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400'
                                                                                : 'rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400'
                                                                    }
                                                                >
                                                                    {record.status === 'present'
                                                                        ? 'Present'
                                                                        : record.status === 'late'
                                                                            ? 'Late'
                                                                            : record.status}
                                                                </Badge>
                                                                {record.is_manual_override && (
                                                                    <Badge className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                        Admin Override
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                                {record.event_date && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                        {record.event_date}{' '}
                                                                        {record.event_time ? `• ${record.event_time}` : ''}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                    {record.event_location || 'Campus'}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <QrCode className="h-3.5 w-3.5 text-slate-400" />
                                                                    {record.check_in_method}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 pt-2 text-xs sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 dark:border-slate-800">
                                                            <div className="space-y-0.5">
                                                                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                    Time-In
                                                                </span>
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                    {record.checked_in_at || 'Recorded'}
                                                                </span>
                                                            </div>
                                                            {record.checked_out_at && (
                                                                <div className="mt-1 space-y-0.5 sm:text-right">
                                                                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                        Time-Out
                                                                    </span>
                                                                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                                                                        {record.checked_out_at}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 3: VIOLATIONS & DISCIPLINARY ── */}
                            {!isProgramHead && activeTab === 'violations' && (
                                <div className="space-y-5">
                                    {/* Severity Counters */}
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Total
                                            </span>
                                            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                                                {violationSummary.total}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider dark:text-amber-400">
                                                Warning
                                            </span>
                                            <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                                                {violationSummary.warning}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-orange-200/70 bg-orange-50/50 p-4 shadow-xs dark:border-orange-900/40 dark:bg-orange-950/20">
                                            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider dark:text-orange-400">
                                                Suspension
                                            </span>
                                            <div className="mt-1 text-2xl font-black text-orange-700 dark:text-orange-300">
                                                {violationSummary.suspension}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-4 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
                                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider dark:text-rose-400">
                                                Exclusion
                                            </span>
                                            <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
                                                {violationSummary.exclusion}
                                            </div>
                                        </div>
                                        <div className="col-span-2 rounded-2xl border border-red-200/70 bg-red-50/50 p-4 shadow-xs sm:col-span-1 dark:border-red-900/40 dark:bg-red-950/20">
                                            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider dark:text-red-400">
                                                Expulsion
                                            </span>
                                            <div className="mt-1 text-2xl font-black text-red-700 dark:text-red-300">
                                                {violationSummary.expulsion}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Violations Search & Filter */}
                                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={violationSearch}
                                                onChange={(e) => setViolationSearch(e.target.value)}
                                                placeholder="Search violation name, code, venue, or description..."
                                                className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#000D6A] dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setViolationSectionFilter('all')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${violationSectionFilter === 'all'
                                                    ? 'bg-[#000D6A] text-white dark:bg-blue-600'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                All ({violations.length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViolationSectionFilter('Warning')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${violationSectionFilter === 'Warning'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Warning
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViolationSectionFilter('Suspension')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${violationSectionFilter === 'Suspension'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Suspension
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViolationSectionFilter('Exclusion')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${violationSectionFilter === 'Exclusion'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Exclusion
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViolationSectionFilter('Expulsion')}
                                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${violationSectionFilter === 'Expulsion'
                                                    ? 'bg-red-700 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                            >
                                                Expulsion
                                            </button>
                                        </div>
                                    </div>

                                    {/* Violations List */}
                                    {isLoadingViolations ? (
                                        <div className="py-16 text-center">
                                            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#000D6A] dark:text-[#8CE4FF]" />
                                            <p className="mt-3 text-xs font-semibold text-slate-500">
                                                Loading violation records...
                                            </p>
                                        </div>
                                    ) : filteredViolations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/30">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                                <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {violations.length === 0
                                                    ? 'Clean Disciplinary Record'
                                                    : 'No Matching Results'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {violations.length === 0
                                                    ? 'No institutional violations recorded for this student.'
                                                    : 'Try adjusting your search or severity filter.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredViolations.map((record) => (
                                                <div
                                                    key={record.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md sm:flex-row sm:items-start dark:border-slate-800 dark:bg-slate-900"
                                                >
                                                    <div
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${record.violation_section === 'Warning'
                                                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : record.violation_section === 'Suspension'
                                                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                                                : record.violation_section === 'Exclusion'
                                                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                                    : record.violation_section === 'Expulsion'
                                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        <ShieldAlert className="h-5 w-5" />
                                                    </div>

                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {record.violation_name}
                                                            </h4>
                                                            <Badge
                                                                className={
                                                                    record.violation_section === 'Warning'
                                                                        ? 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400'
                                                                        : record.violation_section === 'Suspension'
                                                                            ? 'rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400'
                                                                            : record.violation_section === 'Exclusion'
                                                                                ? 'rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400'
                                                                                : record.violation_section === 'Expulsion'
                                                                                    ? 'rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400'
                                                                                    : 'rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400'
                                                                }
                                                            >
                                                                {record.violation_section}
                                                            </Badge>
                                                            <Badge className="rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                {record.violation_code}
                                                            </Badge>
                                                        </div>

                                                        {record.description && (
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                {record.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                            {record.incident_date && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                    {record.incident_date}{' '}
                                                                    {record.incident_time ? `• ${record.incident_time}` : ''}
                                                                </span>
                                                            )}
                                                            {record.location && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                    {record.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
