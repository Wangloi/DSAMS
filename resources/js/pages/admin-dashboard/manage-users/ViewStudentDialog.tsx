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
    Building2,
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    GraduationCap,
    Info,
    Mail,
    MapPin,
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
    const isProgramHead =
        student?.userType === 'program_head' ||
        String(student?.role ?? '').toLowerCase().includes('program');

    const [activeTab, setActiveTab] = useState<'attendance' | 'info'>('attendance');
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

    // Fetch student's attendance records and reset to attendance tab when dialog opens
    useEffect(() => {
        if (!open || !student || isProgramHead) {
            return;
        }

        setActiveTab('attendance');
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

    const printableHtml = useMemo(() => {
        if (!student) return '';

        if (isProgramHead) {
            return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Program Head Information Profile</title>
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
<title>Student Attendance & Participation Record - ${student.name}</title>
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
    }, [student, isProgramHead, activeTab, attendances, summary]);

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
            <DialogContent className="flex max-h-[92vh] w-full !max-w-4xl flex-col overflow-hidden rounded-3xl border-0 bg-slate-100 p-0 shadow-2xl dark:bg-slate-900 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>
                        {student ? formatLastNameFirst(student) : 'User Details'}
                    </DialogTitle>
                    <DialogDescription>
                        {isProgramHead
                            ? 'Program Head Profile and Assigned Academic Department details'
                            : 'Official Student Information Sheet and institutional background record'}
                    </DialogDescription>
                </DialogHeader>
                {!student ? (
                    <div className="p-8 text-center text-slate-500">
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

                                <div className="flex items-center gap-2.5 self-end sm:self-auto">
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
                            {/* Key Badges & Account Metrics Strip */}
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

                            {/* Section Cards */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                {/* Card 1: Department Information */}
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

                                {/* Card 2: Contact & Credentials */}
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

                            {/* Section 3: Responsibilities & Scope */}
                            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-5 shadow-xs dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#23509A] text-white shadow-sm dark:bg-[#0B4DFF]">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                            Designated Departmental Responsibilities
                                        </h4>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-300 text-[11.5px]">
                                            This Program Head possesses administrative jurisdiction over students enrolled in <strong>{student.course || student.program || 'their assigned program'}</strong>. They are authorized to monitor student rosters, evaluate attendance for campus activities, and process departmental incident clearance endorsements.
                                        </p>
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
                    <>
                        {/* STUDENT DIALOG TOP BAR WITH TAB SWITCHER & ACTIONS */}
                        <div className="flex flex-col border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            {/* Top Strip: Status & Print */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 sm:px-8 border-b border-slate-100 dark:border-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#000D6A]/10 text-[#000D6A] dark:bg-[#8CE4FF]/10 dark:text-[#8CE4FF]">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                {formatLastNameFirst(student)}
                                            </h3>
                                            <Badge
                                                className={
                                                    student.is_active
                                                        ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400'
                                                        : 'rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400'
                                                }
                                            >
                                                {student.is_active ? 'Active Account' : 'Inactive Account'}
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
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            ID: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{student.student_id || 'N/A'}</span> • {student.course || student.program || 'Student'} • {student.year_level || 'General'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Switcher Strip */}
                            <div className="flex items-center gap-2 px-6 pt-2 sm:px-8 bg-slate-50/70 dark:bg-slate-900/60">
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
                            </div>
                        </div>

                        {/* TAB 1: STUDENT INFORMATION SHEET */}
                        {activeTab === 'info' && (
                            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
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
                                                ST. RITA'S COLLEGE OF BALINGASAG, INC.
                                            </h2>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">
                                                Balingasag, Misamis Oriental
                                            </p>
                                            <p className="text-slate-500">
                                                Email: ritarian@srcb.edu.ph | Website: www.srcb.edu.ph
                                            </p>
                                            <p className="text-slate-500">
                                                Tel. (088)323-7159 / Mobile: +63-929-734-0012 (SMART); +63-975-637-9948 (Globe)
                                            </p>
                                            <p className="text-slate-500">
                                                PAASCU Level II Re-Accredited: Junior High School
                                            </p>
                                            <p className="text-slate-500">
                                                PAASCU Level I: Teacher Education Program & Business Administration Program
                                            </p>
                                            <p className="text-slate-400 italic">
                                                (Philippine Accrediting Association of Schools, Colleges, and Universities)
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
                                                        {student.year_level === '1st Year' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>1st Year</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.year_level === '2nd Year' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>2nd Year</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.year_level === '3rd Year' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>3rd Year</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.year_level === '4th Year' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>4th Year</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.entry_status === 'Freshman' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>Freshman</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.entry_status === 'Returnee' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>Returnee</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.entry_status === 'Transferee' ? '[x]' : '[ ]'}
                                                    </span>
                                                    <span>Transferee</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                        {student.entry_status === 'Old Student' ? '[x]' : '[ ]'}
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
                                                {student.program || student.course || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[180px_1fr]">
                                            <div className="flex flex-col justify-center border-r border-blue-200 bg-blue-50/50 p-3 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                                                <span>MAJOR</span>
                                                <span className="text-[9px] font-normal text-slate-400 italic">
                                                    (if applicable & do not abbreviate)
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
                                                        {student.place_of_birth || 'N/A'}
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
                                                                {student.gender?.toLowerCase() === 'male' ? '[x]' : '[ ]'}
                                                            </span>{' '}
                                                            Male
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-mono text-sm font-bold text-[#0b2d66] dark:text-blue-400">
                                                                {student.gender?.toLowerCase() === 'female' ? '[x]' : '[ ]'}
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
                                                        {student.contact_no || 'N/A'}
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
                                                        {student.nationality || 'Filipino'}
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
                                                <div className="border-r border-blue-200 p-2 dark:border-blue-900">LEVEL</div>
                                                <div className="border-r border-blue-200 p-2 dark:border-blue-900">SCHOOL ATTENDED</div>
                                                <div className="p-2">YEAR GRADUATED</div>
                                            </div>
                                            <div className="grid grid-cols-[160px_1fr_120px] border-b border-blue-200 dark:border-blue-900">
                                                <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                    Elementary
                                                </div>
                                                <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                    {student.elementary_school || 'N/A'}
                                                </div>
                                                <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                    {student.elementary_year_graduated || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-[160px_1fr_120px] border-b border-blue-200 dark:border-blue-900">
                                                <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                    Junior High School
                                                </div>
                                                <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                    {student.junior_high_school || 'N/A'}
                                                </div>
                                                <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                    {student.junior_high_year_graduated || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-[160px_1fr_120px]">
                                                <div className="flex items-center border-r border-blue-200 bg-blue-50/20 p-2 font-bold text-[#0b2d66] dark:border-blue-900 dark:bg-blue-950/10 dark:text-blue-400">
                                                    Senior High School
                                                </div>
                                                <div className="flex items-center border-r border-blue-200 p-2 font-semibold text-slate-700 dark:border-blue-900 dark:text-slate-200">
                                                    {student.senior_high_school || 'N/A'}
                                                </div>
                                                <div className="flex items-center justify-center p-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                                                    {student.senior_high_year_graduated || 'N/A'}
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
                                                        {student.mother_name || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Contact Number:
                                                    </span>
                                                    <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                        {student.mother_contact || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="flex items-end gap-2">
                                                    <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Father:
                                                    </span>
                                                    <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                        {student.father_name || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Contact Number:
                                                    </span>
                                                    <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                        {student.father_contact || 'N/A'}
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
                                                        {student.guardian_relation || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="shrink-0 font-bold text-[#0b2d66] dark:text-blue-400">
                                                        Contact Number:
                                                    </span>
                                                    <div className="flex-1 border-b border-slate-300 pb-0.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                                                        {student.guardian_contact || 'N/A'}
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

                                    {/* Office of Student Affairs footer seal */}
                                    <div className="mt-14 border-t border-slate-100 pt-5 text-center dark:border-slate-900">
                                        <h3 className="font-serif text-sm font-bold text-[#0b2d66] italic dark:text-blue-400">
                                            Office of Student Affairs
                                        </h3>
                                        <p className="mt-0.5 text-[10px] text-slate-500 italic">
                                            2nd Level, St. Rita Building, St. Rita's College of Balingasag
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
                        )}

                        {/* TAB 2: ATTENDED EVENTS & ATTENDANCE HISTORY */}
                        {activeTab === 'attendance' && (
                            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
                                {/* Summary Metrics Strip */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Total Attended
                                            </span>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#000D6A] text-white dark:bg-blue-600">
                                                <CalendarCheck2 className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-2xl font-black text-[#000D6A] dark:text-[#8CE4FF]">
                                            {summary.total_attended}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Campus events & assemblies
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                On-Time Present
                                            </span>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                            {summary.present_count}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Regular check-in logs
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Late Check-Ins
                                            </span>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-400">
                                            {summary.late_count}
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Past grace period
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 p-4 shadow-xs dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-violet-950/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Attendance Rate
                                            </span>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                            {summary.attendance_rate}%
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            On-time punctuality
                                        </p>
                                    </div>
                                </div>

                                {/* Filters and Search Strip */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={attendanceSearch}
                                            onChange={(e) => setAttendanceSearch(e.target.value)}
                                            placeholder="Search by event title, venue, or check-in method..."
                                            className="w-full rounded-xl border-0 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#000D6A] dark:bg-slate-800/80 dark:text-white dark:focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 self-center sm:self-auto">
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

                                {/* Attendance List / Table */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                                    {isLoadingAttendance ? (
                                        <div className="p-12 text-center space-y-3">
                                            <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#000D6A] dark:text-[#8CE4FF]" />
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Loading student attendance records...
                                            </p>
                                        </div>
                                    ) : filteredAttendances.length === 0 ? (
                                        <div className="p-12 text-center space-y-3">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                No Attendance Records Found
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                                >
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-bold text-sm text-slate-900 dark:text-white">
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
                                                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                                                Note: {record.manual_override_reason}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex sm:flex-col sm:items-end justify-between items-center text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                                Time-In
                                                            </span>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                {record.checked_in_at || 'Recorded'}
                                                            </span>
                                                        </div>
                                                        {record.checked_out_at && (
                                                            <div className="space-y-0.5 mt-1 sm:text-right">
                                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
