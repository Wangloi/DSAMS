import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileSignature,
    FileText,
    MessageSquare,
    Scale,
    Send,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export interface CallingPhaseItem {
    phase: number;
    title: string;
    description: string;
    shortLabel: string;
    badgeColor: string;
    icon: any;
}

export const STUDENT_CALLING_PHASES: CallingPhaseItem[] = [
    {
        phase: 1,
        title: '1. Violation is Reported',
        description: "A teacher or staff member reports the student's violation.",
        shortLabel: 'Violation Reported',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
        icon: FileText,
    },
    {
        phase: 2,
        title: '2. Student is Identified',
        description: "The responsible personnel verifies the student's information and the reported violation.",
        shortLabel: 'Student Identified',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
        icon: UserCheck,
    },
    {
        phase: 3,
        title: '3. Call/Notice is Created',
        description: 'An official notice is prepared informing the student to report to the designated office.',
        shortLabel: 'Call/Notice Created',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
        icon: FileSignature,
    },
    {
        phase: 4,
        title: '4. Student is Notified',
        description: 'The student receives the notice through the appropriate school channel.',
        shortLabel: 'Student Notified',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
        icon: Send,
    },
    {
        phase: 5,
        title: '5. Student Reports to the Office',
        description: 'The student appears at the designated office at the scheduled date and time.',
        shortLabel: 'Student Appears',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
        icon: Building2,
    },
    {
        phase: 6,
        title: '6. Violation is Discussed',
        description: 'The authorized personnel explains the violation and allows the student to provide an explanation.',
        shortLabel: 'Discussion',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
        icon: MessageSquare,
    },
    {
        phase: 7,
        title: '7. Action is Determined',
        description: 'The school decides the appropriate disciplinary or corrective action based on its policies.',
        shortLabel: 'Decision',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50',
        icon: Scale,
    },
    {
        phase: 8,
        title: '8. Record is Updated',
        description: 'The meeting, explanation, and action taken are documented for future reference.',
        shortLabel: 'Record Updated',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
        icon: CheckCircle2,
    },
];

interface Props {
    currentPhase?: number;
    incidentId?: number;
    editable?: boolean;
    compact?: boolean;
    onPhaseChange?: (phase: number) => void;
}

