import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    Building2,
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    Info,
    Mail,
    MapPin,
    Printer,
    QrCode,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { formatLastNameFirst } from '@/lib/utils';
import type { UserRow } from './types';

export type StudentAttendanceRecord = {
    id: number;
    event_id: number;
    event_name: string;
    event_date: string | null;
    event_time: string | null;
    event_location: string;
    event_status: string;
    status: 'present' | 'late' | 'excused' | string;
    checked_in_at: string | null;
    checked_in_raw?: string | null;
    checked_out_at: string | null;
    is_manual_override: boolean;
    manual_override_reason?: string | null;
    manual_override_notes?: string | null;
    check_in_method: string;
};

export type AttendanceSummary = {
    total_attended: number;
    present_count: number;
    late_count: number;
    excused_count: number;
    override_count: number;
    attendance_rate: number;
};

export type ViolationRecord = {
    id: number;
    violation_code: string;
    violation_name: string;
    violation_section: string;
    incident_type: string;
    incident_date: string | null;
    incident_time: string | null;
    location: string;
    description: string;
    immediate_action: string | null;
    classification: string;
    status: string;
    calling_phase: string | null;
    reported_by: string | null;
    created_at: string | null;
};

export type ViolationSummary = {
    total: number;
    warning: number;
    suspension: number;
    exclusion: number;
    expulsion: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: UserRow | null;
    hideInformationSheet?: boolean;
};

