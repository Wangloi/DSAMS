import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    AlertTriangle, 
    BookOpen, 
    Clock, 
    FileText, 
    HeartHandshake, 
    MapPin, 
    Printer, 
    Scale, 
    ShieldAlert, 
    UserCheck, 
    ArrowLeft,
    Paperclip,
    ExternalLink
} from 'lucide-react';
import AdminLayout from '../admin-layout';
import { adminIncidentsViolations, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { IncidentRow, DisciplinaryActionRecord, StudentDisciplinaryStats, Violation, DisciplinaryHistoryItem } from './types';
import DisciplinaryActionPanel from './DisciplinaryActionPanel';

interface ShowPageProps {
    incident: IncidentRow;
    studentDetails: {
        id: string;
        name: string;
        course: string;
        yearLevel: string;
        status: string;
        db_id?: number;
    } | null;
    disciplinaryActions: DisciplinaryActionRecord[];
    violations: Violation[];
    studentDisciplinaryStats: StudentDisciplinaryStats | null;
    studentDisciplinaryHistory: DisciplinaryHistoryItem[];
}

export default function DisciplinaryCaseDetailPage({ 
    incident, 
    studentDetails,
    disciplinaryActions,
    violations,
    studentDisciplinaryStats,
    studentDisciplinaryHistory
}: ShowPageProps) {
    // Process disciplinary history to show warning stages
    const processedDisciplinaryHistory = useMemo((): (DisciplinaryHistoryItem & { displayLabel?: string })[] => {
        let warningCount = 0;
        // Reverse to count from oldest to newest first
        return [...studentDisciplinaryHistory].reverse().map(item => {
            let displayLabel: string = item.action_type;
            if (item.action_type === 'Warning') {
                warningCount++;
                displayLabel = `${warningCount}${warningCount === 1 ? 'st' : warningCount === 2 ? 'nd' : warningCount === 3 ? 'rd' : 'th'} Warning`;
            }
            return { ...item, displayLabel };
        }).reverse(); // Reverse back to show newest first
    }, [studentDisciplinaryHistory]);

    const isMajor = ['Suspension', 'Exclusion', 'Expulsion'].includes(incident.classification);
    const severityText = isMajor ? 'Critical Severity' : 'Moderate Severity';
    const severityColor = isMajor 
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';

    const caseId = incident.caseId;
    const incidentTitle = incident.type;
    const incidentDescription = incident.raw?.description || `Incident reported involving ${incident.student}. Investigation under progress.`;
    const investigationStatus = incident.status;
    const assignedOfficer = incident.raw?.receivedBy || incident.raw?.reportedBy || 'Dean Marcus Aurelius';
    const location = incident.raw?.location || 'Main Campus';
    const dateTime = incident.dateTime;

    // Student Information (using DB record or generated mocks)
    const studentName = studentDetails?.name || incident.student;
    const studentId = studentDetails?.id || incident.studentId;
    const studentInitials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const courseMock = studentDetails?.course || (studentId.includes('BSCS') ? 'BSCS' : 'BSIT');
    const yearLevelMock = studentDetails?.yearLevel || (incident.id % 2 === 0 ? '3rd Year' : '4th Year');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: adminDashboard(),
        },
        {
            title: 'Violation Registry & History',
            href: adminIncidentsViolations(),
        },
        {
            title: `Case #${caseId}`,
            href: `/admin/incidents-violations/${incident.id}`,
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Disciplinary Case Detail - #${caseId}`} />
            
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-[#020617] pb-12">
                
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {/* ── Hero Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Link 
                                    href={adminIncidentsViolations()} 
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner backdrop-blur-sm ring-1 ring-white/20 transition-all duration-200 hover:bg-white/20"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200/80">
                                        <span>Registry</span>
                                        <span>/</span>
                                        <span className="font-extrabold text-white">Case #{caseId}</span>
                                    </div>
                                    <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white">
                                        Disciplinary Case Detail
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Button 
                                    type="button" 
                                    className="h-11 gap-2 rounded-xl bg-white px-5 font-bold text-[#1e3a8a] shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-5 w-5" />
                                    <span>Export PDF</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        
                        {/* LEFT COLUMN - CASE DETAILS (Col-span 2) */}
                        <div className="space-y-6 lg:col-span-2">
                            
                            {/* Card 1: Main Case Information */}
                            <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800 border-l-4 border-l-rose-500 dark:border-l-rose-600">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400">CASE_ID: #{caseId}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${severityColor}`}>
                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                            {severityText}
                                        </span>
                                    </div>

                                    <h3 className="mb-4 text-xl font-extrabold tracking-tight leading-snug text-slate-900 dark:text-white">
                                        {incidentTitle}
                                    </h3>

                                    <p className="mb-6 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                        {incidentDescription}
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-3">
                                        <div>
                                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Investigation Status</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                <span className={`h-2 w-2 rounded-full ${
                                                    investigationStatus === 'Resolved' ? 'bg-emerald-500' :
                                                    investigationStatus === 'Pending' ? 'bg-amber-500' :
                                                    investigationStatus === 'Ongoing' ? 'bg-blue-500' : 'bg-rose-500'
                                                }`} />
                                                <span>{investigationStatus}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Officer</span>
                                            <span className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                                {assignedOfficer}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Location & Date</span>
                                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <span className="truncate">{location} ({dateTime.split(' ')[0]})</span>
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Statutory Reference */}
                            <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Statutory Reference</h4>
                                    </div>

                                    {(() => {
                                        const violation = violations.find(v => v.id === incident.violation_id);
                                        if (violation) {
                                            return (
                                                <div className="space-y-4">
                                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#1E3A5F]/20">
                                                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                                                            {violation.section}: {violation.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                            Student Handbook, Chapter on Student Conduct
                                                        </span>
                                                    </div>
                                                    {violation.description && (
                                                        <ul className="space-y-2">
                                                            <li className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                                                <span>{violation.description}</span>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        }
                                        // Fallback if no violation selected
                                        return (
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#1E3A5F]/20">
                                                    <span className="block text-sm font-extrabold text-slate-900 dark:text-white">General Code of Conduct</span>
                                                    <span className="mt-0.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        Student Handbook, Chapter 3: Student Conduct & Disciplinary Action
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Card 3: Imposed Effects */}
                            <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Scale className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Imposed Effects</h4>
                                    </div>

                                    <div className="space-y-2.5">
                                        {/* First show immediate action from incident */}
                                        {incident.raw?.immediateAction && (
                                            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-200">
                                                <Clock className="h-4 w-4 shrink-0" />
                                                <span>Immediate Action: {incident.raw.immediateAction}</span>
                                            </div>
                                        )}
                                        
                                        {/* Show final actions from approved disciplinary actions */}
                                        {disciplinaryActions.filter(da => ['Approved', 'Modified', 'Overridden'].includes(da.status)).map((action) => (
                                            <div key={action.id} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
                                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                                <span>
                                                    {action.final_action || action.recommended_action}: {action.final_action_reason || action.recommendation_reason || 'Disciplinary action recorded'}
                                                </span>
                                            </div>
                                        ))}
                                        
                                        {/* Fallback if no actions yet */}
                                        {!incident.raw?.immediateAction && disciplinaryActions.filter(da => ['Approved', 'Modified', 'Overridden'].includes(da.status)).length === 0 && (
                                            <div className="py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                                No disciplinary actions have been imposed yet.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 3.5: Evidence Attachments */}
                            {(() => {
                                const evidencePaths = (incident.raw as any)?.evidencePaths || [];
                                if (evidencePaths.length === 0) return null;
                                return (
                                    <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                                        <CardContent className="p-6">
                                            <div className="mb-4 flex items-center gap-2">
                                                <Paperclip className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Evidence Attachments</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {evidencePaths.map((path: string, i: number) => {
                                                    const url = `/storage/${path}`;
                                                    const name = path.split('/').pop() || `evidence-${i + 1}`;
                                                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
                                                    return (
                                                        <div key={path} className="group relative flex flex-col rounded-xl border border-slate-100 bg-slate-50 overflow-hidden dark:border-slate-800 dark:bg-slate-950/20">
                                                            {isImage ? (
                                                                <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                                                                    <img 
                                                                        src={url} 
                                                                        alt={name} 
                                                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" 
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex aspect-video w-full items-center justify-center bg-slate-150 text-slate-400 dark:bg-slate-900 dark:text-slate-650">
                                                                    <FileText className="h-10 w-10" />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between p-3">
                                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                                                                    {name}
                                                                </span>
                                                                <a 
                                                                    href={url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 hover:text-blue-600 shadow-sm transition-colors dark:bg-slate-800 dark:text-slate-400"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}

                            {/* Card 4: Notes & Compliance Tracking */}
                            <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                                <CardContent className="p-6">
                                    <div className="mb-6 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Notes & Compliance Tracking</h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Show immediate action as first entry */}
                                        {incident.raw?.immediateAction && (
                                            <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-[#1E3A5F]/40 dark:text-blue-400">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Initial Action</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">
                                                            {incident.dateTime.split(' ')[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                                        {incident.raw.immediateAction}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Badge className="rounded border-0 bg-slate-100 px-1.5 py-0 text-[9px] font-black tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                            LOGGED
                                                        </Badge>
                                                        {incident.raw?.receivedBy && (
                                                            <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                                                                Officer: {incident.raw.receivedBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Show remarks from disciplinary actions */}
                                        {disciplinaryActions.filter(da => da.remarks).map((action) => (
                                            <div key={action.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Disciplinary Note</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">
                                                            {action.created_at ? new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : ''}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                                        {action.remarks}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Badge className={`rounded border-0 px-1.5 py-0 text-[9px] font-black tracking-wide ${
                                                            action.status === 'Approved' 
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                                        }`}>
                                                            {action.status.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Fallback if no notes */}
                                        {!incident.raw?.immediateAction && disciplinaryActions.filter(da => da.remarks).length === 0 && (
                                            <div className="py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                                No compliance notes have been recorded yet.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Disciplinary Action Panel (Interactive) */}
                            <DisciplinaryActionPanel
                                incidentId={incident.id}
                                studentDbId={studentDetails?.db_id ?? null}
                                disciplinaryActions={disciplinaryActions}
                                violations={violations}
                                stats={studentDisciplinaryStats}
                            />

                        </div>

                        {/* RIGHT COLUMN - STUDENT PROFILE & HISTORY (Col-span 1) */}
                        <div className="space-y-6">
                            
                            {/* Card 1: Student Profile Card */}
                            <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/60 dark:ring-slate-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-base font-black text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                            {studentInitials}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">{studentName}</h4>
                                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID: {studentId}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <div>
                                            <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Year Level & Course</span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">{yearLevelMock} ({courseMock})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Disciplinary History */}
                            <Card className="rounded-2xl border-0 bg-white shadow-lg ring-1 ring-slate-200 dark:bg-[#0B192C]/50 dark:ring-slate-800">
                                <CardContent className="p-6">
                                    <div className="mb-6 flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Disciplinary History</h4>
                                        <Badge variant={isMajor ? 'destructive' : 'secondary'} className="rounded px-1.5 py-0 text-[9px] font-black uppercase tracking-wide">
                                            {studentDisciplinaryStats?.total_actions ?? 0}
                                        </Badge>
                                    </div>

                                    {processedDisciplinaryHistory.length > 0 ? (
                                        <div className="relative space-y-6 border-l-2 border-slate-100 pl-6 dark:border-slate-800">
                                            {processedDisciplinaryHistory.map((historyItem: DisciplinaryHistoryItem & { displayLabel?: string }) => (
                                                <div key={historyItem.id} className="relative">
                                                    <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0B192C] ${
                                                        historyItem.is_current 
                                                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' 
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                    </span>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-xs font-black ${
                                                            historyItem.is_current 
                                                            ? 'text-rose-700 dark:text-rose-400' 
                                                            : 'text-slate-900 dark:text-white'
                                                        }`}>
                                                            {historyItem.is_current ? `Current: ${historyItem.displayLabel}` : historyItem.displayLabel}
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase ${
                                                            historyItem.is_current 
                                                            ? 'text-rose-500 dark:text-rose-400' 
                                                            : 'text-slate-400 dark:text-slate-500'
                                                        }`}>
                                                            {historyItem.date}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                                        {historyItem.description}
                                                    </p>
                                                    {historyItem.case_ref && !historyItem.is_current && (
                                                        <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-1.5 px-2 text-[9px] font-bold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                                                            CASE_REF: #{historyItem.case_ref}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                            No prior disciplinary history.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Card 3: Counseling Status */}
                            <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm text-slate-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-200">
                                <CardContent className="p-6">
                                    <h4 className="mb-4 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400">Counseling Status</h4>
                                    
                                    <div className="mb-2 flex items-center justify-between text-xs font-extrabold">
                                        <span>Program Progress</span>
                                        <span>40%</span>
                                    </div>
                                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                        <div className="h-full rounded-full bg-[#E6A15C]" style={{ width: '40%' }} />
                                    </div>

                                    <p className="flex items-center gap-1.5 text-[10px] font-bold leading-relaxed text-amber-800/80 dark:text-amber-400">
                                        <HeartHandshake className="h-4 w-4 shrink-0 text-[#E6A15C]" />
                                        <span>Mandatory 10 sessions. 4 completed with Dr. S. Thorne</span>
                                    </p>
                                </CardContent>
                            </Card>

                        </div>

                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
