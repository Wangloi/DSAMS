import { AppShell } from '@/components/app-shell';
import StudentProfileCompletionModal from '@/components/StudentProfileCompletionModal';
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
import Swal from 'sweetalert2';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import {
    studentAdmissionSlipStore,
    studentAttendanceDynamicQrScan,
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
    Check,
    ChevronRight,
    ClipboardList,
    Clock,
    FileCheck,
    FileText,
    GraduationCap,
    Info,
    QrCode,
    ScanLine,
    TrendingUp,
    UserRoundCog,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

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
    scanner_portal_active?: boolean;
};

type ProgramOption = {
    id: number;
    name: string;
    code: string;
    department: string;
};

const placeOptions = [
    'Main Gate',
    'Gate 1',
    'Back Gate',
    'Cafeteria',
    'Canteen',
    'Gymnasium',
    'Back of Gym',
    'Outer Ground',
    'Inner Ground',
    'Parents Lounge',
    'Chapel',
    'College Library',
    'Dean of Students Affairs',
    'Registrar',
    'Finance - Cashier',
    'School Clinic',
    'Guidance Office',
    'IT Laboratory',
    'Computer Laboratory',
    'Speech Laboratory',
    'Audio Visual Room',
    'Lecture Room 101',
    'Room 101',
    'Room 205',
    'Room 302',
    'CR Room 302',
];

type Props = {
    user?: User;
    stats?: {
        active_incidents: number;
        event_attendance: number;
        pending_evaluations: number;
    };
    evaluations?: EvaluationRow[];
    events?: EventRecord[];
    violations?: Array<{
        id: number;
        name: string;
        section: string;
    }>;
    programs?: ProgramOption[];
};

