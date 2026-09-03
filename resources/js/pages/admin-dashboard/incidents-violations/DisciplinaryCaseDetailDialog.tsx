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
    AlertCircle,
    AlertTriangle,
    ClipboardCheck,
    FileText,
    Info,
    MapPin,
    Printer,
    Shield,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { IncidentRow } from './types';
import StudentCallingProcessFlow from './StudentCallingProcessFlow';
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

    const isMajor = incident.classification !== 'Warning';
    const severityText = isMajor ? 'Critical Severity' : 'Moderate Severity';
    const severityColor = isMajor
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';

    // Mock/Simulated details based on incident
    const caseId =
        incident.caseId ||
        `CAS-2026-${incident.id.toString().padStart(3, '0')}`;
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

    // Student Information (using active row and generating consistent mocks)
    const studentName = incident.student;
    const studentId = incident.studentId;
    const studentInitials = studentName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Simulate year level and course based on ID or index
    const courseMock = studentId.includes('BSCS') ? 'BSCS' : 'BSIT';
    const yearLevelMock = incident.id % 2 === 0 ? '3rd Year' : '4th Year';
    const gpaMock =
        incident.id % 2 === 0 ? '3.24 (Good Standing)' : '3.85 (Probation)';
    const warningCount = isMajor ? '3 WARNINGS' : '1 WARNING';

    const [callingSlipOpen, setCallingSlipOpen] = useState(false);
    const [investigationOpen, setInvestigationOpen] = useState(false);
    const [decisionOpen, setDecisionOpen] = useState(false);

    const studentDetails = {
        id: incident.studentId || incident.student,
        name: incident.student,
        course: (incident.raw as any)?.course || courseMock,
        yearLevel: (incident.raw as any)?.yearLevel || yearLevelMock,
        status: incident.status,
    };

    // Trigger edit callback and close detail dialog
    const handleModifyClick = () => {
        onOpenChange(false);
        if (onEdit) {
            onEdit(incident);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[92vh] w-[95vw] max-w-7xl gap-0 overflow-y-auto border-slate-200 bg-slate-50 p-0 shadow-2xl md:w-[85vw] dark:border-slate-800 dark:bg-[#0B192C]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Disciplinary Case Detail - {caseId}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed overview of case #{caseId} for student{' '}
                            {studentName}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Top Header/Breadcrumb Bar */}
                    <div className="sticky top-0 z-10 flex flex-col justify-between gap-4 border-b border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center dark:border-slate-800 dark:bg-[#0F213A]">
                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <span className="cursor-pointer hover:underline">
                                    Registry
                                </span>
                                <span>/</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    Case #{caseId}
                                </span>
                            </div>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Disciplinary Case Detail
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="flex h-9 items-center gap-2 bg-[#EC4899] font-black text-white hover:bg-[#db2777] shadow-sm cursor-pointer"
                                onClick={() => setInvestigationOpen(true)}
                                title="Open Step 2 Fact-Finding & Investigation Summary"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                                <span>Investigation Log</span>
                            </Button>
                            <Button
                                size="sm"
                                className="flex h-9 items-center gap-2 bg-indigo-600 font-black text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
                                onClick={() => setCallingSlipOpen(true)}
                            >
                                <Printer className="h-4 w-4" />
                                <span>Call Student</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex h-9 items-center gap-2 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1E3A5F] dark:text-slate-200 dark:hover:bg-[#1A304F]"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4" />
                                <span>Export PDF</span>
                            </Button>
                            {onEdit && (
                                <Button
                                    size="sm"
                                    className="flex h-9 items-center gap-2 bg-[#1E3E62] font-black text-white hover:bg-[#152D48] dark:bg-blue-600 dark:hover:bg-blue-700"
                                    onClick={handleModifyClick}
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Modify Record</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* ── Unified Case & Student Information Banner ── */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0F213A]">
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isMajor ? 'bg-rose-500' : 'bg-blue-600'}`} />

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                {/* Left Side: Case Overview & Metadata */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            CASE_ID: #{caseId}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${severityColor}`}
                                        >
                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                            {severityText}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300"
                                        >
                                            {incident.classification}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                            {incidentTitle}
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-300 max-w-2xl">
                                            {incidentDescription}
                                        </p>
                                    </div>

                                    {/* Key Metadata Pills */}
                                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investigation Status:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        investigationStatus === 'Resolved'
                                                            ? 'bg-emerald-500'
                                                            : investigationStatus === 'Pending'
                                                              ? 'bg-amber-500'
                                                              : investigationStatus === 'Ongoing'
                                                                ? 'bg-blue-500'
                                                                : 'bg-rose-500'
                                                    }`}
                                                />
                                                <span className="font-bold">{investigationStatus}</span>
                                            </div>
                                        </div>

                                        <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Officer:</span>
                                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="font-bold">{assignedOfficer}</span>
                                        </div>

                                        <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location & Date:</span>
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{location} ({dateTime.split(' ')[0]})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Embedded Student Profile Card */}
                                <div className="shrink-0 w-full lg:w-80 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-xs dark:border-slate-800 dark:bg-[#0B192C]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm font-black text-white shadow-inner">
                                            {studentInitials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                                                {studentName}
                                            </h4>
                                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                ID: {studentId}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-2.5 dark:border-slate-800">
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                Year Level & Course
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                                                {yearLevelMock} ({courseMock})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                Academic Status
                                            </span>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                Good Standing
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Grid: Process Flow & Disciplinary History */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* LEFT COLUMN - CALLING WORKFLOW & ACTIONS (Col-span 2) */}
                            <div className="space-y-6 lg:col-span-2">
                                <StudentCallingProcessFlow
                                    currentPhase={(incident as any).calling_phase ?? (incident.status === 'Resolved' ? 5 : (incident.status === 'Escalated' ? 4 : (incident.status === 'Ongoing' ? 3 : 1)))}
                                    incidentId={incident.id}
                                    editable={true}
                                    onCallStudent={() => setCallingSlipOpen(true)}
                                    onOpenInvestigation={() => setInvestigationOpen(true)}
                                    onOpenDecision={() => setDecisionOpen(true)}
                                />
                            </div>

                            {/* RIGHT COLUMN - DISCIPLINARY HISTORY (Col-span 1) */}
                            <div className="space-y-6">

                                {/* Card 2: Disciplinary History */}
                                <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0F213A]">
                                    <CardContent className="p-6">
                                        <div className="mb-6 flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                                Disciplinary History
                                            </h4>
                                            <Badge
                                                variant={
                                                    isMajor
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                                className="rounded px-1.5 py-0 text-[9px] font-black tracking-wide uppercase"
                                            >
                                                {warningCount}
                                            </Badge>
                                        </div>

                                        <div className="relative space-y-6 border-l-2 border-slate-100 pl-6 dark:border-slate-800">
                                            {/* Current Incident Timeline */}
                                            <div className="relative">
                                                <span
                                                    className={`absolute top-0.5 -left-[31px] flex h-4.5 w-4.5 items-center justify-center rounded-full ${isMajor
                                                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                                            : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                                                        } ring-4 ring-white dark:ring-[#0F213A]`}
                                                >
                                                    <AlertTriangle className="h-2.5 w-2.5" />
                                                </span>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`text-xs font-black ${isMajor ? 'text-rose-750 dark:text-rose-450' : 'text-blue-750 dark:text-blue-450'}`}
                                                    >
                                                        Current Case (
                                                        {incident.status})
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {dateTime
                                                            .split(' ')[0]
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="dark:text-slate-450 mt-1 text-[10px] leading-relaxed font-medium text-slate-500">
                                                    {incident.type} (this report)
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Official Calling Slip / Notice to Appear Modal */}
            <CallingSlipModal
                open={callingSlipOpen}
                onOpenChange={setCallingSlipOpen}
                incident={incident}
                studentDetails={studentDetails}
            />

            {/* Official Step 2 Investigation & Fact-Finding Modal */}
            <InvestigationDialog
                open={investigationOpen}
                onOpenChange={setInvestigationOpen}
                incident={incident}
                studentDetails={studentDetails}
            />

            {/* Official Step 4 Disciplinary Resolution & Decision Modal */}
            <DisciplinaryResolutionModal
                open={decisionOpen}
                onOpenChange={setDecisionOpen}
                incident={incident}
                studentDetails={studentDetails}
            />
        </>
    );
}
