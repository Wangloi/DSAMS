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
    PhoneCall,
    Printer,
    Scale,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
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
 * Official 5-Step Student Calling Process
 * St. Rita's College of Balingasag, Inc. - Office of Student Affairs & Discipline
 * "IF A CONCERN ARISES: THE PROCESS"
 */
export const STUDENT_CALLING_PHASES: CallingPhaseItem[] = [
    {
        phase: 1,
        title: '1. Report / Incident',
        description: 'A concern arises; the violation or rule infraction is officially reported, documented, and logged into the system.',
        shortLabel: 'Report / Incident',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        circleColor: 'bg-[#F59E0B] text-slate-950 shadow-amber-300/50',
        circleBorder: 'border-[#F59E0B]',
        circleBg: 'bg-amber-50 dark:bg-amber-950/30',
        circleText: 'text-amber-700 dark:text-amber-300',
        arrowColor: 'text-[#F59E0B]',
        icon: FileText,
        responsibleParty: 'Reporting Personnel / Faculty / Security / SAO',
        expectedTimeframe: 'Immediate (Day of Incident)',
        actionChecklist: [
            'Log incident location, timestamp, and surrounding circumstances',
            'Record initial witness accounts and attach physical/digital evidence',
            'Identify involved student(s) and assign preliminary classification',
        ],
    },
    {
        phase: 2,
        title: '2. Investigation',
        description: 'The Office of Student Affairs & Discipline conducts factual validation, reviews offense records, and gathers statements.',
        shortLabel: 'Investigation',
        badgeColor: 'bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800',
        circleColor: 'bg-[#EC4899] text-white shadow-pink-300/50',
        circleBorder: 'border-[#EC4899]',
        circleBg: 'bg-pink-50 dark:bg-pink-950/30',
        circleText: 'text-pink-700 dark:text-pink-300',
        arrowColor: 'text-[#EC4899]',
        icon: UserCheck,
        responsibleParty: 'Discipline Officer / SAO Investigator',
        expectedTimeframe: 'Within 24-48 Hours',
        actionChecklist: [
            'Verify student identity, academic department, and past cumulative violation history',
            'Interview reporting party, witnesses, and involved students for fact-finding',
            'Assess gravity against Student Handbook and prepare investigation summary',
        ],
    },
    {
        phase: 3,
        title: '3. Meeting / Hearing',
        description: 'Official summon notice/calling slip is issued; a formal conference or disciplinary hearing is convened with due process.',
        shortLabel: 'Meeting / Hearing',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        circleColor: 'bg-[#8B5CF6] text-white shadow-purple-300/50',
        circleBorder: 'border-[#8B5CF6]',
        circleBg: 'bg-purple-50 dark:bg-purple-950/30',
        circleText: 'text-purple-700 dark:text-purple-300',
        arrowColor: 'text-[#8B5CF6]',
        icon: Users,
        responsibleParty: 'Hearing Officer / Discipline Committee / Student & Parents',
        expectedTimeframe: 'Scheduled Hearing Date (3-5 Days)',
        actionChecklist: [
            'Issue official Calling Slip / Summon Notice to student and parents/guardians',
            'Convene formal hearing conference affording student the full right to be heard',
            'Document official proceedings, student explanation, and conference minutes',
        ],
    },
    {
        phase: 4,
        title: '4. Outcome / Sanction',
        description: 'The committee deliberates and metes out the commensurate disciplinary action per the Manual of Regulations for Private Schools.',
        shortLabel: 'Outcome / Sanction',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        circleColor: 'bg-[#10B981] text-white shadow-emerald-300/50',
        circleBorder: 'border-[#10B981]',
        circleBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        circleText: 'text-emerald-700 dark:text-emerald-300',
        arrowColor: 'text-[#10B981]',
        icon: Scale,
        responsibleParty: 'Disciplinary Board / Prefect of Discipline / Dean',
        expectedTimeframe: '1-2 Days Post-Hearing',
        actionChecklist: [
            'Determine commensurate sanction (Section 1 Warning, Section 2 Suspension, Section 3 Exclusion, Section 4 Expulsion)',
            'Formulate formal Disciplinary Resolution / Notice of Decision with rationale',
            'Serve copy of decision to student, parents, and administrative records',
        ],
    },
    {
        phase: 5,
        title: '5. Appeal (If Applicable)',
        description: 'Student or parents may file a petition for reconsideration/appeal within the prescribed period, followed by case closure.',
        shortLabel: 'Appeal (If Applicable)',
        badgeColor: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        circleColor: 'bg-[#F97316] text-white shadow-orange-300/50',
        circleBorder: 'border-[#F97316]',
        circleBg: 'bg-orange-50 dark:bg-orange-950/30',
        circleText: 'text-orange-700 dark:text-orange-300',
        arrowColor: 'text-[#F97316]',
        icon: CheckCircle2,
        responsibleParty: 'Appeals Committee / College President / SAO Director',
        expectedTimeframe: 'Within 5-10 Days / Final Case Closure',
        actionChecklist: [
            'Receive and evaluate formal appeal / petition for reconsideration (if filed)',
            'Evaluate any new evidence, procedural questions, or mitigating circumstances',
            'Execute final resolution, promissory note (if applicable), and archive case as Resolved',
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
    const [selectedPhase, setSelectedPhase] = useState<number>(currentPhase);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'stepper' | 'breadcrumb'>('stepper');

    // Currently inspected step for guidance card
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
        if (!editable || !incidentId || isUpdating || phaseNumber === currentPhase) return;

        Swal.fire({
            title: 'Update Calling Process Step?',
            text: `Update process step to "${STUDENT_CALLING_PHASES[phaseNumber - 1]?.shortLabel}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0B192C',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, update step',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsUpdating(true);
                router.post(
                    `/admin/incidents-violations/${incidentId}/phase`,
                    { calling_phase: phaseNumber },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setSelectedPhase(phaseNumber);
                            setInspectedStep(phaseNumber);
                            setIsUpdating(false);
                            onPhaseChange?.(phaseNumber);
                            Swal.fire({
                                icon: 'success',
                                title: 'Step Updated',
                                text: `Case is now at Step ${phaseNumber}: ${STUDENT_CALLING_PHASES[phaseNumber - 1]?.shortLabel}`,
                                timer: 2000,
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

    const handleFinalStepAction = () => {
        if (!editable || !incidentId) return;

        if (onOpenDecision) {
            onOpenDecision();
            return;
        }

        handleSelectPhase(5);
    };

    if (compact) {
        const isFiltering = selectedPhaseFilter !== undefined && selectedPhaseFilter !== 'all';
        const filteredPhaseItem = isFiltering
            ? STUDENT_CALLING_PHASES.find((p) => p.phase === selectedPhaseFilter)
            : null;

        const currentInspectedCount = phaseCounts ? (phaseCounts[activeInspectedPhase] ?? 0) : 0;
        const progressPct = Math.round((activeInspectedPhase / 5) * 100);

        const handleStepClick = (phaseNumber: number) => {
            setInspectedStep(phaseNumber);
            if (onSelectPhaseFilter) {
                onSelectPhaseFilter(selectedPhaseFilter === phaseNumber ? 'all' : phaseNumber);
            } else if (editable && incidentId) {
                handleSelectPhase(phaseNumber);
            }
        };

        const handlePrevStep = () => {
            const prev = Math.max(1, activeInspectedPhase - 1);
            setInspectedStep(prev);
            if (onSelectPhaseFilter) {
                onSelectPhaseFilter(prev);
            }
        };

        const handleNextStep = () => {
            const next = Math.min(5, activeInspectedPhase + 1);
            setInspectedStep(next);
            if (onSelectPhaseFilter) {
                onSelectPhaseFilter(next);
            }
        };

        return (
            <div className="w-full space-y-3">
                {/* Main Stepper / Pipeline Container */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    {/* Official Institution Header & Slide Banner */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B192C] text-amber-400 shadow-sm ring-1 ring-amber-400/20 dark:bg-blue-950 dark:text-blue-300">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-extrabold tracking-tight text-[#0B192C] dark:text-blue-200 uppercase">
                                        If a Concern Arises: The Process
                                    </h3>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                        5-Step SRCB Protocol
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Office of Student Affairs & Discipline • The Process, the Support, & the Close
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

                            {/* View Switcher: Stepper Pipeline vs Compact Breadcrumb */}
                            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('stepper')}
                                    className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                                        viewMode === 'stepper'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                    title="Visual 5-Step Process Pipeline"
                                >
                                    Step Pipeline
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('breadcrumb')}
                                    className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                                        viewMode === 'breadcrumb'
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                                    title="Compact Breadcrumb View"
                                >
                                    Breadcrumb
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VIEW 1: STEP PIPELINE (Official SRCB Process Diagram Layout) */}
                    {viewMode === 'stepper' && (
                        <div className="relative">
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                                {STUDENT_CALLING_PHASES.map((p, idx) => {
                                    const isInspected = p.phase === activeInspectedPhase;
                                    const isFilterActive = selectedPhaseFilter === p.phase;
                                    const isDone = p.phase < (currentPhase || 1);
                                    const isCurrent = p.phase === currentPhase;
                                    const count = phaseCounts ? (phaseCounts[p.phase] ?? 0) : null;
                                    const Icon = p.icon;

                                    return (
                                        <div key={p.phase} className="relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleStepClick(p.phase)}
                                                className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                                                    isFilterActive
                                                        ? 'border-[#0B192C] bg-[#0B192C] text-white shadow-lg ring-2 ring-amber-400 dark:border-blue-700 dark:bg-blue-900'
                                                        : isInspected
                                                        ? 'border-amber-400 bg-amber-50/50 shadow-md ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-950/20'
                                                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/90 text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200'
                                                }`}
                                            >
                                                {/* Top Row: Colorful Circle Number & Count */}
                                                <div className="flex items-center justify-between gap-1 mb-2">
                                                    {/* Official Numbered Circle matching the presentation slide */}
                                                    <span
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-md border-2 ${
                                                            p.circleColor
                                                        } ${
                                                            isFilterActive ? 'ring-2 ring-white' : ''
                                                        }`}
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

                                                {/* Step Label (Capitalized like the presentation slide) */}
                                                <div>
                                                    <span
                                                        className={`block text-xs font-black tracking-tight leading-tight uppercase ${
                                                            isFilterActive
                                                                ? 'text-white'
                                                                : 'text-slate-900 dark:text-white'
                                                        }`}
                                                    >
                                                        {p.shortLabel}
                                                    </span>
                                                    <span
                                                        className={`block text-[10px] line-clamp-1 mt-0.5 ${
                                                            isFilterActive
                                                                ? 'text-slate-200'
                                                                : 'text-slate-500 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {p.expectedTimeframe}
                                                    </span>
                                                </div>

                                                {/* Bottom Status Indicator */}
                                                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <span
                                                        className={`text-[9px] font-extrabold uppercase ${
                                                            isFilterActive
                                                                ? 'text-amber-300'
                                                                : isInspected
                                                                ? 'text-amber-600 dark:text-amber-400'
                                                                : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {isFilterActive ? '✓ Filtering' : isInspected ? 'Inspecting' : `Step ${p.phase}`}
                                                    </span>
                                                    <Icon className={`h-3 w-3 ${isFilterActive ? 'text-amber-400' : 'text-slate-400'}`} />
                                                </div>
                                            </button>

                                            {/* Connecting Arrow for Desktop (like in the slide) */}
                                            {idx < STUDENT_CALLING_PHASES.length - 1 && (
                                                <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none items-center justify-center">
                                                    <div className="h-4 w-4 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 dark:bg-slate-800 dark:border-slate-700">
                                                        <ArrowRight className="h-2.5 w-2.5" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: COMPACT BREADCRUMB VIEW */}
                    {viewMode === 'breadcrumb' && (
                        <nav aria-label="Calling Progress Breadcrumb" className="overflow-x-auto pb-1">
                            <ol className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
                                {STUDENT_CALLING_PHASES.map((p, idx) => {
                                    const isDone = p.phase < currentPhase;
                                    const isCurrent = p.phase === currentPhase;
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
                                                        : isCurrent
                                                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                                                        : isDone
                                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-500'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${
                                                        p.circleColor
                                                    }`}
                                                >
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

                {/* ACTIVE STEP GUIDANCE CARD */}
                <div className="overflow-hidden rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 dark:border-amber-950/50 dark:bg-[#1E3A5F]/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Step Details & Role */}
                        <div className="space-y-1 max-w-xl">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-sm ${
                                        inspectedPhaseItem.circleColor
                                    }`}
                                >
                                    {inspectedPhaseItem.phase}
                                </span>
                                <h4 className="text-sm font-extrabold text-[#0B192C] dark:text-white uppercase tracking-tight">
                                    Step {inspectedPhaseItem.phase}: {inspectedPhaseItem.shortLabel}
                                </h4>
                                <Badge variant="outline" className={`text-[10px] font-bold ${inspectedPhaseItem.badgeColor}`}>
                                    {inspectedPhaseItem.expectedTimeframe}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {inspectedPhaseItem.description}
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Responsible Role:</span>
                                <span>{inspectedPhaseItem.responsibleParty}</span>
                            </div>
                        </div>

                        {/* Operational Metrics & Controls */}
                        <div className="flex flex-col sm:items-end justify-between gap-2 self-stretch">
                            <div className="flex items-center gap-2">
                                {onOpenInvestigation && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={onOpenInvestigation}
                                        className="h-7 px-2.5 text-xs font-black bg-[#EC4899] hover:bg-[#db2777] text-white shadow-xs gap-1.5 cursor-pointer"
                                        title="Open Step 2 Fact-Finding & Investigation Panel"
                                    >
                                        <ClipboardCheck className="h-3 w-3" />
                                        <span>Log Investigation</span>
                                    </Button>
                                )}
                                {onCallStudent && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={onCallStudent}
                                        className="h-7 px-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs gap-1.5 cursor-pointer"
                                        title="Generate & print official Calling Slip for student"
                                    >
                                        <Printer className="h-3 w-3" />
                                        <span>Call Student (Slip)</span>
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevStep}
                                    disabled={activeInspectedPhase <= 1}
                                    className="h-7 px-2 text-xs font-bold gap-1"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                    Prev Step
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextStep}
                                    disabled={activeInspectedPhase >= 5}
                                    className="h-7 px-2 text-xs font-bold gap-1"
                                >
                                    Next Step
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Caseload Filter Button */}
                            {onSelectPhaseFilter && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => onSelectPhaseFilter(isFiltering ? 'all' : activeInspectedPhase)}
                                    className={`h-7 px-3 text-xs font-black transition-all ${
                                        isFiltering
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                            : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-xs dark:bg-blue-900'
                                    }`}
                                >
                                    {isFiltering
                                        ? '✕ Clear Step Filter'
                                        : `Filter Step ${activeInspectedPhase} Cases (${currentInspectedCount})`}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Step Action Checklist */}
                    {inspectedPhaseItem.actionChecklist && (
                        <div className="mt-3.5 pt-3 border-t border-amber-200/70 dark:border-amber-900/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <ListChecks className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Step Action Checklist ({inspectedPhaseItem.actionChecklist.length} Required Actions):
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    Resolution Progress: Step {inspectedPhaseItem.phase} of 5 ({progressPct}%)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {inspectedPhaseItem.actionChecklist.map((task, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col justify-between gap-1.5 rounded-lg bg-white/90 p-2.5 border border-slate-200/80 text-[11px] text-slate-700 shadow-2xs dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-300"
                                    >
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5 dark:text-emerald-400" />
                                            <span className="leading-tight font-medium">{task}</span>
                                        </div>
                                        {inspectedPhaseItem.phase === 4 && onOpenDecision && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenDecision();
                                                }}
                                                className="self-end inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black cursor-pointer shadow-xs transition-all"
                                                title="Open Step 4 Disciplinary Resolution & Notice of Decision"
                                            >
                                                <Scale className="h-2.5 w-2.5" />
                                                {idx === 0 ? 'Determine Sanction' : idx === 1 ? 'Formulate Resolution' : 'Serve Decision'}
                                            </button>
                                        )}
                                        {inspectedPhaseItem.phase === 3 && idx === 0 && onCallStudent && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCallStudent();
                                                }}
                                                className="self-end inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black cursor-pointer shadow-xs transition-all"
                                            >
                                                <Printer className="h-2.5 w-2.5" />
                                                Open Calling Slip
                                            </button>
                                        )}
                                        {inspectedPhaseItem.phase === 2 && onOpenInvestigation && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenInvestigation();
                                                }}
                                                className="self-end inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-md bg-[#EC4899] hover:bg-[#db2777] text-white text-[10px] font-black cursor-pointer shadow-xs transition-all"
                                            >
                                                <ClipboardCheck className="h-2.5 w-2.5" />
                                                Log Findings
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // FULL VIEW: FOCUSED DISCIPLINARY CASE DETAIL VIEW (Modal & Show Page)
    const [caseViewMode, setCaseViewMode] = useState<'focused' | 'all'>('focused');
    const [inspectedCasePhase, setInspectedCasePhase] = useState<number>(currentPhase);

    const activeCaseItem =
        STUDENT_CALLING_PHASES.find((p) => p.phase === inspectedCasePhase) || activeItem;
    const isInspectedCurrent = activeCaseItem.phase === currentPhase;
    const isInspectedCompleted = activeCaseItem.phase < currentPhase;
    const caseProgressPct = Math.round((activeCaseItem.phase / 5) * 100);

    return (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-[#0B192C]/70">
            {/* Header Banner matching SRCB Presentation Slide */}
            <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#1e3a8a] px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-400 shadow-inner backdrop-blur-md ring-1 ring-white/20">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase">
                                If a Concern Arises: The Process
                            </h3>
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-[#0B192C]">
                                5-Step Process
                            </span>
                        </div>
                        <p className="text-xs text-slate-300">
                            St. Rita's College of Balingasag • Office of Student Affairs & Discipline
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Badge className="bg-amber-400 text-[#0B192C] font-black text-xs px-3 py-1 shadow-sm">
                        Current: Step {currentPhase} of 5 ({activeItem.shortLabel})
                    </Badge>
                    <div className="flex items-center rounded-lg border border-white/20 bg-white/10 p-0.5 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setCaseViewMode('focused')}
                            className={`cursor-pointer rounded-md px-2.5 py-0.5 transition-all ${
                                caseViewMode === 'focused'
                                    ? 'bg-amber-400 text-[#0B192C] font-black shadow-xs'
                                    : 'text-slate-200 hover:text-white'
                            }`}
                        >
                            Specific Step
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaseViewMode('all')}
                            className={`cursor-pointer rounded-md px-2.5 py-0.5 transition-all ${
                                caseViewMode === 'all'
                                    ? 'bg-amber-400 text-[#0B192C] font-black shadow-xs'
                                    : 'text-slate-200 hover:text-white'
                            }`}
                        >
                            All 5 Steps
                        </button>
                    </div>
                </div>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Horizontal Linear Stepper Rail with Official Numbered Circles */}
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span>Student Calling Protocol Progression</span>
                        <span>Click any step to inspect</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                        {STUDENT_CALLING_PHASES.map((p, idx) => {
                            const isCurrent = p.phase === currentPhase;
                            const isDone = p.phase < currentPhase;
                            const isInspected = p.phase === inspectedCasePhase;

                            return (
                                <button
                                    key={p.phase}
                                    type="button"
                                    onClick={() => setInspectedCasePhase(p.phase)}
                                    className={`group flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer text-center ${
                                        isInspected
                                            ? 'bg-white shadow-md ring-2 ring-amber-400 dark:bg-slate-800'
                                            : isCurrent
                                            ? 'bg-amber-100/60 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                            : isDone
                                            ? 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <div className="relative mb-1">
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md border-2 ${
                                                p.circleColor
                                            } ${
                                                isCurrent ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                                            }`}
                                        >
                                            {isDone ? <Check className="h-3.5 w-3.5 text-white stroke-[3]" /> : p.phase}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase leading-tight line-clamp-1">
                                        {p.shortLabel}
                                    </span>
                                    <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                        {isCurrent ? 'Active' : isDone ? 'Done' : 'Upcoming'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MODE 1: SPECIFIC FOCUSED ACTIVE STEP VIEW */}
                {caseViewMode === 'focused' ? (
                    <div className="space-y-4 rounded-xl border border-amber-300/80 bg-amber-50/40 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs">
                        {/* Focused Step Header & Objective */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/70 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-md ${
                                        activeCaseItem.circleColor
                                    }`}
                                >
                                    {activeCaseItem.phase}
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase">
                                            Step {activeCaseItem.phase}: {activeCaseItem.title}
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
                                            {isInspectedCurrent
                                                ? 'Active Case Step'
                                                : isInspectedCompleted
                                                ? 'Completed Step'
                                                : 'Pending Upcoming Step'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                                        {activeCaseItem.description}
                                    </p>
                                </div>
                            </div>

                            {/* Resolution Progress Bar */}
                            <div className="text-right">
                                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                                    Step {activeCaseItem.phase} of 5
                                </span>
                                <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${caseProgressPct}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                                    {caseProgressPct}% Completed
                                </span>
                            </div>
                        </div>

                        {/* Operational Parameters & Requirements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* Operational Parameters */}
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Operational Parameters
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Responsible Role:</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-right">
                                            {activeCaseItem.responsibleParty}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Expected Timeframe:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {activeCaseItem.expectedTimeframe}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Case Protocol Stage:</span>
                                        <span className="font-black text-[#0B192C] dark:text-amber-300">
                                            Step {activeCaseItem.phase} of 5
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Required Action Checklist */}
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    <ListChecks className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Specific Step Checklist
                                </div>
                                <ul className="space-y-1.5">
                                    {(activeCaseItem.actionChecklist || []).map((task, taskIdx) => (
                                        <li key={taskIdx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5 dark:text-emerald-400" />
                                            <span className="text-[11px] leading-tight font-medium flex-1">
                                                {task}
                                                {activeCaseItem.phase === 2 && onOpenInvestigation && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenInvestigation();
                                                        }}
                                                        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-[#EC4899] hover:bg-[#db2777] text-white text-[10px] font-black cursor-pointer shadow-2xs transition-all"
                                                        title="Open Fact-Finding & Investigation Log"
                                                    >
                                                        <ClipboardCheck className="h-2.5 w-2.5" />
                                                        Log Findings
                                                    </button>
                                                )}
                                                {activeCaseItem.phase === 3 && taskIdx === 0 && onCallStudent && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             onCallStudent();
                                                        }}
                                                        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black cursor-pointer shadow-2xs transition-all"
                                                        title="Open official Calling Slip / Notice"
                                                    >
                                                        <Printer className="h-2.5 w-2.5" />
                                                        Open Calling Slip
                                                    </button>
                                                )}
                                                {activeCaseItem.phase === 4 && onOpenDecision && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenDecision();
                                                        }}
                                                        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black cursor-pointer shadow-2xs transition-all"
                                                        title="Formulate Disciplinary Resolution & Notice of Decision"
                                                    >
                                                        <Scale className="h-2.5 w-2.5" />
                                                        {taskIdx === 0 ? 'Determine Sanction' : taskIdx === 1 ? 'Formulate Resolution' : 'Serve Decision'}
                                                    </button>
                                                )}
                                                {activeCaseItem.phase === 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (taskIdx === 2 && onOpenDecision) {
                                                                onOpenDecision();
                                                            } else {
                                                                handleFinalStepAction();
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black cursor-pointer shadow-2xs transition-all"
                                                        title="Review appeal, evaluate mitigation, or view final resolution"
                                                    >
                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                        {taskIdx === 0 ? 'Review Appeals' : taskIdx === 1 ? 'Evaluate Findings' : 'Resolution & Closure'}
                                                    </button>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Direct Step Action Buttons */}
                        {editable && incidentId && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    {activeCaseItem.phase > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isUpdating}
                                            onClick={() => handleSelectPhase(activeCaseItem.phase - 1)}
                                            className="h-8 text-xs font-bold gap-1"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            Revert to Step {activeCaseItem.phase - 1}
                                        </Button>
                                    )}

                                    {onOpenInvestigation && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={onOpenInvestigation}
                                            className="h-8 gap-1.5 rounded-lg bg-[#EC4899] hover:bg-[#db2777] text-white text-xs font-black shadow-xs cursor-pointer"
                                            title="Open Step 2 Fact-Finding & Investigation Summary Panel"
                                        >
                                            <ClipboardCheck className="h-3.5 w-3.5" />
                                            <span>Investigation Log</span>
                                        </Button>
                                    )}

                                    {onCallStudent && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={onCallStudent}
                                            className="h-8 gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer"
                                            title="Open official Calling Slip / Notice to Appear"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                            <span>Call Student (Calling Slip)</span>
                                        </Button>
                                    )}

                                    {onOpenDecision && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={onOpenDecision}
                                            className="h-8 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
                                            title="Open Step 4 Disciplinary Resolution & Notice of Decision"
                                        >
                                            <Scale className="h-3.5 w-3.5" />
                                            <span>Notice of Decision (Resolution)</span>
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {!isInspectedCurrent ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isUpdating}
                                            onClick={() => handleSelectPhase(activeCaseItem.phase)}
                                            className="h-8 text-xs font-black bg-[#0B192C] text-white hover:bg-[#1E3E62] dark:bg-blue-900"
                                        >
                                            Set Case to Step {activeCaseItem.phase}
                                        </Button>
                                    ) : activeCaseItem.phase < 5 ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isUpdating}
                                            onClick={() => handleSelectPhase(activeCaseItem.phase + 1)}
                                            className="h-8 text-xs font-black bg-amber-400 text-[#0B192C] hover:bg-amber-300 shadow-sm gap-1.5"
                                        >
                                            <span>Advance to Step {activeCaseItem.phase + 1}: {STUDENT_CALLING_PHASES[activeCaseItem.phase]?.shortLabel}</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleFinalStepAction}
                                            className="h-8 gap-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                                            title="Click to view Case Resolution / Notice of Decision or manage closure"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>✓ Final Step Complete (Case Resolved)</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODE 2: ALL 5 STEPS GRID (Official Process Diagram View) */
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {STUDENT_CALLING_PHASES.map((p) => {
                            const Icon = p.icon;
                            const isCurrent = p.phase === currentPhase;
                            const isCompleted = p.phase < currentPhase;

                            return (
                                <div
                                    key={p.phase}
                                    onClick={() => {
                                        setInspectedCasePhase(p.phase);
                                        if (editable) handleSelectPhase(p.phase);
                                    }}
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
                                            <span
                                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md border-2 ${
                                                    p.circleColor
                                                }`}
                                            >
                                                {p.phase}
                                            </span>

                                            <span
                                                className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                                                    isCurrent
                                                        ? 'bg-white/20 text-white font-extrabold'
                                                        : isCompleted
                                                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                {isCurrent ? 'Current' : isCompleted ? 'Done' : 'Upcoming'}
                                            </span>
                                        </div>

                                        <div>
                                            <h5
                                                className={`text-xs font-black uppercase leading-snug ${
                                                    isCurrent ? 'text-white' : 'text-slate-900 dark:text-white'
                                                }`}
                                            >
                                                {p.shortLabel}
                                            </h5>
                                            <p
                                                className={`text-[11px] mt-1 line-clamp-3 ${
                                                    isCurrent ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {p.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                                        <span>{p.expectedTimeframe}</span>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
