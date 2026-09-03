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
    HeartHandshake,
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

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* LEFT COLUMN - CASE DETAILS (Col-span 2) */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Card 1: Main Case Information */}
                                <Card className="overflow-hidden border-l-4 border-slate-200 border-l-rose-500 bg-white shadow-sm dark:border-slate-800 dark:border-l-rose-600 dark:bg-[#0F213A]">
                                    <CardContent className="p-6">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-xs font-bold tracking-wider text-slate-400">
                                                CASE_ID: #{caseId}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${severityColor}`}
                                            >
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                {severityText}
                                            </span>
                                        </div>

                                        <h3 className="mb-4 text-xl leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white">
                                            {incidentTitle}
                                        </h3>

                                        <p className="dark:text-slate-350 mb-6 text-xs leading-relaxed font-medium text-slate-600">
                                            {incidentDescription}
                                        </p>

                                        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 dark:border-slate-800">
                                            <div>
                                                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Investigation Status
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${investigationStatus ===
                                                                'Resolved'
                                                                ? 'bg-emerald-500'
                                                                : investigationStatus ===
                                                                    'Pending'
                                                                    ? 'bg-amber-500'
                                                                    : investigationStatus ===
                                                                        'Ongoing'
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-rose-500'
                                                            }`}
                                                    />
                                                    <span>
                                                        {investigationStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Assigned Officer
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                                    {assignedOfficer}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Location & Date
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span className="truncate">
                                                        {location} (
                                                        {dateTime.split(' ')[0]})
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 1.5: Student Calling Process Tracker */}
                                <StudentCallingProcessFlow
                                    currentPhase={(incident as any).calling_phase ?? (incident.status === 'Resolved' ? 5 : (incident.status === 'Escalated' ? 4 : (incident.status === 'Ongoing' ? 3 : 1)))}
                                    incidentId={incident.id}
                                    editable={true}
                                    onCallStudent={() => setCallingSlipOpen(true)}
                                    onOpenInvestigation={() => setInvestigationOpen(true)}
                                    onOpenDecision={() => setDecisionOpen(true)}
                                />
                            </div>

                            {/* RIGHT COLUMN - STUDENT PROFILE & HISTORY (Col-span 1) */}
                            <div className="space-y-6">
                                {/* Card 1: Student Profile Card */}
                                <Card className="overflow-hidden border-slate-800 bg-[#0B192C] text-white shadow-md">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-black text-white shadow-inner ring-2 ring-slate-800">
                                                {studentInitials}
                                            </div>
                                            <div>
                                                <h4 className="text-base leading-tight font-extrabold tracking-tight">
                                                    {studentName}
                                                </h4>
                                                <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                    ID: {studentId}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                                            <div>
                                                <span className="mb-0.5 block text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                                                    Year Level
                                                </span>
                                                <span className="text-xs font-bold text-slate-200">
                                                    {yearLevelMock} ({courseMock})
                                                </span>
                                            </div>
                                            <div>
                                                <span className="mb-0.5 block text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                                                    Academic Status
                                                </span>
                                                <span className="text-slate-250 text-xs font-bold">
                                                    Good Standing
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

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

                                {/* Card 3: Counseling Status */}
                                <Card className="border-amber-200/50 bg-[#FAF3E0] text-slate-800 shadow-sm dark:border-amber-900/30 dark:bg-[#2B2315] dark:text-amber-100">
                                    <CardContent className="p-6">
                                        <h4 className="mb-4 text-xs font-black tracking-wider text-amber-900 uppercase dark:text-amber-400">
                                            Counseling Status
                                        </h4>

                                        <div className="mb-2 flex items-center justify-between text-xs font-extrabold">
                                            <span>Program Status</span>
                                            <span>
                                                {incident.status === 'Resolved'
                                                    ? 'Completed'
                                                    : incident.status === 'Pending'
                                                        ? '0% (Needs Intake)'
                                                        : 'Undergoing'}
                                            </span>
                                        </div>
                                        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-[#E6A15C]"
                                                style={{
                                                    width:
                                                        incident.status ===
                                                            'Resolved'
                                                            ? '100%'
                                                            : incident.status ===
                                                                'Pending'
                                                                ? '0%'
                                                                : '50%',
                                                }}
                                            />
                                        </div>

                                        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed font-bold text-amber-800/80 dark:text-amber-400">
                                            <HeartHandshake className="h-4 w-4 shrink-0 text-[#E6A15C]" />
                                            <span>
                                                {incident.status === 'Resolved'
                                                    ? 'Sessions completed successfully.'
                                                    : 'Counseling scheduling required.'}
                                            </span>
                                        </p>
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
