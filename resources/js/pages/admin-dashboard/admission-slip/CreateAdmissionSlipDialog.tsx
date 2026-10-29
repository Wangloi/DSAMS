import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormRequiredNotice } from '@/components/ui/form-required-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { router } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    GraduationCap,
    IdCard,
    PlusCircle,
    User,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';
import type { CreateSlipFormState } from './types';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors: Record<string, string>;
};

export const REASON_VALIDITY_DAYS: Record<string, number> = {
    'Illness / Not Feeling Well': 3,
    'Medical / Dental Appointment': 1,
    'Family Emergency': 3,
    'Bereavement in the Family': 7,
    'Transportation Problem': 1,
    'Bad Weather / Calamity': 2,
    'Official School Activity': 5,
    'Financial Concern': 3,
    'Others': 2,
};

export const getValidityDaysForReason = (reason: string): number => {
    if (!reason) return 2;
    for (const [key, days] of Object.entries(REASON_VALIDITY_DAYS)) {
        if (reason.toLowerCase().includes(key.toLowerCase())) {
            return days;
        }
    }
    return 2;
};

export default function CreateAdmissionSlipDialog({
    open,
    setOpen,
    errors,
}: Props) {
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const defaultValidUntil = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().slice(0, 10);
    }, []);

    const emptyForm: CreateSlipFormState = useMemo(
        () => ({
            userId: '',
            studentName: '',
            programYear: '',
            dateIssued: today,
            caseText: '',
            reasonText: '',
            validUntil: defaultValidUntil,
        }),
        [today, defaultValidUntil],
    );

    const [form, setForm] = useState<CreateSlipFormState>(emptyForm);
    const [lookupStatus, setLookupStatus] = useState<
        'idle' | 'loading' | 'found' | 'not_found'
    >('idle');
    const [searchResults, setSearchResults] = useState<
        { id: string; name: string }[]
    >([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [studentQuota, setStudentQuota] = useState<{
        count: number;
        limit: number;
        reached: boolean;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Reset to emptyForm when the modal opens
    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            setLookupStatus('idle');
            setSearchResults([]);
            setIsDropdownOpen(false);
            setStudentQuota(null);
            setFormErrors({});
        }
    }, [open, emptyForm]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsDropdownOpen(false);
            return;
        }

        try {
            const res = await fetch(
                `/admin/students/search?q=${encodeURIComponent(query)}`,
                {
                    headers: { Accept: 'application/json' },
                },
            );
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.students || []);
                setIsDropdownOpen(true);
            }
        } catch {
            setSearchResults([]);
        }
    };

    const addDaysIso = (isoDate: string, days: number) => {
        const base = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(base.getTime())) return '';
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10);
    };

    const closeCreate = () => {
        setOpen(false);
        setForm(emptyForm);
        setStudentQuota(null);
    };

    const lookupStudent = async (studentId: string) => {
        const trimmed = String(studentId ?? '').trim();
        if (!trimmed) {
            setLookupStatus('idle');
            setForm((p) => ({ ...p, studentName: '', programYear: '' }));
            return;
        }

        setLookupStatus('loading');
        try {
            const res = await fetch(
                `/admin/students/lookup?student_id=${encodeURIComponent(trimmed)}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            if (!res.ok) {
                setLookupStatus('not_found');
                setForm((p) => ({ ...p, studentName: '', programYear: '' }));
                return;
            }

            const data = (await res.json()) as {
                name?: string;
                course?: string;
                year_level?: string | number;
            };
            const programYear = [data.course, data.year_level]
                .filter(Boolean)
                .join(' ');
            setForm((p) => ({
                ...p,
                studentName: String(data?.name ?? ''),
                programYear,
            }));
            if (typeof (data as any)?.monthly_slips_count === 'number') {
                setStudentQuota({
                    count: (data as any).monthly_slips_count,
                    limit: (data as any).monthly_quota_limit ?? 3,
                    reached: !!(data as any).monthly_quota_reached,
                });
            } else {
                setStudentQuota(null);
            }
            setLookupStatus('found');
        } catch {
            setLookupStatus('not_found');
            setForm((p) => ({ ...p, studentName: '', programYear: '' }));
            setStudentQuota(null);
        }
    };

    const createSlip = () => {
        // ---- Client‑side validation ----
        const errs: Record<string, string> = {};
        if (!form.userId.trim() || !form.studentName.trim()) {
            errs.userId = 'Please enter or select a valid student.';
        }
        if (!form.studentName.trim()) errs.studentName = 'Student name is required.';
        if (!form.programYear.trim()) errs.programYear = 'Program and year level are required.';
        if (!form.dateIssued.trim()) errs.dateIssued = 'Please select date issued.';
        if (!form.reasonText.trim()) errs.reasonText = 'Please select or enter reason for absence.';
        if (!form.validUntil.trim()) errs.validUntil = 'Please specify valid until date.';

        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            setTimeout(() => {
                focusFirstInvalidField(containerRef.current);
            }, 50);
            return;
        }

        setFormErrors({});

        // ---- Confirmation & submission ----
        setOpen(false);
        Swal.fire({
            title: 'Confirm Create Slip',
            text: 'Are you sure you want to create this admission slip?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, create',
            cancelButtonText: 'Cancel',
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                router.post(
                    '/admin/admission-slip',
                    {
                        student_name: form.studentName.trim(),
                        program_year_level: form.programYear.trim(),
                        date_issued: form.dateIssued.trim(),
                        case_text: form.reasonText.trim(),
                        reason_text: form.reasonText.trim(),
                        valid_until: form.validUntil.trim(),
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setOpen(false);
                            setForm(emptyForm);
                        },
                    },
                );
            } else {
                setOpen(true);
            }
        });
    };

    const hasAnyError =
        Object.keys(formErrors).length > 0 || Object.keys(errors).length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent size="lg" className="flex max-h-[90vh] w-[96vw] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 [&>button]:hidden">
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-4.5 text-white shadow-md sm:px-8">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                <PlusCircle className="h-5 w-5 text-white" />
                            </div>
                            <DialogHeader className="p-0 text-left">
                                <DialogTitle className="text-lg font-black tracking-tight text-white sm:text-xl">
                                    Create Walk-in Slip
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/80">
                                    Fill out details below to generate a new walk-in admission slip.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={closeCreate}
                                aria-label="Close dialog"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-100 cursor-pointer shrink-0"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div ref={containerRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
                    {/* Required Notice */}
                    <FormRequiredNotice message="Admission slip fields marked with * or Required must be completed." />

                    {hasAnyError && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                !
                            </span>
                            Please review and fix the highlighted fields below.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* User ID */}
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label
                                htmlFor="userId"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                            >
                                Student ID Number
                            </Label>
                            <div className="relative">
                                <IdCard className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="userId"
                                    value={form.userId}
                                    hasError={!!formErrors.userId || !!errors.user_id}
                                    aria-describedby={(formErrors.userId || errors.user_id) ? 'userId-error' : undefined}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm((p) => ({ ...p, userId: v }));
                                        if (formErrors.userId) {
                                            setFormErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.userId;
                                                return next;
                                            });
                                        }
                                        handleSearch(v);
                                    }}
                                    onBlur={() => {
                                        setTimeout(
                                            () => setIsDropdownOpen(false),
                                            200,
                                        );
                                        lookupStudent(form.userId);
                                        if (!form.userId.trim()) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                userId: 'Please enter or select a valid student.',
                                            }));
                                        }
                                    }}
                                    onFocus={() => {
                                        if (searchResults.length > 0)
                                            setIsDropdownOpen(true);
                                    }}
                                    placeholder="Enter student ID (e.g. ID-230123)"
                                    autoComplete="off"
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-semibold tracking-wide text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                />
                            </div>

                            {isDropdownOpen && searchResults.length > 0 && (
                                <div className="absolute top-[68px] left-0 z-[100] mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                                    {searchResults.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            className="flex w-full flex-col px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer"
                                            onClick={() => {
                                                setForm((p) => ({
                                                    ...p,
                                                    userId: student.id,
                                                }));
                                                setIsDropdownOpen(false);
                                                lookupStudent(student.id);
                                            }}
                                        >
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {student.id}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {student.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="ml-1 text-[11px] font-bold text-slate-400">
                                {lookupStatus === 'loading'
                                    ? 'Looking up...'
                                    : lookupStatus === 'found'
                                      ? '✓ Student found'
                                      : lookupStatus === 'not_found'
                                        ? '✗ Student not found'
                                        : ''}
                            </div>
                            <InputError id="userId-error" message={formErrors.userId || errors.user_id} />
                        </div>

                        {/* Student Name */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="studentName"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                            >
                                Student Name
                            </Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="studentName"
                                    value={form.studentName}
                                    readOnly
                                    hasError={!!formErrors.studentName || !!errors.student_name}
                                    aria-describedby={(formErrors.studentName || errors.student_name) ? 'studentName-error' : undefined}
                                    placeholder="Student name will appear here"
                                    className="h-10 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 pl-10 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                                />
                            </div>
                            <InputError id="studentName-error" message={formErrors.studentName || errors.student_name} />
                        </div>

                        {/* Program / Year Level */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="programYear"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                            >
                                Program & Year Level
                            </Label>
                            <div className="relative">
                                <GraduationCap className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="programYear"
                                    value={form.programYear}
                                    readOnly
                                    hasError={!!formErrors.programYear || !!errors.program_year_level}
                                    aria-describedby={(formErrors.programYear || errors.program_year_level) ? 'programYear-error' : undefined}
                                    placeholder="Program and year level will appear here"
                                    className="h-10 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 pl-10 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* STUDENT MONTHLY QUOTA TRACKER BANNER */}
                        {studentQuota && (
                            <div
                                className={`sm:col-span-2 flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all ${
                                    studentQuota.reached
                                        ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                                        : studentQuota.count === 2
                                          ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                                          : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white ${
                                            studentQuota.reached
                                                ? 'bg-rose-600'
                                                : studentQuota.count === 2
                                                  ? 'bg-amber-500'
                                                  : 'bg-blue-600'
                                        }`}
                                    >
                                        {studentQuota.count}
                                    </div>
                                    <div>
                                        <div className="font-bold">
                                            Student Monthly Quota: {studentQuota.count} of {studentQuota.limit} Slips Used
                                        </div>
                                        <div className="text-[11px] opacity-80">
                                            {studentQuota.reached
                                                ? 'Warning: This student has already reached the maximum 3 slips for this month!'
                                                : `${studentQuota.limit - studentQuota.count} slips remaining for this student this month.`}
                                        </div>
                                    </div>
                                </div>
                                {studentQuota.reached && (
                                    <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white uppercase">
                                        Limit Reached
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Date Issued */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="dateIssued"
                                required
                                showRequiredBadge
                                className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                            >
                                Date Issued
                            </Label>
                            <div className="relative">
                                <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="dateIssued"
                                    type="date"
                                    value={form.dateIssued}
                                    hasError={!!formErrors.dateIssued || !!errors.date_issued}
                                    aria-describedby={(formErrors.dateIssued || errors.date_issued) ? 'dateIssued-error' : undefined}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        const days = getValidityDaysForReason(form.reasonText);
                                        setForm((p) => ({
                                            ...p,
                                            dateIssued: v,
                                            validUntil: v ? addDaysIso(v, days) : '',
                                        }));
                                        if (formErrors.dateIssued) {
                                            setFormErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.dateIssued;
                                                return next;
                                            });
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!form.dateIssued.trim()) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                dateIssued: 'Please select date issued.',
                                            }));
                                        }
                                    }}
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                />
                            </div>
                            <InputError id="dateIssued-error" message={formErrors.dateIssued || errors.date_issued} />
                        </div>

                        {/* Valid Until */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="validUntil"
                                    required
                                    showRequiredBadge
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Valid Until
                                </Label>
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    {form.reasonText ? `Auto (+${getValidityDaysForReason(form.reasonText)}d) • Full Admin Override` : 'Full Admin Override • Editable'}
                                </span>
                            </div>
                            <div className="relative">
                                <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="validUntil"
                                    type="date"
                                    value={form.validUntil}
                                    hasError={!!formErrors.validUntil || !!errors.valid_until}
                                    aria-describedby={(formErrors.validUntil || errors.valid_until) ? 'validUntil-error' : undefined}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm((p) => ({
                                            ...p,
                                            validUntil: val,
                                        }));
                                        if (formErrors.validUntil) {
                                            setFormErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.validUntil;
                                                return next;
                                            });
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!form.validUntil.trim()) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                validUntil: 'Please specify valid until date.',
                                            }));
                                        }
                                    }}
                                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm font-medium text-slate-800 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Input is unlocked. Admins can adjust the expiration date shorter or longer depending on situation.
                            </p>
                            <InputError id="validUntil-error" message={formErrors.validUntil || errors.valid_until} />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="grid gap-1.5">
                        <Label
                            htmlFor="adminReasonSelect"
                            required
                            showRequiredBadge
                            className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                        >
                            Admission Slip Reason
                        </Label>
                        <div className="relative">
                            <FileText className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                            <select
                                id="adminReasonSelect"
                                aria-invalid={!!formErrors.reasonText || !!errors.reason_text}
                                aria-describedby={(formErrors.reasonText || errors.reason_text) ? 'reasonText-error' : undefined}
                                value={
                                    [
                                        'Illness / Not Feeling Well',
                                        'Medical / Dental Appointment',
                                        'Family Emergency',
                                        'Bereavement in the Family',
                                        'Transportation Problem',
                                        'Bad Weather / Calamity',
                                        'Official School Activity',
                                        'Financial Concern',
                                    ].includes(form.reasonText)
                                        ? form.reasonText
                                        : form.reasonText.startsWith('Others:')
                                          ? 'Others'
                                          : form.reasonText
                                            ? 'Others'
                                            : ''
                                }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    const nextReason = v === 'Others' ? 'Others: ' : v;
                                    const days = getValidityDaysForReason(v);
                                    setForm((p) => ({
                                        ...p,
                                        reasonText: nextReason,
                                        validUntil: p.dateIssued ? addDaysIso(p.dateIssued, days) : p.validUntil,
                                    }));
                                    if (formErrors.reasonText) {
                                        setFormErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.reasonText;
                                            return next;
                                        });
                                    }
                                }}
                                onBlur={() => {
                                    if (!form.reasonText.trim()) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            reasonText: 'Please select or enter reason for absence.',
                                        }));
                                    }
                                }}
                                className={`h-10 w-full rounded-xl border bg-slate-50/50 pl-10 pr-8 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800 ${
                                    formErrors.reasonText || errors.reason_text
                                        ? '!border-red-500 ring-2 ring-red-500/25'
                                        : 'border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <option value="">-- Select admission slip reason --</option>
                                {[
                                    'Illness / Not Feeling Well',
                                    'Medical / Dental Appointment',
                                    'Family Emergency',
                                    'Bereavement in the Family',
                                    'Transportation Problem',
                                    'Bad Weather / Calamity',
                                    'Official School Activity',
                                    'Financial Concern',
                                ].map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                                <option value="Others">Others / Custom Reason</option>
                            </select>
                        </div>
                        <InputError id="reasonText-error" message={formErrors.reasonText || errors.reason_text} />

                        {(![
                            'Illness / Not Feeling Well',
                            'Medical / Dental Appointment',
                            'Family Emergency',
                            'Bereavement in the Family',
                            'Transportation Problem',
                            'Bad Weather / Calamity',
                            'Official School Activity',
                            'Financial Concern',
                        ].includes(form.reasonText) &&
                            form.reasonText !== '') && (
                            <div className="mt-2 animate-in space-y-1.5 duration-200 fade-in">
                                <Label
                                    htmlFor="reasonText_other"
                                    required
                                    showRequiredBadge
                                    className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
                                >
                                    Specify Reason Details
                                </Label>
                                <textarea
                                    id="reasonText_other"
                                    value={form.reasonText.replace(/^Others:\s*/, '')}
                                    onChange={(e) => {
                                        setForm((p) => ({
                                            ...p,
                                            reasonText: `Others: ${e.target.value}`,
                                        }));
                                        if (formErrors.reasonText) {
                                            setFormErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.reasonText;
                                                return next;
                                            });
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!form.reasonText.replace(/^Others:\s*/, '').trim()) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                reasonText: 'Please specify reason details.',
                                            }));
                                        }
                                    }}
                                    placeholder="Enter specific reason details..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeCreate}
                        className="rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 cursor-pointer"
                        onClick={createSlip}
                    >
                        Create Slip
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
