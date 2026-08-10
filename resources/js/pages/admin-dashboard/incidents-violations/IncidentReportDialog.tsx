import type React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import IncidentReportDialogActions from './IncidentReportDialogActions';
import IncidentReportDialogDetails from './IncidentReportDialogDetails';
import IncidentReportDialogHeader from './IncidentReportDialogHeader';
import IncidentReportDialogStudents from './IncidentReportDialogStudents';
import type { IncidentReportPayload, StudentInfo, Violation } from './types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    initialValues?: IncidentReportPayload | null;
    title?: string;
    submitLabel?: string;
    viewMode?: boolean; // New prop to control view/edit mode
    onSubmit: (payload: IncidentReportPayload) => void;
    violations: Violation[];
};

type FormState = IncidentReportPayload;

const emptyForm: FormState = {
    violationId: null,
    incidentType: '',
    classification: 'Warning',
    date: '',
    time: '',
    location: '',
    reportedBy: '',
    studentsInvolved: [],
    description: '',
    immediateAction: '',
    receivedBy: '',
};

export default function IncidentReportDialog(props: Props) {
    const { open, onOpenChange, onClose, onSubmit, violations } = props;
    const [form, setForm] = useState<FormState>(emptyForm);
    const [studentDraft, setStudentDraft] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [students, setStudents] = useState<StudentInfo[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isViewMode, setIsViewMode] = useState(props.viewMode ?? false);
    const searchAbortControllerRef = useRef<AbortController | null>(null);

    // Fetch students from database when dialog opens
    useEffect(() => {
        if (open) {
            // Don't fetch all students, wait for search input
            setStudents([]);
        } else {
            // Abort any pending search when dialog closes
            if (searchAbortControllerRef.current) {
                searchAbortControllerRef.current.abort();
                searchAbortControllerRef.current = null;
            }
        }
    }, [open]);

    const searchStudentsFromDB = async (query: string): Promise<StudentInfo[]> => {
        if (!query.trim()) return [];
        
        // Abort previous search
        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort();
        }
        
        const abortController = new AbortController();
        searchAbortControllerRef.current = abortController;
        
        setLoadingStudents(true);
        try {
            const response = await fetch(`/admin/students/search?q=${encodeURIComponent(query.trim())}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: abortController.signal,
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Students found:', data.students); // Debug log
                return data.students || [];
            } else {
                console.error('Search failed:', response.status);
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

    // Simple debounced search
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    
    const handleStudentInputChange = (value: string) => {
        setStudentDraft(value);
        setShowSuggestions(value.trim().length > 0);
        setSelectedSuggestionIndex(0);
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout for search
        if (value.trim().length > 0) {
            const timeout = setTimeout(() => {
                searchStudentsFromDB(value).then(results => {
                    setStudents(results);
                });
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setStudents([]);
        }
    };

    const searchStudents = (query: string): StudentInfo[] => {
        if (!query.trim() || students.length === 0) return [];
        
        const trimmed = query.trim().toLowerCase();
        
        // If query is numeric, search by ID
        if (/^\d+$/.test(trimmed)) {
            return students.filter(student => 
                student.id.toLowerCase().includes(trimmed)
            );
        }
        
        // Otherwise search by name
        return students.filter(student => 
            student.name.toLowerCase().includes(trimmed)
        );
    };

    const suggestions = useMemo(() => {
        return searchStudents(studentDraft);
    }, [studentDraft, students]);

    useEffect(() => {
        if (!open) return;

        if (props.initialValues) {
            setForm({
                violationId: props.initialValues.violationId ?? null,
                incidentType: props.initialValues.incidentType ?? '',
                classification: props.initialValues.classification ?? 'Minor',
                date: props.initialValues.date ?? '',
                time: props.initialValues.time ?? '',
                location: props.initialValues.location ?? '',
                reportedBy: props.initialValues.reportedBy ?? '',
                studentsInvolved: props.initialValues.studentsInvolved ?? [],
                description: props.initialValues.description ?? '',
                immediateAction: props.initialValues.immediateAction ?? '',
                receivedBy: props.initialValues.receivedBy ?? '',
            });
            setIsViewMode(props.viewMode ?? false);
        } else {
            setForm(emptyForm);
            setStudentDraft('');
            setIsViewMode(false);
        }
         
    }, [open, props.initialValues, props.viewMode]);

    const canSubmit = useMemo(() => {
        return Boolean(
            form.violationId &&
                String(form.classification).trim() &&
                String(form.date).trim() &&
                String(form.time).trim() &&
                String(form.location).trim() &&
                String(form.description).trim() &&
                form.studentsInvolved.length > 0
        );
    }, [form]);

    const close = () => {
        onClose();
        setForm(emptyForm);
        setStudentDraft('');
        setIsViewMode(false);
        setCurrentStep(1);
    };

    const toggleEditMode = () => {
        setIsViewMode(false);
    };

    const addStudent = (student: StudentInfo) => {
        if (form.studentsInvolved.some(s => s.id === student.id)) {
            return; // Student already added
        }
        
        setForm(prev => ({ 
            ...prev, 
            studentsInvolved: [...prev.studentsInvolved, student] 
        }));
        setStudentDraft('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter' && studentDraft.trim()) {
                e.preventDefault();
                // Try to find exact match or add as is
                const trimmed = studentDraft.trim();
                if (/^\d+$/.test(trimmed)) {
                    const student = students.find(s => s.id === trimmed);
                    if (student && !form.studentsInvolved.some(s => s.id === student.id)) {
                        addStudent(student);
                    }
                } else {
                    const student = students.find(s => 
                        s.name.toLowerCase() === trimmed.toLowerCase()
                    );
                    if (student && !form.studentsInvolved.some(s => s.id === student.id)) {
                        addStudent(student);
                    }
                }
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
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

    const [currentStep, setCurrentStep] = useState(1);

    const removeStudent = (studentId: string) => {
        setForm((p) => ({ 
            ...p, 
            studentsInvolved: p.studentsInvolved.filter((s) => s.id !== studentId) 
        }));
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            close();
            return;
        }
        onOpenChange(true);
    };



    const submit = () => {
        if (!canSubmit) return;
        onSubmit({
            violationId: form.violationId,
            incidentType: form.incidentType,
            classification: form.classification,
            date: form.date,
            time: form.time,
            location: form.location,
            reportedBy: form.reportedBy,
            studentsInvolved: form.studentsInvolved,
            description: form.description,
            immediateAction: form.immediateAction,
            receivedBy: form.receivedBy,
        });
        close();
    };

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    const title = props.title ?? (props.initialValues ? (isViewMode ? 'View Incident Report' : 'Edit Incident Report') : 'Report Incident');
    const submitLabel = props.submitLabel ?? (props.initialValues ? 'Update Incident' : 'Report Incident');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-3xl overflow-hidden p-0 bg-white dark:bg-slate-800">
                <IncidentReportDialogHeader title={`${title} (Step ${currentStep} of 3)`} isViewMode={isViewMode} />

                {/* Step Indicators */}
                <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>1</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">General Info</span>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 flex-1 mx-4" />
                    <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>2</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Persons Involved</span>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 flex-1 mx-4" />
                    <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>3</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Narrative & Action</span>
                    </div>
                </div>

                <div className="max-h-[60vh] min-h-[300px] space-y-5 overflow-y-auto px-6 py-6">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <IncidentReportDialogDetails
                                form={form}
                                onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                                isViewMode={isViewMode}
                                violations={violations}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="reportedBy">Reported by (Name / Position)</Label>
                                <Input
                                    id="reportedBy"
                                    value={form.reportedBy}
                                    onChange={(e) => setForm((p) => ({ ...p, reportedBy: e.target.value }))}
                                    disabled={isViewMode}
                                    placeholder="Name / Position of Reporter"
                                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <IncidentReportDialogStudents
                            studentDraft={studentDraft}
                            onStudentDraftChange={handleStudentInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                setShowSuggestions(studentDraft.trim().length > 0);
                            }}
                            loadingStudents={loadingStudents}
                            isViewMode={isViewMode}
                            showSuggestions={showSuggestions}
                            suggestions={suggestions}
                            selectedSuggestionIndex={selectedSuggestionIndex}
                            setSelectedSuggestionIndex={setSelectedSuggestionIndex}
                            setShowSuggestions={setShowSuggestions}
                            addStudent={addStudent}
                            studentsInvolved={form.studentsInvolved}
                            removeStudent={removeStudent}
                        />
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="uppercase font-semibold tracking-wider text-slate-800 dark:text-slate-200">
                                    Narrative of the Incident <span className="text-red-500">*</span>
                                </Label>
                                <textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    rows={4}
                                    placeholder="Please provide a detailed narrative of the incident..."
                                    className="flex w-full rounded-md border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-slate-300"
                                    disabled={isViewMode}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="immediateAction" className="uppercase font-semibold tracking-wider text-slate-800 dark:text-slate-200">
                                    Immediate Action Taken (Optional)
                                </Label>
                                <textarea
                                    id="immediateAction"
                                    value={form.immediateAction}
                                    onChange={(e) => setForm((p) => ({ ...p, immediateAction: e.target.value }))}
                                    rows={3}
                                    placeholder="What actions were immediately taken?"
                                    className="flex w-full rounded-md border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-slate-300"
                                    disabled={isViewMode}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div className="flex flex-col gap-1 items-center pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {form.reportedBy || '[Name of Reporter]'}
                                    </span>
                                    <span className="text-sm text-slate-500">Reported by</span>
                                </div>
                                <div className="flex flex-col gap-1 items-center pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <Input
                                        value={form.receivedBy}
                                        onChange={(e) => setForm((p) => ({ ...p, receivedBy: e.target.value }))}
                                        disabled={isViewMode}
                                        placeholder="[OSA Personnel]"
                                        className="w-full max-w-[200px] text-center bg-white dark:bg-slate-700 border-none border-b-2 border-slate-200 dark:border-slate-600 focus-visible:ring-0 rounded-none shadow-none"
                                    />
                                    <span className="text-sm text-slate-500">Received by — OSA</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-6 py-4">
                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <Button type="button" variant="outline" className="h-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={prevStep}>
                                Back
                            </Button>
                        )}
                        <Button type="button" variant="outline" className="h-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={close}>
                            {isViewMode ? 'Close' : 'Cancel'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {isViewMode && props.initialValues && (
                            <Button
                                type="button"
                                variant="default"
                                className="h-10 bg-blue-600 hover:bg-blue-700"
                                onClick={toggleEditMode}
                            >
                                Edit
                            </Button>
                        )}

                        {currentStep < 3 ? (
                            <Button type="button" className="h-10 bg-blue-600 hover:bg-blue-700 text-white" onClick={nextStep}>
                                Next
                            </Button>
                        ) : (
                            !isViewMode && (
                                <Button
                                    type="button"
                                    className="h-10 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={!canSubmit}
                                    onClick={submit}
                                >
                                    {submitLabel}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
