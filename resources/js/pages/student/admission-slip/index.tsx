import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import StudentLayout from '../components/StudentLayout';
import { StudentDashboardFooter } from '../components/StudentDashboardFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import {
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    PlusCircle,
    History,
    ShieldCheck,
    Calendar,
    User,
    GraduationCap,
    Send,
    RotateCcw,
    AlertCircle,
    QrCode,
    ChevronLeft,
    Home,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { BreadcrumbItem, SharedData } from '@/types';
import { studentAdmissionSlipIndex, studentDashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: studentDashboard() },
    { title: 'Admission Slip', href: studentAdmissionSlipIndex() },
];

interface MonthlyQuota {
    used: number;
    limit: number;
    remaining: number;
    month: string;
}

interface AdmissionSlipRecord {
    id: number;
    student_id?: number | string;
    student_name: string;
    program_year_level?: string;
    date_issued: string;
    valid_until: string;
    case_text: string;
    reason_text: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    created_at?: string;
    slip_count?: string;
    all_time_slip_count?: string;
    monthly_slip_count?: number;
}

interface Props {
    slips?: AdmissionSlipRecord[];
    monthlyQuota?: MonthlyQuota;
}

export default function StudentAdmissionSlipIndex({
    slips = [],
    monthlyQuota = { used: 0, limit: 3, remaining: 3, month: 'Current Month' },
}: Props) {
    const { auth, errors: pageErrors } = usePage<SharedData>().props;
    const authUser = auth?.user;
    const errors = (pageErrors as Record<string, string>) || {};

    const userRole = (authUser as any)?.role;
    const dashboardUrl = useMemo(() => {
        if (userRole === 'admin') return '/admin-dashboard';
        if (userRole === 'program_head') return '/program-head-dashboard';
        if (userRole === 'dsa') return '/dsa-dashboard';
        return studentDashboard();
    }, [userRole]);

    const dynamicBreadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            { title: 'Dashboard', href: dashboardUrl },
            { title: 'Admission Slip', href: studentAdmissionSlipIndex() },
        ],
        [dashboardUrl],
    );

    const handleBack = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (
            window.history.length > 1 &&
            document.referrer &&
            document.referrer.includes(window.location.host)
        ) {
            window.history.back();
        } else {
            router.visit(dashboardUrl);
        }
    };

    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const todayPlus7 = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    }, []);

    const resolvedUserId = (authUser as any)?.student_id || (authUser?.id ? String(authUser.id) : '');
    const resolvedName = authUser?.name || '';
    const resolvedProgram = (authUser as any)?.course || (authUser as any)?.program || '';
    const resolvedYear = (authUser as any)?.year_level || '';
    const resolvedProgramYear = [resolvedProgram, resolvedYear].filter(Boolean).join(' ');

    const [caseText, setCaseText] = useState('');
    const [reasonText, setReasonText] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [dateIssued, setDateIssued] = useState(today);
    const [processing, setProcessing] = useState(false);
    const [selectedSlipForQr, setSelectedSlipForQr] = useState<AdmissionSlipRecord | null>(null);

    const reasonTitles = [
        'Absence due to Illness',
        'Medical / Dental Checkup',
        'Family Emergency',
        'Bereavement',
        'Late Enrollment / Payment',
        'Official School Activity',
        'Transportation Problem',
        'Bad Weather / Calamity',
        'Others',
    ];

    const standardReasons = [
        'Illness / Not Feeling Well',
        'Medical / Dental Appointment',
        'Family Emergency',
        'Bereavement in the Family',
        'Transportation Problem',
        'Bad Weather / Calamity',
        'Official School Activity',
        'Financial Concern',
    ];

    const REASON_VALIDITY_DAYS: Record<string, number> = {
        'Illness / Not Feeling Well': 3,
        'Medical / Dental Appointment': 1,
        'Family Emergency': 3,
        'Bereavement in the Family': 7,
        'Transportation Problem': 1,
        'Bad Weather / Calamity': 2,
        'Official School Activity': 5,
        'Financial Concern': 3,
        'Others': 2,
    };

    const getValidityDays = (reason: string): number => {
        if (!reason) return 2;
        for (const [key, days] of Object.entries(REASON_VALIDITY_DAYS)) {
            if (reason.toLowerCase().includes(key.toLowerCase())) {
                return days;
            }
        }
        return 2;
    };

    const addDaysIso = (isoDate: string, days: number) => {
        const base = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(base.getTime())) return '';
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10);
    };

    const handleDateChange = (val: string) => {
        setDateIssued(val);
    };

    const handleReasonSelect = (r: string) => {
        if (reasonText === r) {
            setReasonText('');
        } else {
            setReasonText(r);
            setCustomReason('');
        }
    };

    const handleCustomReasonToggle = () => {
        if (reasonText === 'Others') {
            setReasonText('');
            setCustomReason('');
        } else {
            setReasonText('Others');
        }
    };

    const resetForm = () => {
        setCaseText('');
        setReasonText('');
        setCustomReason('');
        setDateIssued(today);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const finalReason =
            reasonText === 'Others'
                ? `Others: ${customReason.trim()}`
                : reasonText.trim();

        const valErrors: string[] = [];
        if (monthlyQuota.used >= monthlyQuota.limit) {
            valErrors.push(
                `Monthly quota limit reached: You have already used ${monthlyQuota.limit} admission slips for ${monthlyQuota.month}.`,
            );
        }
        if (!finalReason || finalReason === 'Others:')
            valErrors.push('Please select or specify a reason for absence');
        if (!dateIssued.trim()) valErrors.push('Date issued is required');

        if (valErrors.length) {
            Swal.fire({
                title: 'Cannot Submit Request',
                html: valErrors.map((err) => `• ${err}`).join('<br/>'),
                icon: 'warning',
                confirmButtonColor: '#0b2d66',
                confirmButtonText: 'Review Form',
            });
            return;
        }

        Swal.fire({
            title: 'Submit Admission Slip Request?',
            text: 'Are you sure you want to submit this official clearance request to the Office of Student Affairs?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0b2d66',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Submit Request',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                setProcessing(true);
                router.post(
                    '/student/admission-slip',
                    {
                        student_id: resolvedUserId,
                        student_name: resolvedName,
                        program_year_level: resolvedProgramYear,
                        date_issued: dateIssued.trim(),
                        case_text: finalReason,
                        reason_text: finalReason,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            resetForm();
                            setActiveTab('history');
                            Swal.fire({
                                title: 'Request Submitted!',
                                text: 'Your admission slip request was successfully sent to the Office of Student Affairs for review.',
                                icon: 'success',
                                confirmButtonColor: '#0b2d66',
                            });
                        },
                        onError: (errs) => {
                            const errorMsg =
                                Object.values(errs)[0] ||
                                'Failed to submit admission slip. Please try again.';
                            Swal.fire({
                                title: 'Submission Error',
                                text: String(errorMsg),
                                icon: 'error',
                                confirmButtonColor: '#0b2d66',
                            });
                        },
                        onFinish: () => {
                            setProcessing(false);
                        },
                    },
                );
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const s = (status || 'PENDING').toUpperCase();
        if (s === 'APPROVED') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approved
                </span>
            );
        }
        if (s === 'REJECTED') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Rejected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                Pending Review
            </span>
        );
    };

    return (
        <StudentLayout breadcrumbs={dynamicBreadcrumbs}>
            <Head title="Admission Slip Clearance" />

            <div className="mx-auto max-w-5xl px-3 pt-4 pb-16 sm:px-6 lg:px-8">
                {/* BACK BUTTON & BREADCRUMB NAVIGATION */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="group inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                            <ChevronLeft className="h-4 w-4 text-slate-500 transition-transform group-hover:-translate-x-0.5 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                            <span>Back to Dashboard</span>
                        </button>

                        {/* Breadcrumbs Trail */}
                        <nav
                            aria-label="Breadcrumb"
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"
                        >
                            <span className="text-slate-300 dark:text-slate-600">
                                /
                            </span>
                            <Link
                                href={dashboardUrl}
                                className="flex items-center gap-1 text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                            >
                                <Home className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Dashboard
                                </span>
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">
                                /
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                Admission Slip
                            </span>
                        </nav>
                    </div>

                    {/* Official Portal Indicator */}
                    <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-50/80 px-3 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Office of Student Affairs</span>
                    </div>
                </div>

                {/* HERO HEADER */}
                <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
                    <div className="pointer-events-none absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-blue-400/15 blur-2xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-md">
                                <FileText className="h-7 w-7 text-blue-200" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                    Admission Slip Clearance
                                </h1>
                                <p className="mt-0.5 text-xs font-medium text-blue-100/80 sm:text-sm">
                                    Official class re-entry request following absences or infractions.
                                </p>
                            </div>
                        </div>

                        {/* TAB TOGGLES */}
                        <div className="grid w-full grid-cols-2 rounded-2xl border border-white/20 bg-black/20 p-1 backdrop-blur-md sm:flex sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('form')}
                                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black tracking-wider uppercase transition-all sm:px-4 ${
                                    activeTab === 'form'
                                        ? 'bg-white text-blue-950 shadow-md'
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>New Request</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black tracking-wider uppercase transition-all sm:px-4 ${
                                    activeTab === 'history'
                                        ? 'bg-white text-blue-950 shadow-md'
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                <History className="h-4 w-4" />
                                <span>My History ({slips.length})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAB 1: NEW REQUEST FORM (NATIVE INLINE, NO MODAL) */}
                {activeTab === 'form' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* STUDENT INFO BADGE STRIP */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                            Student Name & ID
                                        </div>
                                        <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                            {resolvedName || 'N/A'}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            ID: {resolvedUserId || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                            Program & Year
                                        </div>
                                        <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                            {resolvedProgram || 'General Education'}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {resolvedYear ? `Year ${resolvedYear}` : 'Enrolled'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                            Validity Period
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {reasonText
                                                ? `Estimated: ${addDaysIso(dateIssued, getValidityDays(reasonText))}`
                                                : 'Set upon approval'}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {reasonText
                                                ? `Standard ${getValidityDays(reasonText)}-day validity (Adjustable by Admin)`
                                                : 'Assigned by OSA Admin'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3-QUOTA TRACKING BANNER */}
                            <div
                                className={`overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                                    monthlyQuota.used >= monthlyQuota.limit
                                        ? 'border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40'
                                        : monthlyQuota.used === 2
                                          ? 'border-amber-300 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/40'
                                          : 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-md ${
                                                monthlyQuota.used >= monthlyQuota.limit
                                                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                                                    : monthlyQuota.used === 2
                                                      ? 'bg-amber-500 text-white shadow-amber-500/30'
                                                      : 'bg-blue-600 text-white shadow-blue-600/30'
                                            }`}
                                        >
                                            {monthlyQuota.used}/{monthlyQuota.limit}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                                    Monthly Admission Quota
                                                </span>
                                                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {monthlyQuota.month}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {monthlyQuota.used >= monthlyQuota.limit ? (
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                                        Quota Limit Reached: Maximum of 3 slips per month reached. Additional requests require direct OSA office clearance.
                                                    </span>
                                                ) : (
                                                    <span>
                                                        You have{' '}
                                                        <strong className="font-bold text-blue-600 dark:text-blue-400">
                                                            {monthlyQuota.remaining} of {monthlyQuota.limit}
                                                        </strong>{' '}
                                                        slips available this calendar month.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3 Quota Indicator Slots */}
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        {[1, 2, 3].map((slot) => {
                                            const isUsed = slot <= monthlyQuota.used;
                                            return (
                                                <div
                                                    key={slot}
                                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase transition-all shadow-xs ${
                                                        isUsed
                                                            ? 'border border-rose-300 bg-rose-600 text-white dark:border-rose-700'
                                                            : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <span>Slip #{slot}</span>
                                                    <span>{isUsed ? '✓' : '—'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* MAIN FORM CARD */}
                            <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                <CardContent className="space-y-6 p-6 sm:p-8">
                                    {/* DATES GRID */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="dateIssued"
                                                className="text-xs font-black tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                            >
                                                Date Issued / Return Date *
                                            </Label>
                                            <Input
                                                id="dateIssued"
                                                type="date"
                                                value={dateIssued}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 px-4 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
                                            />
                                            <InputError message={errors.date_issued} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="validUntil"
                                                className="text-xs font-black tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                            >
                                                Valid Until
                                            </Label>
                                            <Input
                                                id="validUntil"
                                                type="text"
                                                value="To be set by Admin"
                                                readOnly
                                                className="h-12 cursor-not-allowed rounded-2xl border-slate-200 bg-slate-100 px-4 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* REASON CATEGORY DROPDOWN */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="reasonSelect"
                                                className="text-xs font-black tracking-wider text-slate-600 uppercase dark:text-slate-300"
                                            >
                                                Admission Slip Reason *
                                            </Label>
                                            {reasonText && (
                                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                                    Selected: {reasonText}
                                                </span>
                                            )}
                                        </div>

                                        <select
                                            id="reasonSelect"
                                            value={reasonText}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setReasonText(val);
                                                if (val !== 'Others') {
                                                    setCustomReason('');
                                                }
                                            }}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
                                        >
                                            <option value="">-- Select admission slip reason --</option>
                                            {standardReasons.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                            <option value="Others">Others / Custom Reason (Specify below)</option>
                                        </select>
                                        <InputError message={errors.reason_text} />

                                        {reasonText && (
                                            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3.5 py-2 text-xs font-medium text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                                                <Clock className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                                <span>
                                                    Institutional Policy: <strong>{getValidityDays(reasonText)} days</strong> validity (Estimated valid until <strong>{addDaysIso(dateIssued, getValidityDays(reasonText))}</strong>). Final validity can be adjusted by the OSA Admin.
                                                </span>
                                            </div>
                                        )}

                                        {/* CUSTOM REASON TEXTAREA (Shown when Others is chosen) */}
                                        {reasonText === 'Others' && (
                                            <div className="mt-3 animate-in space-y-2 duration-200 fade-in">
                                                <Label
                                                    htmlFor="customReason"
                                                    className="text-xs font-bold text-slate-600 dark:text-slate-300"
                                                >
                                                    Please Describe Your Reason Details *
                                                </Label>
                                                <textarea
                                                    id="customReason"
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    placeholder="Specify detailed explanation of the reason for absence..."
                                                    rows={3}
                                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* NOTICE INFO */}
                                    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs font-medium text-blue-900 dark:border-blue-950/60 dark:bg-blue-950/30 dark:text-blue-200">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                        <p>
                                            By submitting this request, you certify that the information provided is accurate and complies with the Student Code of Conduct. Once approved by OSA, your digital admission pass will be available under <strong>My History</strong>.
                                        </p>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            disabled={processing}
                                            className="h-12 rounded-2xl border-slate-200 px-6 text-xs font-bold tracking-wider text-slate-600 uppercase hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reset Form
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                monthlyQuota.used >= monthlyQuota.limit
                                            }
                                            className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <>
                                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                    Submitting Request...
                                                </>
                                            ) : monthlyQuota.used >= monthlyQuota.limit ? (
                                                <>
                                                    <AlertCircle className="mr-2 h-4 w-4" />
                                                    Monthly Limit Reached (3/3)
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Submit Admission Request
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                )}

                {/* TAB 2: MY REQUEST HISTORY */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {slips.length === 0 ? (
                            <Card className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                    No Admission Slips Requested Yet
                                </h3>
                                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                    You have not submitted any admission slip requests. When you request a clearance slip, it will appear here with its real-time review status.
                                </p>
                                <Button
                                    onClick={() => setActiveTab('form')}
                                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Create New Request
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {slips.map((slip) => {
                                    const isApproved = (slip.status || '').toUpperCase() === 'APPROVED';
                                    return (
                                        <Card
                                            key={slip.id}
                                            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800/80">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                            Slip #{slip.id}
                                                        </span>
                                                        {slip.slip_count && (
                                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                                {slip.slip_count}
                                                            </span>
                                                        )}
                                                        {slip.all_time_slip_count && (
                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                {slip.all_time_slip_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
                                                        {slip.case_text}
                                                    </h3>
                                                </div>
                                                <div>{getStatusBadge(slip.status)}</div>
                                            </div>

                                            <CardContent className="space-y-3 p-5">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                        Reason / Details
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {slip.reason_text}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                            Date Issued
                                                        </div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {slip.date_issued}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                            Valid Until
                                                        </div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {slip.valid_until || 'To be set by Admin'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isApproved && (
                                                    <div className="pt-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => setSelectedSlipForQr(slip)}
                                                            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                            Show Verification QR / Pass
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* QR CODE POPUP MODAL FOR APPROVED PASSES */}
            {selectedSlipForQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Verified Clearance
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedSlipForQr(null)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mx-auto my-4 flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                            <div className="text-center">
                                <QrCode className="mx-auto h-28 w-28 text-emerald-600 dark:text-emerald-400" />
                                <div className="mt-2 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                    SLIP-{selectedSlipForQr.id}-{selectedSlipForQr.student_id || 'VERIFIED'}
                                </div>
                            </div>
                        </div>

                        <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {selectedSlipForQr.student_name}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {selectedSlipForQr.case_text}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Valid Until: {selectedSlipForQr.valid_until || 'To be set by Admin'}
                        </p>

                        <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
                            Present this digital clearance QR to your instructor for class entry.
                        </p>

                        <Button
                            type="button"
                            onClick={() => setSelectedSlipForQr(null)}
                            className="mt-5 h-10 w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        >
                            Close Pass
                        </Button>
                    </div>
                </div>
            )}

            <StudentDashboardFooter />
        </StudentLayout>
    );
}
