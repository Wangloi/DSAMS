import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    Calendar,
    ClipboardCheck,
    FileText,
    Gavel,
    History,
    Layers,
    MapPin,
    Printer,
    Scale,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { IncidentRow } from './types';
import StudentCallingProcessFlow, { STUDENT_CALLING_PHASES } from './StudentCallingProcessFlow';
import CallingSlipModal from './CallingSlipModal';
import InvestigationDialog from './InvestigationDialog';
import DisciplinaryResolutionModal from './DisciplinaryResolutionModal';

interface DisciplinaryCaseDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: IncidentRow | null;
    onEdit?: (incident: IncidentRow) => void;
}

export default function DisciplinaryCaseDetailDialog({
    open,
    onOpenChange,
    incident,
    onEdit,
}: DisciplinaryCaseDetailDialogProps) {
    if (!incident) return null;

    const [activeTab, setActiveTab] = useState<'flow' | 'details' | 'history'>('flow');
    const [callingSlipOpen, setCallingSlipOpen] = useState(false);
    const [investigationOpen, setInvestigationOpen] = useState(false);
    const [decisionOpen, setDecisionOpen] = useState(false);

    const isMajor = ['Suspension', 'Exclusion', 'Expulsion'].includes(
        incident.classification,
    ) || incident.classification !== 'Warning';

    const severityText = isMajor ? 'Major Offense' : 'Minor / Warning';

    const caseId =
        incident.caseId ||
        `CAS-2026-${incident.id.toString().padStart(3, '0')}`;
    const incidentTitle = incident.type;
    const incidentDescription =
        incident.raw?.description ||
        `Incident reported involving ${incident.student}. Investigation in progress.`;
    const assignedOfficer =
        incident.raw?.receivedBy ||
        incident.raw?.reportedBy ||
        'Office of Student Affairs & Discipline';
    const location = incident.raw?.location || 'Main Campus';
    const dateTime = incident.dateTime;

    // Student Details
    const studentName = incident.student;
    const studentId = incident.studentId;
    const studentInitials = studentName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const courseMock = (incident.raw as any)?.course || (studentId.includes('BSCS') ? 'BSCS' : 'BSIT');
    const yearLevelMock = (incident.raw as any)?.yearLevel || (incident.id % 2 === 0 ? '3rd Year' : '4th Year');
    const warningCount = isMajor ? 3 : 1;

    const studentDetails = {
        id: incident.studentId || incident.student,
        name: incident.student,
        course: courseMock,
        yearLevel: yearLevelMock,
        status: incident.status,
    };

    const currentPhase = incident.calling_phase ?? (
        incident.status === 'Resolved' ? 5 : (
            incident.status === 'Escalated' ? 4 : (
                incident.status === 'Ongoing' ? 3 : 1
            )
        )
    );

    const handleModifyClick = () => {
        onOpenChange(false);
        if (onEdit) {
            onEdit(incident);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-h-[94vh] w-[96vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-[1380px] gap-0 overflow-y-auto rounded-2xl border-0 bg-slate-100 p-0 shadow-2xl dark:bg-[#071324]"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Case Detail - {caseId}
                        </DialogTitle>
                        <DialogDescription>
                            Case #{caseId} for {studentName}
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── Header Banner ── */}
                    <div className="sticky top-0 z-20 overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 sm:px-8 py-5 text-white shadow-lg">
                        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/5" />
                        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 -translate-y-1/4 rounded-full bg-blue-400/10 blur-xl" />

                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                    <Gavel className="h-5.5 w-5.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-200 uppercase">
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
                                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                                        Case Detail
                                    </h2>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setCallingSlipOpen(true)}
                                >
                                    <Printer className="h-4 w-4 text-amber-300" />
                                    <span>Calling Slip</span>
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setInvestigationOpen(true)}
                                >
                                    <ClipboardCheck className="h-4 w-4 text-pink-300" />
                                    <span>Investigation</span>
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 cursor-pointer"
                                    onClick={() => setDecisionOpen(true)}
                                >
                                    <Scale className="h-4 w-4 text-emerald-300" />
                                    <span>Decision</span>
                                </Button>

                                {onEdit && (
                                    <Button
                                        size="sm"
                                        className="h-9 gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-black text-[#0B192C] shadow-md hover:bg-amber-300 transition-all cursor-pointer"
                                        onClick={handleModifyClick}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Modify</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {/* ── Case & Student Overview Card ── */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-[#0B192C]">
                            <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-12 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
                                {/* Student Profile Column (4 cols) */}
                                <div className="p-6 lg:col-span-4 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-blue-950/20 flex flex-col justify-between gap-5">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-blue-300/60 block mb-3">
                                            Student
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] text-base font-black text-amber-400 shadow-md ring-2 ring-white dark:ring-slate-800">
                                                {studentInitials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base font-black text-slate-900 dark:text-white">
                                                    {studentName}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    ID: {studentId}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <Badge variant="outline" className="bg-white/90 px-2 py-0 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-900/60">
                                                        {courseMock} • {yearLevelMock}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Record:</span>
                                        <Badge
                                            className={`text-[10px] font-black uppercase tracking-wider ${
                                                isMajor
                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                            }`}
                                        >
                                            {severityText} ({warningCount} Warning{warningCount > 1 ? 's' : ''})
                                        </Badge>
                                    </div>
                                </div>

                                {/* Incident Facts Column (8 cols) */}
                                <div className="p-6 lg:col-span-8 flex flex-col justify-between gap-5 bg-white dark:bg-[#0B192C]">
                                    <div className="space-y-2">
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

                                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                            {incidentTitle}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                                            {incidentDescription}
                                        </p>
                                    </div>

                                    {/* Footer Info Row */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span>Officer: <strong className="font-bold text-slate-900 dark:text-slate-200">{assignedOfficer}</strong></span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                            <span>Stage:</span>
                                            <Badge className="bg-[#0b1c5c] text-amber-400 text-[10px] font-black px-2.5 py-0.5 shadow-xs">
                                                Step {currentPhase} of 5
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
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
                                <span>Due Process Flow</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={`flex items-center gap-2 pb-3 px-3.5 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                    activeTab === 'details'
                                        ? 'border-blue-600 text-blue-900 dark:border-amber-400 dark:text-amber-300'
                                        : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <FileText className="h-4 w-4" />
                                <span>Case Facts</span>
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
                                <span>History ({warningCount})</span>
                            </button>
                        </div>

                        {/* ── TAB 1: DUE PROCESS FLOW ── */}
                        {activeTab === 'flow' && (
                            <div className="space-y-4">
                                <StudentCallingProcessFlow
                                    currentPhase={currentPhase}
                                    incidentId={incident.id}
                                    editable={true}
                                    onCallStudent={() => setCallingSlipOpen(true)}
                                    onOpenInvestigation={() => setInvestigationOpen(true)}
                                    onOpenDecision={() => setDecisionOpen(true)}
                                />
                            </div>
                        )}

                        {/* ── TAB 2: CASE FACTS ── */}
                        {activeTab === 'details' && (
                            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B192C] space-y-4">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                        Incident Statement
                                    </h4>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs font-medium leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
                                        {incidentDescription}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Date & Time
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 block">
                                            {dateTime}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Location
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 block">
                                            {location}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Assigned Officer
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 block">
                                            {assignedOfficer}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* ── TAB 3: HISTORY ── */}
                        {activeTab === 'history' && (
                            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        Violation Timeline
                                    </h4>
                                    <Badge className="bg-amber-100 text-amber-900 font-black text-[10px] dark:bg-amber-950/60 dark:text-amber-300">
                                        {warningCount} Record{warningCount > 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div className="relative space-y-5 border-l-2 border-slate-200 pl-6 dark:border-slate-800 ml-2">
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-4 ring-white dark:bg-rose-950 dark:text-rose-400 dark:ring-[#0B192C]">
                                            <AlertTriangle className="h-2.5 w-2.5" />
                                        </span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                                                Active Case #{caseId} ({incident.status})
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {dateTime.split(' ')[0]}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {incident.type} — {incident.classification}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Calling Slip Modal */}
            <CallingSlipModal
                open={callingSlipOpen}
                onOpenChange={setCallingSlipOpen}
                incident={incident}
                studentDetails={studentDetails}
            />

            {/* Investigation Modal */}
            <InvestigationDialog
                open={investigationOpen}
                onOpenChange={setInvestigationOpen}
                incident={incident}
                studentDetails={studentDetails}
            />

            {/* Disciplinary Resolution Modal */}
            <DisciplinaryResolutionModal
                open={decisionOpen}
                onOpenChange={setDecisionOpen}
                incident={incident}
                studentDetails={studentDetails}
            />
        </>
    );
}
