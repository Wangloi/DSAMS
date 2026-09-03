import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock,
    FileText,
    Layers,
    ListChecks,
    Printer,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export interface CallingPhaseItem {
    phase: number;
    title: string;
    description: string;
    shortLabel: string;
    badgeColor: string;
    circleColor: string;
    circleBorder: string;
    circleBg: string;
    circleText: string;
    arrowColor: string;
    icon: any;
    actionChecklist?: string[];
    responsibleParty?: string;
    expectedTimeframe?: string;
}

/**
 * Official 5-Step Due Process Flow
 */
export const STUDENT_CALLING_PHASES: CallingPhaseItem[] = [
    {
        phase: 1,
        title: 'Incident Logging',
        description: 'The infraction is officially logged, documented, and classified.',
        shortLabel: 'Report / Incident',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        circleColor: 'bg-[#F59E0B] text-slate-950 shadow-amber-300/50',
        circleBorder: 'border-[#F59E0B]',
        circleBg: 'bg-amber-50 dark:bg-amber-950/30',
        circleText: 'text-amber-700 dark:text-amber-300',
        arrowColor: 'text-[#F59E0B]',
        icon: FileText,
        responsibleParty: 'Reporting Officer / SAO',
        expectedTimeframe: 'Day of Incident',
        actionChecklist: [
            'Log location, timestamp, and details',
            'Record statements and attach evidence',
            'Identify student and set classification',
        ],
    },
    {
        phase: 2,
        title: 'Fact-Finding & Investigation',
        description: 'Conduct factual validation, review offense records, and gather statements.',
        shortLabel: 'Investigation',
        badgeColor: 'bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800',
        circleColor: 'bg-[#EC4899] text-white shadow-pink-300/50',
        circleBorder: 'border-[#EC4899]',
        circleBg: 'bg-pink-50 dark:bg-pink-950/30',
        circleText: 'text-pink-700 dark:text-pink-300',
        arrowColor: 'text-[#EC4899]',
        icon: UserCheck,
        responsibleParty: 'Discipline Officer / Investigator',
        expectedTimeframe: 'Within 24–48 Hours',
        actionChecklist: [
            'Verify student identity and violation history',
            'Interview reporting party and witnesses',
            'Assess offense gravity against Handbook',
        ],
    },
    {
        phase: 3,
        title: 'Summon Notice & Hearing',
        description: 'Issue official calling slip and convene formal hearing conference.',
        shortLabel: 'Meeting / Hearing',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        circleColor: 'bg-[#8B5CF6] text-white shadow-purple-300/50',
        circleBorder: 'border-[#8B5CF6]',
        circleBg: 'bg-purple-50 dark:bg-purple-950/30',
        circleText: 'text-purple-700 dark:text-purple-300',
        arrowColor: 'text-[#8B5CF6]',
        icon: Users,
        responsibleParty: 'Hearing Officer / Committee',
        expectedTimeframe: 'Scheduled Date (3–5 Days)',
        actionChecklist: [
            'Issue Calling Slip / Summon Notice',
            'Convene hearing conference with student',
            'Record minutes and student explanation',
        ],
    },
    {
        phase: 4,
        title: 'Deliberation & Sanction Decision',
        description: 'Board deliberates and metes out commensurate disciplinary action.',
        shortLabel: 'Outcome / Sanction',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        circleColor: 'bg-[#10B981] text-white shadow-emerald-300/50',
        circleBorder: 'border-[#10B981]',
        circleBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        circleText: 'text-emerald-700 dark:text-emerald-300',
        arrowColor: 'text-[#10B981]',
        icon: Scale,
        responsibleParty: 'Disciplinary Board / Dean',
        expectedTimeframe: '1–2 Days Post-Hearing',
        actionChecklist: [
            'Determine commensurate sanction',
            'Formulate Notice of Decision (Resolution)',
            'Serve copy to student and official record',
        ],
    },
    {
        phase: 5,
        title: 'Appeal Review & Final Closure',
        description: 'Evaluate appeal if filed within the prescribed period, then finalize case.',
        shortLabel: 'Appeal & Close',
        badgeColor: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        circleColor: 'bg-[#F97316] text-white shadow-orange-300/50',
        circleBorder: 'border-[#F97316]',
        circleBg: 'bg-orange-50 dark:bg-orange-950/30',
        circleText: 'text-orange-700 dark:text-orange-300',
        arrowColor: 'text-[#F97316]',
        icon: CheckCircle2,
        responsibleParty: 'Appeals Committee / President',
        expectedTimeframe: '5–10 Days / Final Closure',
        actionChecklist: [
            'Evaluate formal appeal or petition (if any)',
            'Assess mitigating evidence or compliance',
            'Finalize resolution and mark case Resolved',
        ],
    },
];

