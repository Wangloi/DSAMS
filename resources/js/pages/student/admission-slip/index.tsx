import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

type UseFormReturn = ReturnType<typeof useForm>;

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { studentAdmissionSlipStore } from '@/routes';

type FormState = {
    student_name: string;
    program_year_level: string;
    case_text: string;
    reason_text: string;
    valid_until: string;
};

export default function StudentAdmissionSlipIndex() {
    const { data, setData, post, processing, errors, reset } = useForm({
        student_name: '',
        program_year_level: '',
        case_text: '',
        reason_text: '',
        valid_until: '',
    });

    const [open, setOpen] = useState(true);

    const onClose = () => {
        if (!processing) setOpen(false);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(studentAdmissionSlipStore(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Admission Slip" />

            <div className="min-h-screen bg-slate-50 px-4 pt-24 sm:px-6 lg:px-8 dark:bg-[#020617]">
                <Card className="mx-auto max-w-2xl border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
                            Admission Slip Request
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                            Submit your request for review. Printing is not
                            available here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={open} onOpenChange={onClose}>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Request Admission Slip
                                    </DialogTitle>
                                    <DialogDescription>
                                        Fill out the form below. Admins will
                                        notify you once processed.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={submit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="student_name"
                                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Student Name (optional)
                                        </Label>
                                        <Input
                                            id="student_name"
                                            value={data.student_name}
                                            onChange={(e) =>
                                                setData(
                                                    'student_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Your full name"
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                                        />
                                        {errors.student_name && (
                                            <div className="ml-1 text-[11px] font-bold text-rose-500">
                                                {errors.student_name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="program_year_level"
                                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Program Year Level (optional)
                                        </Label>
                                        <Input
                                            id="program_year_level"
                                            value={data.program_year_level}
                                            onChange={(e) =>
                                                setData(
                                                    'program_year_level',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g., BSCS 1st Year"
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                                        />
                                        {errors.program_year_level && (
                                            <div className="ml-1 text-[11px] font-bold text-rose-500">
                                                {errors.program_year_level}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="case_text"
                                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Case / Reason Title
                                        </Label>
                                        <Input
                                            id="case_text"
                                            value={data.case_text}
                                            onChange={(e) =>
                                                setData(
                                                    'case_text',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Briefly describe the case"
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                                        />
                                        {errors.case_text && (
                                            <div className="ml-1 text-[11px] font-bold text-rose-500">
                                                {errors.case_text}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="reason_text"
                                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Reason / Details
                                        </Label>
                                        <Input
                                            id="reason_text"
                                            value={data.reason_text}
                                            onChange={(e) =>
                                                setData(
                                                    'reason_text',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="More details about your request"
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                                        />
                                        {errors.reason_text && (
                                            <div className="ml-1 text-[11px] font-bold text-rose-500">
                                                {errors.reason_text}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="valid_until"
                                            className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                        >
                                            Valid Until
                                        </Label>
                                        <Input
                                            id="valid_until"
                                            type="date"
                                            value={data.valid_until}
                                            onChange={(e) =>
                                                setData(
                                                    'valid_until',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                                        />
                                        {errors.valid_until && (
                                            <div className="ml-1 text-[11px] font-bold text-rose-500">
                                                {errors.valid_until}
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter className="border-t border-slate-100 pt-2 dark:border-slate-800">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={onClose}
                                            disabled={processing}
                                            className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
                                        >
                                            {processing
                                                ? 'Submitting...'
                                                : 'Submit Request'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
