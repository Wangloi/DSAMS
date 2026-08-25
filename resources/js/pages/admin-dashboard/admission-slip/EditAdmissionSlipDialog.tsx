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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';
import type { SlipRow } from './types';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    slip: SlipRow | null;
    errors: Record<string, string>;
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
        if (open && slip) setForm(synced);
    }, [open, slip, synced]);

    const closeEdit = () => {
        setOpen(false);
    };

    const updateSlip = () => {
        const clientErrors: string[] = [];
        if (!form.studentName.trim())
            clientErrors.push('Student name is required');
        if (!form.programYear.trim())
            clientErrors.push('Program year is required');
        if (!form.dateIssued.trim())
            clientErrors.push('Date issued is required');
        if (!form.caseText.trim()) clientErrors.push('Case text is required');
        if (!form.reasonText.trim())
            clientErrors.push('Reason text is required');
        if (!form.validUntil.trim())
            clientErrors.push('Valid until date is required');
        if (clientErrors.length) {
            Swal.fire({
                title: 'Validation error',
                html: clientErrors.join('<br/>'),
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }

        setOpen(false);
        Swal.fire({
            title: 'Confirm Update',
            text: 'Are you sure you want to save changes?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update',
            cancelButtonText: 'Cancel',
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed && slip) {
                router.put(
                    `/admin/admission-slip/${slip.id}`,
                    {
                        student_name: form.studentName.trim(),
                        program_year_level: form.programYear.trim(),
                        date_issued: form.dateIssued.trim(),
                        case_text: form.caseText.trim(),
                        reason_text: form.reasonText.trim(),
                        valid_until: form.validUntil.trim(),
                        status: form.status,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setOpen(false);
                        },
                    },
                );
            } else {
                setOpen(true);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-h-[90vh] w-full !max-w-2xl flex-col overflow-hidden p-0">
                <div className="flex-shrink-0 bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A] px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Edit Admission Slip
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Update slip details and status.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="editStudentName">
                                Student Name
                            </Label>
                            <Input
                                id="editStudentName"
                                value={form.studentName}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        studentName: e.target.value,
                                    }))
                                }
                                placeholder="Student name"
                            />
                            <InputError message={errors.student_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="editProgramYear">
                                Program/Year Level
                            </Label>
                            <Input
                                id="editProgramYear"
                                value={form.programYear}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        programYear: e.target.value,
                                    }))
                                }
                                placeholder="Program and year level"
                            />
                            <InputError message={errors.program_year_level} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editDateIssued">Date Issued</Label>
                            <Input
                                id="editDateIssued"
                                type="date"
                                value={form.dateIssued}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        dateIssued: e.target.value,
                                    }))
                                }
                            />
                            <InputError message={errors.date_issued} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editValidUntil">Valid Until</Label>
                            <Input
                                id="editValidUntil"
                                type="date"
                                value={form.validUntil}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        validUntil: e.target.value,
                                    }))
                                }
                            />
                            <InputError message={errors.valid_until} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="editStatus">Status</Label>
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
                        <Label htmlFor="editCaseText">Case</Label>
                        <Input
                            id="editCaseText"
                            value={form.caseText}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    caseText: e.target.value,
                                }))
                            }
                            placeholder="Enter case"
                        />
                        <InputError message={errors.case_text} />
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                            Reason *
                        </Label>
                        <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                                        className="dark:text-slate-350 flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                setForm((p) => ({
                                                    ...p,
                                                    reasonText: r,
                                                }))
                                            }
                                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{r}</span>
                                    </label>
                                );
                            })}
                            <label className="dark:text-slate-350 flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700">
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
                                    onChange={() =>
                                        setForm((p) => ({
                                            ...p,
                                            reasonText: 'Others: ',
                                        }))
                                    }
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
                                        htmlFor="editReasonText_other"
                                        className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400"
                                    >
                                        Specify Reason Details *
                                    </Label>
                                    <textarea
                                        id="editReasonText_other"
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
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                reasonText:
                                                    'Others: ' + e.target.value,
                                            }))
                                        }
                                        placeholder="Specify other reason details..."
                                        rows={2}
                                        className="min-h-16 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:ring-2 focus-visible:ring-[#23509A] focus-visible:outline-none"
                                    />
                                </div>
                            )}
                        <InputError message={errors.reason_text} />
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={closeEdit}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#23509A] transition-colors hover:bg-[#1e4a8a]"
                        onClick={updateSlip}
                        disabled={
                            !form.studentName.trim() ||
                            !form.programYear.trim() ||
                            !form.dateIssued.trim() ||
                            !form.caseText.trim() ||
                            !form.reasonText.trim() ||
                            !form.validUntil.trim()
                        }
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