const getProgramBadgeClass = (program?: string | null) => {
    const p = String(program || '').toUpperCase();
    if (p.includes('BSIT') || p.includes('INFORMATION TECH')) {
        return 'bg-[#800000]/10 text-[#800000] border-[#800000]/25 dark:bg-[#800000]/25 dark:text-[#ff9999] dark:border-[#800000]/40';
    }
    if (p.includes('BSBA') || p.includes('BUSINESS')) {
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-700/50';
    }
    if (p.includes('BEED') || p.includes('BSED') || p.includes('EDUCATION')) {
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50';
    }
    if (p.includes('CRIM') || p.includes('BSCRIM')) {
        return 'bg-blue-100 text-[#1e40af] border-[#3b82f6]/30 dark:bg-blue-950/60 dark:text-[#93c5fd] dark:border-blue-700/50';
    }
    if (p.includes('BSHM') || p.includes('HOSPITALITY') || p.includes('HM')) {
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

export default function ViewStudentDialog({
    open,
    onOpenChange,
    student,
    hideInformationSheet = false,
}: Props) {
    const isProgramHead =
        student?.userType === 'program_head' ||
        String(student?.role ?? '').toLowerCase().includes('program');

    const [activeTab, setActiveTab] = useState<'attendance' | 'violations' | 'info'>('attendance');
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

    // Violations state
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
    const [violationSectionFilter, setViolationSectionFilter] = useState<'all' | 'Warning' | 'Suspension' | 'Exclusion' | 'Expulsion'>('all');

    // Fetch student's attendance records and reset tab state when dialog opens
    useEffect(() => {
        if (!open || !student || isProgramHead) {
            return;
        }

        // Default tab selection: attendance if information sheet is hidden or attendance is preferred
        setActiveTab(hideInformationSheet ? 'attendance' : 'attendance');

        let isMounted = true;
        setIsLoadingAttendance(true);

        const studentIdentifier = student.id || student.student_id;

        const fetchAttendance = async () => {
            try {
                const res = await fetch(`/students/${encodeURIComponent(String(studentIdentifier))}/attendance-history`, {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch attendance');
                }
                const data = await res.json();
                if (isMounted) {
                    setAttendances(data.attendances || []);
                    if (data.summary) {
                        setSummary(data.summary);
                    }
                }
            } catch (err) {
                console.error('Error fetching attendance history:', err);
            } finally {
                if (isMounted) {
                    setIsLoadingAttendance(false);
                }
            }
        };

        fetchAttendance();

        return () => {
            isMounted = false;
        };
    }, [open, student?.id, student?.student_id, isProgramHead, hideInformationSheet]);

    // Fetch student's violation records when dialog opens
    useEffect(() => {
        if (!open || !student || isProgramHead) {
            return;
        }

        let isMounted = true;
        setIsLoadingViolations(true);

        const studentIdentifier = student.id || student.student_id;

        const fetchViolations = async () => {
            try {
                const res = await fetch(`/students/${encodeURIComponent(String(studentIdentifier))}/violations`, {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch violations');
                }
                const data = await res.json();
                if (isMounted) {
                    setViolations(data.violations || []);
                    if (data.summary) {
                        setViolationSummary(data.summary);
                    }
                }
            } catch (err) {
                console.error('Error fetching violations:', err);
            } finally {
                if (isMounted) {
                    setIsLoadingViolations(false);
                }
            }
        };

        fetchViolations();

        return () => {
            isMounted = false;
        };
    }, [open, student?.id, student?.student_id, isProgramHead]);

    // Filtered attendance list
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

    // Filtered violations list
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

    const printableHtml = useMemo(() => {
        if (!student) return '';

        if (isProgramHead) {
            return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Program Head Information Profile - ${student.name}</title>
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
    table.info-table { width: 100%; border-collapse: collapse; border: 1px solid #bfdbfe; margin-bottom: 20px; }
    table.info-table td { border: 1px solid #bfdbfe; padding: 10px 12px; vertical-align: middle; }
    table.info-table td.k { width: 200px; font-weight: bold; color: #0b2d66; background: #eff6ff; font-size: 11px; }
    .signature-block { margin-top: 50px; text-align: center; }
    .signature-line { border-bottom: 1px solid #cbd5e1; width: 240px; margin: 0 auto 4px; font-weight: bold; color: #0b2d66; text-transform: uppercase; padding-bottom: 2px; }
    .signature-label { font-size: 8px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
    .footer { margin-top: 50px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
    .footer h3 { font-family: Georgia, serif; font-weight: bold; color: #0b2d66; font-style: italic; margin: 0; font-size: 12px; }
    .footer p { font-size: 9px; color: #64748b; font-style: italic; margin: 3px 0 0; }
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
        <p>Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe)</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>
<div class="title">
    <h1>PROGRAM HEAD INFORMATION PROFILE</h1>
    <p>Official Academic Faculty Record</p>
</div>
<table class="info-table">
    <tr>
        <td class="k">FULL NAME:</td>
        <td style="font-weight: 700; font-size: 12px;">${student.name}</td>
    </tr>
    <tr>
        <td class="k">EMAIL ADDRESS:</td>
        <td>${student.email}</td>
    </tr>
    <tr>
        <td class="k">ASSIGNED PROGRAM:</td>
        <td style="font-weight: 700;">${student.course || student.program || 'N/A'}</td>
    </tr>
    <tr>
        <td class="k">ACCOUNT ID:</td>
        <td>${student.student_id || 'PH-' + ((student as any).program_head_id || student.id)}</td>
    </tr>
    <tr>
        <td class="k">SYSTEM ROLE:</td>
        <td>Program Head</td>
    </tr>
    <tr>
        <td class="k">ACCOUNT STATUS:</td>
        <td>${student.is_active ? 'Active' : 'Inactive'}</td>
    </tr>
    <tr>
        <td class="k">VERIFICATION STATUS:</td>
        <td style="text-transform: capitalize;">${student.status || 'Verified'}</td>
    </tr>
</table>
<div class="signature-block">
    <div class="signature-line">${student.name}</div>
    <div class="signature-label">Program Head Signature</div>
</div>
<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
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
        }

        // Printable attendance records sheet
        if (activeTab === 'attendance') {
            const attendanceRowsHtml = attendances.length === 0
                ? `<tr><td colspan="6" style="text-align:center; padding: 20px; color:#64748b;">No attended events recorded for this student.</td></tr>`
                : attendances.map((att, idx) => `
                    <tr>
                        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                        <td style="font-weight: 700; color: #0b2d66;">${att.event_name}</td>
                        <td>${att.event_date || 'N/A'} ${att.event_time ? '&bull; ' + att.event_time : ''}</td>
                        <td>${att.event_location || 'Campus'}</td>
                        <td>${att.checked_in_at || 'Recorded'}</td>
                        <td style="text-align: center;">
                            <span style="display: inline-block; padding: 2px 8px; font-weight: bold; border-radius: 4px; font-size: 9px; text-transform: uppercase; ${att.status === 'present' ? 'background: #dcfce7; color: #166534;' : att.status === 'late' ? 'background: #fef3c7; color: #92400e;' : 'background: #f1f5f9; color: #475569;'}">
                                ${att.status}
                            </span>
                        </td>
                    </tr>
                `).join('');

            return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Student Attendance Record - ${student.name}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #0b2d66; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-left { height: 75px; width: 75px; object-fit: contain; }
    .logo-right { height: 75px; width: 75px; object-fit: contain; }
    .header-text { flex: 1; text-align: center; }
    .header-text h2 { font-size: 13px; font-weight: 900; margin: 0; color: #0b2d66; }
    .header-text p { margin: 2px 0; color: #334155; font-size: 10px; }
    .title { text-align: center; margin: 20px 0 15px; }
    .title h1 { font-size: 16px; font-weight: 900; color: #0b2d66; margin: 0; letter-spacing: 1px; }
    .title p { font-size: 10px; font-weight: 600; color: #64748b; margin: 4px 0 0; }
    
    .meta-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; border: 1px solid #bfdbfe; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 10.5px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 8.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .meta-val { font-weight: bold; color: #0b2d66; margin-top: 2px; }
    
    .summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .summary-card { border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; text-align: center; }
    .summary-card .num { font-size: 16px; font-weight: 900; color: #0b2d66; }
    .summary-card .txt { font-size: 8.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    
    table.att-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 25px; }
    table.att-table th { background: #0b2d66; color: #fff; font-weight: bold; padding: 8px; text-align: left; font-size: 10px; }
    table.att-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10px; vertical-align: middle; }
    table.att-table tr:nth-child(even) { background: #f8fafc; }
    
    .signature-block { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
    .sig-col { text-align: center; width: 220px; }
    .signature-line { border-bottom: 1px solid #0b2d66; margin-bottom: 4px; font-weight: bold; color: #0b2d66; text-transform: uppercase; padding-bottom: 2px; }
    .signature-label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    
    .footer { margin-top: 45px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
    .footer h3 { font-family: Georgia, serif; font-weight: bold; color: #0b2d66; font-style: italic; margin: 0; font-size: 11px; }
    .footer p { font-size: 8.5px; color: #64748b; font-style: italic; margin: 3px 0 0; }
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
        <p>Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe)</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>

<div class="title">
    <h1>STUDENT ATTENDANCE & EVENT PARTICIPATION RECORD</h1>
    <p>Official Institutional Activity Attendance Log</p>
</div>

<div class="meta-box">
    <div class="meta-item">
        <span class="meta-label">Student Name</span>
        <span class="meta-val">${student.name}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Student ID</span>
        <span class="meta-val">${student.student_id || 'N/A'}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Program & Year</span>
        <span class="meta-val">${student.course || student.program || 'N/A'} • ${student.year_level || 'N/A'}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Date Generated</span>
        <span class="meta-val">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>
</div>

<div class="summary-strip">
    <div class="summary-card">
        <div class="num">${summary.total_attended}</div>
        <div class="txt">Total Events Attended</div>
    </div>
    <div class="summary-card">
        <div class="num" style="color: #16a34a;">${summary.present_count}</div>
        <div class="txt">On-Time / Present</div>
    </div>
    <div class="summary-card">
        <div class="num" style="color: #d97706;">${summary.late_count}</div>
        <div class="txt">Late Check-Ins</div>
    </div>
    <div class="summary-card">
        <div class="num" style="color: #2563eb;">${summary.attendance_rate}%</div>
        <div class="txt">Attendance Rate</div>
    </div>
</div>

<table class="att-table">
    <thead>
        <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>Event Name / Activity</th>
            <th style="width: 120px;">Event Date & Time</th>
            <th style="width: 100px;">Venue</th>
            <th style="width: 130px;">Time-In Record</th>
            <th style="width: 70px; text-align: center;">Status</th>
        </tr>
    </thead>
    <tbody>
        ${attendanceRowsHtml}
    </tbody>
</table>

<div class="signature-block">
    <div class="sig-col">
        <div class="signature-line">${student.name}</div>
        <div class="signature-label">Student Signature</div>
    </div>
    <div class="sig-col">
        <div class="signature-line">OFFICE OF STUDENT AFFAIRS</div>
        <div class="signature-label">Verified & Attested By</div>
    </div>
</div>

<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
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
        }

        // Printable violations sheet
        if (activeTab === 'violations') {
            const violationRowsHtml = violations.length === 0
                ? `<tr><td colspan="6" style="text-align:center; padding: 20px; color:#64748b;">No disciplinary violations recorded. Clean record.</td></tr>`
                : violations.map((vio, idx) => `
                    <tr>
                        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                        <td style="font-weight: 700; color: #991b1b;">${vio.violation_name}</td>
                        <td>${vio.violation_code}</td>
                        <td>${vio.incident_date || 'N/A'}</td>
                        <td>${vio.location || 'Campus'}</td>
                        <td style="text-align: center;">
                            <span style="display: inline-block; padding: 2px 8px; font-weight: bold; border-radius: 4px; font-size: 9px; text-transform: uppercase; background: #fee2e2; color: #991b1b;">
                                ${vio.violation_section}
                            </span>
                        </td>
                    </tr>
                `).join('');

            return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Student Disciplinary Record - ${student.name}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; color: #0f172a; font-size: 11px; line-height: 1.5; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #0b2d66; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-left { height: 75px; width: 75px; object-fit: contain; }
    .logo-right { height: 75px; width: 75px; object-fit: contain; }
    .header-text { flex: 1; text-align: center; }
    .header-text h2 { font-size: 13px; font-weight: 900; margin: 0; color: #0b2d66; }
    .header-text p { margin: 2px 0; color: #334155; font-size: 10px; }
    .title { text-align: center; margin: 20px 0 15px; }
    .title h1 { font-size: 16px; font-weight: 900; color: #0b2d66; margin: 0; letter-spacing: 1px; }
    .title p { font-size: 10px; font-weight: 600; color: #64748b; margin: 4px 0 0; }
    
    .meta-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; border: 1px solid #bfdbfe; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 10.5px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 8.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .meta-val { font-weight: bold; color: #0b2d66; margin-top: 2px; }
    
    table.att-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 25px; }
    table.att-table th { background: #0b2d66; color: #fff; font-weight: bold; padding: 8px; text-align: left; font-size: 10px; }
    table.att-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10px; vertical-align: middle; }
    table.att-table tr:nth-child(even) { background: #f8fafc; }
    
    .signature-block { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
    .sig-col { text-align: center; width: 220px; }
    .signature-line { border-bottom: 1px solid #0b2d66; margin-bottom: 4px; font-weight: bold; color: #0b2d66; text-transform: uppercase; padding-bottom: 2px; }
    .signature-label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    
    .footer { margin-top: 45px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
    .footer h3 { font-family: Georgia, serif; font-weight: bold; color: #0b2d66; font-style: italic; margin: 0; font-size: 11px; }
    .footer p { font-size: 8.5px; color: #64748b; font-style: italic; margin: 3px 0 0; }
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
        <p>Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe)</p>
    </div>
    <img src="/images/DSA.png" class="logo-right" alt="DSA Logo" />
</div>

<div class="title">
    <h1>STUDENT DISCIPLINARY & VIOLATIONS RECORD</h1>
    <p>Official Institutional Disciplinary History</p>
</div>

<div class="meta-box">
    <div class="meta-item">
        <span class="meta-label">Student Name</span>
        <span class="meta-val">${student.name}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Student ID</span>
        <span class="meta-val">${student.student_id || 'N/A'}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Program & Year</span>
        <span class="meta-val">${student.course || student.program || 'N/A'} • ${student.year_level || 'N/A'}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Total Violations</span>
        <span class="meta-val">${violations.length} recorded</span>
    </div>
</div>

<table class="att-table">
    <thead>
        <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>Violation / Offense</th>
            <th style="width: 80px;">Code</th>
            <th style="width: 100px;">Incident Date</th>
            <th style="width: 100px;">Location</th>
            <th style="width: 90px; text-align: center;">Section</th>
        </tr>
    </thead>
    <tbody>
        ${violationRowsHtml}
    </tbody>
</table>

<div class="signature-block">
    <div class="sig-col">
        <div class="signature-line">${student.name}</div>
        <div class="signature-label">Student Signature</div>
    </div>
    <div class="sig-col">
        <div class="signature-line">OFFICE OF STUDENT AFFAIRS</div>
        <div class="signature-label">Discipline Officer Signature</div>
    </div>
</div>

<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
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
        }

        // Student info sheet (Admin only)
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
<title>Student Information Sheet - ${student.name}</title>
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
    .footer p { font-size: 9px; color: #64748b; font-style: italic; margin: 3px 0 0; }
    
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
    <div class="form-value" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-transform: uppercase;">
        <div style="text-align: center; font-weight: 900;">${student.last_name || 'N/A'}</div>
        <div style="text-align: center; font-weight: 900;">${student.first_name || 'N/A'}</div>
        <div style="text-align: center; font-weight: 900;">${student.middle_name || 'N/A'}</div>
    </div>
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

<div class="signature-block">
    <div class="signature-line">${student.name}</div>
    <div class="signature-label">Student Signature</div>
</div>

<div class="footer">
    <h3>Office of Student Affairs</h3>
    <p>2nd Level, St. Rita Building, St. Rita's College of Balingasag</p>
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
    }, [student, isProgramHead, activeTab, attendances, summary, violations]);

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
            <DialogContent className="flex max-h-[92vh] w-full !max-w-4xl flex-col overflow-hidden rounded-3xl border-0 bg-slate-50 p-0 shadow-2xl dark:bg-slate-950 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>
                        {student ? formatLastNameFirst(student) : 'User Details'}
                    </DialogTitle>
                    <DialogDescription>
                        {isProgramHead
                            ? 'Program Head Profile and Assigned Academic Department details'
                            : 'Student Academic Attendance and Disciplinary Record'}
                    </DialogDescription>
                </DialogHeader>

                {!student ? (
                    <div className="p-12 text-center text-slate-500">
                        No record selected.
                    </div>
                ) : isProgramHead ? (
                    <div className="flex max-h-[92vh] flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                        {/* Executive Header Banner */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#23509A] px-6 py-6 text-white shadow-md sm:px-8">
                            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8CE4FF] shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                        <GraduationCap className="h-8 w-8" />
                                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#102A83]">
                                            <Sparkles className="h-3 w-3 text-white" />
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                                {formatLastNameFirst(student)}
                                            </h2>
                                            <span className="rounded-full bg-blue-400/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8CE4FF] uppercase tracking-wider backdrop-blur-xs">
                                                Program Head
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-blue-100/80">
                                            Academic Department Leadership • {student.course || student.program || 'Designated Department'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                        type="button"
                                        onClick={print}
                                        className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        <span>Print Profile</span>
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Program Head Body Content */}
                        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Assigned Program</span>
                                    <div className="mt-1 text-sm font-black text-[#000D6A] dark:text-[#8CE4FF]">
                                        {student.course || student.program || 'N/A'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Faculty ID</span>
                                    <div className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {student.student_id || `PH-${(student as any).program_head_id || student.id}`}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Account Status</span>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className={`h-2 w-2 rounded-full ${student.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {student.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Access Role</span>
                                    <div className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-400">
                                        Program Head
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#23509A] dark:bg-blue-950/50 dark:text-[#8CE4FF]">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                                Academic Department
                                            </h3>
                                            <p className="text-[11px] text-slate-400">Assigned college scope</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3 text-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800/60">
                                            <span className="text-slate-500">Program Code:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {student.course || student.program || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800/60">
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

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                                Contact & Credentials
                                            </h3>
                                            <p className="text-[11px] text-slate-400">Official institutional login</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3 text-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800/60">
                                            <span className="text-slate-500">Official Email:</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {student.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800/60">
                                            <span className="text-slate-500">Account Type:</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                Faculty Leadership
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500">Login Portal:</span>
                                            <span className="font-semibold text-[#23509A] dark:text-[#8CE4FF]">
                                                /program-head-login
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Program Head Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl border-slate-200 px-5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Close Profile
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex max-h-[92vh] flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                        {/* ── PREMIUM HERO HEADER ── */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#1E3A8A] px-6 py-5 text-white shadow-md sm:px-8">
                            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-blue-400/15 blur-2xl" />

                            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8CE4FF] shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                        <User className="h-7 w-7" />
                                        <span className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#000D6A] ${student.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
                                                {formatLastNameFirst(student)}
                                            </h2>
                                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getProgramBadgeClass(student.course || student.program)}`}>
                                                {student.course || student.program || 'Student'}
                                            </span>
                                            {student.year_level && (
                                                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-100 backdrop-blur-xs">
                                                    {student.year_level}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-blue-100/80">
                                            <span>ID: <strong className="font-mono text-white">{student.student_id || 'N/A'}</strong></span>
                                            <span>&bull;</span>
                                            <span>{student.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button
                                        type="button"
                                        onClick={print}
                                        className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        <span>Print Log</span>
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── STATS SUMMARY RIBBON ── */}
                        <div className="border-b border-slate-200/80 bg-white px-6 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#000D6A]/10 text-[#000D6A] dark:bg-blue-500/20 dark:text-[#8CE4FF]">
                                        <CalendarCheck2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Events Attended
                                        </span>
                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                            {summary.total_attended}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            On-Time Rate
                                        </span>
                                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {summary.attendance_rate}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Late Check-Ins
                                        </span>
                                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                                            {summary.late_count}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${violations.length > 0 ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                                        <ShieldAlert className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Violations
                                        </span>
                                        <span className={`text-base font-black ${violations.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {violations.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TAB BAR ── */}
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 pt-2 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                            <button
                                type="button"
                                onClick={() => setActiveTab('attendance')}
                                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                                    activeTab === 'attendance'
                                        ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <CalendarCheck2 className="h-4 w-4" />
                                Attended Events & Attendance History
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                        activeTab === 'attendance'
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
                                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                                    activeTab === 'violations'
                                        ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Violations & Disciplinary
                                {violations.length > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                            activeTab === 'violations'
                                                ? 'bg-rose-600 text-white dark:bg-rose-500'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                        }`}
                                    >
                                        {violations.length}
                                    </span>
                                )}
                            </button>

                            {/* Show Information Sheet Tab only if NOT hidden (Admin mode) */}
                            {!hideInformationSheet && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                                        activeTab === 'info'
                                            ? 'border-[#000D6A] text-[#000D6A] dark:border-[#8CE4FF] dark:text-[#8CE4FF]'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    Student Information Sheet
                                </button>
                            )}
                        </div>

                        {/* ── TAB CONTENT: ATTENDANCE ── */}
                        {activeTab === 'attendance' && (
                            <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-6 sm:p-8">
                                {/* Search & Filter Bar */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={attendanceSearch}
                                            onChange={(e) => setAttendanceSearch(e.target.value)}
                                            placeholder="Search event title, venue, or check-in method..."
                                            className="w-full rounded-xl border-0 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#000D6A] dark:bg-slate-800/80 dark:text-white dark:focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('all')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                statusFilter === 'all'
                                                    ? 'bg-[#000D6A] text-white dark:bg-blue-600'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            All ({attendances.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('present')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                statusFilter === 'present'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Present
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('late')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                statusFilter === 'late'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Late
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('override')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                statusFilter === 'override'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Override
                                        </button>
                                    </div>
                                </div>

                                {/* Attendance List */}
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    {isLoadingAttendance ? (
                                        <div className="space-y-3 p-12 text-center">
                                            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#000D6A] dark:text-[#8CE4FF]" />
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Loading attendance records...
                                            </p>
                                        </div>
                                    ) : filteredAttendances.length === 0 ? (
                                        <div className="space-y-3 p-12 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                No Attendance Records Found
                                            </h4>
                                            <p className="mx-auto max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                                {attendances.length === 0
                                                    ? 'This student has not checked in to any campus events yet.'
                                                    : 'No records matched your search or status filter.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                            {filteredAttendances.map((record) => (
                                                <div
                                                    key={record.id}
                                                    className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:p-5 dark:hover:bg-slate-800/40"
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

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {record.event_date && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                    {record.event_date} {record.event_time ? `• ${record.event_time}` : ''}
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

                                                        {record.manual_override_reason && (
                                                            <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                                                Note: {record.manual_override_reason}
                                                            </p>
                                                        )}
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

                        {/* ── TAB CONTENT: VIOLATIONS ── */}
                        {activeTab === 'violations' && (
                            <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-6 sm:p-8">
                                {/* Severity Counters */}
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                                        <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                                            {violationSummary.total}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider dark:text-amber-400">Warning</span>
                                        <div className="mt-1 text-xl font-black text-amber-700 dark:text-amber-300">
                                            {violationSummary.warning}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-orange-200/70 bg-orange-50/50 p-3 shadow-xs dark:border-orange-900/40 dark:bg-orange-950/20">
                                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider dark:text-orange-400">Suspension</span>
                                        <div className="mt-1 text-xl font-black text-orange-700 dark:text-orange-300">
                                            {violationSummary.suspension}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-3 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
                                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider dark:text-rose-400">Exclusion</span>
                                        <div className="mt-1 text-xl font-black text-rose-700 dark:text-rose-300">
                                            {violationSummary.exclusion}
                                        </div>
                                    </div>
                                    <div className="col-span-2 rounded-2xl border border-red-200/70 bg-red-50/50 p-3 shadow-xs sm:col-span-1 dark:border-red-900/40 dark:bg-red-950/20">
                                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider dark:text-red-400">Expulsion</span>
                                        <div className="mt-1 text-xl font-black text-red-700 dark:text-red-300">
                                            {violationSummary.expulsion}
                                        </div>
                                    </div>
                                </div>

                                {/* Filters and Search */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={violationSearch}
                                            onChange={(e) => setViolationSearch(e.target.value)}
                                            placeholder="Search violation name, code, venue, or description..."
                                            className="w-full rounded-xl border-0 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#000D6A] dark:bg-slate-800/80 dark:text-white dark:focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setViolationSectionFilter('all')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                violationSectionFilter === 'all'
                                                    ? 'bg-[#000D6A] text-white dark:bg-blue-600'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            All ({violations.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViolationSectionFilter('Warning')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                violationSectionFilter === 'Warning'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Warning
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViolationSectionFilter('Suspension')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                violationSectionFilter === 'Suspension'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Suspension
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViolationSectionFilter('Exclusion')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                violationSectionFilter === 'Exclusion'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Exclusion
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViolationSectionFilter('Expulsion')}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                violationSectionFilter === 'Expulsion'
                                                    ? 'bg-red-700 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Expulsion
                                        </button>
                                    </div>
                                </div>

                                {/* Violations List */}
                                {isLoadingViolations ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <RefreshCw className="h-8 w-8 animate-spin text-[#000D6A] dark:text-[#8CE4FF]" />
                                        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            Loading violation records...
                                        </p>
                                    </div>
                                ) : filteredViolations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/30">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {violations.length === 0 ? 'Clean Disciplinary Record' : 'No Matching Results'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:shadow-md sm:flex-row sm:items-start dark:border-slate-800 dark:bg-slate-900"
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                                    record.violation_section === 'Warning'
                                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : record.violation_section === 'Suspension'
                                                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                                          : record.violation_section === 'Exclusion'
                                                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : record.violation_section === 'Expulsion'
                                                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
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
                                                        {record.status && (
                                                            <Badge
                                                                className={
                                                                    record.status === 'resolved'
                                                                        ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'
                                                                        : record.status === 'under_investigation'
                                                                          ? 'rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400'
                                                                          : 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400'
                                                                }
                                                            >
                                                                {record.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {record.description && (
                                                        <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                                            {record.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {record.incident_date && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                {record.incident_date} {record.incident_time ? `• ${record.incident_time}` : ''}
                                                            </span>
                                                        )}
                                                        {record.location && (
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                {record.location}
                                                            </span>
                                                        )}
                                                        {record.reported_by && (
                                                            <span className="flex items-center gap-1.5">
                                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                                Reported by: {record.reported_by}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {record.immediate_action && (
                                                        <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                                            Action Taken: {record.immediate_action}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 pt-2 text-xs sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 dark:border-slate-800">
                                                    <div className="space-y-0.5">
                                                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                            Filed
                                                        </span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {record.created_at || 'Recorded'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB CONTENT: STUDENT INFORMATION SHEET (Admin Only) ── */}
                        {activeTab === 'info' && !hideInformationSheet && (
                            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                                    {/* School Header */}
                                    <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-[#0b2d66] pb-4">
                                        <img
                                            src="/images/SRCB.png"
                                            className="h-16 w-16 shrink-0 object-contain"
                                            alt="SRCB Logo"
                                        />
                                        <div className="flex-1 text-center text-xs">
                                            <h2 className="text-sm font-black text-[#0b2d66] dark:text-blue-400">
                                                ST. RITA'S COLLEGE OF BALINGASAG, INC.
                                            </h2>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">
                                                Balingasag, Misamis Oriental
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph
                                            </p>
                                        </div>
                                        <img
                                            src="/images/DSA.png"
                                            className="h-16 w-16 shrink-0 object-contain"
                                            alt="DSA Logo"
                                        />
                                    </div>

                                    {/* Sheet Title */}
                                    <div className="my-4 text-center">
                                        <h1 className="text-base font-black tracking-wider text-[#0b2d66] uppercase dark:text-blue-400">
                                            STUDENT INFORMATION SHEET
                                        </h1>
                                        <p className="text-[11px] font-medium text-slate-400">
                                            Academic Year 2024 &ndash; 2025
                                        </p>
                                    </div>

                                    {/* Personal Info Box */}
                                    <div className="space-y-4 text-xs">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                                                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                                    {student.name}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Student ID</span>
                                                <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {student.student_id || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Program / Course</span>
                                                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                                    {student.course || student.program || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Year Level & Entry Status</span>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {student.year_level || 'N/A'} • {student.entry_status || 'Regular'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {student.email}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</span>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {student.contact_no || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Home Address</span>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {student.home_address || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Birthday & Birthplace</span>
                                                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    {student.birthday || 'N/A'} {student.place_of_birth ? `(${student.place_of_birth})` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Family Background</span>
                                            <div className="mt-2 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                                    <span className="text-[10px] font-bold text-slate-500">Mother:</span>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {student.mother_name || 'N/A'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Contact: {student.mother_contact || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                                    <span className="text-[10px] font-bold text-slate-500">Father:</span>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {student.father_name || 'N/A'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Contact: {student.father_contact || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── MODAL FOOTER ── */}
                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Showing {activeTab === 'attendance' ? `${filteredAttendances.length} event log(s)` : activeTab === 'violations' ? `${filteredViolations.length} violation(s)` : 'official record'}
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl border-slate-200 px-5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

