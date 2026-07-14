import { router } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import type { SweetAlertResult } from 'sweetalert2';
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
import type { CreateSlipFormState } from './types';

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    errors: Record<string, string>;
};

export default function CreateAdmissionSlipDialog({ open, setOpen, errors }: Props) {
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
    const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
    const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
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
            const res = await fetch(`/admin/students/search?q=${encodeURIComponent(query)}`, {
                headers: { Accept: 'application/json' },
            });
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
            const res = await fetch(`/admin/students/lookup?student_id=${encodeURIComponent(trimmed)}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                setLookupStatus('not_found');
                setForm((p) => ({ ...p, studentName: '', programYear: '' }));
                return;
            }

            const data = (await res.json()) as { name?: string; course?: string; year_level?: string | number };
            const programYear = [data.course, data.year_level].filter(Boolean).join(' ');
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
        if (!form.validUntil.trim()) errors.push('Valid until date is required');
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
            <DialogContent className="w-full !max-w-2xl overflow-hidden p-0">
                <div className="bg-gradient-to-r from-[#23509A] via-[#000D6A] to-[#23509A] px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create New Slip</DialogTitle>
                        <DialogDescription className="text-white/80">Fill out the details to generate an admission slip.</DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-4 px-6 py-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2 relative">
                            <Label htmlFor="userId">User ID</Label>
                            <Input
                                id="userId"
                                value={form.userId}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setForm((p) => ({ ...p, userId: v }));
                                    handleSearch(v);
                                }}
                                onBlur={() => {
                                    setTimeout(() => setIsDropdownOpen(false), 200);
                                    lookupStudent(form.userId);
                                }}
                                onFocus={() => {
                                    if (searchResults.length > 0) setIsDropdownOpen(true);
                                }}
                                placeholder="Enter student ID"
                                autoComplete="off"
                            />

                            {isDropdownOpen && searchResults.length > 0 && (
                                <div className="absolute top-[70px] left-0 z-[100] mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg max-h-60 overflow-auto">
                                    {searchResults.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex flex-col transition-colors"
                                            onClick={() => {
                                                setForm(p => ({ ...p, userId: student.id }));
                                                setIsDropdownOpen(false);
                                                lookupStudent(student.id);
                                            }}
                                        >
                                            <span className="font-semibold text-slate-800">{student.id}</span>
                                            <span className="text-xs text-slate-500">{student.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-slate-500">
                                {lookupStatus === 'loading'
                                    ? 'Looking up...'
                                    : lookupStatus === 'found'
                                        ? 'Student found'
                                        : lookupStatus === 'not_found'
                                            ? 'Student not found'
                                            : ''}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="studentName">Name</Label>
                            <Input
                                id="studentName"
                                value={form.studentName}
                                readOnly
                                placeholder="Student name will appear here"
                            />
                            <InputError message={errors.student_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="programYear">Program/Year Level</Label>
                            <Input
                                id="programYear"
                                value={form.programYear}
                                readOnly
                                placeholder="Program and year level will appear here"
                            />
                            <InputError message={errors.program_year_level} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateIssued">Date Issued</Label>
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
                            />
                            <InputError message={errors.date_issued} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input
                                id="validUntil"
                                type="date"
                                value={form.validUntil}
                                readOnly
                            />
                            <InputError message={errors.valid_until} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="caseText">Case</Label>
                        <Input
                            id="caseText"
                            value={form.caseText}
                            onChange={(e) => setForm((p) => ({ ...p, caseText: e.target.value }))}
                            placeholder="Enter case"
                        />
                        <InputError message={errors.case_text} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reasonText">Reason</Label>
                        <textarea
                            id="reasonText"
                            value={form.reasonText}
                            onChange={(e) => setForm((p) => ({ ...p, reasonText: e.target.value }))}
                            placeholder="Enter reason"
                            className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23509A]"
                        />
                        <InputError message={errors.reason_text} />
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <Button variant="secondary" type="button" onClick={closeCreate}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-[#23509A] hover:bg-[#1e4a8a] transition-colors"
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