interface Props {
    currentPhase?: number;
    incidentId?: number;
    editable?: boolean;
    compact?: boolean;
    onPhaseChange?: (phase: number) => void;
    selectedPhaseFilter?: number | 'all';
    onSelectPhaseFilter?: (phase: number | 'all') => void;
    phaseCounts?: Record<number, number>;
    totalCount?: number;
    onCallStudent?: () => void;
    onOpenInvestigation?: () => void;
    onOpenDecision?: () => void;
}

export default function StudentCallingProcessFlow({
    currentPhase = 1,
    incidentId,
    editable = false,
    compact = false,
    onPhaseChange,
    selectedPhaseFilter,
    onSelectPhaseFilter,
    phaseCounts,
    totalCount,
    onCallStudent,
    onOpenInvestigation,
    onOpenDecision,
}: Props) {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'stepper' | 'breadcrumb'>('stepper');

    // Inspected step
    const [inspectedStep, setInspectedStep] = useState<number>(
        selectedPhaseFilter && selectedPhaseFilter !== 'all'
            ? selectedPhaseFilter
            : currentPhase,
    );

    const activeItem =
        STUDENT_CALLING_PHASES.find((p) => p.phase === currentPhase) ||
        STUDENT_CALLING_PHASES[0];

    const activeInspectedPhase =
        selectedPhaseFilter && selectedPhaseFilter !== 'all'
            ? selectedPhaseFilter
            : inspectedStep;

    const inspectedPhaseItem =
        STUDENT_CALLING_PHASES.find((p) => p.phase === activeInspectedPhase) ||
        STUDENT_CALLING_PHASES[0];

    const handleSelectPhase = (phaseNumber: number) => {
        setInspectedStep(phaseNumber);
        if (onPhaseChange) {
            onPhaseChange(phaseNumber);
        }

        if (!editable || !incidentId || phaseNumber === currentPhase) return;

        setIsUpdating(true);
        router.post(
            `/admin/incidents-violations/${incidentId}/phase`,
            { calling_phase: phaseNumber },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                    Swal.fire({
                        icon: 'success',
                        title: `Advanced to Step ${phaseNumber}`,
                        text: `Case moved to Step ${phaseNumber}: ${STUDENT_CALLING_PHASES[phaseNumber - 1]?.shortLabel}`,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    setIsUpdating(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Phase Update Failed',
                        text: Object.values(errors)[0] as string || 'Unable to transition step.',
                    });
                },
            },
        );
    };

    const handleFinalStepAction = () => {
        if (!editable || !incidentId) return;

        Swal.fire({
            title: 'Mark Case as Resolved?',
            text: 'This will finalize proceedings and update case status to Resolved.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Resolve Case',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsUpdating(true);
                router.post(
                    `/admin/incidents-violations/${incidentId}/status`,
                    { status: 'Resolved' },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setIsUpdating(false);
                            Swal.fire({
                                icon: 'success',
                                title: 'Case Resolved',
                                text: 'The case has been marked as Resolved.',
                                timer: 1800,
                                showConfirmButton: false,
                            });
                        },
                        onError: () => {
                            setIsUpdating(false);
                        },
                    },
                );
            }
        });
    };

    // COMPACT VIEW (used on the violation table list page)
    if (compact) {
        const isFiltering = selectedPhaseFilter !== undefined && selectedPhaseFilter !== 'all';

        const handleStepClick = (phaseNumber: number) => {
            setInspectedStep(phaseNumber);
            if (onSelectPhaseFilter) {
                onSelectPhaseFilter(selectedPhaseFilter === phaseNumber ? 'all' : phaseNumber);
            } else if (editable && incidentId) {
                handleSelectPhase(phaseNumber);
            }
        };

        return (
            <div className="w-full space-y-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B192C] text-amber-400 shadow-sm ring-1 ring-amber-400/20 dark:bg-blue-950 dark:text-blue-300">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold tracking-tight text-[#0B192C] dark:text-blue-200 uppercase">
                                    Due Process Pipeline
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    5-Step Case Lifecycle Tracker
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {totalCount !== undefined && (
                                <Badge
                                    variant="outline"
                                    onClick={() => onSelectPhaseFilter?.('all')}
                                    className={`cursor-pointer px-2.5 py-1 text-xs font-bold transition-colors ${
                                        selectedPhaseFilter === 'all' || selectedPhaseFilter === undefined
                                            ? 'border-[#0B192C] bg-[#0B192C] text-white shadow-xs dark:border-blue-500 dark:bg-blue-900 dark:text-white'
                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    Total Cases: {totalCount}
                                </Badge>
                            )}

                            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('stepper')}
                                    className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                                        viewMode === 'stepper'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    Pipeline
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('breadcrumb')}
                                    className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                                        viewMode === 'breadcrumb'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                >
                                    Breadcrumb
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Step Pipeline Grid */}
                    {viewMode === 'stepper' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                            {STUDENT_CALLING_PHASES.map((p) => {
                                const isInspected = p.phase === activeInspectedPhase;
                                const isFilterActive = selectedPhaseFilter === p.phase;
                                const count = phaseCounts ? (phaseCounts[p.phase] ?? 0) : null;

                                return (
                                    <div key={p.phase} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => handleStepClick(p.phase)}
                                            className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                                                isFilterActive
                                                    ? 'border-[#0B192C] bg-[#0B192C] text-white shadow-lg ring-2 ring-amber-400 dark:border-blue-700 dark:bg-blue-900'
                                                    : isInspected
                                                    ? 'border-amber-400 bg-amber-50/50 shadow-md ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-950/20'
                                                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/90 text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <span
                                                    className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-md border-2 ${
                                                        p.circleColor
                                                    } ${isFilterActive ? 'ring-2 ring-white' : ''}`}
                                                >
                                                    {p.phase}
                                                </span>

                                                {count !== null && (
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                            isFilterActive
                                                                ? 'bg-amber-400 text-[#0B192C]'
                                                                : count > 0
                                                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                                                                : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {count} {count === 1 ? 'case' : 'cases'}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <span
                                                    className={`block text-xs font-black tracking-tight leading-tight uppercase ${
                                                        isFilterActive ? 'text-white' : 'text-slate-900 dark:text-white'
                                                    }`}
                                                >
                                                    {p.shortLabel}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <nav aria-label="Calling Progress Breadcrumb" className="overflow-x-auto pb-1">
                            <ol className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
                                {STUDENT_CALLING_PHASES.map((p, idx) => {
                                    const isSelected = p.phase === activeInspectedPhase;
                                    const count = phaseCounts ? (phaseCounts[p.phase] ?? 0) : null;

                                    return (
                                        <li key={p.phase} className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleStepClick(p.phase)}
                                                className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#0B192C] text-white shadow-sm ring-1 ring-amber-400 dark:bg-blue-900'
                                                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${p.circleColor}`}>
                                                    {p.phase}
                                                </span>
                                                <span className="text-xs uppercase font-extrabold">{p.shortLabel}</span>
                                                {count !== null && (
                                                    <span className="ml-0.5 rounded-full bg-black/10 px-1.5 py-0 text-[9px] font-bold">
                                                        {count}
                                                    </span>
                                                )}
                                            </button>

                                            {idx < STUDENT_CALLING_PHASES.length - 1 && (
                                                <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                    )}
                </div>
            </div>
        );
    }

    // FULL VIEW: CLEAN, EXECUTIVE DUE PROCESS STEPPER & ACTION FLOW
    const isInspectedCurrent = inspectedStep === currentPhase;
    const isInspectedCompleted = inspectedStep < currentPhase;

    return (
        <div className="space-y-4">
            {/* ── 5-Step Horizontal Stepper Rail ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-amber-400" />
                        <span>Due Process Pipeline</span>
                    </span>
                    <span>
                        Active: Step {currentPhase} ({activeItem.shortLabel})
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {STUDENT_CALLING_PHASES.map((p) => {
                        const isCurrent = p.phase === currentPhase;
                        const isDone = p.phase < currentPhase;
                        const isSelected = p.phase === inspectedStep;

                        return (
                            <button
                                key={p.phase}
                                type="button"
                                onClick={() => setInspectedStep(p.phase)}
                                className={`relative flex flex-col justify-between rounded-xl p-3 text-left transition-all cursor-pointer border ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600 dark:border-amber-400 dark:bg-amber-950/20'
                                        : isCurrent
                                        ? 'border-blue-400/80 bg-blue-50/30 text-slate-900 dark:border-blue-700 dark:bg-blue-950/20 dark:text-white'
                                        : isDone
                                        ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
                                        : 'border-slate-200/60 bg-white hover:border-slate-300 text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/20 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={`flex h-6.5 w-6.5 items-center justify-center rounded-full text-xs font-black shadow-xs border-2 ${
                                            p.circleColor
                                        } ${isCurrent ? 'ring-2 ring-amber-400' : ''}`}
                                    >
                                        {isDone ? <Check className="h-3.5 w-3.5 text-white stroke-[3]" /> : p.phase}
                                    </span>

                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] font-black uppercase px-1.5 py-0 ${
                                            isCurrent
                                                ? 'bg-amber-400 text-[#0B192C] border-amber-400'
                                                : isDone
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        {isCurrent ? 'Active' : isDone ? 'Done' : 'Pending'}
                                    </Badge>
                                </div>

                                <div>
                                    <span className="block text-xs font-extrabold uppercase leading-tight text-slate-900 dark:text-white">
                                        {p.shortLabel}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Active / Inspected Step Detail Card ── */}
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]">
                <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm ${
                                    inspectedPhaseItem.circleColor
                                }`}
                            >
                                {inspectedPhaseItem.phase}
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                                        Step {inspectedPhaseItem.phase}: {inspectedPhaseItem.title}
                                    </h4>
                                    <Badge
                                        className={`text-[10px] font-black ${
                                            isInspectedCurrent
                                                ? 'bg-amber-400 text-[#0B192C]'
                                                : isInspectedCompleted
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {isInspectedCurrent ? 'Active' : isInspectedCompleted ? 'Completed' : 'Upcoming'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {inspectedPhaseItem.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <span>Timeframe:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{inspectedPhaseItem.expectedTimeframe}</span>
                        </div>
                    </div>

                    {/* Step Action Checklist */}
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                            Due Process Checklist
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {(inspectedPhaseItem.actionChecklist || []).map((task, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 dark:text-emerald-400" />
                                    <span className="leading-snug">{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Controls & Phase Advancement */}
                    {editable && incidentId && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                                {inspectedPhaseItem.phase > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleSelectPhase(inspectedPhaseItem.phase - 1)}
                                        className="h-8.5 gap-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        Revert to Step {inspectedPhaseItem.phase - 1}
                                    </Button>
                                )}

                                {inspectedPhaseItem.phase === 2 && onOpenInvestigation && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={onOpenInvestigation}
                                        className="h-8.5 gap-1.5 rounded-lg bg-[#EC4899] hover:bg-[#db2777] text-white text-xs font-black shadow-xs cursor-pointer"
                                    >
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        <span>Investigation Findings</span>
                                    </Button>
                                )}

                                {inspectedPhaseItem.phase === 3 && onCallStudent && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={onCallStudent}
                                        className="h-8.5 gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        <span>Calling Slip</span>
                                    </Button>
                                )}

                                {(inspectedPhaseItem.phase === 4 || inspectedPhaseItem.phase === 5) && onOpenDecision && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={onOpenDecision}
                                        className="h-8.5 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
                                    >
                                        <Scale className="h-3.5 w-3.5" />
                                        <span>Notice of Decision</span>
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {!isInspectedCurrent ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleSelectPhase(inspectedPhaseItem.phase)}
                                        className="h-8.5 text-xs font-black bg-[#0B192C] text-white hover:bg-[#1E3E62] dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
                                    >
                                        Set as Active Step
                                    </Button>
                                ) : inspectedPhaseItem.phase < 5 ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleSelectPhase(inspectedPhaseItem.phase + 1)}
                                        className="h-8.5 text-xs font-black bg-amber-400 text-[#0B192C] hover:bg-amber-300 shadow-sm gap-1.5 cursor-pointer"
                                    >
                                        <span>Advance to Step {inspectedPhaseItem.phase + 1}</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={handleFinalStepAction}
                                        className="h-8.5 gap-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Resolve Case</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
