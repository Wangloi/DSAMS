import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';
import type { CreateSlipFormState } from './types';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors: Record<string, string>;
};

export default function CreateAdmissionSlipDialog({
    open,
    setOpen,
    errors,
}: Props) {
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const todayPlus7 = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
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
            validUntil: todayPlus7,
        }),
        [],
    );

    const [form, setForm] = useState<CreateSlipFormState>(emptyForm);
    const [lookupStatus, setLookupStatus] = useState<
        'idle' | 'loading' | 'found' | 'not_found'
    >('idle');
    const [searchResults, setSearchResults] = useState<
        { id: string; name: string }[]
    >([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reset to emptyForm when the modal opens
    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            setLookupStatus('idle');
            setSearchResults([]);
            setIsDropdownOpen(false);
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

    const createSlip = () => {
        // ---- Client‑side validation ----
        const errors: string[] = [];
        if (!form.studentName.trim()) errors.push('Student name is required');
        if (!form.programYear.trim()) errors.push('Program year is required');
        if (!form.dateIssued.trim()) errors.push('Date issued is required');
        if (!form.caseText.trim()) errors.push('Case text is required');
        if (!form.reasonText.trim()) errors.push('Reason text is required');
        if (!form.validUntil.trim())
            errors.push('Valid until date is required');
        if (errors.length) {
            Swal.fire({
                title: 'Validation error',
                html: errors.join('<br/>'),
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
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
                        case_text: form.caseText.trim(),
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-2xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
                <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                    <div className="relative flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                            <PlusCircle className="h-8 w-8 text-blue-300" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                Create Walk-in Slip
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-xs font-medium text-blue-100/70">
                                Fill out details below to generate a new walk-in
                                admission slip.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="relative grid gap-2.5">
                            <Label
                                htmlFor="userId"
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                User ID
                            </Label>
                            <Input
                                id="userId"
                                value={form.userId}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setForm((p) => ({ ...p, userId: v }));
                                    handleSearch(v);
                                }}
                                onBlur={() => {
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
                                className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                            />

                            {isDropdownOpen && searchResults.length > 0 && (
                                <div className="absolute top-[75px] left-0 z-[100] mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                                    {searchResults.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            className="flex w-full flex-col px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
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

                            <div className="ml-1 text-[10px] font-bold text-slate-400">
                                {lookupStatus === 'loading'
                                    ? 'Looking up...'
                                    : lookupStatus === 'found'
                                      ? '✓ Student found'
                                      : lookupStatus === 'not_found'
                                        ? '✗ Student not found'
                                        : ''}
                            </div>
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="studentName"
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Name
                            </Label>
                            <Input
                                id="studentName"
                                value={form.studentName}
                                readOnly
                                placeholder="Student name will appear here"
                                className="text-slate-750 h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 dark:border-slate-800 dark:bg-slate-800/80"
                            />
                            <InputError message={errors.student_name} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="programYear"
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Program/Year Level
                            </Label>
                            <Input
                                id="programYear"
                                value={form.programYear}
                                readOnly
                                placeholder="Program and year level will appear here"
                                className="text-slate-750 h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 dark:border-slate-800 dark:bg-slate-800/80"
                            />
                            <InputError message={errors.program_year_level} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="dateIssued"
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Date Issued
                            </Label>
                            <Input
                                id="dateIssued"
                                type="date"
                                value={form.dateIssued}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setForm((p) => ({
                                        ...p,
                                        dateIssued: v,
                                        validUntil: v ? addDaysIso(v, 7) : '',
                                    }));
                                }}
                                className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                            />
                            <InputError message={errors.date_issued} />
                        </div>

                        <div className="grid gap-2.5">
                            <Label
                                htmlFor="validUntil"
                                className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                            >
                                Valid Until
                            </Label>
                            <Input
                                id="validUntil"
                                type="date"
                                value={form.validUntil}
                                readOnly
                                className="text-slate-750 h-11 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100 px-4 dark:border-slate-800 dark:bg-slate-800/80"
                            />
                            <InputError message={errors.valid_until} />
                        </div>
                    </div>

                    <div className="grid gap-2.5">
                        <Label
                            htmlFor="caseText"
                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                        >
                            Case / Reason Title
                        </Label>
                        <Input
                            id="caseText"
                            value={form.caseText}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    caseText: e.target.value,
                                }))
                            }
                            placeholder="Enter case"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                        />
                        <InputError message={errors.case_text} />
                    </div>

                    <div className="grid gap-2.5">
                        <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                            Reason *
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
                                        htmlFor="reasonText_other"
                                        className="ml-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase"
                                    >
                                        Specify Reason Details *
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
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                reasonText:
                                                    'Others: ' + e.target.value,
                                            }))
                                        }
                                        placeholder="Specify other reason details..."
                                        rows={2}
                                        className="dark:border-slate-850 min-h-16 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:outline-none dark:bg-slate-800/50 dark:text-white"
                                    />
                                </div>
                            )}
                        <InputError message={errors.reason_text} />
                    </div>
                </div>

                <DialogFooter className="gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={closeCreate}
                        className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                        onClick={createSlip}
                        disabled={
                            !form.studentName.trim() ||
                            !form.programYear.trim() ||
                            !form.dateIssued.trim() ||
                            !form.caseText.trim() ||
                            !form.reasonText.trim() ||
                            !form.validUntil.trim()
                        }
                    >
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
