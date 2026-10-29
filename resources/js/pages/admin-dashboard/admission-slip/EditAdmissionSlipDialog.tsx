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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { router, usePage } from '@inertiajs/react';
import { FileEdit, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';
import { getValidityDaysForReason } from './CreateAdmissionSlipDialog';
import type { SlipRow } from './types';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    slip: SlipRow | null;
    errors: Record<string, string>;
};

const STANDARD_REASONS = [
    'Illness / Not Feeling Well',
    'Medical / Dental Appointment',
    'Family Emergency',
    'Bereavement in the Family',
    'Transportation Problem',
    'Bad Weather / Calamity',
    'Official School Activity',
    'Financial Concern',
];

const addDaysIso = (isoDate: string, days: number) => {
    const base = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) return '';
    base.setDate(base.getDate() + days);
    return base.toISOString().slice(0, 10);
};

export default function EditAdmissionSlipDialog({
    open,
    setOpen,
    slip,
    errors,
}: Props) {
    const emptyForm = {
        studentName: '',
        programYear: '',
        dateIssued: '',
        caseText: '',
        reasonText: '',
        validUntil: '',
        status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
    };

    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    const markTouched = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const validateField = (field: string, val: string) => {
        if (!val.trim()) {
            if (field === 'studentName') return 'Student name is required.';
            if (field === 'programYear') return 'Program and year level are required.';
            if (field === 'dateIssued') return 'Date issued is required.';
            if (field === 'reasonText') return 'Reason for absence is required.';
            if (field === 'validUntil') return 'Valid until date is required.';
        }
        return '';
    };

    const handleBlur = (field: string, val: string, errKey: string) => {
        markTouched(field);
        const errMsg = validateField(field, val);
        setFormErrors((prev) => {
            const next = { ...prev };
            if (errMsg) next[errKey] = errMsg;
            else delete next[errKey];
            return next;
        });
    };

    const clearFieldError = (errKey: string) => {
        if (formErrors[errKey]) {
            setFormErrors((prev) => {
                const next = { ...prev };
                delete next[errKey];
                return next;
            });
        }
    };

    const synced = useMemo(() => {
        if (!slip) return emptyForm;
        return {
            studentName: slip.studentName,
            programYear: slip.programYear,
            dateIssued: slip.dateIssued,
            caseText: slip.caseText,
            reasonText: slip.reasonText,
            validUntil: slip.validUntil,
            status: (slip.status || 'PENDING') as
                | 'PENDING'
                | 'APPROVED'
                | 'REJECTED',
        };
    }, [slip]);

    useEffect(() => {
        if (open && slip) {
            setForm(synced);
            setFormErrors({});
            setTouched({});
        }
    }, [open, slip, synced]);

    const { props: pageProps } = usePage<any>();
    const role = pageProps?.auth?.user?.role;

    const closeEdit = () => {
        setFormErrors({});
        setTouched({});
        setOpen(false);
    };

    const updateSlip = () => {
        const errs: Record<string, string> = {};
        if (!form.studentName.trim())
            errs.student_name = 'Student name is required.';
        if (!form.programYear.trim())
            errs.program_year_level = 'Program and year level are required.';
        if (!form.dateIssued.trim())
            errs.date_issued = 'Date issued is required.';
        if (!form.reasonText.trim())
            errs.reason_text = 'Reason for absence is required.';
        if (!form.validUntil.trim())
            errs.valid_until = 'Valid until date is required.';

        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            setTimeout(() => {
                focusFirstInvalidField(containerRef.current);
            }, 50);
            return;
        }

        setFormErrors({});

        setOpen(false);
        Swal.fire({
            title: 'Confirm Update',
            text: 'Are you sure you want to save changes to this admission slip?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, update',
            cancelButtonText: 'Cancel',
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed && slip) {
                const endpoint =
                    role === 'dsa'
                        ? `/dsa/admission-slip/${slip.id}`
                        : `/admin/admission-slip/${slip.id}`;

                router.put(
                    endpoint,
                    {
                        student_name: form.studentName.trim(),
                        program_year_level: form.programYear.trim(),
                        date_issued: form.dateIssued.trim(),
                        case_text: form.reasonText.trim(),
                        reason_text: form.reasonText.trim(),
                        valid_until: form.validUntil.trim(),
                        status: form.status,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setOpen(false);
                            Swal.fire({
                                title: 'Updated!',
                                text: 'Admission slip has been updated successfully.',
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                        onError: () => {
                            setOpen(true);
                            setTimeout(() => {
                                focusFirstInvalidField(containerRef.current);
                            }, 50);
                        },
                    },
                );
            } else {
                setOpen(true);
            }
        });
    };

    const isPredefined = STANDARD_REASONS.includes(form.reasonText);
    const isOtherSelected =
        !isPredefined && form.reasonText !== '';
    const dropdownValue = isPredefined
        ? form.reasonText
        : isOtherSelected
          ? 'Others'
          : '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent size="lg" className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 [&>button]:hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#23509A] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                            <FileEdit className="h-5 w-5" />
                        </div>
                        <DialogHeader className="p-0 text-left">
                            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                                Edit Admission Slip
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Update slip details, reason, and status.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <button
                        type="button"
                        onClick={closeEdit}
                        aria-label="Close dialog"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div ref={containerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-8">
                    <FormRequiredNotice message="Fields marked with * or Required must be completed." />

                    {(slip?.slipCount || slip?.allTimeCount) && (
                        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
                            <span className="font-semibold">
                                Monthly Quota: {slip.slipCount}
                            </span>
                            {slip.allTimeCount && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                    {slip.allTimeCount}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="editStudentName" required showRequiredBadge>
                                Student Name
                            </Label>
                            <Input
                                id="editStudentName"
                                value={form.studentName}
                                hasError={!!(formErrors.student_name || errors.student_name)}
                                aria-describedby={(formErrors.student_name || errors.student_name) ? "editStudentName-error" : undefined}
                                onBlur={(e) => handleBlur('studentName', e.target.value, 'student_name')}
                                onChange={(e) => {
                                    clearFieldError('student_name');
                                    setForm((p) => ({
                                        ...p,
                                        studentName: e.target.value,
                                    }));
                                }}
                                placeholder="Student name"
                            />
                            <InputError id="editStudentName-error" message={formErrors.student_name || errors.student_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="editProgramYear" required showRequiredBadge>
                                Program/Year Level
                            </Label>
                            <Input
                                id="editProgramYear"
                                value={form.programYear}
                                hasError={!!(formErrors.program_year_level || errors.program_year_level)}
                                aria-describedby={(formErrors.program_year_level || errors.program_year_level) ? "editProgramYear-error" : undefined}
                                onBlur={(e) => handleBlur('programYear', e.target.value, 'program_year_level')}
                                onChange={(e) => {
                                    clearFieldError('program_year_level');
                                    setForm((p) => ({
                                        ...p,
                                        programYear: e.target.value,
                                    }));
                                }}
                                placeholder="Program and year level"
                            />
                            <InputError id="editProgramYear-error" message={formErrors.program_year_level || errors.program_year_level} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editDateIssued" required showRequiredBadge>
                                Date Issued
                            </Label>
                            <Input
                                id="editDateIssued"
                                type="date"
                                value={form.dateIssued}
                                hasError={!!(formErrors.date_issued || errors.date_issued)}
                                aria-describedby={(formErrors.date_issued || errors.date_issued) ? "editDateIssued-error" : undefined}
                                onBlur={(e) => handleBlur('dateIssued', e.target.value, 'date_issued')}
                                onChange={(e) => {
                                    clearFieldError('date_issued');
                                    const v = e.target.value;
                                    const days = getValidityDaysForReason(form.reasonText);
                                    setForm((p) => ({
                                        ...p,
                                        dateIssued: v,
                                        validUntil: v ? addDaysIso(v, days) : p.validUntil,
                                    }));
                                }}
                            />
                            <InputError id="editDateIssued-error" message={formErrors.date_issued || errors.date_issued} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="editValidUntil" required showRequiredBadge>
                                    Valid Until
                                </Label>
                                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                    {form.reasonText ? `Auto (+${getValidityDaysForReason(form.reasonText)}d) • Full Admin Override` : 'Full Admin Override • Editable'}
                                </span>
                            </div>
                            <Input
                                id="editValidUntil"
                                type="date"
                                value={form.validUntil}
                                hasError={!!(formErrors.valid_until || errors.valid_until)}
                                aria-describedby={(formErrors.valid_until || errors.valid_until) ? "editValidUntil-error" : undefined}
                                onBlur={(e) => handleBlur('validUntil', e.target.value, 'valid_until')}
                                onChange={(e) => {
                                    clearFieldError('valid_until');
                                    setForm((p) => ({
                                        ...p,
                                        validUntil: e.target.value,
                                    }));
                                }}
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Input is unlocked. Admins can adjust the expiration date shorter or longer depending on medical certificates or student circumstances.
                            </p>
                            <InputError id="editValidUntil-error" message={formErrors.valid_until || errors.valid_until} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="editStatus" required>
                            Status
                        </Label>
                        <Select
                            value={form.status}
                            onValueChange={(v) =>
                                setForm((p) => ({
                                    ...p,
                                    status: v as
                                        | 'PENDING'
                                        | 'APPROVED'
                                        | 'REJECTED',
                                }))
                            }
                        >
                            <SelectTrigger className="h-10 w-full sm:w-48">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">
                                    Approved
                                </SelectItem>
                                <SelectItem value="REJECTED">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="editReasonSelect"
                            required
                            showRequiredBadge
                        >
                            Reason
                        </Label>
                        <select
                            id="editReasonSelect"
                            value={dropdownValue}
                            aria-invalid={!!(formErrors.reason_text || errors.reason_text)}
                            aria-describedby={(formErrors.reason_text || errors.reason_text) ? "editReasonText-error" : undefined}
                            onBlur={(e) => handleBlur('reasonText', e.target.value, 'reason_text')}
                            onChange={(e) => {
                                clearFieldError('reason_text');
                                const val = e.target.value;
                                const nextReason =
                                    val === 'Others'
                                        ? form.reasonText.startsWith('Others: ')
                                            ? form.reasonText
                                            : 'Others: '
                                        : val;
                                const days = getValidityDaysForReason(val);
                                setForm((p) => ({
                                    ...p,
                                    reasonText: nextReason,
                                    validUntil: p.dateIssued ? addDaysIso(p.dateIssued, days) : p.validUntil,
                                }));
                            }}
                            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none dark:bg-slate-900 dark:text-slate-100 ${
                                formErrors.reason_text || errors.reason_text
                                    ? '!border-red-500 !ring-2 !ring-red-500/25 dark:!border-red-500'
                                    : 'border-slate-200 focus-visible:ring-2 focus-visible:ring-[#23509A] dark:border-slate-700'
                            }`}
                        >
                            <option value="" disabled>
                                -- Select Reason --
                            </option>
                            {STANDARD_REASONS.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                            <option value="Others">
                                Others (Please Specify)
                            </option>
                        </select>

                        {dropdownValue === 'Others' && (
                            <div className="mt-2 animate-in space-y-1.5 duration-200 fade-in">
                                <Label
                                    htmlFor="editReasonText_other"
                                    required
                                    showRequiredBadge
                                    className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400"
                                >
                                    Specify Reason Details
                                </Label>
                                <textarea
                                    id="editReasonText_other"
                                    value={
                                        form.reasonText.startsWith('Others: ')
                                            ? form.reasonText.replace(
                                                  'Others: ',
                                                  '',
                                              )
                                            : form.reasonText === 'Others'
                                              ? ''
                                              : form.reasonText
                                    }
                                    aria-invalid={!!(formErrors.reason_text || errors.reason_text)}
                                    aria-describedby={(formErrors.reason_text || errors.reason_text) ? "editReasonText-error" : undefined}
                                    onBlur={(e) => handleBlur('reasonText', e.target.value, 'reason_text')}
                                    onChange={(e) => {
                                        clearFieldError('reason_text');
                                        setForm((p) => ({
                                            ...p,
                                            reasonText:
                                                'Others: ' + e.target.value,
                                        }));
                                    }}
                                    placeholder="Specify other reason details..."
                                    rows={2}
                                    className={`min-h-16 w-full resize-none rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none dark:bg-slate-900 dark:text-slate-100 ${
                                        formErrors.reason_text || errors.reason_text
                                            ? '!border-red-500 !ring-2 !ring-red-500/25 dark:!border-red-500'
                                            : 'border-slate-200 focus-visible:ring-2 focus-visible:ring-[#23509A] dark:border-slate-700'
                                    }`}
                                />
                            </div>
                        )}
                        <InputError id="editReasonText-error" message={formErrors.reason_text || errors.reason_text} />
                    </div>
                </div>

                <DialogFooter className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={closeEdit}
                        className="rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-[#23509A] px-6 text-sm font-semibold text-white hover:bg-[#1b4080] shadow-sm cursor-pointer"
                        onClick={updateSlip}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

