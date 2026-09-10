import React, { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { studentIncidentsStore } from '@/routes';
import { router } from '@inertiajs/react';
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
    const [reportStep, setReportStep] = useState(1);
    const [reportProcessing, setReportProcessing] = useState(false);
    const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
    const [reportForm, setReportForm] = useState<ReportIncidentFormData>({
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
                    handleDialogChange(false);
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

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-3xl dark:bg-[#0B192C] [&>button]:hidden">
                <ReportIncidentHeader reportStep={reportStep} />

                <div className="max-h-[60vh] min-h-[300px] space-y-5 overflow-y-auto px-6 py-6">
                    {reportStep === 1 && (
                        <ReportIncidentStepGeneral
                            reportForm={reportForm}
                            setReportForm={setReportForm}
                            violations={violations}
                            reportErrors={reportErrors}
                            hasCustomPlace={hasCustomPlace}
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
                        />
                    )}
                </div>

                <ReportIncidentFooter
                    reportStep={reportStep}
                    reportProcessing={reportProcessing}
                    onBack={() => setReportStep((prev) => prev - 1)}
                    onCancel={() => handleDialogChange(false)}
                    onNext={() => setReportStep((prev) => prev + 1)}
                    onSubmit={submitReportIncident}
                />
            </DialogContent>
        </Dialog>
    );
}
