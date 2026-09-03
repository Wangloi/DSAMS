import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    BookOpen,
    CheckCircle2,
    Clock,
    FileText,
    Gavel,
    GraduationCap,
    Printer,
    Scale,
    Send,
    Shield,
    ShieldAlert,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import type { IncidentRow, DisciplinaryDecisionData } from './types';
import {
    DISCIPLINARY_POLICIES,
    getApplicablePolicy,
    type DisciplinaryPolicyItem,
} from './disciplinaryPolicies';

interface DisciplinaryResolutionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: IncidentRow;
    studentDetails: {
        id: string;
        name: string;
        course?: string;
        yearLevel?: string;
        db_id?: number | null;
        status?: string;
    } | null;
    priorWarningCount?: number;
    priorSuspensionCount?: number;
}

export default function DisciplinaryResolutionModal({
    open,
    onOpenChange,
    incident,
    studentDetails,
    priorWarningCount = 0,
    priorSuspensionCount = 0,
}: DisciplinaryResolutionModalProps) {
    const caseId = incident.caseId;
    const studentName = studentDetails?.name || incident.student;
    const studentId = studentDetails?.id || incident.studentId || '—';
    const course = studentDetails?.course || 'Collegiate Department';
    const yearLevel = studentDetails?.yearLevel || '—';
    const incidentType = incident.type;
    const incidentDate = incident.raw?.date || incident.dateTime.split(' ')[0] || '—';
    const location = incident.raw?.location || 'Main Campus';

    // Policy recommendation
    const recommendedPolicy = getApplicablePolicy(incident.type, incident.classification);

    // Existing decision if previously served
    const existingDecision: DisciplinaryDecisionData | null =
        incident.action_data || (incident.raw as any)?.actionData || null;

    // Form state
    const [selectedSection, setSelectedSection] = useState<1 | 2 | 3 | 4>(
        existingDecision?.section || recommendedPolicy.section
    );
    const [specificPenalty, setSpecificPenalty] = useState(
        existingDecision?.specific_penalty || ''
    );
    const [findingsSummary, setFindingsSummary] = useState(
        existingDecision?.findings || ''
    );
    const [legalRationale, setLegalRationale] = useState(
        existingDecision?.rationale || ''
    );
    const [termsConditions, setTermsConditions] = useState(
        existingDecision?.terms || ''
    );
    const [effectiveDate, setEffectiveDate] = useState(
        existingDecision?.effective_date || new Date().toISOString().split('T')[0]
    );
    const [signatoryName, setSignatoryName] = useState(
        existingDecision?.signatory_name || 'Dean Marcus Aurelius / Discipline Board'
    );
    const [signatoryTitle, setSignatoryTitle] = useState(
        existingDecision?.signatory_title || 'Dean of Student Affairs & Discipline Officer'
    );
    const [markResolved, setMarkResolved] = useState(false);

    // Mode: 'form' | 'preview'
    const [viewTab, setViewTab] = useState<'form' | 'preview'>('form');

    // Action state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmServeOpen, setConfirmServeOpen] = useState(false);
    const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
    const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

    const activePolicy =
        DISCIPLINARY_POLICIES.find((p) => p.section === selectedSection) || recommendedPolicy;

    // Sync defaults when selectedSection changes
    useEffect(() => {
        if (!existingDecision) {
            if (selectedSection === 1) {
                setSpecificPenalty('Official 1st Written Warning & Mandatory Guidance Counseling');
                setTermsConditions('Student must attend two (2) reflective guidance counseling sessions and execute a written letter of reflection within 5 school days.');
            } else if (selectedSection === 2) {
                setSpecificPenalty('Three (3) School Days Campus Entry & Class Suspension');
                setTermsConditions('Student is denied campus entry for 3 days; requires execution of a formal promissory note to live an exemplary conduct with parents prior to readmission.');
            } else if (selectedSection === 3) {
                setSpecificPenalty('Exclusion / Dropped from School Rolls for One (1) Semester');
                setTermsConditions('Official drop from rolls; honorable dismissal certificate withheld until clearance; may reapply next academic term upon Board approval.');
            } else if (selectedSection === 4) {
                setSpecificPenalty('Expulsion from Institution with CHED/DepEd Notification');
                setTermsConditions('Permanent disqualification from institution; official case record forwarded to CHED Regional Office.');
            }

            setLegalRationale(
                `${activePolicy.title}: ${activePolicy.legalBasis}. ${activePolicy.description}`
            );

            if (!findingsSummary) {
                setFindingsSummary(
                    `During the formal inquiry and hearing held at ${location}, the Committee evaluated incident reports concerning "${incidentType}". Due process was accorded with the student present and given full opportunity to explain.`
                );
            }
        }
    }, [selectedSection, existingDecision]);

    const handlePrint = () => {
        setViewTab('preview');
        setTimeout(() => {
            window.print();
        }, 200);
    };

    const handleServeDecision = () => {
        setIsSubmitting(true);
        setActionErrorMsg(null);

        router.post(
            `/admin/incidents-violations/${incident.id}/serve-decision`,
            {
                student_id: studentId,
                student_db_id: studentDetails?.db_id ?? null,
                sanction_section: selectedSection,
                sanction_type: activePolicy.category,
                specific_penalty: specificPenalty,
                findings_summary: findingsSummary,
                legal_basis_rationale: legalRationale,
                terms_conditions: termsConditions,
                effective_date: effectiveDate,
                signatory_name: signatoryName,
                signatory_title: signatoryTitle,
                advance_to_step_4: true,
                mark_as_resolved: markResolved,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setConfirmServeOpen(false);
                    setActionSuccessMsg(
                        `Formal Notice of Decision (${activePolicy.category}) successfully served to ${studentName}'s DSAMS account!`
                    );
                    setTimeout(() => {
                        setActionSuccessMsg(null);
                    }, 5000);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const msg =
                        (errors && Object.values(errors)[0]) ||
                        'Failed to serve decision. Please review all fields.';
                    setActionErrorMsg(String(msg));
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName="z-[90]"
                className="z-[95] max-w-4xl overflow-y-auto max-h-[92vh] p-0 bg-slate-100 dark:bg-slate-950 border-0 shadow-2xl"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Disciplinary Resolution & Decision - Case #{caseId}</DialogTitle>
                    <DialogDescription>
                        Official Disciplinary Resolution and Notice of Decision for student {studentName}
                    </DialogDescription>
                </DialogHeader>

                {/* Send Decision Confirmation Overlay */}
                {confirmServeOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in-0">
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Serve Decision to Student Account?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Dispatch official Disciplinary Resolution
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                                <p>
                                    The formal <strong>Notice of Decision ({activePolicy.category})</strong> will be officially delivered to{' '}
                                    <strong className="text-slate-900 dark:text-white">{studentName}</strong>'s DSAMS account, logged in their 201 disciplinary record, and the case will advance in the 5-step pipeline.
                                </p>
                                <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px] dark:border-emerald-900/60 dark:bg-emerald-950/40">
                                    <p><strong className="text-slate-900 dark:text-white">Student:</strong> {studentName} ({studentId})</p>
                                    <p><strong className="text-slate-900 dark:text-white">Sanction:</strong> Section {selectedSection} ({activePolicy.category})</p>
                                    <p><strong className="text-slate-900 dark:text-white">Specific Penalty:</strong> {specificPenalty}</p>
                                    <p><strong className="text-slate-900 dark:text-white">Effective Date:</strong> {effectiveDate}</p>
                                </div>
                            </div>

                            {actionErrorMsg && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                    <span>{actionErrorMsg}</span>
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        setConfirmServeOpen(false);
                                        setActionErrorMsg(null);
                                    }}
                                    className="h-8 rounded-lg px-3.5 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={isSubmitting}
                                    onClick={handleServeDecision}
                                    className="h-8 gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-black text-white shadow hover:bg-emerald-700 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            <span>Serving Decision...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5" />
                                            <span>Yes, Serve Decision</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Top Bar (Hidden on print) */}
                <div className="print:hidden sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[#0B192C] text-amber-400 font-black text-xs gap-1.5">
                            <Scale className="h-3.5 w-3.5" />
                            <span>Step 4: Outcome & Sanction</span>
                        </Badge>
                        <span className="text-xs font-semibold text-slate-500">
                            Disciplinary Resolution & Decision
                        </span>
                        {existingDecision && (
                            <Badge className="bg-emerald-600 text-white font-black text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Served: {existingDecision.sanction}</span>
                            </Badge>
                        )}
                        {actionSuccessMsg && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold text-[11px] gap-1 animate-in fade-in-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{actionSuccessMsg}</span>
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tab Toggle: Form vs Preview */}
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewTab('form')}
                                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                                    viewTab === 'form'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                1. Determine & Formulate
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewTab('preview')}
                                className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                                    viewTab === 'preview'
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-bold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                2. Formal Letterhead Preview
                            </button>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setConfirmServeOpen(true)}
                            className="h-8 gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-black text-white shadow hover:bg-emerald-700 cursor-pointer"
                            title="Dispatch official decision directly to student account and 201 records"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{existingDecision ? 'Update / Resend Decision' : 'Serve Decision to Student'}</span>
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 gap-1.5 rounded-lg bg-[#0b2d66] px-3.5 text-xs font-bold text-white shadow hover:bg-blue-900 cursor-pointer"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Print Resolution</span>
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-500"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* TAB 1: FORMULATE & DETERMINE SANCTION */}
                {viewTab === 'form' && (
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Requirement 1: Determine commensurate sanction */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black">
                                        1
                                    </span>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        Determine Commensurate Sanction (SRCB Handbook Sections)
                                    </h3>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Student Offense Record: <strong>{priorWarningCount} warnings</strong>, <strong>{priorSuspensionCount} suspensions</strong>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                {DISCIPLINARY_POLICIES.map((p) => {
                                    const isSelected = selectedSection === p.section;
                                    const isRecommended = recommendedPolicy.section === p.section;

                                    return (
                                        <button
                                            key={p.section}
                                            type="button"
                                            onClick={() => setSelectedSection(p.section)}
                                            className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20 dark:bg-slate-900 dark:border-emerald-500'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <Badge className={`text-[10px] font-black ${p.badgeColor}`}>
                                                    Section {p.section}
                                                </Badge>
                                                {isRecommended && (
                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                                                        Handbook Fit
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                                                {p.category}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                                                {p.shortTitle}
                                            </span>
                                            {p.accumulationRule && (
                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                                                    ⚠️ Threshold applies
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Policy Rules Note */}
                            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Handbook Guideline for Section {selectedSection} ({activePolicy.category}):</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                    {activePolicy.description}
                                </p>
                                {activePolicy.accumulationRule && (
                                    <p className="text-[11px] mt-1 font-semibold text-rose-700 dark:text-rose-300">
                                        📌 <strong>Accumulation Rule:</strong> {activePolicy.accumulationRule}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Requirement 2: Formulate formal Disciplinary Resolution / Notice of Decision with rationale */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black">
                                    2
                                </span>
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    Formulate Disciplinary Resolution & Rationale
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Specific Sanction Meted
                                    </label>
                                    <input
                                        type="text"
                                        value={specificPenalty}
                                        onChange={(e) => setSpecificPenalty(e.target.value)}
                                        placeholder="e.g. 1st Warning, 3 Days Suspension"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Effective Date of Decision
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Summary of Inquiry Findings & Facts Established
                                </label>
                                <textarea
                                    rows={3}
                                    value={findingsSummary}
                                    onChange={(e) => setFindingsSummary(e.target.value)}
                                    placeholder="Enter findings from the Step 3 conference and evidence examined..."
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Legal & Institutional Basis / Rationale
                                </label>
                                <textarea
                                    rows={2}
                                    value={legalRationale}
                                    onChange={(e) => setLegalRationale(e.target.value)}
                                    placeholder="Cite specific handbook sections and regulations..."
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Corrective Directives, Restitution & Counseling Terms
                                </label>
                                <textarea
                                    rows={2}
                                    value={termsConditions}
                                    onChange={(e) => setTermsConditions(e.target.value)}
                                    placeholder="e.g. Guidance counseling sessions, letter of apology, promissory note..."
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Primary Signatory Name
                                    </label>
                                    <input
                                        type="text"
                                        value={signatoryName}
                                        onChange={(e) => setSignatoryName(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Signatory Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={signatoryTitle}
                                        onChange={(e) => setSignatoryTitle(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Option to mark case as Resolved */}
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="mark-resolved-check"
                                    checked={markResolved}
                                    onChange={(e) => setMarkResolved(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label
                                    htmlFor="mark-resolved-check"
                                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                                >
                                    Final Decision: Mark case directly as Step 5 / Resolved (Case Closed)
                                </label>
                            </div>
                        </div>

                        {/* Navigation bottom row */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-xs text-slate-500">
                                Review the formulated document before serving to student and archives.
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setViewTab('preview')}
                                    className="h-8 text-xs font-bold"
                                >
                                    View Letterhead Preview &rarr;
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setConfirmServeOpen(true)}
                                    className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 shadow"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Serve Decision to Student</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: FORMAL LETTERHEAD PREVIEW & PRINT (Requirement 3: Serve copy) */}
                {viewTab === 'preview' && (
                    <div className="p-6 sm:p-10">
                        <div
                            id="decision-resolution-print-area"
                            className="mx-auto max-w-2xl rounded-xl border border-slate-300 bg-white p-8 sm:p-12 text-slate-900 shadow-md print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none dark:bg-white dark:text-slate-900"
                        >
                            {/* Letterhead */}
                            <div className="border-b-2 border-slate-900 pb-4 text-center">
                                <div className="flex items-center justify-center gap-3 mb-1">
                                    <img
                                        src="/images/DSA.png"
                                        alt="SRCB Logo"
                                        className="h-14 w-14 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <div>
                                        <h1 className="text-base font-black tracking-tight uppercase text-slate-900 leading-tight">
                                            St. Rita's College of Balingasag
                                        </h1>
                                        <p className="text-[11px] font-semibold text-slate-600">
                                            Balingasag, Misamis Oriental 9005
                                        </p>
                                        <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                                            Discipline Board • Office of Student Affairs & Services
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Document Title & Reference */}
                            <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-3">
                                <div>
                                    <h2 className="text-base font-black tracking-wide uppercase text-slate-900">
                                        Formal Disciplinary Resolution & Notice of Decision
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Official Step 4 Outcome • Student Discipline Board
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Docket Reference
                                    </span>
                                    <span className="font-mono text-sm font-black text-rose-600">
                                        #{caseId}
                                    </span>
                                </div>
                            </div>

                            {/* Date Issued & Student Profile */}
                            <div className="mt-4 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-500">Effective Date:</span>{' '}
                                    <strong className="text-slate-900 font-bold">{effectiveDate}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500">Sanction Category:</span>{' '}
                                    <strong className="text-emerald-700 font-extrabold uppercase">
                                        Section {selectedSection} • {activePolicy.category}
                                    </strong>
                                </div>
                            </div>

                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                <div className="grid grid-cols-2 gap-y-1.5">
                                    <div>
                                        <span className="text-slate-500">Student Name:</span>{' '}
                                        <strong className="text-slate-900 font-bold uppercase">{studentName}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Student ID:</span>{' '}
                                        <span className="font-mono font-bold text-slate-900">{studentId}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Program / Year:</span>{' '}
                                        <span className="text-slate-800 font-medium">{course} • {yearLevel}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Docketed Incident:</span>{' '}
                                        <span className="text-slate-900 font-bold">{incidentType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Formal Clauses / WHEREAS */}
                            <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-slate-800">
                                <p>
                                    <strong>WHEREAS,</strong> an incident report concerning an alleged violation of school regulations was docketed under Case Reference #{caseId}, specifically involving <em>{incidentType}</em> on {incidentDate};
                                </p>
                                <p>
                                    <strong>WHEREAS,</strong> due preliminary inquiry and formal conference proceedings were convened affording the respondent student the right to notice, to be heard, and to present any explanatory statements;
                                </p>
                                <p>
                                    <strong>WHEREAS,</strong> upon evaluation of all facts and witness reports, the Discipline Committee establishes the following findings:
                                </p>
                                <div className="rounded-lg border-l-4 border-slate-900 bg-slate-50 p-3 italic text-slate-700">
                                    "{findingsSummary || 'Infraction established as verified during committee proceedings.'}"
                                </div>

                                <p>
                                    <strong>NOW, THEREFORE,</strong> pursuant to the provisions of <strong>{activePolicy.title}</strong> of the SRCB Student Handbook and the Manual of Regulations for Private Schools:
                                </p>

                                {/* Resolution Box */}
                                <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50/60 p-4 space-y-1.5">
                                    <div className="text-[11px] font-black uppercase text-emerald-900">
                                        BE IT RESOLVED, as it is hereby resolved, that the commensurate penalty of:
                                    </div>
                                    <div className="text-base font-black text-emerald-800 uppercase tracking-tight">
                                        {specificPenalty}
                                    </div>
                                    <div className="text-[11px] text-slate-700 pt-1">
                                        <strong>Institutional Rationale:</strong> {legalRationale}
                                    </div>
                                    {termsConditions && (
                                        <div className="text-[11px] text-slate-800 pt-1 border-t border-emerald-200">
                                            <strong>Required Terms & Counseling:</strong> {termsConditions}
                                        </div>
                                    )}
                                </div>

                                <p className="text-[11px] font-semibold text-slate-600 bg-slate-100 p-2.5 rounded border border-slate-200">
                                    ⚖️ <strong>NOTICE OF RIGHT TO APPEAL (Step 5):</strong> Per institutional protocol, the respondent student or parents may submit a formal petition for reconsideration/appeal to the Appeals Committee within five (5) school days from receipt of this decision.
                                </p>
                            </div>

                            {/* Signatures */}
                            <div className="mt-10 grid grid-cols-2 gap-8 text-xs pt-4">
                                <div>
                                    <div className="border-b border-slate-800 pb-1 text-center font-bold uppercase text-slate-900">
                                        {signatoryName}
                                    </div>
                                    <div className="text-center text-[10px] text-slate-500">
                                        {signatoryTitle}
                                    </div>
                                </div>
                                <div>
                                    <div className="border-b border-slate-800 pb-1 text-center font-bold uppercase text-slate-900">
                                        College President / OSA Board
                                    </div>
                                    <div className="text-center text-[10px] text-slate-500">
                                        Concurring Authority
                                    </div>
                                </div>
                            </div>

                            {/* Service Copy Section (Requirement 3) */}
                            <div className="mt-8 border-t border-dashed border-slate-300 pt-4 text-xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Proof of Service & Acknowledgment Copy
                                </span>
                                <div className="mt-4 grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="border-b border-slate-400 pb-1 text-center text-slate-900 font-semibold uppercase">
                                            {studentName}
                                        </div>
                                        <div className="text-center text-[10px] text-slate-500 mt-1">
                                            Student Signature over Printed Name / Date
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-b border-slate-400 pb-1"></div>
                                        <div className="text-center text-[10px] text-slate-500 mt-1">
                                            Parent / Guardian Signature over Printed Name / Date
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
                                St. Rita's College of Balingasag — Student Affairs Management System (DSAMS) | Official Resolution Docket
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
