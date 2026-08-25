import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateSlipFormState } from '@/pages/admin-dashboard/admission-slip/types';
import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SweetAlertResult } from 'sweetalert2';
import Swal from 'sweetalert2';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors: Record<string, string>;
    mode: 'admin' | 'student' | 'dsa';
    onSubmit?: (data: Record<string, any>) => void;
    initialData?: Partial<CreateSlipFormState>;
    user?: {
        name?: string;
        course?: string;
        year_level?: string | number;
    } | null;
};

export function AdmissionSlipRequestModal({
    open,
    setOpen,
    errors,
    mode,
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

    const emptyForm: CreateSlipFormState = useMemo(
        () => ({
            userId: '',
            studentName: user?.name ?? '',
            programYear:
                mode === 'student' && user
                    ? [user.course, user.year_level].filter(Boolean).join(' ')
                    : '',
            dateIssued: today,
            caseText: '',
            reasonText: '',
            validUntil: todayPlus7,
        }),
        [user?.name, mode, user, today, todayPlus7],
    );

    const [form, setForm] = useState<CreateSlipFormState>(() => ({
        ...emptyForm,
        ...stableInitialData,
    }));
    const [lookupStatus, setLookupStatus] = useState<
        'idle' | 'loading' | 'found' | 'not_found'
    >('idle');
    const [suggestions, setSuggestions] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Reset to emptyForm when the modal opens
    useEffect(() => {
        if (open) {
            setForm({ ...emptyForm, ...stableInitialData });
            setLookupStatus('idle');
            setProcessing(false);
        }
    }, [open, emptyForm, stableInitialData]);

    const addDaysIso = (isoDate: string, days: number) => {
        const base = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(base.getTime())) return '';
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10);
    };

    const closeModal = () => {
        setOpen(false);
    };

    const lastSearchRef = useRef<string>('');

    const handleStudentSearch = (value: string) => {
        const trimmed = value.trim();

        // Prevent duplicate API calls
        if (trimmed === lastSearchRef.current) {
            return;
        }
        lastSearchRef.current = trimmed;

        if (!trimmed) {
            setLookupStatus('idle');
            setSuggestions([]);
            setShowSuggestions(false);
            setForm((p) => ({ ...p, studentName: '', programYear: '' }));
            return;
        }

        setLookupStatus('loading');
        setSuggestions([]);
        setShowSuggestions(false);

        // Debounce the lookup
        setTimeout(async () => {
            try {
                // First try lookup by exact ID
                const idRes = await fetch(
                    `/admin/students/lookup?student_id=${encodeURIComponent(trimmed)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (idRes.ok) {
                    const data = (await idRes.json()) as {
                        student_id?: string;
                        name?: string;
                    };
                    setLookupStatus('idle');
                    setSuggestions([
                        {
                            id: trimmed,
                            name: String(data?.name ?? ''),
                        },
                    ]);
                    setShowSuggestions(true);
                    return;
                }

                // If exact ID lookup fails, try search for partial matches
                const searchRes = await fetch(
                    `/admin/students/search?q=${encodeURIComponent(trimmed)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (searchRes.ok) {
                    const searchData = (await searchRes.json()) as {
                        students?: Array<{ id: string; name: string }>;
                    };
                    const students = searchData.students ?? [];

                    if (students.length === 0) {
                        setLookupStatus('not_found');
                        setSuggestions([]);
                        setShowSuggestions(false);
                        return;
                    }

                    const needle = trimmed.toLowerCase();

                    // Show all partial matches (case-insensitive)
                    const filteredStudents = students.filter(
                        (student) =>
                            student.id.toLowerCase().includes(needle) ||
                            student.name.toLowerCase().includes(needle),
                    );

                    if (filteredStudents.length > 0) {
                        setSuggestions(filteredStudents);
                        setShowSuggestions(true);
                        setLookupStatus('idle');
                    } else {
                        setLookupStatus('not_found');
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                } else {
                    setLookupStatus('not_found');
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch (error) {
                console.error('Student search error:', error);
                setLookupStatus('not_found');
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
    };

    const selectStudent = async (student: { id: string; name: string }) => {
        setForm((p) => ({ ...p, userId: student.id }));
        setSuggestions([]);
        setShowSuggestions(false);

        // Get full student data
        try {
            const fullLookupRes = await fetch(
                `/admin/students/lookup?student_id=${encodeURIComponent(student.id)}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            if (fullLookupRes.ok) {
                const fullData = (await fullLookupRes.json()) as {
                    name?: string;
                    course?: string;
                    year_level?: string | number;
                };
                const programYear = [fullData.course, fullData.year_level]
                    .filter(Boolean)
                    .join(' ');
                setForm((p) => ({
                    ...p,
                    studentName: String(fullData?.name ?? ''),
                    programYear,
                }));
                setLookupStatus('found');
            } else {
                setLookupStatus('not_found');
            }
        } catch {
            setLookupStatus('not_found');
        }
    };

    const submitForm = () => {
        if (onSubmit) {
            onSubmit({
                userId: form.userId,
                student_name: form.studentName,
                program_year_level: form.programYear,
                date_issued: form.dateIssued,
                case_text: form.caseText,
                reason_text: form.reasonText,
                valid_until: form.validUntil,
            });
            return;
        }

        // Default admin submission
        setProcessing(true);
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
                const route =
                    mode === 'dsa'
                        ? '/dsa/admission-slip'
                        : '/admin/admission-slip';
                router.post(
                    route,
                    {
                        student_name: form.studentName,
                        program_year_level: form.programYear,
                        date_issued: form.dateIssued,
                        case_text: form.caseText,
                        reason_text: form.reasonText,
                        valid_until: form.validUntil,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setOpen(false);
                        },
                        onFinish: () => setProcessing(false),
                    },
                );
            } else {
                setProcessing(false);
                setOpen(true);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content asChild>
                    <div className="fixed inset-0 z-50 flex items-center justify-center gap-4 overflow-hidden px-4">
                        <div
                            className={
                                'relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl duration-200 dark:border-slate-700 dark:bg-slate-800 ' +
                                (mode === 'admin' || mode === 'dsa'
                                    ? 'max-h-[90vh] w-full max-w-2xl'
                                    : 'max-h-[90vh] w-[96vw] max-w-2xl')
                            }
                        >
                            <div className="shrink-0 bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-6 text-white">
                                <DialogHeader className="space-y-1">
                                    <DialogTitle className="text-xl font-bold text-white">
                                        {mode === 'dsa'
                                            ? 'Create New Admission Slip'
                                            : mode === 'admin'
                                              ? 'Create New Admission Slip'
                                              : 'Request Admission Slip'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-white/80">
                                        {mode === 'dsa'
                                            ? 'Fill out the details to create a new admission slip for a student.'
                                            : mode === 'admin'
                                              ? 'Fill out the details to create a new admission slip for a student.'
                                              : 'Fill out the details to request your admission slip.'}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-6 py-6">
                                {(mode === 'admin' || mode === 'dsa') && (
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="studentSearch"
                                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Search Student *
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="studentSearch"
                                                value={form.userId}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    setForm((p) => ({
                                                        ...p,
                                                        userId: value,
                                                    }));
                                                    handleStudentSearch(value);
                                                }}
                                                placeholder="Enter student ID or name to search"
                                                className="h-11 w-full border-slate-200 bg-slate-50 text-slate-900 focus:ring-[#1e40af] dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            />
                                            {lookupStatus === 'loading' && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-600" />
                                                </div>
                                            )}
                                        </div>
                                        {lookupStatus === 'found' && (
                                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                Student identified successfully
                                            </p>
                                        )}
                                        {lookupStatus === 'not_found' && (
                                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                                No matches found for this ID
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="studentName"
                                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Student Name
                                        </Label>
                                        <Input
                                            id="studentName"
                                            value={form.studentName}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    studentName: e.target.value,
                                                }))
                                            }
                                            className="h-10 border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            readOnly={
                                                mode === 'student' ||
                                                mode === 'admin'
                                            }
                                            placeholder="Student name will appear here"
                                        />
                                        <InputError
                                            message={errors.student_name}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="programYear"
                                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Program & Year
                                        </Label>
                                        <Input
                                            id="programYear"
                                            value={form.programYear}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    programYear: e.target.value,
                                                }))
                                            }
                                            className="h-10 border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            readOnly={
                                                mode === 'student' ||
                                                mode === 'admin'
                                            }
                                            placeholder="Course info will appear here"
                                        />
                                        <InputError
                                            message={errors.program_year_level}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="dateIssued"
                                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Date Issued
                                        </Label>
                                        <Input
                                            id="dateIssued"
                                            type="date"
                                            value={form.dateIssued}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    dateIssued: e.target.value,
                                                }))
                                            }
                                            className="h-10 border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            readOnly={mode === 'student'}
                                        />
                                        <InputError
                                            message={errors.date_issued}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="validUntil"
                                            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Valid Until
                                        </Label>
                                        <Input
                                            id="validUntil"
                                            type="date"
                                            value={form.validUntil}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    validUntil: e.target.value,
                                                }))
                                            }
                                            className="h-10 border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        />
                                        <InputError
                                            message={errors.valid_until}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="caseText"
                                        className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        Case *
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
                                        placeholder="Specific reason/case for this admission slip"
                                        className="h-10 border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    />
                                    <InputError message={errors.case_text} />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                                            const checked =
                                                form.reasonText === r;
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
                                                    ].includes(
                                                        form.reasonText,
                                                    ) && form.reasonText !== ''
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
                                                    className="text-xs font-bold tracking-widest text-slate-400 uppercase"
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
                                                                'Others: ' +
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Specify other reason details..."
                                                    rows={2}
                                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    <InputError message={errors.reason_text} />
                                </div>
                            </div>

                            <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-600 dark:bg-slate-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="h-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={submitForm}
                                    disabled={processing}
                                    className="h-10 min-w-[120px] bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {processing
                                        ? 'Processing...'
                                        : mode === 'admin'
                                          ? 'Create Slip'
                                          : 'Submit Request'}
                                </Button>
                            </DialogFooter>

                            <DialogPrimitive.Close className="absolute top-6 right-6 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogPrimitive.Close>
                        </div>

                        {mode === 'admin' &&
                            showSuggestions &&
                            suggestions.length > 0 && (
                                <div className="hidden h-fit w-72 animate-in self-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl duration-200 slide-in-from-left-2 lg:block dark:border-slate-700 dark:bg-slate-800">
                                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-600 dark:bg-slate-700">
                                        <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                            Search Results
                                        </span>
                                        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300">
                                            {suggestions.length} found
                                        </span>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                className="flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left text-slate-900 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                                                onClick={() => selectStudent(s)}
                                            >
                                                <span className="truncate text-sm font-semibold text-slate-900">
                                                    {s.name}
                                                </span>
                                                <span className="text-xs font-medium text-blue-600">
                                                    #{s.id}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
