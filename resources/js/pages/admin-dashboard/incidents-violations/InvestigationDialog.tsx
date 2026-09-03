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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    Gavel,
    GraduationCap,
    History,
    Save,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import type { IncidentRow, InvestigationDetails } from './types';

interface InvestigationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: IncidentRow | null;
    studentDetails?: {
        id: string;
        name: string;
        course: string;
        yearLevel: string;
        status: string;
    } | null;
    onSaved?: () => void;
}

export default function InvestigationDialog({
    open,
    onOpenChange,
    incident,
    studentDetails,
    onSaved,
}: InvestigationDialogProps) {
    if (!incident) return null;

    const existingDetails: InvestigationDetails | undefined =
        incident.investigation_details || (incident.raw as any)?.investigationDetails;

    const [identityVerified, setIdentityVerified] = useState<boolean>(
        existingDetails?.identity_verified ?? true,
    );
    const [interviewsCompleted, setInterviewsCompleted] = useState<boolean>(
        existingDetails?.interviews_completed ?? false,
    );
    const [gravityAssessed, setGravityAssessed] = useState<boolean>(
        existingDetails?.gravity_assessed ?? false,
    );

    const [studentHistoryNotes, setStudentHistoryNotes] = useState<string>(
        existingDetails?.student_history_notes ??
            `Student ${incident.student} (${studentDetails?.course || 'Collegiate Dept'}, ${studentDetails?.yearLevel || 'Undergraduate'}) verified against DSAMS master records. Past violation record: No previous major suspensions.`,
    );

    const [interviewNotes, setInterviewNotes] = useState<string>(
        existingDetails?.interview_notes ??
            `Conducted initial fact-finding interview regarding reported violation (${incident.type}) at ${incident.raw?.location || 'Campus'}. Statements taken from reporting staff and student.`,
    );

    const [investigationSummary, setInvestigationSummary] = useState<string>(
        existingDetails?.investigation_summary ??
            `Factual investigation confirms the reported incident occurred on ${incident.raw?.date || incident.dateTime.split(' ')[0]}. Initial evidence assessed. Commensurate policy evaluation requires convening Step 3 (Meeting / Hearing).`,
    );

    const [investigatorName, setInvestigatorName] = useState<string>(
        existingDetails?.investigator_name ??
            (incident.raw?.receivedBy ||
                'Office of Student Affairs & Discipline Investigator'),
    );

    const [recommendedAction, setRecommendedAction] = useState<string>(
        existingDetails?.recommended_action ??
            'Issue official Calling Slip / Summon Notice and convene Step 3 (Meeting / Hearing).',
    );

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Sync on incident change
    useEffect(() => {
        if (existingDetails) {
            setIdentityVerified(existingDetails.identity_verified ?? true);
            setInterviewsCompleted(existingDetails.interviews_completed ?? false);
            setGravityAssessed(existingDetails.gravity_assessed ?? false);
            setStudentHistoryNotes(existingDetails.student_history_notes ?? '');
            setInterviewNotes(existingDetails.interview_notes ?? '');
            setInvestigationSummary(existingDetails.investigation_summary ?? '');
            setInvestigatorName(existingDetails.investigator_name ?? '');
            setRecommendedAction(existingDetails.recommended_action ?? '');
        }
    }, [incident.id]);

    const handleSave = (advanceToHearing: boolean = false) => {
        setIsSubmitting(true);
        router.post(
            `/admin/incidents-violations/${incident.id}/investigation`,
            {
                identity_verified: identityVerified,
                interviews_completed: interviewsCompleted,
                gravity_assessed: gravityAssessed,
                student_history_notes: studentHistoryNotes,
                interview_notes: interviewNotes,
                investigation_summary: investigationSummary,
                investigator_name: investigatorName,
                recommended_action: recommendedAction,
                advance_to_hearing: advanceToHearing,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onOpenChange(false);
                    onSaved?.();
                    Swal.fire({
                        icon: 'success',
                        title: advanceToHearing ? 'Advanced to Meeting / Hearing' : 'Investigation Logged',
                        text: advanceToHearing
                            ? 'Investigation record finalized and case advanced to Step 3 (Meeting / Hearing).'
                            : 'Investigation details and checklist actions saved successfully.',
                        confirmButtonColor: '#0B192C',
                    });
                },
                onError: () => {
                    setIsSubmitting(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Save Failed',
                        text: 'Unable to save investigation details. Please check all fields.',
                    });
                },
            },
        );
    };

    const completedCount =
        (identityVerified ? 1 : 0) +
        (interviewsCompleted ? 1 : 0) +
        (gravityAssessed ? 1 : 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName="z-[90]"
                className="z-[95] max-h-[92vh] w-[95vw] sm:max-w-4xl md:max-w-5xl gap-0 overflow-y-auto border-slate-200 bg-slate-50 p-0 shadow-2xl dark:border-slate-800 dark:bg-[#0B192C]"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Step 2: Investigation & Fact-Finding</DialogTitle>
                    <DialogDescription>
                        Formal fact-finding, witness statements, and Student Handbook gravity assessment for Case #{incident.caseId}
                    </DialogDescription>
                </DialogHeader>

                {/* Top Header Banner matching the SRCB Step 2 Pink Theme */}
                <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-pink-200 bg-gradient-to-r from-pink-900 via-[#831843] to-[#4c0519] px-6 py-4 text-white shadow-sm dark:border-pink-950">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300 shadow-inner ring-1 ring-pink-400/30">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EC4899] text-xs font-black text-white shadow-xs">
                                    2
                                </span>
                                <h3 className="text-base font-extrabold tracking-tight text-white uppercase">
                                    Step 2: Investigation & Fact-Finding
                                </h3>
                                <Badge className="bg-pink-400 text-[#4c0519] font-black text-[10px] px-2 py-0.5">
                                    {completedCount}/3 Actions Verified
                                </Badge>
                            </div>
                            <p className="text-xs text-pink-200">
                                Case #{incident.caseId} • Student: {incident.student} ({studentDetails?.course || 'Collegiate'})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-pink-300/40 bg-pink-950/40 text-pink-200 text-xs font-bold">
                            Investigation Protocol
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Action 1: Student Identity & History Verification */}
                    <Card className={`border-2 transition-all shadow-sm ${identityVerified ? 'border-pink-400 bg-pink-50/30 dark:border-pink-800 dark:bg-pink-950/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'}`}>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                                        <GraduationCap className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            1. Student Identity & History Verification
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Verify student identity, academic department, and past cumulative violation history
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIdentityVerified(!identityVerified)}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                                        identityVerified
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>{identityVerified ? '✓ Verified in DSAMS' : 'Mark as Verified'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Student Name & ID</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{incident.student}</span>
                                    <span className="block font-mono text-[11px] text-slate-500">ID: {incident.studentId || '—'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Enrolled Department</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{studentDetails?.course || 'Collegiate Dept'}</span>
                                    <span className="block text-[11px] text-slate-500">{studentDetails?.yearLevel || 'Level Confirmed'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Cumulative Offenses</span>
                                    <Badge className="bg-amber-100 text-amber-900 text-[10px] font-black dark:bg-amber-950 dark:text-amber-200">
                                        {incident.classification} Offense Record
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Identity & Offense History Verification Notes:
                                </label>
                                <Input
                                    value={studentHistoryNotes}
                                    onChange={(e) => setStudentHistoryNotes(e.target.value)}
                                    placeholder="Enter verification notes from DSAMS directory / past violations log..."
                                    className="text-xs"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action 2: Fact-Finding Interviews */}
                    <Card className={`border-2 transition-all shadow-sm ${interviewsCompleted ? 'border-pink-400 bg-pink-50/30 dark:border-pink-800 dark:bg-pink-950/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'}`}>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            2. Fact-Finding & Witness Interviews
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Interview reporting party, witnesses, and involved students for fact-finding
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setInterviewsCompleted(!interviewsCompleted)}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                                        interviewsCompleted
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>{interviewsCompleted ? '✓ Interviews Completed' : 'Mark as Completed'}</span>
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Fact-Finding Interview Records & Witness Statements:
                                </label>
                                <Textarea
                                    rows={3}
                                    value={interviewNotes}
                                    onChange={(e) => setInterviewNotes(e.target.value)}
                                    placeholder="Summarize statements from reporting teacher/staff, security witnesses, and the student's initial response..."
                                    className="text-xs leading-relaxed"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action 3: Student Handbook Gravity Assessment & Summary */}
                    <Card className={`border-2 transition-all shadow-sm ${gravityAssessed ? 'border-pink-400 bg-pink-50/30 dark:border-pink-800 dark:bg-pink-950/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60'}`}>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            3. Handbook Gravity Assessment & Summary
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Assess gravity against Student Handbook and prepare formal investigation summary
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setGravityAssessed(!gravityAssessed)}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                                        gravityAssessed
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>{gravityAssessed ? '✓ Gravity Assessed' : 'Mark as Assessed'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Assigned Investigator:
                                    </label>
                                    <Input
                                        value={investigatorName}
                                        onChange={(e) => setInvestigatorName(e.target.value)}
                                        placeholder="Name of Investigating Officer / SAO Staff..."
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Recommended Action:
                                    </label>
                                    <Input
                                        value={recommendedAction}
                                        onChange={(e) => setRecommendedAction(e.target.value)}
                                        placeholder="e.g. Convene Step 3 Meeting / Hearing..."
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Formal Investigation Summary & Finding of Facts:
                                </label>
                                <Textarea
                                    rows={4}
                                    value={investigationSummary}
                                    onChange={(e) => setInvestigationSummary(e.target.value)}
                                    placeholder="Provide the official findings of the investigation to be presented at Step 3 (Meeting / Hearing)..."
                                    className="text-xs leading-relaxed"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Controls */}
                <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-bold"
                    >
                        Close
                    </Button>

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => handleSave(false)}
                            className="text-xs font-black gap-1.5 border-slate-300 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                        >
                            <Save className="h-3.5 w-3.5" />
                            <span>Save Investigation Log</span>
                        </Button>

                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleSave(true)}
                            className="text-xs font-black gap-1.5 bg-[#EC4899] hover:bg-[#db2777] text-white shadow-sm"
                        >
                            <span>Save & Advance to Step 3 (Hearing)</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
