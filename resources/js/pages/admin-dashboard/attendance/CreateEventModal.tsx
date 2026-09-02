import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
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
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    Calendar,
    Check,
    Clock,
    Info,
    LogIn,
    LogOut,
    MapPin,
    ShieldCheck,
    Users,
    XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type CreateEventPayload = {
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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    onSubmit: (payload: CreateEventPayload) => void;
    courses: Array<{ id: string; name: string; code: string }>;
    yearLevels: Array<{ id: string; name: string; code: string }>;
    totalStudents: number;
    studentCountsByCourseYear: Array<{
        course: string;
        year_level: string;
        total: number;
    }>;
    announcements?: Array<{
        id: string;
        title: string;
        eventDate?: string;
        eventTime?: string;
    }>;
};

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
}: Props) {
    const [formData, setFormData] = useState<CreateEventPayload>({
        eventName: '',
        organizer: '',
        location: "St. Rita's College of Balingasag",
        eventDate: '',
        eventTime: '',
        registrationEndTime: '',
        expectedAttendees: '',
        description: '',
        courses: [],
        yearLevels: [],
        scannerStudentIds: [],
        geofenceEnabled: true,
        geofenceLatitude: '8.743070',
        geofenceLongitude: '124.774500',
        geofenceRadiusM: '300',
        attendanceType: 'dynamic_qr',
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});

    const [scannerStudentQuery, setScannerStudentQuery] = useState('');
    const [scannerSearchResults, setScannerSearchResults] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState('');
    const [selectedScannerStudents, setSelectedScannerStudents] = useState<
        Array<{ id: string; name: string }>
    >([]);

    const [showMapSelector, setShowMapSelector] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');

    const handleMapLocationSelect = (
        lat: number,
        lng: number,
        name?: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            geofenceLatitude: lat.toFixed(6),
            geofenceLongitude: lng.toFixed(6),
            ...(name ? { location: name } : {}),
        }));
        setSelectedLocationName(name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        // Clear latitude/longitude/location errors if they were set
        setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.geofenceLatitude;
            delete next.geofenceLongitude;
            if (name) {
                delete next.location;
            }
            return next;
        });
    };

    // Debounce search
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
                const res = await fetch(
                    `/admin/students/search?q=${encodeURIComponent(query)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                if (!res.ok) throw new Error('Search failed');
                const data = (await res.json()) as {
                    students?: Array<{ id: string; name: string }>;
                };
                setScannerSearchResults(data.students || []);
                if (data.students?.length === 0)
                    setScannerStudentError('No students found');
            } catch {
                setScannerStudentError('Failed to search students');
                setScannerSearchResults([]);
            } finally {
                setScannerStudentLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [scannerStudentQuery]);

    // Sync selected students back to formData.scannerStudentIds
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
                const courseMatch =
                    courseFilter.size === 0
                        ? true
                        : courseFilter.has(row.course);
                const yearMatch =
                    yearLevelFilter.size === 0
                        ? true
                        : yearLevelFilter.has(row.year_level);
                return courseMatch && yearMatch;
            })
            .reduce((sum, row) => sum + Number(row.total || 0), 0);
    }, [
        formData.courses,
        formData.yearLevels,
        studentCountsByCourseYear,
        totalStudents,
    ]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            expectedAttendees: String(computedExpectedAttendees),
        }));
    }, [computedExpectedAttendees]);

    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {};
        if (step === 1) {
            if (!formData.eventName.trim())
                errors.eventName = 'Event Name is required';
            if (!formData.organizer) errors.organizer = 'Organizer is required';
            if (!formData.eventDate)
                errors.eventDate = 'Event Date is required';
            if (!formData.eventTime)
                errors.eventTime = 'Event Time is required';
        } else if (step === 2) {
            if (!formData.location.trim())
                errors.location = 'Location description is required';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setValidationErrors({});
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Final validation check for all steps
        if (!validateStep(1)) {
            setCurrentStep(1);
            return;
        }
        if (!validateStep(2)) {
            setCurrentStep(2);
            return;
        }
        const isGpsMode = formData.attendanceType === 'dynamic_qr';
        const payload: CreateEventPayload = {
            ...formData,
            geofenceEnabled: isGpsMode ? true : formData.geofenceEnabled,
            geofenceLatitude: isGpsMode
                ? formData.geofenceLatitude || '8.743070'
                : formData.geofenceLatitude,
            geofenceLongitude: isGpsMode
                ? formData.geofenceLongitude || '124.774500'
                : formData.geofenceLongitude,
            geofenceRadiusM: isGpsMode
                ? formData.geofenceRadiusM || '300'
                : formData.geofenceRadiusM,
        };
        onSubmit(payload);
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
        setScannerStudentQuery('');
        setSelectedScannerStudents([]);
        setScannerSearchResults([]);
        setScannerStudentError('');
        setSelectedLocationName('');
        setShowMapSelector(false);
        setValidationErrors({});
        setCurrentStep(1);
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

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                } else {
                    onOpenChange(isOpen);
                }
            }}
        >
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content asChild>
                    <div className="fixed inset-0 z-50 flex items-center justify-center gap-4 overflow-hidden px-4">
                        <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl duration-200 dark:border-slate-700 dark:bg-slate-900">
                            <div className="shrink-0 border-b border-transparent bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white dark:border-slate-700">
                                <DialogHeader>
                                    <DialogTitle className="text-white">
                                        Create New Event
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80">
                                        Fill in the event details using this
                                        step-by-step wizard.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            {/* Stepper Progress Indicator */}
                            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-8 py-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                                <div className="mx-auto flex max-w-2xl items-center justify-between">
                                    {/* Step 1 */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                currentStep > 1
                                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                                    : currentStep === 1
                                                      ? 'animate-pulse border-[#1e40af] bg-[#1e40af] text-white shadow-sm'
                                                      : 'border-slate-300 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500'
                                            }`}
                                        >
                                            {currentStep > 1 ? (
                                                <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                                            ) : (
                                                <Calendar className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p
                                                className={`text-[10px] font-semibold tracking-wider uppercase ${currentStep >= 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}
                                            >
                                                Step 1
                                            </p>
                                            <p
                                                className={`text-xs font-semibold ${currentStep === 1 ? 'text-[#1e40af] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                                            >
                                                Basic Info
                                            </p>
                                        </div>
                                    </div>

                                    {/* Line 1-2 */}
                                    <div className="relative mx-4 h-0.5 max-w-[80px] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#1e40af] transition-all duration-500 ${currentStep > 1 ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                currentStep > 2
                                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                                    : currentStep === 2
                                                      ? 'animate-pulse border-[#1e40af] bg-[#1e40af] text-white shadow-sm'
                                                      : 'border-slate-300 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500'
                                            }`}
                                        >
                                            {currentStep > 2 ? (
                                                <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                                            ) : (
                                                <MapPin className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p
                                                className={`text-[10px] font-semibold tracking-wider uppercase ${currentStep >= 2 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}
                                            >
                                                Step 2
                                            </p>
                                            <p
                                                className={`text-xs font-semibold ${currentStep === 2 ? 'text-[#1e40af] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                                            >
                                                Location & Map
                                            </p>
                                        </div>
                                    </div>

                                    {/* Line 2-3 */}
                                    <div className="relative mx-4 h-0.5 max-w-[80px] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#1e40af] transition-all duration-500 ${currentStep > 2 ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                currentStep === 3
                                                    ? 'border-[#1e40af] bg-[#1e40af] text-white shadow-sm'
                                                    : 'border-slate-300 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500'
                                            }`}
                                        >
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div className="hidden sm:block">
                                            <p
                                                className={`text-[10px] font-semibold tracking-wider uppercase ${currentStep === 3 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}
                                            >
                                                Step 3
                                            </p>
                                            <p
                                                className={`text-xs font-semibold ${currentStep === 3 ? 'text-[#1e40af] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                                            >
                                                Audience & Security
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-white px-6 py-6 dark:bg-slate-900">
                                {/* Step 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label
                                                    htmlFor="eventName"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Event Name{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="eventName"
                                                    list="announcementsList"
                                                    value={formData.eventName}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            eventName: val,
                                                        }));
                                                        if (
                                                            validationErrors.eventName
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next.eventName;
                                                                    return next;
                                                                },
                                                            );
                                                        }

                                                        const matched =
                                                            announcements?.find(
                                                                (a) =>
                                                                    a.title ===
                                                                    val,
                                                            );
                                                        if (matched) {
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    eventDate:
                                                                        matched.eventDate ||
                                                                        prev.eventDate,
                                                                    eventTime:
                                                                        matched.eventTime ||
                                                                        prev.eventTime,
                                                                }),
                                                            );
                                                        }
                                                    }}
                                                    placeholder="Enter or select an event"
                                                    className={`h-9 ${validationErrors.eventName ? 'border-rose-500 focus-visible:ring-rose-500' : 'dark:border-slate-600 dark:bg-slate-800'}`}
                                                />
                                                {validationErrors.eventName && (
                                                    <p className="text-xs font-medium text-rose-500">
                                                        {
                                                            validationErrors.eventName
                                                        }
                                                    </p>
                                                )}
                                                {announcements &&
                                                    announcements.length >
                                                        0 && (
                                                        <datalist id="announcementsList">
                                                            {announcements.map(
                                                                (a) => (
                                                                    <option
                                                                        key={
                                                                            a.id
                                                                        }
                                                                        value={
                                                                            a.title
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </datalist>
                                                    )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="organizer"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Organizer{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={formData.organizer}
                                                    onValueChange={(value) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            organizer: value,
                                                        }));
                                                        if (
                                                            validationErrors.organizer
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next.organizer;
                                                                    return next;
                                                                },
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id="organizer"
                                                        className={`h-9 ${validationErrors.organizer ? 'border-rose-500 focus-visible:ring-rose-500' : 'dark:border-slate-600 dark:bg-slate-800'}`}
                                                    >
                                                        <SelectValue placeholder="Select organizer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Office Student Affairs">
                                                            Office Student
                                                            Affairs
                                                        </SelectItem>
                                                        <SelectItem value="Dean of College">
                                                            Dean of College
                                                        </SelectItem>
                                                        <SelectItem value="HED Library">
                                                            HED Library
                                                        </SelectItem>
                                                        <SelectItem value="Guidance Office">
                                                            Guidance Office
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {validationErrors.organizer && (
                                                    <p className="text-xs font-medium text-rose-500">
                                                        {
                                                            validationErrors.organizer
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="eventDate"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Date{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="eventDate"
                                                    type="date"
                                                    value={formData.eventDate}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            eventDate:
                                                                e.target.value,
                                                        }));
                                                        if (
                                                            validationErrors.eventDate
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next.eventDate;
                                                                    return next;
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={`h-9 ${validationErrors.eventDate ? 'border-rose-500 focus-visible:ring-rose-500' : 'dark:border-slate-600 dark:bg-slate-800'}`}
                                                />
                                                {validationErrors.eventDate && (
                                                    <p className="text-xs font-medium text-rose-500">
                                                        {
                                                            validationErrors.eventDate
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="eventTime"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Time{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="eventTime"
                                                    type="time"
                                                    value={formData.eventTime}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        const calculateTimeInEnd =
                                                            (start: string) => {
                                                                if (!start)
                                                                    return '09:30';
                                                                const [h, m] =
                                                                    start
                                                                        .split(
                                                                            ':',
                                                                        )
                                                                        .map(
                                                                            Number,
                                                                        );
                                                                if (
                                                                    isNaN(h) ||
                                                                    isNaN(m)
                                                                )
                                                                    return '09:30';
                                                                const date =
                                                                    new Date();
                                                                date.setHours(
                                                                    h,
                                                                    m + 90,
                                                                    0,
                                                                    0,
                                                                );
                                                                const newH =
                                                                    String(
                                                                        date.getHours(),
                                                                    ).padStart(
                                                                        2,
                                                                        '0',
                                                                    );
                                                                const newM =
                                                                    String(
                                                                        date.getMinutes(),
                                                                    ).padStart(
                                                                        2,
                                                                        '0',
                                                                    );
                                                                return `${newH}:${newM}`;
                                                            };

                                                        setFormData(
                                                            (prev) =>
                                                                ({
                                                                    ...prev,
                                                                    eventTime:
                                                                        val,
                                                                    timeInStart:
                                                                        val,
                                                                    timeInEnd:
                                                                        calculateTimeInEnd(
                                                                            val,
                                                                        ),
                                                                }) as any,
                                                        );

                                                        if (
                                                            validationErrors.eventTime
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next.eventTime;
                                                                    return next;
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className={`h-9 ${validationErrors.eventTime ? 'border-rose-500 focus-visible:ring-rose-500' : 'dark:border-slate-600 dark:bg-slate-800'}`}
                                                />
                                                {validationErrors.eventTime && (
                                                    <p className="text-xs font-medium text-rose-500">
                                                        {
                                                            validationErrors.eventTime
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="registrationEndTime"
                                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Registration End Time
                                                </Label>
                                                <Input
                                                    id="registrationEndTime"
                                                    type="time"
                                                    value={
                                                        formData.registrationEndTime
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            registrationEndTime:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="h-9 dark:border-slate-600 dark:bg-slate-800"
                                                />
                                            </div>

                                            {/* Designated Time-In & Time-Out Windows */}
                                            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:col-span-2 dark:border-blue-900/30 dark:bg-blue-950/20">
                                                <div className="flex items-center gap-2 text-xs font-black tracking-wider text-blue-900 uppercase dark:text-blue-300">
                                                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span>
                                                        Designated Attendance
                                                        Time Windows
                                                    </span>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <Label className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                            <LogIn className="h-3.5 w-3.5" />{' '}
                                                            Time-In Window
                                                            (Entrance)
                                                        </Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={
                                                                    (
                                                                        formData as any
                                                                    )
                                                                        .timeInStart ||
                                                                    '08:00'
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const val =
                                                                        e.target
                                                                            .value;
                                                                    const [
                                                                        h,
                                                                        m,
                                                                    ] = val
                                                                        .split(
                                                                            ':',
                                                                        )
                                                                        .map(
                                                                            Number,
                                                                        );
                                                                    const date =
                                                                        new Date();
                                                                    date.setHours(
                                                                        isNaN(h)
                                                                            ? 8
                                                                            : h,
                                                                        (isNaN(
                                                                            m,
                                                                        )
                                                                            ? 0
                                                                            : m) +
                                                                            90,
                                                                        0,
                                                                        0,
                                                                    );
                                                                    const autoEnd = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                                                    setFormData(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            ({
                                                                                ...prev,
                                                                                timeInStart:
                                                                                    val,
                                                                                timeInEnd:
                                                                                    autoEnd,
                                                                            }) as any,
                                                                    );
                                                                }}
                                                                className="h-8 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                                                            />
                                                            <span className="text-xs font-bold text-slate-400">
                                                                to
                                                            </span>
                                                            <Input
                                                                type="time"
                                                                value={
                                                                    (
                                                                        formData as any
                                                                    )
                                                                        .timeInEnd ||
                                                                    '09:30'
                                                                }
                                                                onChange={(e) =>
                                                                    setFormData(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            ({
                                                                                ...prev,
                                                                                timeInEnd:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }) as any,
                                                                    )
                                                                }
                                                                className="h-8 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400">
                                                            <LogOut className="h-3.5 w-3.5" />{' '}
                                                            Time-Out Window
                                                            (Exit)
                                                        </Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={
                                                                    (
                                                                        formData as any
                                                                    )
                                                                        .timeOutStart ||
                                                                    '11:00'
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const val =
                                                                        e.target
                                                                            .value;
                                                                    const [
                                                                        h,
                                                                        m,
                                                                    ] = val
                                                                        .split(
                                                                            ':',
                                                                        )
                                                                        .map(
                                                                            Number,
                                                                        );
                                                                    const date =
                                                                        new Date();
                                                                    date.setHours(
                                                                        isNaN(h)
                                                                            ? 11
                                                                            : h,
                                                                        (isNaN(
                                                                            m,
                                                                        )
                                                                            ? 0
                                                                            : m) +
                                                                            90,
                                                                        0,
                                                                        0,
                                                                    );
                                                                    const autoEnd = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                                                    setFormData(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            ({
                                                                                ...prev,
                                                                                timeOutStart:
                                                                                    val,
                                                                                timeOutEnd:
                                                                                    autoEnd,
                                                                            }) as any,
                                                                    );
                                                                }}
                                                                className="h-8 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                                                            />
                                                            <span className="text-xs font-bold text-slate-400">
                                                                to
                                                            </span>
                                                            <Input
                                                                type="time"
                                                                value={
                                                                    (
                                                                        formData as any
                                                                    )
                                                                        .timeOutEnd ||
                                                                    '12:00'
                                                                }
                                                                onChange={(e) =>
                                                                    setFormData(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            ({
                                                                                ...prev,
                                                                                timeOutEnd:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }) as any,
                                                                    )
                                                                }
                                                                className="h-8 text-xs font-bold dark:border-slate-600 dark:bg-slate-800"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Location & Geofencing */}
                                {currentStep === 2 && (
                                    <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label
                                                    htmlFor="location"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Location Description{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="location"
                                                    value={formData.location}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            location:
                                                                e.target.value,
                                                        }));
                                                        if (
                                                            validationErrors.location
                                                        ) {
                                                            setValidationErrors(
                                                                (prev) => {
                                                                    const next =
                                                                        {
                                                                            ...prev,
                                                                        };
                                                                    delete next.location;
                                                                    return next;
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    placeholder="Enter location description (e.g. Gym, Room 302)"
                                                    className={`h-9 ${validationErrors.location ? 'border-rose-500 focus-visible:ring-rose-500' : 'dark:border-slate-600 dark:bg-slate-800'}`}
                                                />
                                                {validationErrors.location && (
                                                    <p className="text-xs font-medium text-rose-500">
                                                        {
                                                            validationErrors.location
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label
                                                    htmlFor="attendanceType"
                                                    className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Attendance Method{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={
                                                        formData.attendanceType ||
                                                        'qr_scanner'
                                                    }
                                                    onValueChange={(val) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            attendanceType: val,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="attendanceType"
                                                        className="h-9 dark:border-slate-600 dark:bg-slate-800"
                                                    >
                                                        <SelectValue placeholder="Select check-in method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="qr_scanner">
                                                            QR Scanner (Camera
                                                            scan by admin)
                                                        </SelectItem>
                                                        <SelectItem value="dynamic_qr">
                                                            GPS Location Check-in
                                                            (Direct check-in via
                                                            GPS location)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                                <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    Geotagging & Geofencing
                                                </Label>
                                                <div className="mt-1 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="geofenceEnabled"
                                                        checked={
                                                            formData.geofenceEnabled
                                                        }
                                                        onChange={(e) => {
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    geofenceEnabled:
                                                                        e.target
                                                                            .checked,
                                                                    geofenceRadiusM:
                                                                        prev.geofenceRadiusM ||
                                                                        '50',
                                                                }),
                                                            );
                                                            // Clear geofence validation errors if unchecked
                                                            if (
                                                                !e.target
                                                                    .checked
                                                            ) {
                                                                setValidationErrors(
                                                                    (prev) => {
                                                                        const next =
                                                                            {
                                                                                ...prev,
                                                                            };
                                                                        delete next.geofenceLatitude;
                                                                        delete next.geofenceLongitude;
                                                                        delete next.geofenceRadiusM;
                                                                        return next;
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-600 dark:bg-slate-800"
                                                    />
                                                    <Label
                                                        htmlFor="geofenceEnabled"
                                                        className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300"
                                                    >
                                                        Enable geofence
                                                        validation
                                                    </Label>
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    Students scan with real
                                                    device GPS; the backend
                                                    compares distance to the
                                                    event latitude, longitude,
                                                    and radius you save here.
                                                    The campus map is visual
                                                    only.
                                                </p>
                                            </div>

                                            {formData.geofenceEnabled && (
                                                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-800 sm:col-span-2 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                    <span>
                                                        Geofence: <strong>Whole Campus (St. Rita's College of Balingasag)</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Audience & Security */}
                                {currentStep === 3 && (
                                    <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-4 sm:col-span-2">
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Target Courses
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                                formData.courses
                                                                    .length ===
                                                                0
                                                                    ? 'border-transparent bg-[#1e40af] text-white shadow-sm'
                                                                    : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        courses:
                                                                            [],
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            {formData.courses
                                                                .length ===
                                                                0 && (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                            All Courses
                                                        </button>
                                                        {courses.map(
                                                            (course) => {
                                                                const isSelected =
                                                                    formData.courses.includes(
                                                                        course.id,
                                                                    );
                                                                return (
                                                                    <button
                                                                        key={
                                                                            course.id
                                                                        }
                                                                        type="button"
                                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                                            isSelected
                                                                                ? 'border-blue-200 bg-blue-50 text-[#1e40af] hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/30'
                                                                                : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        }`}
                                                                        onClick={() => {
                                                                            setFormData(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newCourses =
                                                                                        prev.courses.includes(
                                                                                            course.id,
                                                                                        )
                                                                                            ? prev.courses.filter(
                                                                                                  (
                                                                                                      id,
                                                                                                  ) =>
                                                                                                      id !==
                                                                                                      course.id,
                                                                                              )
                                                                                            : [
                                                                                                  ...prev.courses,
                                                                                                  course.id,
                                                                                              ];
                                                                                    return {
                                                                                        ...prev,
                                                                                        courses:
                                                                                            newCourses,
                                                                                    };
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="h-3 w-3" />
                                                                        )}
                                                                        {
                                                                            course.name
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            course.code
                                                                        }
                                                                        )
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-2 grid gap-2 sm:col-span-2">
                                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Target Year Levels
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                                formData
                                                                    .yearLevels
                                                                    .length ===
                                                                0
                                                                    ? 'border-transparent bg-[#1e40af] text-white shadow-sm'
                                                                    : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        yearLevels:
                                                                            [],
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            {formData.yearLevels
                                                                .length ===
                                                                0 && (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                            All Year Levels
                                                        </button>
                                                        {yearLevels.map(
                                                            (yearLevel) => {
                                                                const isSelected =
                                                                    formData.yearLevels.includes(
                                                                        yearLevel.id,
                                                                    );
                                                                return (
                                                                    <button
                                                                        key={
                                                                            yearLevel.id
                                                                        }
                                                                        type="button"
                                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                                            isSelected
                                                                                ? 'border-blue-200 bg-blue-50 text-[#1e40af] hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/30'
                                                                                : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        }`}
                                                                        onClick={() => {
                                                                            setFormData(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const newYearLevels =
                                                                                        prev.yearLevels.includes(
                                                                                            yearLevel.id,
                                                                                        )
                                                                                            ? prev.yearLevels.filter(
                                                                                                  (
                                                                                                      id,
                                                                                                  ) =>
                                                                                                      id !==
                                                                                                      yearLevel.id,
                                                                                              )
                                                                                            : [
                                                                                                  ...prev.yearLevels,
                                                                                                  yearLevel.id,
                                                                                              ];
                                                                                    return {
                                                                                        ...prev,
                                                                                        yearLevels:
                                                                                            newYearLevels,
                                                                                    };
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="h-3 w-3" />
                                                                        )}
                                                                        {
                                                                            yearLevel.name
                                                                        }
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label
                                                    htmlFor="expectedAttendees"
                                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Expected Attendees
                                                    (Auto-calculated)
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="expectedAttendees"
                                                        type="number"
                                                        value={
                                                            formData.expectedAttendees
                                                        }
                                                        readOnly
                                                        placeholder="Number of expected attendees"
                                                        className="dark:bg-slate-850 h-9 bg-slate-50/50 pl-9 font-semibold text-[#1e40af] dark:text-blue-400"
                                                        min="1"
                                                    />
                                                    <Users className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                </div>
                                            </div>

                                            <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                                <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
                                                    <div className="flex gap-2.5">
                                                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                                                                Automatic
                                                                Scanner Access
                                                                Enabled
                                                            </h4>
                                                            <p className="mt-1 text-xs leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                                                                All students
                                                                belonging to the
                                                                selected Target
                                                                Courses and
                                                                Target Year
                                                                Levels are
                                                                automatically
                                                                authorized to
                                                                act as
                                                                attendance
                                                                scanners from
                                                                their student
                                                                accounts. There
                                                                is no need to
                                                                manually assign
                                                                scanner IDs.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Controls */}
                            <div className="flex shrink-0 items-center justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                                <div>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Step {currentStep} of 3
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {currentStep === 1 ? (
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            onClick={handleClose}
                                            id="btn-cancel"
                                        >
                                            Cancel
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            onClick={handleBack}
                                            id="btn-step-prev"
                                        >
                                            Back
                                        </Button>
                                    )}

                                    {currentStep < 3 ? (
                                        <Button
                                            type="button"
                                            className="bg-[#121F78] text-white hover:bg-[#0f1a66]"
                                            onClick={handleNext}
                                            id="btn-step-next"
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="bg-[#121F78] text-white hover:bg-[#0f1a66]"
                                            onClick={handleSubmit}
                                            id="btn-create-event-submit"
                                        >
                                            Create Event
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <DialogPrimitive.Close
                                className="absolute top-6 right-6 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                onClick={handleClose}
                            >
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogPrimitive.Close>
                        </div>

                        {currentStep === 3 &&
                            scannerSearchResults.length > 0 &&
                            scannerStudentQuery && (
                                <div className="hidden h-fit w-72 shrink-0 animate-in self-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl duration-200 slide-in-from-left-2 lg:block dark:border-slate-700 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                                        <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                            Search Results
                                        </span>
                                        <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                            {scannerSearchResults.length} found
                                        </span>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {scannerSearchResults.map((student) => (
                                            <button
                                                key={student.id}
                                                type="button"
                                                className="flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                                onClick={() =>
                                                    addSelectedStudent(student)
                                                }
                                            >
                                                <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {student.name}
                                                </span>
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                    #{student.id}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
