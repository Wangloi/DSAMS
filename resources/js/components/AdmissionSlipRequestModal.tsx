import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormRequiredNotice } from '@/components/ui/form-required-notice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';

export type CreateSlipFormState = {
    userId: string;
    studentName: string;
    programYear: string;
    dateIssued: string;
    caseText: string;
    reasonText: string;
    validUntil: string;
};

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors?: Record<string, string>;
    mode?: 'admin' | 'student' | 'dsa';
    onSubmit?: (data: Record<string, any>) => void;
    initialData?: Partial<CreateSlipFormState>;
    user?: {
        id?: string | number;
        student_id?: string;
        name?: string;
        course?: string;
        year_level?: string | number;
    } | null;
};

export function AdmissionSlipRequestModal({
    open,
    setOpen,
    errors = {},
    mode = 'student',
    onSubmit,
    initialData,
    user = null,
}: Props) {
    const stableInitialData = useMemo(() => initialData ?? {}, [initialData]);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const todayPlus7 = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    }, []);

    const emptyForm: CreateSlipFormState = useMemo(() => {
        const resolvedUserId =
            user?.student_id || (user?.id ? String(user.id) : '');
        const resolvedName = user?.name ?? '';
        const resolvedProgramYear =
            user
                ? [user.course, user.year_level].filter(Boolean).join(' ')
                : '';

        return {
            userId: mode === 'student' ? resolvedUserId : '',
            studentName: mode === 'student' ? resolvedName : '',
            programYear: mode === 'student' ? resolvedProgramYear : '',
            dateIssued: today,
            caseText: '',
            reasonText: '',
            validUntil: todayPlus7,
        };
    }, [user, mode, today, todayPlus7]);

    const [form, setForm] = useState<CreateSlipFormState>(() => ({
        ...emptyForm,
        ...stableInitialData,
    }));
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const [lookupStatus, setLookupStatus] = useState<
        'idle' | 'loading' | 'found' | 'not_found'
    >('idle');
    const [searchResults, setSearchResults] = useState<
        { id: string; name: string }[]
    >([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Reset to emptyForm when the modal opens
    useEffect(() => {
        if (open) {
            setForm({ ...emptyForm, ...stableInitialData });
            setFormErrors({});
            setTouched({});
            setLookupStatus('idle');
            setSearchResults([]);
            setIsDropdownOpen(false);
            setProcessing(false);
        }
    }, [open, emptyForm, stableInitialData]);

    const markTouched = (field: string) => {
        setTouched((p) => ({ ...p, [field]: true }));
    };

    const clearFieldError = (key: string) => {
        if (formErrors[key]) {
            setFormErrors((p) => {
                const next = { ...p };
                delete next[key];
                return next;
            });
        }
    };

    const addDaysIso = (isoDate: string, days: number) => {
        const base = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(base.getTime())) return '';
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10);
    };

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
            setLookupStatus('found');
        } catch {
            setLookupStatus('not_found');
            setForm((p) => ({ ...p, studentName: '', programYear: '' }));
        }
    };

    const closeModal = () => {
        setFormErrors({});
        setTouched({});
        setOpen(false);
        setForm(emptyForm);
    };

    const submitSlip = () => {
        const errs: Record<string, string> = {};
        if (!isStudent && !form.userId.trim()) {
            errs.userId = 'Student ID is required.';
        }
        if (!form.studentName.trim()) {
            errs.studentName = 'Student name is required.';
        }
        if (!form.programYear.trim()) {
            errs.programYear = 'Program and year level are required.';
        }
        if (!form.dateIssued.trim()) {
            errs.dateIssued = 'Date issued is required.';
        }
        if (!form.caseText.trim()) {
            errs.caseText = 'Please select a reason title / case category.';
        }
        if (!form.reasonText.trim()) {
            errs.reasonText = 'Please select or specify a reason.';
        }
        if (!isStudent && !form.validUntil.trim()) {
            errs.validUntil = 'Valid until date is required.';
        }

        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            setTimeout(() => {
                focusFirstInvalidField(containerRef.current);
            }, 50);
            return;
        }

        setFormErrors({});

        if (onSubmit) {
            onSubmit({
                user_id: form.userId,
                student_id: form.userId,
                student_name: form.studentName.trim(),
                program_year_level: form.programYear.trim(),
                date_issued: form.dateIssued.trim(),
                case_text: form.caseText.trim(),
                reason_text: form.reasonText.trim(),
                ...(isStudent
                    ? {}
                    : { valid_until: form.validUntil.trim() }),
            });
            return;
        }

        // Confirmation & submission
        setOpen(false);
        Swal.fire({
            title:
                mode === 'student'
                    ? 'Confirm Request Slip'
                    : 'Confirm Create Slip',
            text:
                mode === 'student'
                    ? 'Are you sure you want to submit this admission slip request?'
                    : 'Are you sure you want to create this admission slip?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText:
                mode === 'student' ? 'Yes, submit' : 'Yes, create',
            cancelButtonText: 'Cancel',
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                setProcessing(true);
                const route =
                    mode === 'student'
                        ? '/student/admission-slip'
                        : mode === 'dsa'
                          ? '/dsa/admission-slip'
                          : '/admin/admission-slip';

                router.post(
                    route,
                    {
                        student_id: form.userId,
                        student_name: form.studentName.trim(),
                        program_year_level: form.programYear.trim(),
                        date_issued: form.dateIssued.trim(),
                        case_text: form.caseText.trim(),
                        reason_text: form.reasonText.trim(),
                        ...(isStudent
                            ? {}
                            : { valid_until: form.validUntil.trim() }),
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setOpen(false);
                            setForm(emptyForm);
                        },
                        onError: () => {
                            setOpen(true);
                        },
                        onFinish: () => {
                            setProcessing(false);
                        },
                    },
                );
            } else {
                setOpen(true);
            }
        });
    };

    const isStudent = mode === 'student';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent size="lg" preventClose={processing} className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                    <div className="relative flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                            <PlusCircle className="h-8 w-8 text-blue-300" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                {isStudent
                                    ? 'Request Admission Slip'
                                    : mode === 'dsa'
                                      ? 'Create Walk-in Slip'
                                      : 'Create Walk-in Slip'}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-xs font-medium text-blue-100/70">
                                {isStudent
                                    ? 'Fill out details below to submit your admission slip request.'
                                    : 'Fill out details below to generate a new walk-in admission slip.'}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div ref={containerRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-8">
                    <FormRequiredNotice message="Fields marked with * or Required must be completed." />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="relative grid gap-2.5">
                            <Label
                                htmlFor={isStudent ? 'studentUserId' : 'userId'}
                                required={!isStudent}
                                showRequiredBadge={!isStudent}
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                User ID
                            </Label>
                            {isStudent ? (
                                <Input
                                    id="studentUserId"
                                    value={form.userId || 'N/A'}
                                    readOnly
                                    className="h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                                />
                            ) : (
                                <>
                                    <Input
                                        id="userId"
                                        value={form.userId}
                                        hasError={!!formErrors.userId}
                                        aria-describedby={formErrors.userId ? "userId-error" : undefined}
                                        onChange={(e) => {
                                            clearFieldError('userId');
                                            const v = e.target.value;
                                            setForm((p) => ({
                                                ...p,
                                                userId: v,
                                            }));
                                            handleSearch(v);
                                        }}
                                        onBlur={() => {
                                            markTouched('userId');
                                            if (!form.userId.trim()) {
                                                setFormErrors((p) => ({ ...p, userId: 'Student ID is required.' }));
                                            }
                                            setTimeout(
                                                () => setIsDropdownOpen(false),
                                                200,
                                            );
                                            lookupStudent(form.userId);
                                        }}
                                        onFocus={() => {
                                            if (searchResults.length > 0)
                                                setIsDropdownOpen(true);
                                        }}
                                        placeholder="Enter student ID"
                                        autoComplete="off"
                                        className="h-11 rounded-xl"
                                    />

                                    {isDropdownOpen &&
                                        searchResults.length > 0 && (
                                            <div className="absolute top-[75px] left-0 z-[100] mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                                                {searchResults.map(
                                                    (student) => (
                                                        <button
                                                            key={student.id}
                                                            type="button"
                                                            className="flex w-full flex-col px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                                            onClick={() => {
                                                                clearFieldError('userId');
                                                                setForm(
                                                                    (p) => ({
                                                                        ...p,
                                                                        userId: student.id,
                                                                    }),
                                                                );
                                                                setIsDropdownOpen(
                                                                    false,
                                                                );
                                                                lookupStudent(
                                                                    student.id,
                                                                );
                                                            }}
                                                        >
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                {student.id}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {student.name}
                                                            </span>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                    <div className="ml-1 text-[10px] font-bold text-slate-400">
                                        {lookupStatus === 'loading'
                                            ? 'Looking up...'
                                            : lookupStatus === 'found'
                                              ? '✓ Student found'
                                              : lookupStatus === 'not_found'
                                                ? '✗ Student not found'
                                                : ''}
                                    </div>
                                    <InputError id="userId-error" message={formErrors.userId} />
                                </>
                            )}
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="studentName"
                                required
                                showRequiredBadge
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Name
                            </Label>
                            <Input
                                id="studentName"
                                value={form.studentName}
                                hasError={!!(formErrors.studentName || errors.student_name)}
                                aria-describedby={(formErrors.studentName || errors.student_name) ? "studentName-error" : undefined}
                                readOnly
                                placeholder="Student name will appear here"
                                className="h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                            />
                            <InputError id="studentName-error" message={formErrors.studentName || errors.student_name} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="programYear"
                                required
                                showRequiredBadge
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Program/Year Level
                            </Label>
                            <Input
                                id="programYear"
                                value={form.programYear}
                                hasError={!!(formErrors.programYear || errors.program_year_level)}
                                aria-describedby={(formErrors.programYear || errors.program_year_level) ? "programYear-error" : undefined}
                                readOnly
                                placeholder="Program and year level will appear here"
                                className="h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                            />
                            <InputError id="programYear-error" message={formErrors.programYear || errors.program_year_level} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="dateIssued"
                                required
                                showRequiredBadge
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Date Issued
                            </Label>
                            <Input
                                id="dateIssued"
                                type="date"
                                value={form.dateIssued}
                                hasError={!!(formErrors.dateIssued || errors.date_issued)}
                                aria-describedby={(formErrors.dateIssued || errors.date_issued) ? "dateIssued-error" : undefined}
                                onBlur={() => {
                                    markTouched('dateIssued');
                                    if (!form.dateIssued.trim()) {
                                        setFormErrors((p) => ({ ...p, dateIssued: 'Date issued is required.' }));
                                    }
                                }}
                                onChange={(e) => {
                                    clearFieldError('dateIssued');
                                    const v = e.target.value;
                                    setForm((p) => ({
                                        ...p,
                                        dateIssued: v,
                                        validUntil: v ? addDaysIso(v, 7) : '',
                                    }));
                                }}
                                className="h-11 rounded-xl"
                            />
                            <InputError id="dateIssued-error" message={formErrors.dateIssued || errors.date_issued} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor={isStudent ? 'studentValidUntil' : 'validUntil'}
                                required={!isStudent}
                                showRequiredBadge={!isStudent}
                                optional={isStudent}
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Valid Until
                            </Label>
                            {isStudent ? (
                                <Input
                                    id="studentValidUntil"
                                    type="text"
                                    value="To be set by Admin"
                                    readOnly
                                    className="h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                                />
                            ) : (
                                <Input
                                    id="validUntil"
                                    type="date"
                                    value={form.validUntil}
                                    hasError={!!(formErrors.validUntil || errors.valid_until)}
                                    aria-describedby={(formErrors.validUntil || errors.valid_until) ? "validUntil-error" : undefined}
                                    onBlur={() => {
                                        markTouched('validUntil');
                                        if (!form.validUntil.trim()) {
                                            setFormErrors((p) => ({ ...p, validUntil: 'Valid until date is required.' }));
                                        }
                                    }}
                                    onChange={(e) => {
                                        clearFieldError('validUntil');
                                        setForm((p) => ({
                                            ...p,
                                            validUntil: e.target.value,
                                        }));
                                    }}
                                    className="h-11 rounded-xl"
                                />
                            )}
                            <InputError id="validUntil-error" message={formErrors.validUntil || errors.valid_until} />
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label
                            htmlFor="caseText"
                            required
                            showRequiredBadge
                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                        >
                            Case / Reason Title
                        </Label>
                        <select
                            id="caseText"
                            value={form.caseText}
                            aria-invalid={!!(formErrors.caseText || errors.case_text)}
                            aria-describedby={(formErrors.caseText || errors.case_text) ? "caseText-error" : undefined}
                            onBlur={() => {
                                markTouched('caseText');
                                if (!form.caseText.trim()) {
                                    setFormErrors((p) => ({ ...p, caseText: 'Please select a reason title / case category.' }));
                                }
                            }}
                            onChange={(e) => {
                                clearFieldError('caseText');
                                setForm((p) => ({
                                    ...p,
                                    caseText: e.target.value,
                                }));
                            }}
                            className={`h-11 w-full rounded-xl border bg-slate-50 px-4 text-slate-900 focus:outline-none dark:bg-slate-800/50 dark:text-white ${
                                formErrors.caseText || errors.case_text
                                    ? '!border-red-500 !ring-2 !ring-red-500/25 dark:!border-red-500'
                                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800'
                            }`}
                        >
                            <option value="">Select reason title</option>
                            {[
                                'Absence due to Illness',
                                'Medical / Dental Checkup',
                                'Family Emergency',
                                'Bereavement',
                                'Late Enrollment / Payment',
                                'Official School Activity',
                                'Transportation Problem',
                                'Bad Weather / Calamity',
                                'Others',
                            ].map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <InputError id="caseText-error" message={formErrors.caseText || errors.case_text} />
                    </div>

                    <div className="grid gap-2.5">
                        <Label
                            required
                            showRequiredBadge
                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                        >
                            Reason
                        </Label>
                        <div className="mt-1 ml-1 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {[
                                'Illness / Not Feeling Well',
                                'Medical / Dental Appointment',
                                'Family Emergency',
                                'Bereavement in the Family',
                                'Transportation Problem',
                                'Bad Weather / Calamity',
                                'Official School Activity',
                                'Financial Concern',
                            ].map((r) => {
                                const checked = form.reasonText === r;
                                return (
                                    <label
                                        key={r}
                                        className="flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                                clearFieldError('reasonText');
                                                setForm((p) => ({
                                                    ...p,
                                                    reasonText: r,
                                                }));
                                            }}
                                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{r}</span>
                                    </label>
                                );
                            })}
                            <label className="flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={
                                        ![
                                            'Illness / Not Feeling Well',
                                            'Medical / Dental Appointment',
                                            'Family Emergency',
                                            'Bereavement in the Family',
                                            'Transportation Problem',
                                            'Bad Weather / Calamity',
                                            'Official School Activity',
                                            'Financial Concern',
                                        ].includes(form.reasonText) &&
                                        form.reasonText !== ''
                                    }
                                    onChange={() => {
                                        clearFieldError('reasonText');
                                        setForm((p) => ({
                                            ...p,
                                            reasonText: 'Others: ',
                                        }));
                                    }}
                                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Others</span>
                            </label>
                        </div>

                        {![
                            'Illness / Not Feeling Well',
                            'Medical / Dental Appointment',
                            'Family Emergency',
                            'Bereavement in the Family',
                            'Transportation Problem',
                            'Bad Weather / Calamity',
                            'Official School Activity',
                            'Financial Concern',
                        ].includes(form.reasonText) &&
                            form.reasonText !== '' && (
                                <div className="mt-2 animate-in space-y-1.5 duration-200 fade-in">
                                    <Label
                                        htmlFor="reasonText_other"
                                        required
                                        showRequiredBadge
                                        className="ml-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase"
                                    >
                                        Specify Reason Details
                                    </Label>
                                    <textarea
                                        id="reasonText_other"
                                        value={
                                            form.reasonText.startsWith(
                                                'Others: ',
                                            )
                                                ? form.reasonText.replace(
                                                      'Others: ',
                                                      '',
                                                  )
                                                : form.reasonText
                                        }
                                        aria-invalid={!!(formErrors.reasonText || errors.reason_text)}
                                        aria-describedby={(formErrors.reasonText || errors.reason_text) ? "reasonText-error" : undefined}
                                        onChange={(e) => {
                                            clearFieldError('reasonText');
                                            setForm((p) => ({
                                                ...p,
                                                reasonText:
                                                    'Others: ' + e.target.value,
                                            }));
                                        }}
                                        placeholder="Specify other reason details..."
                                        rows={2}
                                        className={`min-h-16 w-full resize-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-none focus-visible:outline-none dark:bg-slate-800/50 dark:text-white ${
                                            formErrors.reasonText || errors.reason_text
                                                ? '!border-red-500 !ring-2 !ring-red-500/25 dark:!border-red-500'
                                                : 'border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700'
                                        }`}
                                    />
                                </div>
                            )}
                        <InputError id="reasonText-error" message={formErrors.reasonText || errors.reason_text} />
                    </div>
                </div>

                <DialogFooter className="gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={closeModal}
                        disabled={processing}
                        className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                        onClick={submitSlip}
                        disabled={processing}
                    >
                        {processing
                            ? isStudent
                                ? 'Submitting...'
                                : 'Creating...'
                            : isStudent
                              ? 'Submit Request'
                              : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
