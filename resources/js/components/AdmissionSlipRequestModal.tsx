import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import type { SweetAlertResult } from 'sweetalert2';
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

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors: Record<string, string>;
    mode: 'admin' | 'student' | 'dsa';
    onSubmit?: (data: Record<string, any>) => void;
    initialData?: Partial<CreateSlipFormState>;
    user?: { name?: string; course?: string; year_level?: string | number } | null;
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
            programYear: mode === 'student' && user ? [user.course, user.year_level].filter(Boolean).join(' ') : '',
            dateIssued: today,
            caseText: '',
            reasonText: '',
            validUntil: todayPlus7,
        }),
        [user?.name, mode, user, today, todayPlus7],
    );

    const [form, setForm] = useState<CreateSlipFormState>(() => ({ ...emptyForm, ...stableInitialData }));
    const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
    const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([]);
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
                const idRes = await fetch(`/admin/students/lookup?student_id=${encodeURIComponent(trimmed)}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                });

                if (idRes.ok) {
                    const data = (await idRes.json()) as { student_id?: string; name?: string };
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
                const searchRes = await fetch(`/admin/students/search?q=${encodeURIComponent(trimmed)}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                });

                if (searchRes.ok) {
                    const searchData = (await searchRes.json()) as { students?: Array<{ id: string; name: string }> };
                    const students = searchData.students ?? [];
                    
                    if (students.length === 0) {
                        setLookupStatus('not_found');
                        setSuggestions([]);
                        setShowSuggestions(false);
                        return;
                    }

                    const needle = trimmed.toLowerCase();

                    // Show all partial matches (case-insensitive)
                    const filteredStudents = students.filter((student) =>
                        student.id.toLowerCase().includes(needle) || student.name.toLowerCase().includes(needle),
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
            const fullLookupRes = await fetch(`/admin/students/lookup?student_id=${encodeURIComponent(student.id)}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });
            
            if (fullLookupRes.ok) {
                const fullData = (await fullLookupRes.json()) as { name?: string; course?: string; year_level?: string | number };
                const programYear = [fullData.course, fullData.year_level].filter(Boolean).join(' ');
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
                const route = mode === 'dsa' ? '/dsa/admission-slip' : '/admin/admission-slip';
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center gap-4 px-4 overflow-hidden">
                        <div
                            className={
                                "bg-white dark:bg-slate-800 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 p-0 shadow-2xl duration-200 relative flex flex-col " +
                                ((mode === 'admin' || mode === 'dsa') ? "w-full max-w-2xl max-h-[90vh]" : "w-[96vw] max-w-2xl max-h-[90vh]")
                            }
                        >
                            <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-6 text-white shrink-0">
                                <DialogHeader className="space-y-1">
                                    <DialogTitle className="text-white text-xl font-bold">
                                        {mode === 'dsa' ? 'Create New Admission Slip' : mode === 'admin' ? 'Create New Admission Slip' : 'Request Admission Slip'}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-sm">
                                        {mode === 'dsa'
                                            ? 'Fill out the details to create a new admission slip for a student.'
                                            : mode === 'admin'
                                            ? 'Fill out the details to create a new admission slip for a student.'
                                            : 'Fill out the details to request your admission slip.'}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-5">
                                {(mode === 'admin' || mode === 'dsa') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="studentSearch" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                                            Search Student *
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="studentSearch"
                                                value={form.userId}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setForm((p) => ({ ...p, userId: value }));
                                                    handleStudentSearch(value);
                                                }}
                                                placeholder="Enter student ID or name to search"
                                                className="w-full bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-11 focus:ring-[#1e40af] text-slate-900 dark:text-white"
                                            />
                                            {lookupStatus === 'loading' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-600" />
                                                </div>
                                            )}
                                        </div>
                                        {lookupStatus === 'found' && (
                                            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                Student identified successfully
                                            </p>
                                        )}
                                        {lookupStatus === 'not_found' && (
                                            <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                                No matches found for this ID
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="studentName" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Student Name</Label>
                                        <Input
                                            id="studentName"
                                            value={form.studentName}
                                            onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
                                            className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10 text-slate-900 dark:text-white"
                                            readOnly={mode === 'student' || mode === 'admin'}
                                            placeholder="Student name will appear here"
                                        />
                                        <InputError message={errors.student_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="programYear" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Program & Year</Label>
                                        <Input
                                            id="programYear"
                                            value={form.programYear}
                                            onChange={(e) => setForm((p) => ({ ...p, programYear: e.target.value }))}
                                            className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10 text-slate-900 dark:text-white"
                                            readOnly={mode === 'student' || mode === 'admin'}
                                            placeholder="Course info will appear here"
                                        />
                                        <InputError message={errors.program_year_level} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="dateIssued" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Date Issued</Label>
                                        <Input
                                            id="dateIssued"
                                            type="date"
                                            value={form.dateIssued}
                                            onChange={(e) => setForm((p) => ({ ...p, dateIssued: e.target.value }))}
                                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10 text-slate-900 dark:text-white"
                                            readOnly={mode === 'student'}
                                        />
                                        <InputError message={errors.date_issued} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="validUntil" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Valid Until</Label>
                                        <Input
                                            id="validUntil"
                                            type="date"
                                            value={form.validUntil}
                                            onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10 text-slate-900 dark:text-white"
                                        />
                                        <InputError message={errors.valid_until} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="caseText" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Case *</Label>
                                    <Input
                                        id="caseText"
                                        value={form.caseText}
                                        onChange={(e) => setForm((p) => ({ ...p, caseText: e.target.value }))}
                                        placeholder="Specific reason/case for this admission slip"
                                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10 text-slate-900 dark:text-white"
                                    />
                                    <InputError message={errors.case_text} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reasonText" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Detailed Description</Label>
                                    <textarea
                                        id="reasonText"
                                        value={form.reasonText}
                                        onChange={(e) => setForm((p) => ({ ...p, reasonText: e.target.value }))}
                                        placeholder="Provide more context or details if necessary..."
                                        rows={3}
                                        className="flex w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError message={errors.reason_text} />
                                </div>
                            </div>

                            <DialogFooter className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-t border-slate-200 dark:border-slate-600 shrink-0">
                                <Button type="button" variant="outline" onClick={closeModal} disabled={processing} className="h-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    Cancel
                                </Button>
                                <Button 
                                    type="button" 
                                    onClick={submitForm} 
                                    disabled={processing}
                                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                >
                                    {processing ? 'Processing...' : mode === 'admin' ? 'Create Slip' : 'Submit Request'}
                                </Button>
                            </DialogFooter>

                            <DialogPrimitive.Close
                                className="absolute top-6 right-6 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogPrimitive.Close>
                        </div>

                        {mode === 'admin' && showSuggestions && suggestions.length > 0 && (
                            <div className="hidden lg:block w-72 h-fit bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden self-center animate-in slide-in-from-left-2 duration-200">
                                <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Search Results</span>
                                    <span className="text-[10px] bg-white dark:bg-slate-600 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">{suggestions.length} found</span>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 text-slate-900 dark:text-white"
                                            onClick={() => selectStudent(s)}
                                        >
                                            <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                                            <span className="text-xs text-blue-600 font-medium">#{s.id}</span>
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
