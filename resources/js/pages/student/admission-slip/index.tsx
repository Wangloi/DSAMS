import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import StudentLayout from '../components/StudentLayout';
import { AdmissionSlipRequestModal } from '@/components/AdmissionSlipRequestModal';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PlusCircle, FileText } from 'lucide-react';
import type { SharedData } from '@/types';

export default function StudentAdmissionSlipIndex() {
    const { auth, errors } = usePage<SharedData>().props;
    const authUser = auth?.user;
    const [open, setOpen] = useState(true);

    return (
        <StudentLayout>
            <Head title="Admission Slip Request" />

            <div className="mx-auto max-w-4xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
                <Card className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                        <div className="relative flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                <FileText className="h-8 w-8 text-blue-300" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-white">
                                    Admission Slip Request
                                </h1>
                                <p className="mt-1 text-xs font-medium text-blue-100/70">
                                    Request official admission slips for class entry after absences or infractions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8 text-center sm:p-10">
                        <div className="mx-auto max-w-md space-y-4">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Need an admission slip to return to class? Click below to submit an official admission slip request for administrative review.
                            </p>
                            <Button
                                onClick={() => setOpen(true)}
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Request Admission Slip
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <AdmissionSlipRequestModal
                    open={open}
                    setOpen={setOpen}
                    errors={(errors as Record<string, string>) || {}}
                    mode="student"
                    user={{
                        student_id: (authUser as any)?.student_id ?? (authUser as any)?.id ?? '',
                        name: authUser?.name ?? '',
                        course: (authUser as any)?.course ?? (authUser as any)?.program ?? '',
                        year_level: (authUser as any)?.year_level ?? '',
                    }}
                />
            </div>
        </StudentLayout>
    );
}
