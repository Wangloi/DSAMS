import {
    Calendar,
    MapPin,
    Users,
    GraduationCap,
    Check,
    Info,
    X,
    Clock,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    Layers,
    Radio,
    Building2,
    Target,
    Compass,
    Plus,
    Search,
    UserCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dedupeCourseRows } from './mergeCourseYearOptions';

export type CreateEventPayload = {
    eventName: string;
    organizer: string;
    location: string;
    eventDate: string;
    eventTime: string;
    registrationEndTime: string;
    expectedAttendees: string;
    description: string;
    courses: string[];
    yearLevels: string[];
    scannerStudentIds: string[];
    geofenceEnabled: boolean;
    geofenceLatitude: string;
    geofenceLongitude: string;
    geofenceRadiusM: string;
    attendanceType: string;
};

const SCHOOL_MAP_LOCATIONS = [
    { name: "Main Gate", lat: "14.599500", lng: "120.984200" },
    { name: "Cafeteria", lat: "8.743160", lng: "124.774360" },
    { name: "Gymnasium", lat: "14.599300", lng: "120.984400" },
    { name: "RVM TTP Program Office", lat: "8.743890", lng: "124.774250" },
    { name: "Power House", lat: "14.599300", lng: "120.984400" },
    { name: "Parking Area", lat: "14.599700", lng: "120.984000" },
    { name: "Outer Ground", lat: "8.742990", lng: "124.774390" },
    { name: "Inner Ground", lat: "8.743170", lng: "124.774370" },
    { name: "Parents Lounge", lat: "8.743130", lng: "124.777180" },
    { name: "Christian Formation Office (1st floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Chapel (1st floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Room 101 (1st floor)", lat: "14.599400", lng: "120.984300" },
    { name: "HM Laboratory (1st floor)", lat: "8.743150", lng: "124.774190" },
    { name: "College Library (2nd Floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Dean of College (2nd Floor)", lat: "14.599400", lng: "120.984300" },
    { name: "College Faculty Room (2nd Floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Program Head's Office (2nd Floor)", lat: "14.599400", lng: "120.984300" },
    { name: "IT LABORATORY (3rd floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Room 301 (3rd floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Room 302 (3rd floor)", lat: "14.599400", lng: "120.984300" },
    { name: "Room 303 (3rd floor)", lat: "14.599400", lng: "120.984300" },
    { name: "CRIM LAB (4th floor)", lat: "14.599400", lng: "120.984300" },
    { name: "401 Room (4th floor)", lat: "14.599400", lng: "120.984300" },
    { name: "402 Room (4th floor)", lat: "14.599400", lng: "120.984300" },
    { name: "403 Room (4th floor)", lat: "14.599400", lng: "120.984300" },
];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    onSubmit: (payload: CreateEventPayload) => void;
    courses: Array<{ id: string; name: string; code: string }>;
    yearLevels: Array<{ id: string; name: string; code: string }>;
    totalStudents: number;
    studentCountsByCourseYear: Array<{ course: string; year_level: string; total: number }>;
    announcements?: Array<{ id: string | number; title: string; eventDate?: string; eventTime?: string }>;
    mode?: 'create' | 'edit';
    initialEvent?: Record<string, any> | null;
};

const DRAFT_KEY = 'dsams_create_event_draft_v1';

