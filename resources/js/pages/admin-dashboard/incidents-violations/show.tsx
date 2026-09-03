import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminDashboard, adminIncidentsViolations } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileText,
    Gavel,
    History,
    Layers,
    MapPin,
    Printer,
    Scale,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AdminLayout from '../admin-layout';
import CallingSlipModal from './CallingSlipModal';
import InvestigationDialog from './InvestigationDialog';
import DisciplinaryResolutionModal from './DisciplinaryResolutionModal';
import DisciplinaryActionPanel from './DisciplinaryActionPanel';
import StudentCallingProcessFlow, { STUDENT_CALLING_PHASES } from './StudentCallingProcessFlow';
import type {
    DisciplinaryActionRecord,
    DisciplinaryHistoryItem,
    IncidentRow,
    StudentDisciplinaryStats,
    Violation,
} from './types';

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
    studentDisciplinaryHistory,
}: ShowPageProps) {
    const [activeTab, setActiveTab] = useState<'flow' | 'sanctions' | 'history'>('flow');
    const [callingSlipOpen, setCallingSlipOpen] = useState(false);
    const [investigationOpen, setInvestigationOpen] = useState(false);
    const [decisionOpen, setDecisionOpen] = useState(false);

    // Process disciplinary history to show warning stages
    const processedDisciplinaryHistory =
        useMemo((): (DisciplinaryHistoryItem & { displayLabel?: string })[] => {
            let warningCount = 0;
            return [...studentDisciplinaryHistory]
                .reverse()
                .map((item) => {
                    let displayLabel: string = item.action_type;
                    if (item.action_type === 'Warning') {
                        warningCount++;
                        displayLabel = `${warningCount}${warningCount === 1 ? 'st' : warningCount === 2 ? 'nd' : warningCount === 3 ? 'rd' : 'th'} Warning`;
                    }
                    return { ...item, displayLabel };
                })
                .reverse();
        }, [studentDisciplinaryHistory]);

    const isMajor = ['Suspension', 'Exclusion', 'Expulsion'].includes(
        incident.classification,
    ) || incident.classification !== 'Warning';

    const severityText = isMajor ? 'Major Offense' : 'Minor / Warning';

    const caseId = incident.caseId;
    const incidentTitle = incident.type;
    const incidentDescription =
        incident.raw?.description ||
        `Incident reported involving ${incident.student}. Investigation under progress.`;
    const investigationStatus = incident.status;
    const assignedOfficer =
        incident.raw?.receivedBy ||
        incident.raw?.reportedBy ||
        'Dean Marcus Aurelius';
    const location = incident.raw?.location || 'Main Campus';
    const dateTime = incident.dateTime;

    // Student Details
    const studentName = studentDetails?.name || incident.student;
    const studentId = studentDetails?.id || incident.studentId;
    const studentInitials = studentName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const courseMock =
        studentDetails?.course ||
        (studentId.includes('BSCS') ? 'BSCS' : 'BSIT');
    const yearLevelMock =
        studentDetails?.yearLevel ||
        (incident.id % 2 === 0 ? '3rd Year' : '4th Year');

    const totalWarnings = studentDisciplinaryStats?.total_actions ?? (isMajor ? 3 : 1);

    const currentPhase = incident.calling_phase ?? (
        incident.status === 'Resolved' ? 5 : (
            incident.status === 'Escalated' ? 4 : (
                incident.status === 'Ongoing' ? 3 : 1
            )
        )
    );

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

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 pb-12 dark:bg-[#020617] print:hidden">
                <div className="flex w-full flex-col gap-6 px-6 py-6 max-w-7xl mx-auto">
                    {/* ── Official DSAMS Brand Hero Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 shadow-xl shadow-blue-900/20">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={adminIncidentsViolations()}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                                    title="Back to Violation Registry"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-200/90 uppercase">
                                        <span>Registry</span>
                                        <span>/</span>
                                        <span>Case #{caseId}</span>
                                        <span>•</span>
                                        <Badge
                                            className={
                                                incident.status === 'Resolved'
                                                    ? 'bg-emerald-500 text-white font-black'
                                                    : incident.status === 'Ongoing'
                                                      ? 'bg-sky-400 text-[#0B192C] font-black'
                                                      : incident.status === 'Escalated'
                                                        ? 'bg-rose-500 text-white font-black'
                                                        : 'bg-amber-400 text-[#0B192C] font-black'
                                            }
                                        >
                                            {incident.status}
                                        </Badge>
                                    </div>
                                    <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white">
                                        Disciplinary Case Detail
                                    </h1>
                                </div>
                            </div>

                            {/* Primary Action Button Group */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-10 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setCallingSlipOpen(true)}
                                    title="Open Step 3 Calling Slip / Summon Notice"
                                >
                                    <Printer className="h-4 w-4 text-amber-300" />
                                    <span>Calling Slip</span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-10 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setInvestigationOpen(true)}
                                    title="Open Step 2 Fact-Finding & Investigation Summary"
                                >
                                    <ClipboardCheck className="h-4 w-4 text-pink-300" />
                                    <span>Investigation Log</span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-10 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setDecisionOpen(true)}
                                    title="Open Step 4 Disciplinary Resolution & Decision Modal"
                                >
                                    <Scale className="h-4 w-4 text-emerald-300" />
                                    <span>Notice of Decision</span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-10 gap-2 rounded-xl bg-white px-4 font-bold text-[#0b1c5c] shadow-md transition-all hover:bg-blue-50 cursor-pointer"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Export PDF</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── Executive Case & Offender Master Card ── */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-[#0B192C]">
                        <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-12 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
                            {/* Offender Identity (4 Cols) */}
                            <div className="p-6 lg:col-span-4 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-blue-950/20 flex flex-col justify-between gap-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-blue-300/60 block mb-3">
                                        Involved Student
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] text-lg font-black text-amber-400 shadow-md ring-2 ring-white dark:ring-slate-800">
                                            {studentInitials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-base font-black text-slate-900 dark:text-white">
                                                {studentName}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Student ID: {studentId}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <Badge variant="outline" className="bg-white/90 px-2.5 py-0 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-900/60">
                                                    {courseMock} • {yearLevelMock}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Cumulative Standing:</span>
                                    <Badge
                                        className={`text-[10px] font-black uppercase tracking-wider ${
                                            isMajor
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                        }`}
                                    >
                                        {severityText} ({totalWarnings} Total Record{totalWarnings > 1 ? 's' : ''})
                                    </Badge>
                                </div>
                            </div>

                            {/* Case Essentials (8 Cols) */}
                            <div className="p-6 lg:col-span-8 flex flex-col justify-between gap-5 bg-white dark:bg-[#0B192C]">
                                <div className="space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] font-black uppercase dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                            >
                                                {incident.classification}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                {dateTime}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            <span>{location}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                                        {incidentTitle}
                                    </h2>
                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        {incidentDescription}
                                    </p>
                                </div>

                                {/* Bottom Info Row */}
                                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span>Assigned Handling Officer: <strong className="font-bold text-slate-900 dark:text-slate-200">{assignedOfficer}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        <span>Due Process Stage:</span>
                                        <Badge className="bg-[#0b1c5c] text-amber-400 text-[10px] font-black px-2.5 py-0.5 shadow-xs">
                                            Step {currentPhase} of 5
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DSAMS Tab Bar ── */}
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('flow')}
                            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                activeTab === 'flow'
                                    ? 'border-blue-600 text-blue-900 dark:border-amber-400 dark:text-amber-300'
                                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Layers className="h-4 w-4" />
                            <span>5-Step Due Process Flow</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('sanctions')}
                            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                activeTab === 'sanctions'
                                    ? 'border-blue-600 text-blue-900 dark:border-amber-400 dark:text-amber-300'
                                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <Scale className="h-4 w-4" />
                            <span>Disciplinary Sanctions & Actions</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                activeTab === 'history'
                                    ? 'border-blue-600 text-blue-900 dark:border-amber-400 dark:text-amber-300'
                                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <History className="h-4 w-4" />
                            <span>Student Disciplinary History ({totalWarnings})</span>
                        </button>
                    </div>

                    {/* ── TAB 1: 5-STEP DUE PROCESS FLOW & TIMELINE ── */}
                    {activeTab === 'flow' && (
                        <div className="space-y-6">
                            <StudentCallingProcessFlow
                                currentPhase={currentPhase}
                                incidentId={incident.id}
                                editable={true}
                                onCallStudent={() => setCallingSlipOpen(true)}
                                onOpenInvestigation={() => setInvestigationOpen(true)}
                                onOpenDecision={() => setDecisionOpen(true)}
                            />

                            {/* Phase Transition History Timeline */}
                            {incident.calling_phase_history && (incident as any).calling_phase_history && (incident as any).calling_phase_history.length > 0 && (
                                <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                                    <CardContent className="p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                                Due Process Phase Transition Log
                                            </h4>
                                        </div>
                                        <div className="relative space-y-4 border-l-2 border-slate-200 pl-5 dark:border-slate-700 ml-2">
                                            {((incident as any).calling_phase_history as Array<{ phase: number; at: string; by: string; trigger: string }>).map((entry, idx) => {
                                                const phaseItem = STUDENT_CALLING_PHASES.find(p => p.phase === entry.phase) || STUDENT_CALLING_PHASES[0];
                                                const date = new Date(entry.at);
                                                return (
                                                    <div key={idx} className="relative">
                                                        <span className={`absolute -left-[27px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-black ring-4 ring-white dark:ring-[#0B192C] ${
                                                            idx === ((incident as any).calling_phase_history as any[]).length - 1
                                                                ? 'bg-[#0b1c5c] text-amber-400'
                                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                        }`}>
                                                            {entry.phase}
                                                        </span>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                    Step {entry.phase}: {phaseItem.shortLabel}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                    <span>Recorded by {entry.by}</span>
                                                                    <span>•</span>
                                                                    <span>{entry.trigger === 'status_change' ? 'Auto-synced from status' : entry.trigger === 'batch' ? 'Batch update' : 'Manual update'}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-slate-400">
                                                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: DISCIPLINARY SANCTION PANEL ── */}
                    {activeTab === 'sanctions' && (
                        <div className="space-y-6">
                            <DisciplinaryActionPanel
                                incidentId={incident.id}
                                studentDbId={studentDetails?.db_id ?? null}
                                disciplinaryActions={disciplinaryActions}
                                violations={violations}
                                stats={studentDisciplinaryStats}
                            />
                        </div>
                    )}

                    {/* ── TAB 3: DISCIPLINARY HISTORY ── */}
                    {activeTab === 'history' && (
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                            <CardContent className="p-6">
                                <div className="mb-6 flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                        Cumulative Student Violation & Sanction History
                                    </h4>
                                    <Badge
                                        variant={isMajor ? 'destructive' : 'secondary'}
                                        className="rounded px-2 py-0.5 text-[10px] font-black tracking-wide uppercase"
                                    >
                                        {studentDisciplinaryStats?.total_actions ?? 0} Recorded Actions
                                    </Badge>
                                </div>

                                {processedDisciplinaryHistory.length > 0 ? (
                                    <div className="relative space-y-6 border-l-2 border-slate-100 pl-6 dark:border-slate-800 ml-2">
                                        {processedDisciplinaryHistory.map((historyItem) => (
                                            <div key={historyItem.id} className="relative">
                                                <span
                                                    className={`absolute top-0.5 -left-[31px] flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0B192C] ${
                                                        historyItem.is_current
                                                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <AlertTriangle className="h-2.5 w-2.5" />
                                                </span>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`text-xs font-black ${
                                                            historyItem.is_current
                                                                ? 'text-rose-700 dark:text-rose-400'
                                                                : 'text-slate-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {historyItem.is_current
                                                            ? `Current: ${historyItem.displayLabel}`
                                                            : historyItem.displayLabel}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold uppercase ${
                                                            historyItem.is_current
                                                                ? 'text-rose-500 dark:text-rose-400'
                                                                : 'text-slate-400 dark:text-slate-500'
                                                        }`}
                                                    >
                                                        {historyItem.date}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                    {historyItem.description}
                                                </p>
                                                {historyItem.case_ref && !historyItem.is_current && (
                                                    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/40">
                                                        Case Reference: #{historyItem.case_ref}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                                        No prior disciplinary history recorded for this student.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Calling Slip Modal */}
            <CallingSlipModal
                open={callingSlipOpen}
                onOpenChange={setCallingSlipOpen}
                incident={incident}
                studentDetails={{
                    id: studentId,
                    name: studentName,
                    course: courseMock,
                    yearLevel: yearLevelMock,
                    status: incident.status,
                }}
            />

            {/* Investigation Modal */}
            <InvestigationDialog
                open={investigationOpen}
                onOpenChange={setInvestigationOpen}
                incident={incident}
                studentDetails={{
                    id: studentId,
                    name: studentName,
                    course: courseMock,
                    yearLevel: yearLevelMock,
                    status: incident.status,
                }}
            />

            {/* Disciplinary Resolution Modal */}
            <DisciplinaryResolutionModal
                open={decisionOpen}
                onOpenChange={setDecisionOpen}
                incident={incident}
                studentDetails={{
                    id: studentId,
                    name: studentName,
                    course: courseMock,
                    yearLevel: yearLevelMock,
                    status: incident.status,
                }}
            />
        </AdminLayout>
    );
}