export default function StudentCallingProcessFlow({
    currentPhase = 1,
    incidentId,
    editable = false,
    compact = false,
    onPhaseChange,
}: Props) {
    const [selectedPhase, setSelectedPhase] = useState<number>(currentPhase);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    const activeItem = STUDENT_CALLING_PHASES.find((p) => p.phase === currentPhase) || STUDENT_CALLING_PHASES[0];

    const handleSelectPhase = (phaseNumber: number) => {
        if (!editable) return;
        
        Swal.fire({
            title: `Advance to Phase ${phaseNumber}?`,
            text: `Update process step to "${STUDENT_CALLING_PHASES[phaseNumber - 1].shortLabel}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0B192C',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, update phase',
        }).then((result) => {
            if (result.isConfirmed && incidentId) {
                setIsUpdating(true);
                router.post(
                    `/admin/incidents-violations/${incidentId}/phase`,
                    { calling_phase: phaseNumber },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setIsUpdating(false);
                            setSelectedPhase(phaseNumber);
                            if (onPhaseChange) onPhaseChange(phaseNumber);
                            Swal.fire({
                                icon: 'success',
                                title: 'Process Phase Updated',
                                text: `Case is now at Phase ${phaseNumber}: ${STUDENT_CALLING_PHASES[phaseNumber - 1].shortLabel}`,
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: () => setIsUpdating(false),
                    }
                );
            }
        });
    };

    if (compact) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B192C] dark:text-blue-400">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <span>Student Calling Process</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${activeItem.badgeColor}`}>
                        Phase {currentPhase} of 8: {activeItem.shortLabel}
                    </Badge>
                </div>
                {/* Horizontal Simple Flow Breadcrumb */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {STUDENT_CALLING_PHASES.map((p, idx) => {
                        const isPast = p.phase < currentPhase;
                        const isCurrent = p.phase === currentPhase;
                        return (
                            <div key={p.phase} className="flex items-center shrink-0">
                                <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                                        isCurrent
                                            ? 'bg-[#0B192C] text-white shadow-sm ring-1 ring-amber-400 dark:bg-blue-900 dark:text-white'
                                            : isPast
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                    }`}
                                >
                                    {p.shortLabel}
                                </span>
                                {idx < STUDENT_CALLING_PHASES.length - 1 && (
                                    <ChevronRight className="mx-0.5 h-3 w-3 text-slate-400 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-[#0B192C]/70">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1e3a8a] px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shadow-inner backdrop-blur-md ring-1 ring-white/20">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                            Student Calling Process
                        </h3>
                        <p className="text-xs text-slate-300">
                            8-Phase Standard Incident Resolution & Disciplinary Workflow
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">Current Progress:</span>
                    <Badge className="bg-amber-400 text-[#0B192C] font-black text-xs px-3 py-1 shadow-sm">
                        Phase {currentPhase} / 8: {activeItem.shortLabel}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                {/* Simple Flow Summary Strip */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Simple Execution Flow
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                        {STUDENT_CALLING_PHASES.map((p, idx) => {
                            const isCurrent = p.phase === currentPhase;
                            const isDone = p.phase < currentPhase;
                            return (
                                <div key={p.phase} className="flex items-center shrink-0">
                                    <span
                                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                                            isCurrent
                                                ? 'bg-[#0B192C] text-white shadow-md ring-2 ring-amber-400 font-extrabold dark:bg-blue-900'
                                                : isDone
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 font-semibold'
                                                : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium'
                                        }`}
                                    >
                                        <span className="text-[10px] opacity-80">{p.phase}.</span>
                                        <span>{p.shortLabel}</span>
                                    </span>
                                    {idx < STUDENT_CALLING_PHASES.length - 1 && (
                                        <ArrowRight className="mx-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Grid of 8 Detailed Phases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {STUDENT_CALLING_PHASES.map((p) => {
                        const Icon = p.icon;
                        const isCurrent = p.phase === currentPhase;
                        const isCompleted = p.phase < currentPhase;

                        return (
                            <div
                                key={p.phase}
                                onClick={() => editable && handleSelectPhase(p.phase)}
                                className={`relative flex flex-col justify-between rounded-xl p-3.5 transition-all ${
                                    editable ? 'cursor-pointer hover:shadow-md' : ''
                                } ${
                                    isCurrent
                                        ? 'bg-[#0B192C] text-white shadow-lg border-2 border-amber-400 ring-2 ring-amber-400/20 dark:bg-[#1E3E62]'
                                        : isCompleted
                                        ? 'bg-emerald-50/70 border border-emerald-200 text-slate-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-slate-200'
                                        : 'bg-white border border-slate-200/90 text-slate-700 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                                isCurrent
                                                    ? 'bg-amber-400 text-[#0B192C]'
                                                    : isCompleted
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>

                                        <span
                                            className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                                                isCurrent
                                                    ? 'bg-white/20 text-white font-extrabold'
                                                    : isCompleted
                                                    ? 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            {isCurrent ? 'Active Phase' : isCompleted ? 'Completed' : `Step ${p.phase}`}
                                        </span>
                                    </div>

                                    <div>
                                        <h4
                                            className={`text-xs font-bold leading-tight ${
                                                isCurrent ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                                            }`}
                                        >
                                            {p.title}
                                        </h4>
                                        <p
                                            className={`mt-1 text-[11px] leading-relaxed ${
                                                isCurrent
                                                    ? 'text-slate-200'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            {p.description}
                                        </p>
                                    </div>
                                </div>

                                {editable && (
                                    <div className="mt-3 pt-2 border-t border-slate-100/20 flex justify-end">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isCurrent ? 'secondary' : 'ghost'}
                                            className={`h-6 text-[10px] font-bold px-2 ${
                                                isCurrent
                                                    ? 'bg-amber-400 text-[#0B192C] hover:bg-amber-300'
                                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                                            }`}
                                            disabled={isUpdating}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectPhase(p.phase);
                                            }}
                                        >
                                            {isCurrent ? 'Current' : 'Set Active'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
