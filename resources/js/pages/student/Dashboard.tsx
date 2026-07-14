import { AppShell } from '@/components/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import {
    studentAdmissionSlipStore,
    studentCertificates,
    studentEvaluationShow,
    studentIncidentsStore,
} from '@/routes';

import type { SharedData } from '@/types';
import type { User } from '@/types/auth';
import { Head, router, useForm, usePage } from '@inertiajs/react';

import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    Calendar,
    ChevronRight,
    ClipboardList,
    Clock,
    FileCheck,
    GraduationCap,
    Info,
    QrCode,
    TrendingUp,
    UserRoundCog,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { StudentDashboardFooter } from './components/StudentDashboardFooter';
import { StudentHeader } from './components/StudentHeader';

type StatCard = {
    label: string;
    value: string;
    sublabel: string;
    icon: React.JSX.Element;
    accent: string;
    theme: {
        text: string;
        iconBg: string;
        iconText: string;
        border: string;
    };
    trend?: string;
};

type EvaluationRow = {
    id: string;
    title: string;
    date: string;
    statusLabel: string;
};

type EventRecord = {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    status: string;
};

type Props = {
    user?: User;
    stats?: {
        active_incidents: number;
        event_attendance: number;
        pending_evaluations: number;
    };
    evaluations?: EvaluationRow[];
    events?: EventRecord[];
};

