import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import StudentLayout from '../components/StudentLayout';
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
        <StudentLayout>
            <Head title="Admission Slip" />

            <div className="mx-auto max-w-2xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
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

                                    <div className="space-y-3">
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
                                                const checked =
                                                    data.reason_text === r;
                                                return (
                                                    <label
                                                        key={r}
                                                        className="dark:text-slate-350 flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() =>
                                                                setData(
                                                                    'reason_text',
                                                                    r,
                                                                )
                                                            }
                                                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span>{r}</span>
                                                    </label>
                                                );
                                            })}
                                            <label className="dark:text-slate-355 flex cursor-pointer items-center space-x-2.5 text-sm font-medium text-slate-700">
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
                                                            data.reason_text,
                                                        ) &&
                                                        data.reason_text !== ''
                                                    }
                                                    onChange={() =>
                                                        setData(
                                                            'reason_text',
                                                            'Others: ',
                                                        )
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
                                        ].includes(data.reason_text) &&
                                            data.reason_text !== '' && (
                                                <div className="mt-2 animate-in space-y-1.5 duration-200 fade-in">
                                                    <Label
                                                        htmlFor="reason_other_details"
                                                        className="ml-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase"
                                                    >
                                                        Specify Reason Details *
                                                    </Label>
                                                    <textarea
                                                        id="reason_other_details"
                                                        value={
                                                            data.reason_text.startsWith(
                                                                'Others: ',
                                                            )
                                                                ? data.reason_text.replace(
                                                                      'Others: ',
                                                                      '',
                                                                  )
                                                                : data.reason_text
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'reason_text',
                                                                'Others: ' +
                                                                    e.target
                                                                        .value,
                                                            )
                                                        }
                                                        placeholder="Specify other reason details..."
                                                        rows={2}
                                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                                                    />
                                                </div>
                                            )}

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
        </StudentLayout>
    );
}
