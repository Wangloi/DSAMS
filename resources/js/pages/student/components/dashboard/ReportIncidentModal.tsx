import React, { useMemo, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { focusFirstInvalidField } from '@/lib/formFocusNavigation';
import { studentIncidentsStore } from '@/routes';
import { router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { placeOptions, type StudentInvolved, type ViolationOption } from './types';
import {
    type ReportIncidentFormData,
    type ReportIncidentModalProps,
    ReportIncidentHeader,
    ReportIncidentStepGeneral,
    ReportIncidentStepStudents,
    ReportIncidentStepEvidence,
    ReportIncidentFooter,
} from './report-incident';

export function ReportIncidentModal({
    open,
    onOpenChange,
    violations = [],
}: ReportIncidentModalProps) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const page = usePage();
    const authUser = (page.props as any)?.auth?.user;

    const authReporterIdentity = useMemo(() => {
        if (!authUser?.name) return 'Student';
        return authUser.student_id
            ? `${authUser.name} (${authUser.student_id})`
            : authUser.name;
    }, [authUser]);

    const [reportStep, setReportStep] = useState(1);
    const [reportProcessing, setReportProcessing] = useState(false);
    const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
    const [reportForm, setReportForm] = useState<ReportIncidentFormData>(() => ({
        violation_id: null,
        incident_type: '',
        incident_date: '',
        incident_time: '',
        location: '',
        reported_by: authUser?.name
            ? (authUser.student_id
                  ? `${authUser.name} (${authUser.student_id})`
                  : authUser.name)
            : 'Student',
        is_anonymous: false,
        students_involved: [],
        classification: 'Warning',
        description: '',
        evidences: [],
    }));

    const [studentDraft, setStudentDraft] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [students, setStudents] = useState<StudentInvolved[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<
        typeof setTimeout
    > | null>(null);
    const searchAbortControllerRef = useRef<AbortController | null>(null);

    const hasCustomPlace = useMemo(() => {
        return (
            Boolean(reportForm.location) &&
            !placeOptions.includes(reportForm.location)
        );
    }, [reportForm.location]);

    const resetForm = () => {
        setReportStep(1);
        setReportForm({
            violation_id: null,
            incident_type: '',
            incident_date: '',
            incident_time: '',
            location: '',
            reported_by: authReporterIdentity,
            is_anonymous: false,
            students_involved: [],
            classification: 'Warning',
            description: '',
            evidences: [],
        });
        setStudentDraft('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(0);
        setStudents([]);
        setReportErrors({});
    };

    const handleDialogChange = (isOpen: boolean) => {
        if (!isOpen) {
            resetForm();
        }
        onOpenChange(isOpen);
    };

    const searchStudentsFromDB = async (
        query: string,
    ): Promise<StudentInvolved[]> => {
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

    const searchStudents = (query: string): StudentInvolved[] => {
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

    const addStudent = (student: StudentInvolved) => {
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

    const handleNext = () => {
        if (reportStep === 1) {
            const stepErrors: Record<string, string> = {};
            if (!reportForm.violation_id && !reportForm.incident_type) {
                stepErrors.violation_id = 'Please select a violation.';
            }
            if (!reportForm.incident_date) {
                stepErrors.incident_date = 'Date of incident is required.';
            }
            if (!reportForm.incident_time) {
                stepErrors.incident_time = 'Time of incident is required.';
            }
            if (!reportForm.location) {
                stepErrors.location = 'Location is required.';
            }
            if (!reportForm.is_anonymous && !authReporterIdentity) {
                stepErrors.reported_by = 'Authenticated reporting person is required.';
            }

            if (Object.keys(stepErrors).length > 0) {
                setReportErrors(stepErrors);
                setTimeout(() => {
                    focusFirstInvalidField(bodyRef.current);
                }, 50);
                Swal.fire({
                    icon: 'warning',
                    title: 'Required Information Missing',
                    text: 'Please complete all required fields on Step 1 (General Information).',
                    confirmButtonColor: '#1e3a8a',
                });
                return;
            }
            setReportErrors({});
            setReportStep(2);
        } else if (reportStep === 2) {
            if (reportForm.students_involved.length === 0) {
                setReportErrors({
                    students_involved: 'Please add at least one student involved before continuing.',
                });
                setTimeout(() => {
                    focusFirstInvalidField(bodyRef.current);
                }, 50);
                Swal.fire({
                    icon: 'warning',
                    title: 'Students Involved Required',
                    text: 'Please add at least one student involved in the incident on Step 2.',
                    confirmButtonColor: '#1e3a8a',
                });
                return;
            }
            setReportErrors({});
            setReportStep(3);
        }
    };

    const submitReportIncident = () => {
        // Prevent duplicate submissions caused by repeated clicks
        if (reportProcessing) return;

        // Final client-side checks
        const step1Errors: Record<string, string> = {};
        if (!reportForm.violation_id && !reportForm.incident_type) {
            step1Errors.violation_id = 'Please select a violation.';
        }
        if (!reportForm.incident_date) {
            step1Errors.incident_date = 'Date of incident is required.';
        }
        if (!reportForm.incident_time) {
            step1Errors.incident_time = 'Time of incident is required.';
        }
        if (!reportForm.location) {
            step1Errors.location = 'Location is required.';
        }

        if (Object.keys(step1Errors).length > 0) {
            setReportErrors(step1Errors);
            setReportStep(1);
            setTimeout(() => {
                focusFirstInvalidField(bodyRef.current);
            }, 50);
            Swal.fire({
                icon: 'warning',
                title: 'Required Information Missing',
                text: 'Please complete all required fields on Step 1.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        if (reportForm.students_involved.length === 0) {
            setReportErrors({
                students_involved: 'Please add at least one student involved.',
            });
            setReportStep(2);
            setTimeout(() => {
                focusFirstInvalidField(bodyRef.current);
            }, 50);
            Swal.fire({
                icon: 'warning',
                title: 'Students Involved Required',
                text: 'Please add at least one student involved in the incident on Step 2.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        if (!reportForm.description.trim()) {
            setReportErrors({
                description: 'Incident narrative description is required.',
            });
            setReportStep(3);
            setTimeout(() => {
                focusFirstInvalidField(bodyRef.current);
            }, 50);
            Swal.fire({
                icon: 'warning',
                title: 'Narrative Description Required',
                text: 'Please provide a detailed narrative of the incident on Step 3.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        setReportProcessing(true);
        setReportErrors({});

        // Sanitize students_involved payload to ensure clean id & name objects
        const sanitizedStudents = reportForm.students_involved.map((s) => ({
            id: String(s.id ?? ''),
            name: String(s.name ?? ''),
        }));

        let formattedTime = reportForm.incident_time;
        if (formattedTime && formattedTime.split(':').length === 3) {
            formattedTime = formattedTime.slice(0, 5);
        }

        const isAnonymous = Boolean(reportForm.is_anonymous);
        const finalReportedBy = isAnonymous
            ? 'Anonymous Student'
            : authReporterIdentity;

        router.post(
            studentIncidentsStore(),
            {
                violation_id: reportForm.violation_id
                    ? Number(reportForm.violation_id)
                    : null,
                incident_type: reportForm.incident_type,
                incident_date: reportForm.incident_date,
                incident_time: formattedTime,
                location: reportForm.location,
                reported_by: finalReportedBy,
                is_anonymous: isAnonymous,
                students_involved: sanitizedStudents,
                classification: reportForm.classification,
                description: reportForm.description,
                evidences: reportForm.evidences,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: (page) => {
                    const flashError = (page.props as any)?.flash?.error;
                    if (flashError) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Submission Failed',
                            text: String(flashError),
                            confirmButtonColor: '#ef4444',
                        });
                        return;
                    }

                    handleDialogChange(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Incident Report Submitted',
                        text:
                            (page.props as any)?.flash?.success ||
                            'Your incident report has been submitted to the Office of Student Affairs.',
                        confirmButtonColor: '#1e3a8a',
                    });
                },
                onError: (backendErrors: Record<string, unknown>) => {
                    const mapped = Object.entries(backendErrors).reduce<
                        Record<string, string>
                    >((acc, [k, v]) => {
                        if (typeof v === 'string') acc[k] = v;
                        else if (Array.isArray(v) && typeof v[0] === 'string')
                            acc[k] = v[0];
                        return acc;
                    }, {});
                    setReportErrors(mapped);

                    const errorKeys = Object.keys(mapped);
                    if (
                        errorKeys.some((k) =>
                            [
                                'violation_id',
                                'incident_type',
                                'incident_date',
                                'incident_time',
                                'location',
                                'reported_by',
                            ].includes(k),
                        )
                    ) {
                        setReportStep(1);
                    } else if (
                        errorKeys.some((k) => k.startsWith('students_involved'))
                    ) {
                        setReportStep(2);
                    } else if (
                        errorKeys.some((k) =>
                            [
                                'description',
                                'classification',
                                'evidences',
                            ].includes(k),
                        )
                    ) {
                        setReportStep(3);
                    }

                    const firstErrorMsg =
                        Object.values(mapped)[0] ||
                        'Failed to submit incident report. Please review the highlighted fields.';

                    Swal.fire({
                        icon: 'error',
                        title: 'Submission Failed',
                        text: firstErrorMsg,
                        confirmButtonColor: '#ef4444',
                    });
                },
                onFinish: () => {
                    setReportProcessing(false);
                },
            },
        );
    };

    const clearFieldError = (key: string) => {
        if (reportErrors[key]) {
            setReportErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const setFieldError = (key: string, error: string) => {
        setReportErrors((prev) => ({
            ...prev,
            [key]: error,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent
                size="xl"
                preventClose={reportProcessing}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-[#0B192C] [&>button]:hidden"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Report Incident Form</DialogTitle>
                    <DialogDescription>
                        Step {reportStep} of 3: Provide incident details, involved parties, and narrative evidence.
                    </DialogDescription>
                </DialogHeader>
                <ReportIncidentHeader
                    reportStep={reportStep}
                    onClose={() => handleDialogChange(false)}
                />

                <div ref={bodyRef} className="max-h-[60vh] min-h-[300px] space-y-5 overflow-y-auto px-6 py-6">
                    {Object.keys(reportErrors).length > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                !
                            </span>
                            Please review and fix the highlighted fields below.
                        </div>
                    )}

                    {reportStep === 1 && (
                        <ReportIncidentStepGeneral
                            reportForm={reportForm}
                            setReportForm={setReportForm}
                            violations={violations}
                            reportErrors={reportErrors}
                            hasCustomPlace={hasCustomPlace}
                            clearFieldError={clearFieldError}
                            setFieldError={setFieldError}
                        />
                    )}

                    {reportStep === 2 && (
                        <ReportIncidentStepStudents
                            reportForm={reportForm}
                            setReportForm={setReportForm}
                            reportErrors={reportErrors}
                            studentDraft={studentDraft}
                            loadingStudents={loadingStudents}
                            showSuggestions={showSuggestions}
                            suggestions={suggestions}
                            selectedSuggestionIndex={selectedSuggestionIndex}
                            setSelectedSuggestionIndex={
                                setSelectedSuggestionIndex
                            }
                            setShowSuggestions={setShowSuggestions}
                            handleStudentInputChange={handleStudentInputChange}
                            handleKeyDown={handleKeyDown}
                            addStudent={addStudent}
                            removeStudent={removeStudent}
                        />
                    )}

                    {reportStep === 3 && (
                        <ReportIncidentStepEvidence
                            reportForm={reportForm}
                            setReportForm={setReportForm}
                            reportErrors={reportErrors}
                            clearFieldError={clearFieldError}
                            setFieldError={setFieldError}
                        />
                    )}
                </div>

                <ReportIncidentFooter
                    reportStep={reportStep}
                    reportProcessing={reportProcessing}
                    isAnonymous={Boolean(reportForm.is_anonymous)}
                    onBack={() => setReportStep((prev) => prev - 1)}
                    onCancel={() => handleDialogChange(false)}
                    onNext={handleNext}
                    onSubmit={submitReportIncident}
                />
            </DialogContent>
        </Dialog>
    );
}
