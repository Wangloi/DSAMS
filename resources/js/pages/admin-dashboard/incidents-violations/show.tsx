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
    ArrowLeft
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
                
                <div className="bg-white dark:bg-[#0B192C]/60 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-6">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={adminIncidentsViolations()} 
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <span>Registry</span>
                                    <span>/</span>
                                    <span className="text-[#1E3E62] dark:text-blue-400 font-extrabold">Case #{caseId}</span>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                                    Disciplinary Case Detail
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-white hover:bg-slate-50 dark:bg-[#1E3A5F] dark:hover:bg-[#1A304F] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 h-9 font-bold flex items-center gap-2"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4" />
                                <span>Export PDF</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* LEFT COLUMN - CASE DETAILS (Col-span 2) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Card 1: Main Case Information */}
                            <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 border-l-rose-500 dark:border-l-rose-600">
                                <CardContent className="p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                        <span className="text-xs font-bold text-slate-450 tracking-wider">CASE_ID: #{caseId}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${severityColor}`}>
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {severityText}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-snug">
                                        {incidentTitle}
                                    </h3>

                                    <p className="text-slate-600 dark:text-slate-350 text-xs font-medium leading-relaxed mb-6">
                                        {incidentDescription}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Investigation Status</span>
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
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Officer</span>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                                {assignedOfficer}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location & Date</span>
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{location} ({dateTime.split(' ')[0]})</span>
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Statutory Reference */}
                            <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Statutory Reference</h4>
                                    </div>

                                    {(() => {
                                        const violation = violations.find(v => v.id === incident.violation_id);
                                        if (violation) {
                                            return (
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50 dark:bg-[#1E3A5F]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                                                            {violation.section}: {violation.name}
                                                        </span>
                                                        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                            Student Handbook, Chapter on Student Conduct
                                                        </span>
                                                    </div>
                                                    {violation.description && (
                                                        <ul className="space-y-2">
                                                            <li className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                                <span className="block h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
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
                                                <div className="bg-slate-50 dark:bg-[#1E3A5F]/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-sm font-extrabold text-slate-900 dark:text-white">General Code of Conduct</span>
                                                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                        Student Handbook, Chapter 3: Student Conduct & Disciplinary Action
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Card 3: Imposed Effects */}
                            <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Scale className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Imposed Effects</h4>
                                    </div>

                                    <div className="space-y-2.5">
                                        {/* First show immediate action from incident */}
                                        {incident.raw?.immediateAction && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
                                                <Clock className="h-4 w-4 shrink-0" />
                                                <span>Immediate Action: {incident.raw.immediateAction}</span>
                                            </div>
                                        )}
                                        
                                        {/* Show final actions from approved disciplinary actions */}
                                        {disciplinaryActions.filter(da => ['Approved', 'Modified', 'Overridden'].includes(da.status)).map((action) => (
                                            <div key={action.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-350 text-xs font-bold">
                                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                                <span>
                                                    {action.final_action || action.recommended_action}: {action.final_action_reason || action.recommendation_reason || 'Disciplinary action recorded'}
                                                </span>
                                            </div>
                                        ))}
                                        
                                        {/* Fallback if no actions yet */}
                                        {!incident.raw?.immediateAction && disciplinaryActions.filter(da => ['Approved', 'Modified', 'Overridden'].includes(da.status)).length === 0 && (
                                            <div className="text-xs font-medium text-slate-500 text-center py-2">
                                                No disciplinary actions have been imposed yet.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 4: Notes & Compliance Tracking */}
                            <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between gap-2 mb-6">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Notes & Compliance Tracking</h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Show immediate action as first entry */}
                                        {incident.raw?.immediateAction && (
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-[#1E3A5F]/40 text-blue-600 dark:text-blue-400 mt-0.5">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Initial Action</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {incident.dateTime.split(' ')[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-355 leading-relaxed mt-1">
                                                        {incident.raw.immediateAction}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-0 rounded text-[9px] font-black tracking-wide px-1.5 py-0">
                                                            LOGGED
                                                        </Badge>
                                                        {incident.raw?.receivedBy && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                Officer: {incident.raw.receivedBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Show remarks from disciplinary actions */}
                                        {disciplinaryActions.filter(da => da.remarks).map((action) => (
                                            <div key={action.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mt-0.5">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Disciplinary Note</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {action.created_at ? new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-355 leading-relaxed mt-1">
                                                        {action.remarks}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge className={`text-[9px] font-black tracking-wide px-1.5 py-0 rounded border-0 ${
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
                                            <div className="text-xs font-medium text-slate-500 text-center py-4">
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
                            <Card className="bg-[#0B192C] text-white border-slate-800 shadow-md overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-black text-white ring-2 ring-slate-800 shadow-inner">
                                            {studentInitials}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-extrabold tracking-tight leading-tight">{studentName}</h4>
                                            <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">ID: {studentId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mt-6 pt-4 border-t border-slate-800">
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Year Level</span>
                                            <span className="text-xs font-bold text-slate-200">{yearLevelMock} ({courseMock})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Disciplinary History */}
                            <Card className="bg-white dark:bg-[#0B192C]/50 border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between gap-2 mb-6">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Disciplinary History</h4>
                                        <Badge variant={isMajor ? 'destructive' : 'secondary'} className="rounded text-[9px] font-black px-1.5 py-0 tracking-wide uppercase">
                                            {studentDisciplinaryStats?.total_actions ?? 0}
                                        </Badge>
                                    </div>

                                    {processedDisciplinaryHistory.length > 0 ? (
                                        <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                                            {processedDisciplinaryHistory.map((historyItem: DisciplinaryHistoryItem & { displayLabel?: string }) => (
                                                <div key={historyItem.id} className="relative">
                                                    <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0F213A] ${
                                                        historyItem.is_current 
                                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
                                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                        {historyItem.description}
                                                    </p>
                                                    {historyItem.case_ref && !historyItem.is_current && (
                                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 px-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                                            CASE_REF: #{historyItem.case_ref}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs font-medium text-slate-500 text-center py-6">
                                            No prior disciplinary history.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Card 3: Counseling Status */}
                            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30 text-slate-800 dark:text-amber-200 shadow-sm">
                                <CardContent className="p-6">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400 mb-4">Counseling Status</h4>
                                    
                                    <div className="flex items-center justify-between text-xs font-extrabold mb-2">
                                        <span>Program Progress</span>
                                        <span>40%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                                        <div className="bg-[#E6A15C] h-full rounded-full" style={{ width: '40%' }} />
                                    </div>

                                    <p className="text-[10px] font-bold text-amber-800/80 dark:text-amber-400 flex items-center gap-1.5 leading-relaxed">
                                        <HeartHandshake className="h-4 w-4 text-[#E6A15C] shrink-0" />
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