export default function CreateEventModal({
    open,
    onOpenChange,
    onClose,
    onSubmit,
    courses,
    yearLevels,
    totalStudents,
    studentCountsByCourseYear,
    announcements,
    mode = 'create',
    initialEvent,
}: Props) {
    const [formData, setFormData] = useState<CreateEventPayload>({
        eventName: '',
        organizer: '',
        location: '',
        eventDate: '',
        eventTime: '',
        registrationEndTime: '',
        expectedAttendees: '',
        description: '',
        courses: [],
        yearLevels: [],
        scannerStudentIds: [],
        geofenceEnabled: true,
        geofenceLatitude: '',
        geofenceLongitude: '',
        geofenceRadiusM: '50',
        attendanceType: 'qr_scanner',
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isDraftRestored, setIsDraftRestored] = useState(false);

    const courseSelectOptions = useMemo(() => dedupeCourseRows(courses), [courses]);

    // Populate form when editing or restore draft on create
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialEvent) {
                setFormData({
                    eventName: initialEvent.event_name ?? '',
                    organizer: initialEvent.organizer ?? '',
                    location: initialEvent.location ?? '',
                    eventDate: (initialEvent.event_date ?? '').split('T')[0],
                    eventTime: initialEvent.event_time ?? '',
                    registrationEndTime: initialEvent.registration_end_time ?? '',
                    expectedAttendees: String(initialEvent.expected_attendees ?? ''),
                    description: initialEvent.description ?? '',
                    courses: initialEvent.courses ?? [],
                    yearLevels: initialEvent.year_levels ?? [],
                    scannerStudentIds: [],
                    geofenceEnabled: true,
                    geofenceLatitude: String(initialEvent.geofence_latitude ?? ''),
                    geofenceLongitude: String(initialEvent.geofence_longitude ?? ''),
                    geofenceRadiusM: String(initialEvent.geofence_radius_m ?? '50'),
                    attendanceType: initialEvent.attendance_type ?? 'qr_scanner',
                });
                setCurrentStep(1);
                setValidationErrors({});
                setIsDraftRestored(false);
            } else if (mode === 'create') {
                const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
                if (savedDraftRaw) {
                    try {
                        const saved = JSON.parse(savedDraftRaw);
                        if (saved?.formData) {
                            setFormData(saved.formData);
                            setCurrentStep(saved.currentStep || 1);
                            setIsDraftRestored(true);
                            setValidationErrors({});
                            return;
                        }
                    } catch {
                        localStorage.removeItem(DRAFT_KEY);
                    }
                }

                setFormData({
                    eventName: '',
                    organizer: '',
                    location: '',
                    eventDate: '',
                    eventTime: '',
                    registrationEndTime: '',
                    expectedAttendees: '',
                    description: '',
                    courses: [],
                    yearLevels: [],
                    scannerStudentIds: [],
                    geofenceEnabled: true,
                    geofenceLatitude: '',
                    geofenceLongitude: '',
                    geofenceRadiusM: '50',
                    attendanceType: 'qr_scanner',
                });
                setCurrentStep(1);
                setValidationErrors({});
                setIsDraftRestored(false);
            }
        }
    }, [open, mode, initialEvent]);

    // Auto-save form draft to localStorage
    useEffect(() => {
        if (open && mode === 'create') {
            const hasData = !!(
                formData.eventName ||
                formData.organizer ||
                formData.location ||
                formData.eventDate ||
                formData.eventTime ||
                formData.courses.length > 0 ||
                formData.yearLevels.length > 0
            );

            if (hasData) {
                localStorage.setItem(
                    DRAFT_KEY,
                    JSON.stringify({ formData, currentStep })
                );
            }
        }
    }, [open, mode, formData, currentStep]);

    // Warn user before reloading or navigating away if there are unsaved input values
    useEffect(() => {
        if (!open || mode !== 'create') return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasUnsavedData = !!(
                formData.eventName.trim() ||
                formData.location.trim() ||
                formData.eventDate ||
                formData.eventTime
            );

            if (hasUnsavedData) {
                e.preventDefault();
                e.returnValue = 'You have an unsaved event draft. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [open, mode, formData]);

    const [scannerStudentQuery, setScannerStudentQuery] = useState('');
    const [scannerSearchResults, setScannerSearchResults] = useState<Array<{ id: string; name: string }>>([]);
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState('');
    const [selectedScannerStudents, setSelectedScannerStudents] = useState<Array<{ id: string; name: string }>>([]);

    const [showMapSelector, setShowMapSelector] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');

    const handleMapLocationSelect = (lat: number, lng: number, name?: string) => {
        setFormData((prev) => ({
            ...prev,
            geofenceLatitude: lat.toFixed(6),
            geofenceLongitude: lng.toFixed(6),
            ...(name ? { location: name } : {}),
        }));
        setSelectedLocationName(name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        setValidationErrors((prev) => {
            const copy = { ...prev };
            delete copy.geofenceLatitude;
            delete copy.geofenceLongitude;
            if (name) {
                delete copy.location;
            }
            return copy;
        });
    };

    useEffect(() => {
        const query = scannerStudentQuery.trim();
        if (!query) {
            setScannerSearchResults([]);
            setScannerStudentError('');
            return;
        }

        const timeoutId = setTimeout(async () => {
            setScannerStudentLoading(true);
            setScannerStudentError('');
            try {
                const res = await fetch(`/admin/students/search?q=${encodeURIComponent(query)}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (!res.ok) throw new Error('Search failed');
                const data = (await res.json()) as { students?: Array<{ id: string; name: string }> };
                setScannerSearchResults(data.students || []);
                if (data.students?.length === 0) setScannerStudentError('No students found');
            } catch {
                setScannerStudentError('Failed to search students');
                setScannerSearchResults([]);
            } finally {
                setScannerStudentLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [scannerStudentQuery]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            scannerStudentIds: selectedScannerStudents.map((s) => s.id),
        }));
    }, [selectedScannerStudents]);

    const computedExpectedAttendees = useMemo(() => {
        if (formData.courses.length === 0 && formData.yearLevels.length === 0) {
            return totalStudents;
        }

        const courseFilter = new Set(formData.courses);
        const yearLevelFilter = new Set(formData.yearLevels);

        return studentCountsByCourseYear
            .filter((row) => {
                const courseMatch = courseFilter.size === 0 ? true : courseFilter.has(row.course);
                const yearMatch = yearLevelFilter.size === 0 ? true : yearLevelFilter.has(row.year_level);
                return courseMatch && yearMatch;
            })
            .reduce((sum, row) => sum + Number(row.total || 0), 0);
    }, [formData.courses, formData.yearLevels, studentCountsByCourseYear, totalStudents]);

    useEffect(() => {
        setFormData((prev) => ({ ...prev, expectedAttendees: String(computedExpectedAttendees) }));
    }, [computedExpectedAttendees]);

    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.eventName.trim()) {
                errors.eventName = 'Event Name is required';
            }
            if (!formData.organizer) {
                errors.organizer = 'Organizer is required';
            }
            if (!formData.eventDate) {
                errors.eventDate = 'Event Date is required';
            }
            if (!formData.eventTime) {
                errors.eventTime = 'Event Time is required';
            }
        } else if (step === 2) {
            if (formData.attendanceType === 'dynamic_qr') {
                if (!formData.location.trim()) {
                    errors.location = 'Location description is required when using Dynamic Rotation QR';
                }
                if (!formData.geofenceLatitude) {
                    errors.geofenceLatitude = 'Latitude is required for campus geofencing';
                } else if (isNaN(Number(formData.geofenceLatitude))) {
                    errors.geofenceLatitude = 'Latitude must be a valid number';
                }

                if (!formData.geofenceLongitude) {
                    errors.geofenceLongitude = 'Longitude is required for campus geofencing';
                } else if (isNaN(Number(formData.geofenceLongitude))) {
                    errors.geofenceLongitude = 'Longitude must be a valid number';
                }

                if (!formData.geofenceRadiusM) {
                    errors.geofenceRadiusM = 'Radius is required';
                } else {
                    const radiusNum = Number(formData.geofenceRadiusM);
                    if (isNaN(radiusNum) || radiusNum < 10 || radiusNum > 500) {
                        errors.geofenceRadiusM = 'Radius must be between 10 and 500 meters';
                    }
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setValidationErrors({});
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const discardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setIsDraftRestored(false);
        setFormData({
            eventName: '',
            organizer: '',
            location: '',
            eventDate: '',
            eventTime: '',
            registrationEndTime: '',
            expectedAttendees: '',
            description: '',
            courses: [],
            yearLevels: [],
            scannerStudentIds: [],
            geofenceEnabled: true,
            geofenceLatitude: '',
            geofenceLongitude: '',
            geofenceRadiusM: '50',
            attendanceType: 'qr_scanner',
        });
        setCurrentStep(1);
        setValidationErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep(1)) {
            setCurrentStep(1);
            return;
        }
        if (!validateStep(2)) {
            setCurrentStep(2);
            return;
        }

        localStorage.removeItem(DRAFT_KEY);
        setIsDraftRestored(false);
        onSubmit(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            eventName: '',
            organizer: '',
            location: '',
            eventDate: '',
            eventTime: '',
            registrationEndTime: '',
            expectedAttendees: '',
            description: '',
            courses: [],
            yearLevels: [],
            scannerStudentIds: [],
            geofenceEnabled: false,
            geofenceLatitude: '',
            geofenceLongitude: '',
            geofenceRadiusM: '50',
            attendanceType: 'qr_scanner',
        });
        setCurrentStep(1);
        setValidationErrors({});
        setScannerStudentQuery('');
        setSelectedScannerStudents([]);
        setScannerSearchResults([]);
        setScannerStudentError('');
        setSelectedLocationName('');
        setShowMapSelector(false);
        onClose();
    };

    const addSelectedStudent = (student: { id: string; name: string }) => {
        setSelectedScannerStudents((prev) => {
            if (prev.some((s) => s.id === student.id)) return prev;
            return [...prev, student];
        });
        setScannerStudentQuery('');
        setScannerSearchResults([]);
    };

    const removeSelectedStudent = (id: string) => {
        setSelectedScannerStudents((prev) => prev.filter((s) => s.id !== id));
    };

    if (!open) return null;

    const steps = [
        { id: 1, label: 'Basic Details', subtitle: 'Name, Organizer & Schedule' },
        { id: 2, label: 'Location & Check-In', subtitle: 'Venue & Geofence Settings' },
        { id: 3, label: 'Target Audience', subtitle: 'Courses, Years & Scanners' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md transition-all duration-300">
            <div className="mx-auto w-full max-w-5xl flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200">
                {/* Header Banner */}
                <div className="shrink-0 relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 sm:px-8 pt-6 pb-6 text-white border-b border-blue-900/30">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shadow-inner">
                                {mode === 'edit' ? <Sparkles className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                        {mode === 'edit' ? 'Edit Event' : 'Create New Event'}
                                    </h2>
                                    <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-400/20">
                                        {mode === 'edit' ? 'Update Details' : 'New Setup'}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300/90 mt-0.5">
                                    Configure event parameters, check-in methods, and target attendees.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="mt-6 relative">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => {
                                            if (isCompleted) setCurrentStep(step.id);
                                        }}
                                        disabled={!isCompleted && !isActive}
                                        className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 ${
                                            isActive
                                                ? 'bg-blue-600/30 border-blue-400/50 text-white shadow-lg backdrop-blur-md ring-2 ring-blue-400/30'
                                                : isCompleted
                                                ? 'bg-white/5 border-emerald-500/30 text-emerald-300 hover:bg-white/10 cursor-pointer'
                                                : 'bg-white/5 border-white/10 text-slate-400 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs sm:text-sm transition-all ${
                                                isActive
                                                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-white/20'
                                                    : isCompleted
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}
                                        >
                                            {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
                                        </div>
                                        <div className="hidden sm:block min-w-0">
                                            <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                                                {step.label}
                                            </div>
                                            <div className="text-[10px] text-slate-300/70 truncate mt-0.5">
                                                {step.subtitle}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 sm:p-8 dark:bg-slate-900/50">
                    {isDraftRestored && mode === 'create' && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 animate-in fade-in-50 duration-200">
                            <div className="flex items-center gap-2.5 text-xs font-medium">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 font-bold text-[11px]">
                                    ✓
                                </span>
                                <span>Restored your unsaved event draft from your previous session.</span>
                            </div>
                            <button
                                type="button"
                                onClick={discardDraft}
                                className="text-xs font-bold text-rose-700 hover:text-rose-900 underline dark:text-rose-400 dark:hover:text-rose-200"
                            >
                                Discard Draft & Start Clean
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* STEP 1: BASIC INFORMATION */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in-50 duration-200">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Event Name */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="eventName" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Event Name <span className="text-rose-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="eventName"
                                                list="announcementsList"
                                                value={formData.eventName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData((prev) => ({ ...prev, eventName: val }));

                                                    const matched = announcements?.find((a) => a.title === val);
                                                    if (matched) {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            eventDate: matched.eventDate || prev.eventDate,
                                                            eventTime: matched.eventTime || prev.eventTime,
                                                        }));
                                                    }
                                                    if (validationErrors.eventName) {
                                                        setValidationErrors((prev) => {
                                                            const copy = { ...prev };
                                                            delete copy.eventName;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                placeholder="e.g., Annual Sports Fest, IT Seminar 2026"
                                                className={`h-10 dark:border-slate-700 dark:bg-slate-800/80 ${
                                                    validationErrors.eventName ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                                                }`}
                                                required
                                            />
                                        </div>
                                        {validationErrors.eventName && (
                                            <p className="text-xs text-rose-500 font-medium">{validationErrors.eventName}</p>
                                        )}
                                        {announcements && announcements.length > 0 && (
                                            <datalist id="announcementsList">
                                                {announcements.map((a) => (
                                                    <option key={a.id} value={a.title} />
                                                ))}
                                            </datalist>
                                        )}
                                    </div>

                                    {/* Organizer */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="organizer" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Organizer <span className="text-rose-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.organizer}
                                            onValueChange={(value) => {
                                                setFormData((prev) => ({ ...prev, organizer: value }));
                                                if (validationErrors.organizer) {
                                                    setValidationErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy.organizer;
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            required
                                        >
                                            <SelectTrigger
                                                id="organizer"
                                                className={`h-10 dark:border-slate-700 dark:bg-slate-800/80 ${
                                                    validationErrors.organizer ? 'border-rose-500 focus:ring-rose-500' : ''
                                                }`}
                                            >
                                                <SelectValue placeholder="Select organizing body" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Office Student Affairs">Office Student Affairs</SelectItem>
                                                <SelectItem value="Dean of College">Dean of College</SelectItem>
                                                <SelectItem value="HED Library">HED Library</SelectItem>
                                                <SelectItem value="Guidance Office">Guidance Office</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {validationErrors.organizer && (
                                            <p className="text-xs text-rose-500 font-medium">{validationErrors.organizer}</p>
                                        )}
                                    </div>

                                    {/* Event Date */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="eventDate" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Event Date <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="eventDate"
                                            type="date"
                                            value={formData.eventDate}
                                            onChange={(e) => {
                                                setFormData((prev) => ({ ...prev, eventDate: e.target.value }));
                                                if (validationErrors.eventDate) {
                                                    setValidationErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy.eventDate;
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            className={`h-10 dark:border-slate-700 dark:bg-slate-800/80 ${
                                                validationErrors.eventDate ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                                            }`}
                                            required
                                        />
                                        {validationErrors.eventDate && (
                                            <p className="text-xs text-rose-500 font-medium">{validationErrors.eventDate}</p>
                                        )}
                                    </div>

                                    {/* Event Start Time */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="eventTime" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Start Time <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="eventTime"
                                            type="time"
                                            value={formData.eventTime}
                                            onChange={(e) => {
                                                setFormData((prev) => ({ ...prev, eventTime: e.target.value }));
                                                if (validationErrors.eventTime) {
                                                    setValidationErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy.eventTime;
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            className={`h-10 dark:border-slate-700 dark:bg-slate-800/80 ${
                                                validationErrors.eventTime ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                                            }`}
                                            required
                                        />
                                        {validationErrors.eventTime && (
                                            <p className="text-xs text-rose-500 font-medium">{validationErrors.eventTime}</p>
                                        )}
                                    </div>

                                    {/* Registration Cut-Off Time */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="registrationEndTime" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                            <span>Registration Cut-off Time</span>
                                            <span className="text-[11px] normal-case text-slate-400 font-normal">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="registrationEndTime"
                                            type="time"
                                            value={formData.registrationEndTime}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, registrationEndTime: e.target.value }))}
                                            className="h-10 dark:border-slate-700 dark:bg-slate-800/80"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: LOCATION & CHECK-IN METHOD */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in-50 duration-200">
                                <div className="grid gap-6">
                                    {/* Attendance Method Card Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Check-In Method <span className="text-rose-500">*</span>
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Option 1: QR Scanner */}
                                            <div
                                                onClick={() => setFormData((prev) => ({ ...prev, attendanceType: 'qr_scanner' }))}
                                                className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative ${
                                                    formData.attendanceType === 'qr_scanner'
                                                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/30 dark:border-blue-500'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2.5 rounded-lg shrink-0 ${formData.attendanceType === 'qr_scanner' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        <Radio className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                                            <span>QR Scanner Check-in</span>
                                                            {formData.attendanceType === 'qr_scanner' && (
                                                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                            Admins or authorized student scanners scan QR codes on attendee devices.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Option 2: Dynamic Rotation QR */}
                                            <div
                                                onClick={() => setFormData((prev) => ({ ...prev, attendanceType: 'dynamic_qr' }))}
                                                className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative ${
                                                    formData.attendanceType === 'dynamic_qr'
                                                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/30 dark:border-blue-500'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2.5 rounded-lg shrink-0 ${formData.attendanceType === 'dynamic_qr' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                                            <span>Dynamic Rotation QR</span>
                                                            {formData.attendanceType === 'dynamic_qr' && (
                                                                <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                            Project dynamic screen QR code; students scan using their phones.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Venue Location - Based on School Location Map for Dynamic Rotation QR */}
                                    {formData.attendanceType === 'dynamic_qr' && (
                                        <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="location" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Venue / Room Location (Campus Map) <span className="text-rose-500">*</span>
                                                </Label>
                                                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                                    Linked to Campus Geofence
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <Input
                                                    id="location"
                                                    list="schoolMapLocationsList"
                                                    value={formData.location}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const matched = SCHOOL_MAP_LOCATIONS.find(
                                                            (loc) => loc.name.toLowerCase() === val.toLowerCase()
                                                        );

                                                        if (matched) {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                location: matched.name,
                                                                geofenceLatitude: matched.lat,
                                                                geofenceLongitude: matched.lng,
                                                                geofenceEnabled: true,
                                                            }));
                                                            setSelectedLocationName(matched.name);
                                                        } else {
                                                            setFormData((prev) => ({ ...prev, location: val }));
                                                        }

                                                        if (validationErrors.location) {
                                                            setValidationErrors((prev) => {
                                                                const copy = { ...prev };
                                                                delete copy.location;
                                                                delete copy.geofenceLatitude;
                                                                delete copy.geofenceLongitude;
                                                                return copy;
                                                            });
                                                        }
                                                    }}
                                                    placeholder="Select or type campus location (e.g. IT LABORATORY, Gymnasium, Cafeteria)"
                                                    className={`h-10 dark:border-slate-700 dark:bg-slate-800/80 ${
                                                        validationErrors.location ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                                                    }`}
                                                    required
                                                />
                                                <datalist id="schoolMapLocationsList">
                                                    {SCHOOL_MAP_LOCATIONS.map((loc) => (
                                                        <option key={loc.name} value={loc.name} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            {validationErrors.location && (
                                                <p className="text-xs text-rose-500 font-medium">{validationErrors.location}</p>
                                            )}

                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Select an official location from the campus map or click on the campus map below to set coordinates automatically.
                                            </p>
                                        </div>
                                    )}

                                    {/* Geofence Feature Card - Always On for Dynamic Rotation QR */}
                                    {formData.attendanceType === 'dynamic_qr' && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/50 space-y-4 animate-in fade-in-50 duration-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                                        <ShieldCheck className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Campus Geofence Location Security
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Validate physical attendee location inside campus boundaries
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">
                                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                                    Always On
                                                </span>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-4 animate-in fade-in-50 duration-200">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setShowMapSelector((prev) => !prev)}
                                                        className="h-9 text-xs font-semibold border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100 dark:border-blue-900/40 dark:text-blue-300 dark:bg-blue-950/40"
                                                    >
                                                        <Compass className="h-4 w-4 mr-1.5" />
                                                        {showMapSelector ? 'Hide Campus Map Selector' : 'Pick Location on Interactive Campus Map'}
                                                    </Button>

                                                    {selectedLocationName && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {selectedLocationName}
                                                        </span>
                                                    )}
                                                </div>

                                                    {showMapSelector && (
                                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm dark:border-slate-700">
                                                            <SchoolMapSelector
                                                                onLocationSelect={handleMapLocationSelect}
                                                                initialLocation={
                                                                    formData.geofenceLatitude && formData.geofenceLongitude
                                                                        ? {
                                                                              latitude: parseFloat(formData.geofenceLatitude),
                                                                              longitude: parseFloat(formData.geofenceLongitude),
                                                                              name: selectedLocationName,
                                                                          }
                                                                        : undefined
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <div>
                                                            <Label className="text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                                                                Latitude <span className="text-rose-500">*</span>
                                                            </Label>
                                                            <Input
                                                                value={formData.geofenceLatitude}
                                                                onChange={(e) => {
                                                                    setFormData((prev) => ({ ...prev, geofenceLatitude: e.target.value }));
                                                                    if (validationErrors.geofenceLatitude) {
                                                                        setValidationErrors((prev) => {
                                                                            const copy = { ...prev };
                                                                            delete copy.geofenceLatitude;
                                                                            return copy;
                                                                        });
                                                                    }
                                                                }}
                                                                placeholder="e.g. 8.742771"
                                                                className={`h-9 mt-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 ${
                                                                    validationErrors.geofenceLatitude ? 'border-rose-500' : ''
                                                                }`}
                                                            />
                                                            {validationErrors.geofenceLatitude && (
                                                                <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.geofenceLatitude}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label className="text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                                                                Longitude <span className="text-rose-500">*</span>
                                                            </Label>
                                                            <Input
                                                                value={formData.geofenceLongitude}
                                                                onChange={(e) => {
                                                                    setFormData((prev) => ({ ...prev, geofenceLongitude: e.target.value }));
                                                                    if (validationErrors.geofenceLongitude) {
                                                                        setValidationErrors((prev) => {
                                                                            const copy = { ...prev };
                                                                            delete copy.geofenceLongitude;
                                                                            return copy;
                                                                        });
                                                                    }
                                                                }}
                                                                placeholder="e.g. 124.774366"
                                                                className={`h-9 mt-1 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 ${
                                                                    validationErrors.geofenceLongitude ? 'border-rose-500' : ''
                                                                }`}
                                                            />
                                                            {validationErrors.geofenceLongitude && (
                                                                <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.geofenceLongitude}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label className="text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                                                                Radius (meters) <span className="text-rose-500">*</span>
                                                            </Label>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Input
                                                                    type="number"
                                                                    min={10}
                                                                    max={500}
                                                                    value={formData.geofenceRadiusM}
                                                                    onChange={(e) => {
                                                                        setFormData((prev) => ({ ...prev, geofenceRadiusM: e.target.value }));
                                                                        if (validationErrors.geofenceRadiusM) {
                                                                            setValidationErrors((prev) => {
                                                                                const copy = { ...prev };
                                                                                delete copy.geofenceRadiusM;
                                                                                return copy;
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`h-9 text-xs dark:border-slate-700 dark:bg-slate-800 ${
                                                                        validationErrors.geofenceRadiusM ? 'border-rose-500' : ''
                                                                    }`}
                                                                />
                                                                <div className="flex gap-1">
                                                                    {['30', '50', '100'].map((val) => (
                                                                        <button
                                                                            key={val}
                                                                            type="button"
                                                                            onClick={() => setFormData((prev) => ({ ...prev, geofenceRadiusM: val }))}
                                                                            className={`px-2 py-1 text-[10px] font-semibold rounded border ${
                                                                                formData.geofenceRadiusM === val
                                                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                                                            }`}
                                                                        >
                                                                            {val}m
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {validationErrors.geofenceRadiusM && (
                                                                <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.geofenceRadiusM}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: TARGET AUDIENCE & SCANNERS */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in-50 duration-200">

                                <div className="grid gap-6">
                                    {/* Target Courses Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Target Courses
                                            </Label>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {formData.courses.length === 0 ? 'All courses included' : `${formData.courses.length} selected`}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 border ${
                                                    formData.courses.length === 0
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                                                }`}
                                                onClick={() => setFormData((prev) => ({ ...prev, courses: [] }))}
                                            >
                                                {formData.courses.length === 0 && <Check className="h-3.5 w-3.5" />}
                                                All Courses
                                            </button>

                                            {courseSelectOptions.map((course) => {
                                                const isSelected = formData.courses.includes(course.id);
                                                return (
                                                    <button
                                                        key={course.id}
                                                        type="button"
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                            isSelected
                                                                ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                        }`}
                                                        onClick={() => {
                                                            setFormData((prev) => {
                                                                const newCourses = prev.courses.includes(course.id)
                                                                    ? prev.courses.filter((id) => id !== course.id)
                                                                    : [...prev.courses, course.id];
                                                                return { ...prev, courses: newCourses };
                                                            });
                                                        }}
                                                    >
                                                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                                                        {course.name} ({course.code})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Target Year Levels Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                Target Year Levels
                                            </Label>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {formData.yearLevels.length === 0 ? 'All year levels included' : `${formData.yearLevels.length} selected`}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 border ${
                                                    formData.yearLevels.length === 0
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                                                }`}
                                                onClick={() => setFormData((prev) => ({ ...prev, yearLevels: [] }))}
                                            >
                                                {formData.yearLevels.length === 0 && <Check className="h-3.5 w-3.5" />}
                                                All Year Levels
                                            </button>

                                            {yearLevels.map((yearLevel) => {
                                                const isSelected = formData.yearLevels.includes(yearLevel.id);
                                                return (
                                                    <button
                                                        key={yearLevel.id}
                                                        type="button"
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                            isSelected
                                                                ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                        }`}
                                                        onClick={() => {
                                                            setFormData((prev) => {
                                                                const newYearLevels = prev.yearLevels.includes(yearLevel.id)
                                                                    ? prev.yearLevels.filter((id) => id !== yearLevel.id)
                                                                    : [...prev.yearLevels, yearLevel.id];
                                                                return { ...prev, yearLevels: newYearLevels };
                                                            });
                                                        }}
                                                    >
                                                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                                                        {yearLevel.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Attendance In-Charge Assignment */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Attendance Scanner In-Charge
                                                </Label>
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {selectedScannerStudents.length === 0 ? 'No students assigned' : `${selectedScannerStudents.length} assigned`}
                                            </span>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Assign students who will be responsible for scanning attendance at this event. These students will have access to the <strong className="text-slate-700 dark:text-slate-200">Attendance Scanner Portal</strong>.
                                            </p>

                                            {/* Search Input */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    value={scannerStudentQuery}
                                                    onChange={(e) => setScannerStudentQuery(e.target.value)}
                                                    placeholder="Search student by name or ID..."
                                                    className="h-9 pl-9 text-xs dark:border-slate-700 dark:bg-slate-800"
                                                />
                                                {scannerStudentLoading && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {scannerSearchResults.length > 0 && (
                                                <div className="rounded-lg border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto dark:border-slate-700 dark:bg-slate-800">
                                                    {scannerSearchResults.map((student) => {
                                                        const alreadyAdded = selectedScannerStudents.some((s) => s.id === student.id);
                                                        return (
                                                            <button
                                                                key={student.id}
                                                                type="button"
                                                                disabled={alreadyAdded}
                                                                onClick={() => addSelectedStudent(student)}
                                                                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors ${
                                                                    alreadyAdded
                                                                        ? 'bg-emerald-50 text-emerald-700 cursor-default dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                        : 'hover:bg-blue-50 text-slate-700 dark:hover:bg-slate-700 dark:text-slate-200'
                                                                }`}
                                                            >
                                                                <span className="font-medium">{student.name}</span>
                                                                {alreadyAdded ? (
                                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Already added</span>
                                                                ) : (
                                                                    <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {scannerStudentError && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{scannerStudentError}</p>
                                            )}

                                            {/* Assigned Students List */}
                                            {selectedScannerStudents.length > 0 && (
                                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                        Assigned In-Charge ({selectedScannerStudents.length})
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedScannerStudents.map((student) => (
                                                            <span
                                                                key={student.id}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50"
                                                            >
                                                                <UserCheck className="h-3.5 w-3.5" />
                                                                {student.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSelectedStudent(student.id)}
                                                                    className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Live Event Summary Preview Strip */}
                <div className="shrink-0 bg-slate-100/90 px-6 py-2.5 border-t border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-4 truncate">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {formData.eventName || 'Untitled Event'}
                        </span>
                        {formData.eventDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                {formData.eventDate} {formData.eventTime}
                            </span>
                        )}
                        {formData.location && (
                            <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                                {formData.location}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {formData.attendanceType === 'dynamic_qr' ? 'Dynamic QR' : 'QR Scanner'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {formData.expectedAttendees} Attendees
                        </span>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="h-10 px-4 gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="h-10 px-4 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="h-10 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white px-6 font-semibold shadow-md gap-1.5"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                className="h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-7 font-bold shadow-md gap-2"
                            >
                                <Check className="h-4 w-4 stroke-[3]" />
                                {mode === 'edit' ? 'Update Event' : 'Create Event'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