export default function StudentDashboard({
    user,
    stats: serverStats,
    evaluations: serverEvaluations,
    events = [],
    violations = [],
    programs: serverPrograms = [],
}: Props) {
    const page = usePage();
    const getInitials = useInitials();

    const props = page.props as unknown as SharedData;
    const authUser = props?.auth?.user ?? user;

    // Profile completion gate — true when the student hasn't filled in personal info yet
    const needsProfileCompletion = !!(page.props as any)
        ?.needsProfileCompletion;

    const status =
        (page.props as any)?.status ||
        (page.props as any)?.flash?.status ||
        (page.props as any)?.flash?.success;

    React.useEffect(() => {
        if (status) {
            Swal.fire({
                title: 'Success!',
                text: status,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }, [status]);

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

    const activeEvents = events.filter((e) => e.scanner_portal_active);

    // Resolve the student's course code to the full program name from the programs table
    const studentCourse = ((authUser as any)?.course ?? '').trim();
    const resolvedProgram = useMemo(() => {
        if (!studentCourse || serverPrograms.length === 0) return null;
        const courseKey = studentCourse.toLowerCase();
        return (
            serverPrograms.find(
                (p) =>
                    p.code.toLowerCase() === courseKey ||
                    p.name.toLowerCase() === courseKey,
            ) ?? null
        );
    }, [studentCourse, serverPrograms]);

    const autoFilledProgram = resolvedProgram
        ? `${resolvedProgram.code} — ${resolvedProgram.name}`
        : studentCourse || 'N/A';

    const autoFilledDepartment = resolvedProgram?.department ?? '';

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
        valid_until: new Date().toLocaleDateString('en-CA'),
    });

    const [reportProcessing, setReportProcessing] = useState(false);
    const [reportErrors, setReportErrors] = useState<Record<string, string>>(
        {},
    );
    const [reportForm, setReportForm] = useState({
        violation_id: null as number | null,
        incident_type: '',
        incident_date: '',
        incident_time: '',
        location: '',
        reported_by: '',
        students_involved: [] as Array<{ id: string; name: string }>,
        classification: 'Warning' as
            | 'Warning'
            | 'Suspension'
            | 'Exclusion'
            | 'Expulsion',
        description: '',
        evidences: [] as File[],
    });

    const hasCustomPlace = useMemo(() => {
        return (
            Boolean(reportForm.location) &&
            !placeOptions.includes(reportForm.location)
        );
    }, [reportForm.location]);

    const [studentDraft, setStudentDraft] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [students, setStudents] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<
        typeof setTimeout
    > | null>(null);
    const searchAbortControllerRef = useRef<AbortController | null>(null);
    const [reportStep, setReportStep] = useState(1);

    const searchStudentsFromDB = async (
        query: string,
    ): Promise<Array<{ id: string; name: string }>> => {
        if (!query.trim()) return [];

        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        searchAbortControllerRef.current = abortController;

        setLoadingStudents(true);
        try {
            const response = await fetch(
                `/student/students/search?q=${encodeURIComponent(query.trim())}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: abortController.signal,
                },
            );

            if (response.ok) {
                const data = await response.json();
                return data.students || [];
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Error searching students:', error);
            }
        } finally {
            setLoadingStudents(false);
            if (searchAbortControllerRef.current === abortController) {
                searchAbortControllerRef.current = null;
            }
        }

        return [];
    };

    const handleStudentInputChange = (value: string) => {
        setStudentDraft(value);
        setShowSuggestions(value.trim().length > 0);
        setSelectedSuggestionIndex(0);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (value.trim().length > 0) {
            const timeout = setTimeout(() => {
                searchStudentsFromDB(value).then((results) => {
                    setStudents(results);
                });
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setStudents([]);
        }
    };

    const searchStudents = (
        query: string,
    ): Array<{ id: string; name: string }> => {
        if (!query.trim() || students.length === 0) return [];

        const trimmed = query.trim().toLowerCase();

        if (/^\d+$/.test(trimmed)) {
            return students.filter((student) =>
                student.id.toLowerCase().includes(trimmed),
            );
        }

        return students.filter((student) =>
            student.name.toLowerCase().includes(trimmed),
        );
    };

    const suggestions = useMemo(() => {
        return searchStudents(studentDraft);
    }, [studentDraft, students]);

    const addStudent = (student: { id: string; name: string }) => {
        if (reportForm.students_involved.some((s) => s.id === student.id)) {
            return;
        }

        setReportForm((prev) => ({
            ...prev,
            students_involved: [...prev.students_involved, student],
        }));
        setStudentDraft('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(0);
    };

    const removeStudent = (studentId: string) => {
        setReportForm((prev) => ({
            ...prev,
            students_involved: prev.students_involved.filter(
                (s) => s.id !== studentId,
            ),
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter' && studentDraft.trim()) {
                e.preventDefault();
                const trimmed = studentDraft.trim();
                if (/^\d+$/.test(trimmed)) {
                    const student = students.find((s) => s.id === trimmed);
                    if (
                        student &&
                        !reportForm.students_involved.some(
                            (s) => s.id === student.id,
                        )
                    ) {
                        addStudent(student);
                    }
                } else {
                    const student = students.find(
                        (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
                    );
                    if (
                        student &&
                        !reportForm.students_involved.some(
                            (s) => s.id === student.id,
                        )
                    ) {
                        addStudent(student);
                    }
                }
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1,
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (suggestions[selectedSuggestionIndex]) {
                    addStudent(suggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(0);
                break;
        }
    };

    const submitReportIncident = () => {
        setReportProcessing(true);

        setReportErrors({});

        router.post(
            studentIncidentsStore(),
            {
                violation_id: reportForm.violation_id,
                incident_type: reportForm.incident_type,
                incident_date: reportForm.incident_date,
                incident_time: reportForm.incident_time,
                location: reportForm.location,
                reported_by: reportForm.reported_by,
                students_involved: reportForm.students_involved,
                classification: reportForm.classification,
                description: reportForm.description,
                evidences: reportForm.evidences,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setReportIncidentOpen(false);
                    setReportStep(1);
                    setReportForm({
                        violation_id: null,
                        incident_type: '',
                        incident_date: '',
                        incident_time: '',
                        location: '',
                        reported_by: '',
                        students_involved: [],
                        classification: 'Warning',
                        description: '',
                        evidences: [],
                    });
                    setStudentDraft('');
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(0);
                    setStudents([]);
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

        // Combine resolved program name + year_level into program_year_level for submission
        const programName = resolvedProgram?.name ?? admissionSlipData.program;
        const combined = [programName, admissionSlipData.year_level]
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
                    setAdmissionSlipData(
                        'student_name',
                        (authUser as any)?.name ?? '',
                    );
                    setAdmissionSlipData(
                        'program',
                        (authUser as any)?.course ?? '',
                    );
                    setAdmissionSlipData(
                        'year_level',
                        (authUser as any)?.year_level ?? '',
                    );
                    setAdmissionSlipOpen(false);
                },
            },
        );
    };

    return (
        <AppShell>
            {/* Profile completion gate — non-dismissible until student fills in personal info */}
            <StudentProfileCompletionModal
                isOpen={needsProfileCompletion}
                onComplete={() => window.location.reload()}
            />

            {/* Pending Evaluations Gate Modal */}
            {!needsProfileCompletion && evaluationRows.length > 0 && (
                <div className="fixed inset-0 z-[90] flex animate-in items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md duration-300 fade-in">
                    <div className="relative flex w-full max-w-lg animate-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl duration-300 zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
                        {/* Background Decorations */}
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-rose-500/10 blur-xl" />
                        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-xl" />

                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/30">
                            <ClipboardList className="h-8 w-8 animate-bounce" />
                        </div>

                        <h2 className="mt-5 animate-pulse text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Pending Evaluation Required
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            To ensure high-quality student services and events,
                            you are required to complete all pending event
                            evaluations before accessing the system.
                        </p>

                        <div className="mt-6 max-h-[30vh] space-y-3 overflow-y-auto pr-1">
                            {evaluationRows.map((evaluation) => (
                                <div
                                    key={evaluation.id}
                                    className="dark:border-slate-850 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition-all hover:border-blue-500/30 dark:bg-slate-900/30"
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {evaluation.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Event Date:{' '}
                                            {evaluation.date || 'N/A'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            router.get(
                                                studentEvaluationShow(
                                                    evaluation.id,
                                                ),
                                            );
                                        }}
                                        className="h-8 shrink-0 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                                    >
                                        Start Evaluation
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800">
                            OSAMS • Office of Student Affairs
                        </div>
                    </div>
                </div>
            )}

            <StudentHeader />
            <Head title="Student Dashboard" />

            <Dialog
                open={reportIncidentOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setReportIncidentOpen(false);
                        setReportStep(1);
                        setReportForm({
                            violation_id: null,
                            incident_type: '',
                            incident_date: '',
                            incident_time: '',
                            location: '',
                            reported_by: '',
                            students_involved: [],
                            classification: 'Warning',
                            description: '',
                            evidences: [],
                        });
                        setStudentDraft('');
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(0);
                        setStudents([]);
                    } else {
                        setReportIncidentOpen(true);
                    }
                }}
            >
                <DialogContent className="overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-3xl dark:bg-[#0B192C] [&>button]:hidden">
                    {/* Hero Gradient Header */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-6 py-6 text-white shadow-md">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
                        <div className="relative z-10 flex flex-col gap-5">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <DialogHeader className="p-0 text-left">
                                    <DialogTitle className="text-xl font-black tracking-tight text-white">
                                        Report Incident
                                    </DialogTitle>
                                    <DialogDescription className="mt-0.5 text-xs font-medium text-blue-100/80">
                                        Provide details about the incident to
                                        create a new report.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            {/* Step Indicators */}
                            <div className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-3">
                                {[
                                    {
                                        label: 'General Info',
                                        icon: ClipboardList,
                                    },
                                    { label: 'Details', icon: Users },
                                    {
                                        label: 'Narrative & Evidence',
                                        icon: FileText,
                                    },
                                ].map((s, i) => {
                                    const num = i + 1;
                                    const isDone = num < reportStep;
                                    const isActive = num === reportStep;

                                    return (
                                        <div
                                            key={s.label}
                                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                                                isActive
                                                    ? 'bg-white font-bold text-[#1e3a8a] shadow-md'
                                                    : isDone
                                                      ? 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-200'
                                                      : 'bg-white/10 text-blue-100/60'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                                    isActive
                                                        ? 'bg-[#1e3a8a] text-white'
                                                        : isDone
                                                          ? 'bg-emerald-500 text-white'
                                                          : 'bg-white/20 text-white'
                                                }`}
                                            >
                                                {isDone ? (
                                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                ) : (
                                                    num
                                                )}
                                            </div>
                                            <div className="hidden min-w-0 sm:block">
                                                <p className="truncate text-[11px] font-bold">
                                                    {s.label}
                                                </p>
                                            </div>
                                            <span className="truncate text-[10px] font-semibold sm:hidden">
                                                {s.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[60vh] min-h-[300px] space-y-5 overflow-y-auto px-6 py-6">
                        {reportStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label className="text-slate-700 dark:text-slate-300">
                                            Violation{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={
                                                reportForm.violation_id
                                                    ? String(
                                                          reportForm.violation_id,
                                                      )
                                                    : ''
                                            }
                                            onValueChange={(v) => {
                                                const violation =
                                                    violations.find(
                                                        (x) =>
                                                            x.id === Number(v),
                                                    );
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    violation_id: violation
                                                        ? violation.id
                                                        : null,
                                                    incident_type: violation
                                                        ? violation.name
                                                        : prev.incident_type,
                                                    classification: violation
                                                        ? (violation.section as any)
                                                        : prev.classification,
                                                }));
                                            }}
                                            required
                                        >
                                            <SelectTrigger className="border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700">
                                                <SelectValue placeholder="Select violation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    'Warning',
                                                    'Suspension',
                                                    'Exclusion',
                                                    'Expulsion',
                                                ].map((section, idx, arr) => {
                                                    const sectionViolations =
                                                        violations.filter(
                                                            (v) =>
                                                                v.section ===
                                                                section,
                                                        );
                                                    if (
                                                        sectionViolations.length ===
                                                        0
                                                    )
                                                        return null;
                                                    return (
                                                        <React.Fragment
                                                            key={section}
                                                        >
                                                            <SelectGroup
                                                                key={section}
                                                            >
                                                                <SelectLabel className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                                    {section}{' '}
                                                                    Infractions
                                                                </SelectLabel>
                                                                {sectionViolations.map(
                                                                    (
                                                                        violation,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                violation.id
                                                                            }
                                                                            value={String(
                                                                                violation.id,
                                                                            )}
                                                                            className="pl-4"
                                                                        >
                                                                            {
                                                                                violation.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectGroup>
                                                            {idx <
                                                                arr.length -
                                                                    1 && (
                                                                <SelectSeparator
                                                                    key={`sep-${section}`}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="incident_date"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            Date of Incident{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="incident_date"
                                            type="date"
                                            value={reportForm.incident_date}
                                            onChange={(e) =>
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    incident_date:
                                                        e.target.value,
                                                }))
                                            }
                                            className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="incident_time"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            Time of Incident{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="incident_time"
                                            type="time"
                                            value={reportForm.incident_time}
                                            onChange={(e) =>
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    incident_time:
                                                        e.target.value,
                                                }))
                                            }
                                            className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2 md:col-span-2">
                                        <Label
                                            htmlFor="location"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            Location{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={reportForm.location}
                                            onValueChange={(v) =>
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    location: v,
                                                }))
                                            }
                                            required
                                        >
                                            <SelectTrigger
                                                id="location"
                                                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            >
                                                <SelectValue placeholder="Select place" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {hasCustomPlace && (
                                                    <SelectItem
                                                        value={
                                                            reportForm.location
                                                        }
                                                    >
                                                        {reportForm.location}
                                                    </SelectItem>
                                                )}
                                                {placeOptions.map((place) => (
                                                    <SelectItem
                                                        key={place}
                                                        value={place}
                                                    >
                                                        {place}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2 md:col-span-2">
                                        <Label
                                            htmlFor="reported_by"
                                            className="text-slate-700 dark:text-slate-300"
                                        >
                                            Reported By (Name/Position){' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="reported_by"
                                            value={reportForm.reported_by}
                                            onChange={(e) =>
                                                setReportForm((prev) => ({
                                                    ...prev,
                                                    reported_by: e.target.value,
                                                }))
                                            }
                                            placeholder="Your name and position"
                                            className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {reportStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="incident_type"
                                        className="text-slate-700 dark:text-slate-300"
                                    >
                                        Incident Summary{' '}
                                        <span className="text-red-500">*</span>
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
                                        placeholder="Brief summary of what happened..."
                                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="students_involved"
                                        className="text-slate-700 dark:text-slate-300"
                                    >
                                        Students Involved{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="students_involved"
                                            placeholder={
                                                loadingStudents
                                                    ? 'Loading students...'
                                                    : 'Enter student ID or name...'
                                            }
                                            value={studentDraft}
                                            onChange={(e) =>
                                                handleStudentInputChange(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={handleKeyDown}
                                            onFocus={() => {
                                                setShowSuggestions(
                                                    studentDraft.trim().length >
                                                        0,
                                                );
                                            }}
                                            className="border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                        />

                                        {showSuggestions &&
                                        suggestions.length > 0 &&
                                        !loadingStudents ? (
                                            <div
                                                className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700"
                                                onMouseLeave={() =>
                                                    setShowSuggestions(false)
                                                }
                                            >
                                                {suggestions.map(
                                                    (student, index) => (
                                                        <div
                                                            key={student.id}
                                                            className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 ${
                                                                index ===
                                                                selectedSuggestionIndex
                                                                    ? 'bg-slate-100 dark:bg-slate-600'
                                                                    : ''
                                                            }`}
                                                            onClick={() =>
                                                                addStudent(
                                                                    student,
                                                                )
                                                            }
                                                            onMouseEnter={() =>
                                                                setSelectedSuggestionIndex(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {student.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                ID: {student.id}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    {reportForm.students_involved.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {reportForm.students_involved.map(
                                                (student) => (
                                                    <Badge
                                                        key={student.id}
                                                        variant="secondary"
                                                        className="gap-1 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                                    >
                                                        {student.name} (
                                                        {student.id})
                                                        <button
                                                            type="button"
                                                            className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                                            onClick={() =>
                                                                removeStudent(
                                                                    student.id,
                                                                )
                                                            }
                                                            aria-label={`Remove ${student.name}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    ) : null}

                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Start typing a student ID or name to see
                                        suggestions. Use arrow keys to navigate,
                                        Enter to select.
                                    </div>
                                </div>
                            </div>
                        )}

                        {reportStep === 3 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="description"
                                        className="font-semibold tracking-wider text-slate-800 uppercase dark:text-slate-200"
                                    >
                                        Narrative of the Incident{' '}
                                        <span className="text-red-500">*</span>
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
                                        rows={4}
                                        placeholder="Please provide a detailed narrative of the incident..."
                                        className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:focus-visible:ring-slate-300"
                                        required
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="evidences"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Supporting Evidence
                                    </Label>
                                    <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
                                                            e.target.files ??
                                                                [],
                                                        ).slice(0, 5),
                                                    }))
                                                }
                                                className="h-10 cursor-pointer border-slate-200 bg-white transition-all file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:text-[10px] file:font-semibold file:text-white file:uppercase hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-800"
                                            />
                                            {reportForm.evidences.length >
                                                0 && (
                                                <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                                                    {
                                                        reportForm.evidences
                                                            .length
                                                    }{' '}
                                                    files selected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="dark:border-slate-850 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                            {reportStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    onClick={() =>
                                        setReportStep((prev) => prev - 1)
                                    }
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                onClick={() => setReportIncidentOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {reportStep < 3 ? (
                                <Button
                                    type="button"
                                    className="h-10 rounded-xl bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] px-5 font-bold text-white shadow-md hover:opacity-90"
                                    onClick={() =>
                                        setReportStep((prev) => prev + 1)
                                    }
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    className="h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 font-bold text-white shadow-md hover:opacity-90"
                                    disabled={reportProcessing}
                                    onClick={submitReportIncident}
                                >
                                    {reportProcessing
                                        ? 'Processing...'
                                        : 'Submit Report'}
                                </Button>
                            )}
                        </div>
                    </div>
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
                                    Submit your admission slip request for
                                    administrative review.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-8">
                        <form
                            onSubmit={onSubmitAdmissionSlip}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2.5 md:col-span-2">
                                    <Label
                                        htmlFor="student_name"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Student Name
                                    </Label>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {admissionSlipData.student_name ||
                                            'N/A'}
                                    </div>
                                    <p className="ml-1 text-[10px] text-slate-400">
                                        Auto-filled from your account
                                    </p>
                                </div>

                                <div className="space-y-2.5">
                                    <Label
                                        htmlFor="program"
                                        className="ml-1 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400"
                                    >
                                        Department / Program
                                    </Label>
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {autoFilledProgram}
                                    </div>
                                    {autoFilledDepartment && (
                                        <p className="ml-1 text-[10px] text-slate-400">
                                            Department:{' '}
                                            <span className="font-semibold text-slate-500 dark:text-slate-300">
                                                {autoFilledDepartment}
                                            </span>
                                        </p>
                                    )}
                                    {!autoFilledDepartment && (
                                        <p className="ml-1 text-[10px] text-slate-400">
                                            Auto-filled from your account
                                        </p>
                                    )}
                                    {admissionSlipErrors.program_year_level && (
                                        <div className="ml-1 text-[11px] font-bold text-rose-500">
                                            {
                                                admissionSlipErrors.program_year_level
                                            }
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
                                        onValueChange={(val) =>
                                            setAdmissionSlipData(
                                                'year_level',
                                                val,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="year_level"
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800/50"
                                        >
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st Year">
                                                1st Year
                                            </SelectItem>
                                            <SelectItem value="2nd Year">
                                                2nd Year
                                            </SelectItem>
                                            <SelectItem value="3rd Year">
                                                3rd Year
                                            </SelectItem>
                                            <SelectItem value="4th Year">
                                                4th Year
                                            </SelectItem>
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
                                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {new Date().toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            },
                                        )}
                                    </div>
                                    <input
                                        type="hidden"
                                        id="valid_until"
                                        value={admissionSlipData.valid_until}
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

                <div className="relative z-10 mx-auto max-w-7xl px-3 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8">
                    <div className="space-y-5 sm:space-y-8">
                        {/* PREMIUM HERO SECTION */}
                        <div className="group relative overflow-hidden rounded-2xl bg-[#0b2d66] p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/4 translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

                            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                                    <div className="group/avatar relative">
                                        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-400 opacity-20 blur transition duration-500 group-hover/avatar:opacity-50"></div>
                                        <Avatar className="relative h-14 w-14 rounded-2xl border-4 border-white/10 shadow-2xl ring-1 ring-white/20 transition-transform duration-500 group-hover/avatar:scale-105 sm:h-20 sm:w-20">
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
                                            <h1 className="text-xl leading-tight font-black tracking-tight text-white sm:text-2xl md:text-3xl">
                                                Welcome back,{' '}
                                                <span className="bg-gradient-to-r from-blue-200 to-indigo-100 bg-clip-text text-transparent">
                                                    {displayName.split(' ')[1]}
                                                </span>
                                                ! 👋
                                            </h1>
                                            <p className="hidden max-w-md text-xs font-medium text-blue-100/70 sm:block sm:text-sm">
                                                Your academic journey is
                                                progressing well. Here's what's
                                                happening today.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
                                            <Badge
                                                variant="outline"
                                                className="gap-1 rounded-md border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:text-[10px]"
                                            >
                                                <GraduationCap className="h-2.5 w-2.5 text-blue-300 sm:h-3 sm:w-3" />
                                                {program}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="gap-1 rounded-md border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase backdrop-blur-md sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:text-[10px]"
                                            >
                                                <Clock className="h-2.5 w-2.5 text-blue-300 sm:h-3 sm:w-3" />
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
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
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
                                    <CardContent className="relative p-3 sm:p-5">
                                        <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-0 sm:text-left">
                                            <div className="space-y-1 sm:space-y-2 sm:flex-1">
                                                <div className="space-y-0.5">
                                                    <p className="text-[7px] font-black tracking-[0.15em] text-slate-400 uppercase sm:text-[10px] sm:tracking-[0.2em] dark:text-slate-500">
                                                        {stat.label}
                                                    </p>
                                                    <h3 className="text-xl font-black tracking-tighter text-slate-900 sm:text-3xl dark:text-white">
                                                        {stat.value}
                                                    </h3>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-tight uppercase backdrop-blur-md sm:inline-flex',
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
                                                    'hidden rounded-xl p-3 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 sm:block',
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
                                        <div className="mt-3 hidden space-y-2 sm:mt-6 sm:block">
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
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
                            {/* ACTION: SCAN ATTENDANCE */}
                            <div>
                                <Card
                                    onClick={() => {
                                        if (activeEvents.length > 0) {
                                            router.visit(
                                                studentAttendanceDynamicQrScan(
                                                    activeEvents[0].id,
                                                ),
                                            );
                                        } else {
                                            Swal.fire({
                                                icon: 'info',
                                                title: 'No Active Sessions',
                                                text: 'There are no active attendance sessions at the moment.',
                                                confirmButtonColor: '#0b2d66',
                                            });
                                        }
                                    }}
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-violet-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl transition-colors group-hover:bg-violet-500/10" />
                                    <CardContent className="p-3 sm:p-6">
                                        <div className="flex flex-col items-center gap-3 text-center sm:gap-6">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-violet-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 sm:h-14 sm:w-14 dark:bg-violet-500/10 dark:text-violet-400">
                                                    <ScanLine className="h-5 w-5 sm:h-7 sm:w-7" />
                                                </div>
                                            </div>
                                            <div className="w-full flex-1 space-y-2 sm:space-y-4">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase sm:text-lg sm:tracking-wider dark:text-white">
                                                        Scan QR
                                                    </h3>
                                                    <p className="hidden text-xs leading-relaxed font-medium text-slate-500 sm:block dark:text-slate-400">
                                                        Check-in to an active
                                                        event session by
                                                        scanning the dynamic QR
                                                        code.
                                                    </p>
                                                </div>
                                                <Button
                                                    className="group h-7 w-full rounded-lg border border-violet-600 bg-violet-600 px-3 text-[8px] font-black tracking-[0.15em] text-white uppercase transition-all duration-300 hover:border-violet-300 hover:bg-violet-600 hover:shadow-[0_0_12px_rgba(139,92,246,0.8)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:px-5 sm:text-[10px] sm:tracking-[0.2em]"
                                                    disabled={
                                                        activeEvents.length ===
                                                        0
                                                    }
                                                >
                                                    {activeEvents.length > 0
                                                        ? 'Scan Now'
                                                        : 'No Active Session'}
                                                    {activeEvents.length >
                                                        0 && (
                                                        <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ACTION: REPORT INCIDENT */}
                            <div>
                                <Card
                                    onClick={() => setReportIncidentOpen(true)}
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-rose-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-rose-500/5 blur-3xl transition-colors group-hover:bg-rose-500/10" />
                                    <CardContent className="p-3 sm:p-6">
                                        <div className="flex flex-col items-center gap-3 text-center sm:gap-6">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-rose-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 sm:h-14 sm:w-14 dark:bg-rose-500/10 dark:text-rose-400">
                                                    <AlertTriangle className="h-5 w-5 sm:h-7 sm:w-7" />
                                                </div>
                                            </div>
                                            <div className="w-full flex-1 space-y-2 sm:space-y-4">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase sm:text-lg sm:tracking-wider dark:text-white">
                                                        Report Incident
                                                    </h3>
                                                    <p className="hidden text-xs leading-relaxed font-medium text-slate-500 sm:block dark:text-slate-400">
                                                        Confidentially report
                                                        safety or security
                                                        concerns directly to the
                                                        Dean for review.
                                                    </p>
                                                </div>
                                                <Button className="group h-7 w-full rounded-lg border border-rose-600 bg-rose-600 px-3 text-[8px] font-black tracking-[0.15em] text-white uppercase transition-all duration-300 hover:border-rose-300 hover:bg-rose-600 hover:shadow-[0_0_12px_rgba(251,113,133,0.8)] active:scale-95 sm:h-9 sm:px-5 sm:text-[10px] sm:tracking-[0.2em]">
                                                    Begin Report
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ACTION: ADMISSION SLIP */}
                            <div>
                                <Card
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setAdmissionSlipOpen(true);
                                    }}
                                    className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-colors group-hover:bg-blue-500/10" />
                                    <CardContent className="p-3 sm:p-6">
                                        <div className="flex flex-col items-center gap-3 text-center sm:gap-6">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-blue-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 sm:h-14 sm:w-14 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <ClipboardList className="h-5 w-5 sm:h-7 sm:w-7" />
                                                </div>
                                            </div>
                                            <div className="w-full flex-1 space-y-2 sm:space-y-4">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase sm:text-lg sm:tracking-wider dark:text-white">
                                                        Admission Slip
                                                    </h3>
                                                    <p className="hidden text-xs leading-relaxed font-medium text-slate-500 sm:block dark:text-slate-400">
                                                        Request an admission
                                                        slip for administrative
                                                        review.
                                                    </p>
                                                </div>
                                                <Button className="group h-7 w-full rounded-lg border border-blue-600 bg-blue-600 px-3 text-[8px] font-black tracking-[0.15em] text-white uppercase transition-all duration-300 hover:border-blue-300 hover:bg-blue-600 hover:shadow-[0_0_12px_rgba(59,130,246,0.7)] active:scale-95 sm:h-9 sm:px-5 sm:text-[10px] sm:tracking-[0.2em]">
                                                    Request Slip
                                                    <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ACTION: E-CERTIFICATES */}
                            <div>
                                <Card
                                    onClick={() =>
                                        router.visit(studentCertificates())
                                    }
                                    className="group relative cursor-pointer overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-emerald-500/10 active:scale-[0.98] dark:bg-slate-900/40"
                                >
                                    <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-colors group-hover:bg-emerald-500/10" />
                                    <CardContent className="p-3 sm:p-6">
                                        <div className="flex flex-col items-center gap-3 text-center sm:gap-6">
                                            <div className="relative">
                                                <div className="absolute -inset-3 rounded-full bg-emerald-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 sm:h-14 sm:w-14 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <Award className="h-5 w-5 sm:h-7 sm:w-7" />
                                                </div>
                                            </div>
                                            <div className="w-full flex-1 space-y-2 sm:space-y-4">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase sm:text-lg sm:tracking-wider dark:text-white">
                                                        E-Certificates
                                                    </h3>
                                                    <p className="hidden text-xs leading-relaxed font-medium text-slate-500 sm:block dark:text-slate-400">
                                                        Access and download your
                                                        official participation
                                                        and achievement awards
                                                        earned.
                                                    </p>
                                                </div>
                                                <Button className="group h-7 w-full rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-[8px] font-black tracking-[0.15em] text-white uppercase transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-600 hover:shadow-[0_0_12px_rgba(52,211,153,0.7)] active:scale-95 sm:h-9 sm:px-5 sm:text-[10px] sm:tracking-[0.2em]">
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
                        <div className="space-y-3 sm:space-y-5">
                            <div className="flex items-center justify-between px-0.5 sm:px-1">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10 shadow-inner sm:h-9 sm:w-9">
                                        <ClipboardList className="h-3.5 w-3.5 text-blue-600 sm:h-4.5 sm:w-4.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase sm:text-base dark:text-white">
                                            Pending Evaluations
                                        </h2>
                                        <p className="mt-0.5 hidden text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase sm:block dark:text-slate-500">
                                            Forms requiring attention
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-600 uppercase backdrop-blur-md dark:bg-blue-500/20 dark:text-blue-400">
                                    {evaluationRows.length} Active
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-2">
                                {evaluationRows.map((evaluation) => (
                                    <Card
                                        key={evaluation.id}
                                        className="group overflow-hidden rounded-xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/5 sm:rounded-2xl dark:bg-slate-900/40"
                                    >
                                        <div className="relative p-4 sm:p-6">
                                            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl transition-transform duration-700 group-hover:scale-105 sm:h-12 sm:w-12">
                                                        <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
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

                                            <div className="group/info relative mb-4 hidden overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 sm:mb-6 sm:block dark:border-white/5 dark:bg-white/5">
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
                                                className="h-8 w-full rounded-lg bg-slate-900 text-[9px] font-black tracking-[0.15em] text-white uppercase shadow-md transition-all duration-500 hover:bg-blue-600 hover:text-white active:scale-[0.98] sm:h-10 sm:text-[10px] sm:tracking-[0.2em] dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
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