export default function StudentDashboard({
    user,
    stats: serverStats,
    evaluations: serverEvaluations,
    events = [],
}: Props) {
    const page = usePage();
    const getInitials = useInitials();

    const props = page.props as unknown as SharedData;
    const authUser = props?.auth?.user ?? user;

    const displayName = authUser?.name || 'Student';
    const studentId = (authUser as any)?.student_id || '2023-0000';
    const program = (authUser as any)?.program || 'General Education';

    const dashboardNotifications = ((page.props as any)?.notifications ??
        []) as Array<{
            id: string;
            type?: string;
            eventId?: number | string | null;
            evaluationId?: number | string | null;
            title: string;
            subtitle?: string;
            timeAgo?: string;
        }>;

    const recentNotifications = ((page.props as any)?.recentNotifications ??
        []) as Array<{
            id: string;
            type?: string;
            eventId?: number | string | null;
            evaluationId?: number | string | null;
            title: string;
            subtitle?: string;
            timeAgo?: string;
        }>;

    const notificationsForCard =
        dashboardNotifications.length > 0
            ? dashboardNotifications
            : recentNotifications;

    const [academicYear, setAcademicYear] = useState('2024 - 2025');
    const [reportIncidentOpen, setReportIncidentOpen] = useState(false);
    const [admissionSlipOpen, setAdmissionSlipOpen] = useState(false);

    const {
        data: admissionSlipData,
        setData: setAdmissionSlipData,
        post: postAdmissionSlip,
        processing: admissionSlipProcessing,
        errors: admissionSlipErrors,
        reset: resetAdmissionSlip,
    } = useForm({
        student_name: (authUser as any)?.name ?? '',
        program_year_level: '',
        program: (authUser as any)?.course ?? '',
        year_level: (authUser as any)?.year_level ?? '',
        case_text: '',
        reason_text: '',
        valid_until: '',
    });

    const [reportProcessing, setReportProcessing] = useState(false);
    const [reportErrors, setReportErrors] = useState<Record<string, string>>(
        {},
    );
    const [reportForm, setReportForm] = useState({
        incident_type: '',
        incident_date: '',
        incident_time: '',
        location: '',
        classification: 'Minor' as 'Minor' | 'Major',
        description: '',
        evidences: [] as File[],
    });

    const submitReportIncident = () => {
        setReportProcessing(true);

        setReportErrors({});

        router.post(
            studentIncidentsStore(),
            {
                incident_type: reportForm.incident_type,
                incident_date: reportForm.incident_date,
                incident_time: reportForm.incident_time,
                location: reportForm.location,
                classification: reportForm.classification,
                description: reportForm.description,
                evidences: reportForm.evidences,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setReportIncidentOpen(false);
                    setReportForm({
                        incident_type: '',
                        incident_date: '',
                        incident_time: '',
                        location: '',
                        classification: 'Minor',
                        description: '',
                        evidences: [],
                    });
                },
                onError: (errors: Record<string, unknown>) => {
                    const mapped = Object.entries(errors).reduce<
                        Record<string, string>
                    >((acc, [k, v]) => {
                        if (typeof v === 'string') acc[k] = v;
                        return acc;
                    }, {});
                    setReportErrors(mapped);
                },
                onFinish: () => {
                    setReportProcessing(false);
                },
            },
        );
    };

    const stats: StatCard[] = useMemo(
        () => [
            {
                label: 'Active Incidents',
                value: serverStats?.active_incidents?.toString() || '0',
                sublabel: 'Under Review',
                icon: <AlertTriangle className="h-6 w-6" />,
                accent: 'bg-rose-500',
                theme: {
                    text: 'text-rose-600 dark:text-rose-400',
                    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
                    iconText: 'text-rose-600 dark:text-rose-400',
                    border: 'border-rose-100 dark:border-rose-500/20',
                },
                trend:
                    serverStats?.active_incidents &&
                        serverStats.active_incidents > 0
                        ? `+${serverStats.active_incidents}`
                        : '0',
            },
            {
                label: 'Event Attendance',
                value: serverStats?.event_attendance?.toString() || '0',
                sublabel: 'Events Attended',
                icon: <QrCode className="h-6 w-6" />,
                accent: 'bg-blue-500',
                theme: {
                    text: 'text-blue-600 dark:text-blue-400',
                    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
                    iconText: 'text-blue-600 dark:text-blue-400',
                    border: 'border-blue-100 dark:border-blue-500/20',
                },
                trend: serverStats?.event_attendance
                    ? `+${serverStats.event_attendance}`
                    : '0',
            },
            {
                label: 'Pending Evaluations',
                value: serverStats?.pending_evaluations?.toString() || '0',
                sublabel: 'Forms to Complete',
                icon: <UserRoundCog className="h-6 w-6" />,
                accent: 'bg-purple-500',
                theme: {
                    text: 'text-purple-600 dark:text-purple-400',
                    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
                    iconText: 'text-purple-600 dark:text-purple-400',
                    border: 'border-purple-100 dark:border-purple-500/20',
                },
                trend:
                    serverStats?.pending_evaluations &&
                        serverStats.pending_evaluations > 0
                        ? `+${serverStats.pending_evaluations}`
                        : '0',
            },
        ],
        [serverStats],
    );

    const evaluationRows: EvaluationRow[] = serverEvaluations || [];

    const onSubmitAdmissionSlip = (e: React.FormEvent) => {
        e.preventDefault();

        // Combine program + year_level into program_year_level for submission
        const combined = [admissionSlipData.program, admissionSlipData.year_level]
            .filter(Boolean)
            .join(' ');

        router.post(
            studentAdmissionSlipStore(),
            {
                student_name: admissionSlipData.student_name,
                program_year_level: combined,
                case_text: admissionSlipData.case_text,
                reason_text: admissionSlipData.reason_text,
                valid_until: admissionSlipData.valid_until,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    resetAdmissionSlip();
                    setAdmissionSlipData('student_name', (authUser as any)?.name ?? '');
                    setAdmissionSlipData('program', (authUser as any)?.course ?? '');
                    setAdmissionSlipData('year_level', (authUser as any)?.year_level ?? '');
                    setAdmissionSlipOpen(false);
                },
            },
        );
    };

    return (
        <AppShell>
            <StudentHeader />
            <Head title="Student Dashboard" />

            <Dialog
                open={reportIncidentOpen}
                onOpenChange={setReportIncidentOpen}
            >
                <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-2xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
                    <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                        <div className="relative flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                <AlertTriangle className="h-8 w-8 text-rose-300" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                    Report Incident
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm font-medium text-blue-100/70">
                                    Your safety is our priority. Submit a report
                                    for administrative review.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-8">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="incident_type"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Incident Type
                                    </Label>
                                    <Input
                                        id="incident_type"
                                        value={reportForm.incident_type}
                                        onChange={(e) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                incident_type: e.target.value,
                                            }))
                                        }
                                        placeholder="What happened?"
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 transition-all focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {reportErrors.incident_type && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {reportErrors.incident_type}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="incident_date"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Date
                                    </Label>
                                    <Input
                                        id="incident_date"
                                        type="date"
                                        value={reportForm.incident_date}
                                        onChange={(e) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                incident_date: e.target.value,
                                            }))
                                        }
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {reportErrors.incident_date && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {reportErrors.incident_date}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="incident_time"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Time
                                    </Label>
                                    <Input
                                        id="incident_time"
                                        type="time"
                                        value={reportForm.incident_time}
                                        onChange={(e) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                incident_time: e.target.value,
                                            }))
                                        }
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {reportErrors.incident_time && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {reportErrors.incident_time}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="location"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={reportForm.location}
                                        onChange={(e) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                location: e.target.value,
                                            }))
                                        }
                                        placeholder="Where did it occur?"
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {reportErrors.location && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {reportErrors.location}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                                        Classification
                                    </Label>
                                    <Select
                                        value={reportForm.classification}
                                        onValueChange={(v) =>
                                            setReportForm((prev) => ({
                                                ...prev,
                                                classification: v as
                                                    | 'Minor'
                                                    | 'Major',
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                                            <SelectItem
                                                value="Minor"
                                                className="rounded-xl"
                                            >
                                                Minor Violation
                                            </SelectItem>
                                            <SelectItem
                                                value="Major"
                                                className="rounded-xl"
                                            >
                                                Major Violation
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label
                                    htmlFor="description"
                                    className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Detailed Description
                                </Label>
                                <textarea
                                    id="description"
                                    value={reportForm.description}
                                    onChange={(e) =>
                                        setReportForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    placeholder="Please provide as much detail as possible to help us investigate..."
                                />
                                {reportErrors.description && (
                                    <div className="ml-1 text-[11px] font-bold text-rose-500">
                                        {reportErrors.description}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                <Label
                                    htmlFor="evidences"
                                    className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                >
                                    Supporting Evidence
                                </Label>
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                            <Activity className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                Upload evidence files
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Max 5 files (JPG, PNG, PDF)
                                            </p>
                                        </div>
                                        <Input
                                            id="evidences"
                                            type="file"
                                            multiple
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) =>
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    evidences: Array.from(
                                                        e.target.files ?? [],
                                                    ).slice(0, 5),
                                                }))
                                            }
                                            className="h-10 cursor-pointer border-slate-200 bg-white transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:text-[10px] file:font-black file:tracking-widest file:text-white file:uppercase hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                        {reportForm.evidences.length > 0 && (
                                            <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                                                {reportForm.evidences.length}{' '}
                                                files selected
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setReportIncidentOpen(false)}
                            disabled={reportProcessing}
                            className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitReportIncident}
                            disabled={reportProcessing}
                            className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            {reportProcessing
                                ? 'Processing...'
                                : 'Submit Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ADMISSION SLIP MODAL */}
            <Dialog
                open={admissionSlipOpen}
                onOpenChange={(next) => {
                    if (admissionSlipProcessing) return;
                    setAdmissionSlipOpen(next);
                }}
            >
                <DialogContent className="flex max-h-[90vh] w-[96vw] max-w-2xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
                    <div className="relative bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-8 py-8 text-white">
                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
                        <div className="relative flex items-center gap-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-xl">
                                <ClipboardList className="h-8 w-8 text-blue-300" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                                    Request Admission Slip
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs font-medium text-blue-100/70">
                                    Submit your admission slip request for administrative review.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-8">
                        <form onSubmit={onSubmitAdmissionSlip} className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="student_name"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Student Name
                                    </Label>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {admissionSlipData.student_name || 'N/A'}
                                    </div>
                                    <p className="ml-1 text-[10px] text-slate-400">Auto-filled from your account</p>
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="program"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Program
                                    </Label>
                                    <Select
                                        value={admissionSlipData.program}
                                        onValueChange={(val) => setAdmissionSlipData('program', val)}
                                    >
                                        <SelectTrigger id="program" className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50">
                                            <SelectValue placeholder="Select program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Information Technology Program">Information Technology Program</SelectItem>
                                            <SelectItem value="Business Administration Program">Business Administration Program</SelectItem>
                                            <SelectItem value="Hospitality Management Program">Hospitality Management Program</SelectItem>
                                            <SelectItem value="Teacher Education Program">Teacher Education Program</SelectItem>
                                            <SelectItem value="Criminal Justice Education Program">Criminal Justice Education Program</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {admissionSlipErrors.program_year_level && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {admissionSlipErrors.program_year_level}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="year_level"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Year Level
                                    </Label>
                                    <Select
                                        value={admissionSlipData.year_level}
                                        onValueChange={(val) => setAdmissionSlipData('year_level', val)}
                                    >
                                        <SelectTrigger id="year_level" className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50">
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st Year">1st Year</SelectItem>
                                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                                            <SelectItem value="4th Year">4th Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="case_text"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Case / Reason Title
                                    </Label>
                                    <Input
                                        id="case_text"
                                        value={admissionSlipData.case_text}
                                        onChange={(e) =>
                                            setAdmissionSlipData(
                                                'case_text',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Briefly describe the case"
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {admissionSlipErrors.case_text && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {admissionSlipErrors.case_text}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="reason_text"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Reason / Details
                                    </Label>
                                    <Input
                                        id="reason_text"
                                        value={admissionSlipData.reason_text}
                                        onChange={(e) =>
                                            setAdmissionSlipData(
                                                'reason_text',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="More details about your request"
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {admissionSlipErrors.reason_text && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {admissionSlipErrors.reason_text}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="valid_until"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Valid Until
                                    </Label>
                                    <Input
                                        id="valid_until"
                                        type="date"
                                        value={admissionSlipData.valid_until}
                                        onChange={(e) =>
                                            setAdmissionSlipData(
                                                'valid_until',
                                                e.target.value,
                                            )
                                        }
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                    />
                                    {admissionSlipErrors.valid_until && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {admissionSlipErrors.valid_until}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    <DialogFooter className="gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAdmissionSlipOpen(false)}
                            disabled={admissionSlipProcessing}
                            className="rounded-xl px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            onClick={onSubmitAdmissionSlip}
                            disabled={admissionSlipProcessing}
                            className="rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            {admissionSlipProcessing
                                ? 'Submitting...'
                                : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="relative min-h-screen overflow-x-hidden bg-slate-50 transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Depth Layers - Mesh Gradients */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        {/* PREMIUM HERO SECTION */}
                        <div className="group relative overflow-hidden rounded-3xl bg-[#0b2d66] p-6 shadow-2xl sm:p-8">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/4 translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

                            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                                    <div className="group/avatar relative">
                                        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-400 opacity-20 blur transition duration-500 group-hover/avatar:opacity-50"></div>
                                        <Avatar className="relative h-20 w-20 rounded-2xl border-4 border-white/10 shadow-2xl ring-1 ring-white/20 transition-transform duration-500 group-hover/avatar:scale-105">
                                            <AvatarImage
                                                src={
                                                    authUser?.avatar ??
                                                    undefined
                                                }
                                                alt={displayName}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-2xl font-black text-white">
                                                {getInitials(displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-[#0b2d66] bg-emerald-500 shadow-lg"
                                            title="Online"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="space-y-0.5">
                                            <h1 className="text-2xl leading-tight font-black tracking-tight text-white sm:text-3xl">
                                                Welcome back,{' '}
                                                <span className="bg-gradient-to-r from-blue-200 to-indigo-100 bg-clip-text text-transparent">
                                                    {displayName.split(' ')[1]}
                                                </span>
                                                ! 👋
                                            </h1>
                                            <p className="max-w-md text-xs font-medium text-blue-100/70 sm:text-sm">
                                                Your academic journey is
                                                progressing well. Here's what's
                                                happening today.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                            <Badge
                                                variant="outline"
                                                className="gap-1.5 rounded-lg border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-md"
                                            >
                                                <GraduationCap className="h-3 w-3 text-blue-300" />
                                                {program}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="gap-1.5 rounded-lg border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-md"
                                            >
                                                <Clock className="h-3 w-3 text-blue-300" />
                                                ID: {studentId}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3 lg:items-end">
                                    <div className="w-full sm:w-64">
                                        <label className="mb-1.5 ml-1 block text-[10px] font-black tracking-[0.2em] text-blue-200/40 uppercase">
                                            Academic Session
                                        </label>
                                        <Select
                                            value={academicYear}
                                            onValueChange={setAcademicYear}
                                        >
                                            <SelectTrigger className="group h-11 w-full rounded-xl border-white/10 bg-white/5 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 transition-transform group-hover:scale-105">
                                                        <Calendar className="h-3.5 w-3.5 text-blue-200" />
                                                    </div>
                                                    <SelectValue
                                                        placeholder="Academic Year"
                                                        className="text-sm"
                                                    />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-white/10 bg-[#0b2d66] text-white backdrop-blur-2xl">
                                                <SelectItem
                                                    value="2024 - 2025"
                                                    className="rounded-lg py-2 text-sm focus:bg-white/10 focus:text-white"
                                                >
                                                    AY 2024 - 2025
                                                </SelectItem>
                                                <SelectItem
                                                    value="2023 - 2024"
                                                    className="rounded-lg py-2 text-sm focus:bg-white/10 focus:text-white"
                                                >
                                                    AY 2023 - 2024
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODERN STATISTIC CARDS */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            {stats.map((stat) => (
                                <Card
                                    key={stat.label}
                                    className={cn(
                                        'group relative overflow-hidden rounded-2xl border-none bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10 dark:bg-slate-900/40 dark:shadow-none',
                                        'before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity hover:before:opacity-100',
                                        stat.label === 'Active Incidents'
                                            ? 'before:from-rose-500/[0.03] before:to-transparent'
                                            : stat.label === 'Event Attendance'
                                                ? 'before:from-blue-500/[0.03] before:to-transparent'
                                                : 'before:from-purple-500/[0.03] before:to-transparent',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0 left-0 h-1 w-full opacity-40',
                                            stat.label === 'Active Incidents'
                                                ? 'bg-rose-500'
                                                : stat.label ===
                                                    'Event Attendance'
                                                    ? 'bg-blue-500'
                                                    : 'bg-purple-500',
                                        )}
                                    />
                                    <CardContent className="relative p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                        {stat.label}
                                                    </p>
                                                    <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                                        {stat.value}
                                                    </h3>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-tight uppercase backdrop-blur-md',
                                                        stat.label ===
                                                            'Active Incidents'
                                                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            : stat.label ===
                                                                'Event Attendance'
                                                                ? 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                : 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
                                                    )}
                                                >
                                                    <TrendingUp className="h-2 w-2" />
                                                    {stat.trend === '0'
                                                        ? 'Stable'
                                                        : `${stat.trend} this term`}
                                                </div>
                                            </div>
                                            <div
                                                className={cn(
                                                    'rounded-xl p-3 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6',
                                                    stat.theme.iconBg,
                                                    stat.theme.iconText,
                                                )}
                                            >
                                                {React.cloneElement(
                                                    stat.icon as React.ReactElement<{
                                                        className?: string;
                                                    }>,
                                                    { className: 'h-5 w-5' },
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-6 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                                                    {stat.sublabel}
                                                </span>
                                                <span className="text-[9px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
                                                    Progress
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 dark:border-white/5 dark:bg-white/5">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full transition-all duration-1000',
                                                        stat.label ===
                                                            'Active Incidents'
                                                            ? 'w-[15%] bg-gradient-to-r from-rose-400 to-rose-600'
                                                            : stat.label ===
                                                                'Event Attendance'
                                                                ? 'w-[65%] bg-gradient-to-r from-blue-400 to-blue-600'
                                                                : 'w-[40%] bg-gradient-to-r from-purple-400 to-purple-600',
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* MODERN QUICK ACTIONS GRID */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            {/* ACTION: REPORT INCIDENT */}
                            <div className="lg:col-span-1">
                                <Card
                                    onClick={() => setReportIncidentOpen(true)}
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-rose-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-rose-500/5 blur-3xl transition-colors group-hover:bg-rose-500/10" />
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-rose-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 dark:bg-rose-500/10 dark:text-rose-400">
                                                    <AlertTriangle className="h-7 w-7" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                        Report Incident
                                                    </h3>
                                                    <p className="text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                        Confidentially report
                                                        safety or security
                                                        concerns directly to the
                                                        Dean for review.
                                                    </p>
                                                </div>
                                                <Button className="group h-9 rounded-lg border border-rose-600 bg-rose-600 px-5 text-[10px] font-black tracking-[0.2em] text-white uppercase transition-all duration-300 hover:border-rose-300 hover:bg-rose-600 hover:shadow-[0_0_12px_rgba(251,113,133,0.8)] active:scale-95">
                                                    Begin Report
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ACTION: ADMISSION SLIP (Center) */}
                            <div className="flex justify-center lg:col-span-1">
                                <Card className="group relative w-full max-w-[420px] cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10 active:scale-[0.98] dark:bg-slate-900/40">
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-colors group-hover:bg-blue-500/10" />

                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-blue-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <ClipboardList className="h-7 w-7" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                        Admission Slip
                                                    </h3>
                                                    <p className="text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                        Request an admission
                                                        slip for administrative
                                                        review.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setAdmissionSlipOpen(
                                                            true,
                                                        );
                                                    }}
                                                    className="group !hover:bg-blue-600 !hover:text-white h-9 rounded-lg border border-blue-600 !bg-blue-600 px-5 text-[10px] font-black tracking-[0.2em] !text-white uppercase transition-all duration-300 hover:border-blue-300 hover:shadow-[0_0_12px_rgba(59,130,246,0.7)] active:scale-95"
                                                >
                                                    Request Slip
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ACTION: E-CERTIFICATES */}
                            <div className="lg:col-span-1">
                                <Card
                                    onClick={() =>
                                        router.visit(studentCertificates())
                                    }
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-emerald-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-colors group-hover:bg-emerald-500/10" />
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-emerald-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <Award className="h-7 w-7" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                        E-Certificates
                                                    </h3>
                                                    <p className="text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                        Access and download your
                                                        official participation
                                                        and achievement awards
                                                        earned.
                                                    </p>
                                                </div>
                                                <Button className="group !hover:bg-emerald-600 !hover:text-white h-9 rounded-lg border border-emerald-600 !bg-emerald-600 px-5 text-[10px] font-black tracking-[0.2em] !text-white uppercase transition-all duration-300 hover:border-emerald-300 hover:shadow-[0_0_12px_rgba(52,211,153,0.7)] active:scale-95">
                                                    View Awards
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* REFINED EVALUATIONS SECTION */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10 shadow-inner">
                                        <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                            Pending Evaluations
                                        </h2>
                                        <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                            Forms requiring attention
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-600 uppercase backdrop-blur-md dark:bg-blue-500/20 dark:text-blue-400">
                                    {evaluationRows.length} Active
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                {evaluationRows.map((evaluation) => (
                                    <Card
                                        key={evaluation.id}
                                        className="group overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/5 dark:bg-slate-900/40"
                                    >
                                        <div className="relative p-6">
                                            <div className="mb-6 flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl transition-transform duration-700 group-hover:scale-105">
                                                        <FileCheck className="h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0 space-y-0.5">
                                                        <h3 className="truncate text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                                                            {evaluation.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2 py-0.5 dark:border-white/5 dark:bg-white/5">
                                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                                    {
                                                                        evaluation.date
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
                                                    {evaluation.statusLabel}
                                                </Badge>
                                            </div>

                                            <div className="group/info relative mb-6 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 transition-opacity group-hover/info:opacity-20">
                                                    <Info className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <div className="relative z-10 flex items-start gap-3">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                                                        <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold tracking-tight text-slate-900 uppercase dark:text-white">
                                                            Est. Time: 2-3 mins
                                                        </p>
                                                        <p className="text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                                            Your honest feedback
                                                            directly impacts
                                                            campus development.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                className="h-10 w-full rounded-lg bg-slate-900 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md transition-all duration-500 hover:bg-blue-600 hover:text-white active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                                onClick={() =>
                                                    router.visit(
                                                        studentEvaluationShow(
                                                            Number(
                                                                evaluation.id,
                                                            ),
                                                        ),
                                                    )
                                                }
                                            >
                                                Start Evaluation
                                                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}

                                {evaluationRows.length === 0 && (
                                    <Card className="group/empty overflow-hidden rounded-2xl border-none bg-white/80 shadow-lg backdrop-blur-xl lg:col-span-2 dark:bg-slate-900/40">
                                        <CardContent className="relative py-16 text-center">
                                            {/* Decorative Background for Empty State */}
                                            <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[80px] transition-transform duration-1000 group-hover/empty:scale-110" />

                                            <div className="relative z-10">
                                                <div className="relative mx-auto mb-6 h-24 w-24">
                                                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-10 dark:bg-blue-900/20" />
                                                    <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-slate-50 shadow-xl dark:border-slate-700/50 dark:bg-slate-800/50">
                                                        <div className="absolute -top-1 -right-1 flex h-7 w-7 animate-bounce items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
                                                            <FileCheck className="h-3.5 w-3.5" />
                                                        </div>
                                                        <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                </div>
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <h3 className="text-xl font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                        All Caught Up!
                                                    </h3>
                                                    <p className="px-6 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                        Excellent work! You've
                                                        completed all pending
                                                        evaluations for now.
                                                    </p>
                                                    <div className="flex flex-col items-center justify-center gap-3 pt-6 sm:flex-row"></div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <StudentDashboardFooter />
            </div>
        </AppShell>
    );
}
