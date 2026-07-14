import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Info, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
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
import { adminDashboard, adminEvents } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import {
    dedupeCourseRows,
    mergeAndDedupeYearLevels,
    type CourseYearOption,
} from './mergeCourseYearOptions';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: adminDashboard() },
    { title: 'Events', href: adminEvents() },
    { title: 'Create Event', href: '#' },
];

interface FormData {
    event_name: string;
    event_name_changed?: boolean;
    description: string;
    courses: string[];
    year_levels: string[];
    location: string;
    event_date: string;
    event_time: string;
    registration_end_time: string;
    organizer: string;
    geofence_enabled: boolean;
    geofence_latitude: string;
    geofence_longitude: string;
    geofence_radius_m: string;
    scanner_portal_active: boolean;
    scannerStudentIds?: string[];
    expectedAttendees?: string;
}
export default function CreateEventPage() {
    const { props } = usePage();
    const flash = (props as any).flash as { success?: string; error?: string };
    const errors = (props.errors || {}) as Record<string, string>;
    const [successMessage, setSuccessMessage] = useState('');
    const pageProps = props as {
        courses?: CourseYearOption[];
        yearLevels?: CourseYearOption[];
        totalStudents?: number;
        studentCountsByCourseYear?: Array<{ course: string; year_level: string; total: number }>;
        announcements?: Array<{ id: string | number; title: string; eventDate?: string; eventTime?: string }>;
    };

    const pageCourses = (pageProps.courses ?? []) as CourseYearOption[];
    const pageYearLevels = (pageProps.yearLevels ?? []) as CourseYearOption[];
    const totalStudents = Number(pageProps.totalStudents ?? 0);
    const studentCountsByCourseYear = pageProps.studentCountsByCourseYear ?? [];
    const announcements = pageProps.announcements ?? [];

    const courseSelectOptions = useMemo(() => dedupeCourseRows(pageCourses), [pageCourses]);
    const mergedYearChoices = useMemo(() => mergeAndDedupeYearLevels(pageYearLevels, []), [pageYearLevels]);

    const [formData, setFormData] = useState<FormData>(() => {
        const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        return {
            event_name: '',
            description: '',
            courses: [],
            year_levels: [],
            location: '',
            event_date: searchParams.get('date') || '',
            event_time: '',
            registration_end_time: '',
            organizer: '',
            geofence_enabled: false,
            geofence_latitude: '',
            geofence_longitude: '',
            geofence_radius_m: '50',
            scanner_portal_active: true,
        };
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showMapSelector, setShowMapSelector] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');

    const [scannerStudentQuery, setScannerStudentQuery] = useState('');
    const [scannerSearchResults, setScannerSearchResults] = useState<Array<{ id: string; name: string }>>([]);
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState<string>('');
    const [selectedScannerStudents, setSelectedScannerStudents] = useState<Array<{ id: string; name: string }>>([]);
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);

    useEffect(() => {
        if (flash?.success || successMessage) {
            setShowSuccessBanner(true);
            const timer = setTimeout(() => setShowSuccessBanner(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, successMessage]);

    const computedExpectedAttendees = useMemo(() => {
        if (formData.courses.length === 0 && formData.year_levels.length === 0) {
            return totalStudents;
        }

        const courseFilter = new Set(formData.courses);
        const yearLevelFilter = new Set(formData.year_levels);

        return studentCountsByCourseYear
            .filter((row) => {
                const courseMatch = courseFilter.size === 0 ? true : courseFilter.has(row.course);
                const yearMatch = yearLevelFilter.size === 0 ? true : yearLevelFilter.has(row.year_level);
                return courseMatch && yearMatch;
            })
            .reduce((sum, row) => sum + Number(row.total || 0), 0);
    }, [formData.courses, formData.year_levels, studentCountsByCourseYear, totalStudents]);

    useEffect(() => {
        setFormData((prev) => ({ ...prev, expectedAttendees: String(computedExpectedAttendees) }));
    }, [computedExpectedAttendees, formData.courses, formData.year_levels]);

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

    const isStepOneValid = (): boolean => {
        const next: Record<string, string> = {};
        if (!formData.event_name.trim()) {
            next.event_name = 'Event Name is required';
        }
        if (!String(formData.organizer || '').trim()) {
            next.organizer = 'Organizer is required';
        }
        if (!formData.event_date) {
            next.event_date = 'Event Date is required';
        }
        if (!formData.event_time) {
            next.event_time = 'Event Time is required';
        }
        setValidationErrors((prev) => ({ ...prev, ...next }));
        return Object.keys(next).length === 0;
    };

    const isStepTwoValid = (): boolean => {
        const next: Record<string, string> = {};
        if (!formData.location.trim()) {
            next.location = 'Location description is required';
        }
        if (formData.geofence_enabled) {
            if (!formData.geofence_latitude) {
                next.geofence_latitude = 'Latitude is required when geofencing is enabled';
            } else if (Number.isNaN(Number(formData.geofence_latitude))) {
                next.geofence_latitude = 'Latitude must be a valid number';
            }
            if (!formData.geofence_longitude) {
                next.geofence_longitude = 'Longitude is required when geofencing is enabled';
            } else if (Number.isNaN(Number(formData.geofence_longitude))) {
                next.geofence_longitude = 'Longitude must be a valid number';
            }
            if (!formData.geofence_radius_m) {
                next.geofence_radius_m = 'Radius is required';
            } else {
                const radiusNum = Number(formData.geofence_radius_m);
                if (Number.isNaN(radiusNum) || radiusNum < 10 || radiusNum > 500) {
                    next.geofence_radius_m = 'Radius must be a number between 10 and 500 meters';
                }
            }
        }
        setValidationErrors((prev) => ({ ...prev, ...next }));
        return Object.keys(next).length === 0;
    };

    const clearFieldError = (field: string) => {
        setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleNext = () => {
        if (currentStep === 1 && isStepOneValid()) {
            setValidationErrors({});
            setCurrentStep(2);
            return;
        }
        if (currentStep === 2 && isStepTwoValid()) {
            setValidationErrors({});
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        setValidationErrors({});
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure we are on final step before submitting
        if (currentStep !== 3) {
            return;
        }

        // Validate previous steps without changing the current step
        const stepOneValid = isStepOneValid();
        const stepTwoValid = isStepTwoValid();
        if (!stepOneValid) {
            setCurrentStep(1);
            return;
        }
        if (!stepTwoValid) {
            setCurrentStep(2);
            return;
        }

        Swal.fire({
            title: 'Confirm Create Event',
            text: 'Are you sure you want to create this event?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, create',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                confirmSubmit();
            }
        });
    };

    const confirmSubmit = () => {
        router.post(
            adminEvents(),
            {
                event_name: formData.event_name,
                description: formData.description,
                courses: formData.courses,
                year_levels: formData.year_levels,
                location: formData.location,
                event_date: formData.event_date,
                event_time: formData.event_time,
                registration_end_time: formData.registration_end_time,
                organizer: formData.organizer,
                geofence_enabled: formData.geofence_enabled,
                geofence_latitude: formData.geofence_latitude,
                geofence_longitude: formData.geofence_longitude,
                geofence_radius_m: formData.geofence_radius_m,
                scanner_portal_active: formData.scanner_portal_active,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    setSuccessMessage('Event created successfully');
                    // Optionally reset form for a new entry
                    setFormData({
                        event_name: '',
                        description: '',
                        courses: [],
                        year_levels: [],
                        location: '',
                        event_date: '',
                        event_time: '',
                        registration_end_time: '',
                        organizer: '',
                        geofence_enabled: false,
                        geofence_latitude: '',
                        geofence_longitude: '',
                        geofence_radius_m: '50',
                        scanner_portal_active: true,
                    });
                    setCurrentStep(1);
                },
                onError: (errors: any) => {
                    setValidationErrors(errors);
                },
            },
        );
    };

    const handleMapLocationSelect = (lat: number, lng: number, name?: string) => {
        setFormData((prev) => ({
            ...prev,
            geofence_latitude: lat.toFixed(6),
            geofence_longitude: lng.toFixed(6),
        }));
        setSelectedLocationName(name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        if (validationErrors.geofence_latitude || validationErrors.geofence_longitude) {
            setValidationErrors((prev) => {
                const copy = { ...prev };
                delete copy.geofence_latitude;
                delete copy.geofence_longitude;
                return copy;
            });
        }
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

    const stepperClass = (step: number) =>
        `h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${currentStep === step
            ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md'
            : currentStep > step
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-800 text-blue-200'
        }`;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Event" />
            {showSuccessBanner && (flash?.success || successMessage) && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 relative w-full rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 shadow-lg overflow-hidden">
                    <div className="absolute -right-4 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-black/10 blur-xl"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-md">
                            <Check className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Success</h3>
                            <p className="text-emerald-50 text-sm mt-0.5 font-medium">{flash?.success || successMessage}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSuccessBanner(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => router.visit(adminEvents())} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
                            <p className="text-gray-600 dark:text-slate-400">Fill in the event details to create a new attendance event.</p>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="shrink-0 rounded-t-xl border-b border-transparent bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-200" />
                                    <h1 className="text-xl font-bold text-white">Create New Event</h1>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between max-w-xl mx-auto px-4">
                                <div className="flex flex-col items-center flex-1 relative">
                                    <div className={stepperClass(1)}>
                                        {currentStep > 1 ? <span className="text-emerald-500">✔</span> : '1'}
                                    </div>
                                    <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 1 ? 'text-white' : 'text-blue-200'}`}>Basic Info</span>
                                </div>

                                <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
                                    <div
                                        className="absolute inset-0 bg-white transition-all duration-300"
                                        style={{ width: currentStep > 1 ? '100%' : '0%' }}
                                    />
                                </div>

                                <div className="flex flex-col items-center flex-1 relative">
                                    <div className={stepperClass(2)}>
                                        {currentStep > 2 ? <span className="text-emerald-500">✔</span> : '2'}
                                    </div>
                                    <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 2 ? 'text-white' : 'text-blue-200'}`}>Location</span>
                                </div>

                                <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
                                    <div
                                        className="absolute inset-0 bg-white transition-all duration-300"
                                        style={{ width: currentStep > 2 ? '100%' : '0%' }}
                                    />
                                </div>

                                <div className="flex flex-col items-center flex-1 relative">
                                    <div className={stepperClass(3)}>3</div>
                                    <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 3 ? 'text-white' : 'text-blue-200'}`}>Audience</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-slate-50/50 px-6 py-6 dark:bg-slate-900/40">
                                <div className="grid grid-cols-1 gap-6">
                                    {currentStep === 1 && (
                                        <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out animate-in fade-in duration-200">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="event_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Event Name *
                                                    </Label>
                                                    <Input
                                                        id="event_name"
                                                        list="announcementsList"
                                                        value={formData.event_name}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFormData((prev) => ({ ...prev, event_name: value }));
                                                            const matched = announcements.find((a) => a.title === value);
                                                            if (matched) {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    event_date: matched.eventDate || prev.event_date,
                                                                    event_time: matched.eventTime || prev.event_time,
                                                                }));
                                                            }
                                                            clearFieldError('event_name');
                                                        }}
                                                        placeholder="Enter or select an event name"
                                                        className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.event_name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        required
                                                    />
                                                    {validationErrors.event_name && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.event_name}</span>
                                                    )}
                                                    {announcements.length > 0 && (
                                                        <datalist id="announcementsList">
                                                            {announcements.map((a) => (
                                                                <option key={a.id} value={a.title} />
                                                            ))}
                                                        </datalist>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="organizer" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Organizer *
                                                    </Label>
                                                    <Select
                                                        value={formData.organizer}
                                                        onValueChange={(value) => {
                                                            setFormData((prev) => ({ ...prev, organizer: value }));
                                                            clearFieldError('organizer');
                                                        }}
                                                    >
                                                        <SelectTrigger id="organizer" className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.organizer ? 'border-rose-500 focus:ring-rose-500' : ''}`}>
                                                            <SelectValue placeholder="Select organizer" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Admin Office">Admin Office</SelectItem>
                                                            <SelectItem value="Academic Affairs">Academic Affairs</SelectItem>
                                                            <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                                                            <SelectItem value="Sports Department">Sports Department</SelectItem>
                                                            <SelectItem value="Library">Library</SelectItem>
                                                            <SelectItem value="Guidance Office">Guidance Office</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {validationErrors.organizer && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.organizer}</span>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="event_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Date *
                                                    </Label>
                                                    <Input
                                                        id="event_date"
                                                        type="date"
                                                        value={formData.event_date}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({ ...prev, event_date: e.target.value }));
                                                            clearFieldError('event_date');
                                                        }}
                                                        className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.event_date ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        required
                                                    />
                                                    {validationErrors.event_date && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.event_date}</span>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="event_time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Time *
                                                    </Label>
                                                    <Input
                                                        id="event_time"
                                                        type="time"
                                                        value={formData.event_time}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({ ...prev, event_time: e.target.value }));
                                                            clearFieldError('event_time');
                                                        }}
                                                        className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.event_time ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        required
                                                    />
                                                    {validationErrors.event_time && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.event_time}</span>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="registration_end_time" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Registration End Time
                                                    </Label>
                                                    <Input
                                                        id="registration_end_time"
                                                        type="time"
                                                        value={formData.registration_end_time}
                                                        onChange={(e) => setFormData((prev) => ({ ...prev, registration_end_time: e.target.value }))}
                                                        className="h-9 dark:border-slate-600 dark:bg-slate-800"
                                                    />
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Description
                                                    </Label>
                                                    <textarea
                                                        id="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Enter event description (optional)"
                                                        className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-400 dark:ring-offset-slate-900"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out animate-in fade-in duration-200">
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Location *
                                                    </Label>
                                                    <Input
                                                        id="location"
                                                        value={formData.location}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({ ...prev, location: e.target.value }));
                                                            clearFieldError('location');
                                                        }}
                                                        placeholder="Enter event venue/room name"
                                                        className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.location ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        required
                                                    />
                                                    {validationErrors.location && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.location}</span>
                                                    )}
                                                </div>

                                                <div className="grid gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Geotagging & Validation Settings</Label>
                                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                                                        <input
                                                            type="checkbox"
                                                            id="geofence_enabled"
                                                            checked={formData.geofence_enabled}
                                                            onChange={(e) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    geofence_enabled: e.target.checked,
                                                                    geofence_radius_m: prev.geofence_radius_m || '50',
                                                                }));
                                                                setValidationErrors({});
                                                            }}
                                                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-600 dark:bg-slate-800"
                                                        />
                                                        <Label htmlFor="geofence_enabled" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                                            Enable geofence location validation
                                                        </Label>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-1 leading-relaxed">
                                                        When enabled, students must be physically within the designated campus area to scan and record attendance. The coordinates can be populated manually or selected on the campus map below.
                                                    </p>
                                                </div>

                                                {formData.geofence_enabled && (
                                                    <>
                                                        <div className="grid gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                id="btn-select-map-location"
                                                                className="h-9 text-sm font-semibold border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:bg-blue-950/20"
                                                                onClick={() => setShowMapSelector((prev) => !prev)}
                                                            >
                                                                📍 {showMapSelector ? 'Hide Campus Map' : 'Select Location on Campus Map'}
                                                            </Button>
                                                        </div>

                                                        {showMapSelector && (
                                                            <div className="min-h-[300px] border border-slate-200 rounded-lg p-2 bg-white dark:bg-slate-950/40 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                                                                <SchoolMapSelector
                                                                    onLocationSelect={handleMapLocationSelect}
                                                                    initialLocation={
                                                                        formData.geofence_latitude && formData.geofence_longitude
                                                                            ? {
                                                                                latitude: parseFloat(formData.geofence_latitude),
                                                                                longitude: parseFloat(formData.geofence_longitude),
                                                                                name: selectedLocationName,
                                                                            }
                                                                            : undefined
                                                                    }
                                                                />
                                                            </div>
                                                        )}

                                                        {selectedLocationName && (
                                                            <div className="grid gap-2 bg-emerald-50/30 border border-emerald-200/50 rounded-lg px-4 py-2.5 dark:bg-emerald-950/10 dark:border-emerald-900/30">
                                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                    Selected Facility:{' '}
                                                                    <span className="font-semibold text-emerald-800 dark:text-emerald-400">{selectedLocationName}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="geofence_latitude" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                    Latitude
                                                                </Label>
                                                                <Input
                                                                    id="geofence_latitude"
                                                                    value={formData.geofence_latitude}
                                                                    onChange={(e) => {
                                                                        setFormData((prev) => ({ ...prev, geofence_latitude: e.target.value }));
                                                                        clearFieldError('geofence_latitude');
                                                                    }}
                                                                    placeholder="e.g. 8.742771"
                                                                    className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofence_latitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                                />
                                                                {validationErrors.geofence_latitude && (
                                                                    <span className="text-xs text-rose-500 font-medium">{validationErrors.geofence_latitude}</span>
                                                                )}
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="geofence_longitude" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                    Longitude
                                                                </Label>
                                                                <Input
                                                                    id="geofence_longitude"
                                                                    value={formData.geofence_longitude}
                                                                    onChange={(e) => {
                                                                        setFormData((prev) => ({ ...prev, geofence_longitude: e.target.value }));
                                                                        clearFieldError('geofence_longitude');
                                                                    }}
                                                                    placeholder="e.g. 124.774366"
                                                                    className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofence_longitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                                />
                                                                {validationErrors.geofence_longitude && (
                                                                    <span className="text-xs text-rose-500 font-medium">{validationErrors.geofence_longitude}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="geofence_radius_m" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                Geofence Radius (meters) *
                                                            </Label>
                                                            <Input
                                                                id="geofence_radius_m"
                                                                type="number"
                                                                min={10}
                                                                max={500}
                                                                value={formData.geofence_radius_m}
                                                                onChange={(e) => {
                                                                    setFormData((prev) => ({ ...prev, geofence_radius_m: e.target.value }));
                                                                    clearFieldError('geofence_radius_m');
                                                                }}
                                                                className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofence_radius_m ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                            />
                                                            {validationErrors.geofence_radius_m && (
                                                                <span className="text-xs text-rose-500 font-medium">{validationErrors.geofence_radius_m}</span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out animate-in fade-in duration-200">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-4 sm:col-span-2">
                                                    <div className="grid gap-2 sm:col-span-2">
                                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Courses</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${formData.courses.length === 0
                                                                        ? 'bg-[#1e40af] text-white border-transparent shadow-sm'
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                                    }`}
                                                                onClick={() => setFormData((prev) => ({ ...prev, courses: [] }))}
                                                            >
                                                                {formData.courses.length === 0 && <span className="text-emerald-500">✔</span>}
                                                                All Courses
                                                            </button>
                                                            {courseSelectOptions.map((course) => {
                                                                const isSelected = formData.courses.includes(course.id);
                                                                return (
                                                                    <button
                                                                        key={course.id}
                                                                        type="button"
                                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${isSelected
                                                                                ? 'bg-blue-50 text-[#1e40af] border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-900/30'
                                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                                            }`}
                                                                        onClick={() => {
                                                                            setFormData((prev) => {
                                                                                const next = prev.courses.includes(course.id)
                                                                                    ? prev.courses.filter((id) => id !== course.id)
                                                                                    : [...prev.courses, course.id];
                                                                                return { ...prev, courses: next };
                                                                            });
                                                                        }}
                                                                    >
                                                                        {isSelected && <Check className="h-3 w-3" />}
                                                                        {course.name} ({course.code})
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2 mt-2">
                                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Year Levels</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${formData.year_levels.length === 0
                                                                    ? 'bg-[#1e40af] text-white border-transparent shadow-sm'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                                }`}
                                                            onClick={() => setFormData((prev) => ({ ...prev, year_levels: [] }))}
                                                        >
                                                            {formData.year_levels.length === 0 && <Check className="h-3 w-3" />}
                                                            All Year Levels
                                                        </button>
                                                        {mergedYearChoices.map((yearLevel) => {
                                                            const isSelected = formData.year_levels.includes(yearLevel.id);
                                                            return (
                                                                <button
                                                                    key={yearLevel.id}
                                                                    type="button"
                                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${isSelected
                                                                            ? 'bg-blue-50 text-[#1e40af] border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-900/30'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                                        }`}
                                                                    onClick={() => {
                                                                        setFormData((prev) => {
                                                                            const next = prev.year_levels.includes(yearLevel.id)
                                                                                ? prev.year_levels.filter((id) => id !== yearLevel.id)
                                                                                : [...prev.year_levels, yearLevel.id];
                                                                            return { ...prev, year_levels: next };
                                                                        });
                                                                    }}
                                                                >
                                                                    {isSelected && <Check className="h-3 w-3" />}
                                                                    {yearLevel.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label htmlFor="expected_attendees" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Expected Attendees (Auto-calculated)
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="expected_attendees"
                                                            type="text"
                                                            value={computedExpectedAttendees}
                                                            readOnly
                                                            placeholder="Number of expected attendees"
                                                            className="h-9 pl-9 bg-slate-50/50 font-semibold text-[#1e40af] dark:bg-slate-850 dark:text-blue-400"
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                                    <div className="rounded-lg bg-blue-50/50 border border-blue-200/50 p-3.5 dark:bg-blue-950/20 dark:border-blue-900/30">
                                                        <div className="flex gap-2.5">
                                                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-blue-950 dark:text-blue-200">Automatic Scanner Access Enabled</h4>
                                                                <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                                                                    All students belonging to the selected Target Courses and Target Year Levels are automatically
                                                                    authorized to act as attendance scanners from their student accounts. There is no need to manually
                                                                    assign scanner IDs.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 sm:col-span-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="scanner_portal_active"
                                                            checked={formData.scanner_portal_active}
                                                            onChange={(e) => setFormData((prev) => ({ ...prev, scanner_portal_active: e.target.checked }))}
                                                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-600 dark:bg-slate-800"
                                                        />
                                                        <Label htmlFor="scanner_portal_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                                            Activate Scanner Portal for this event
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                                {currentStep > 1 ? (
                                    <Button variant="secondary" type="button" onClick={handleBack} className="px-4 gap-1.5">
                                        Back
                                    </Button>
                                ) : (
                                    <Button variant="secondary" type="button" onClick={() => router.visit(adminEvents())} className="px-4">
                                        Cancel
                                    </Button>
                                )}

                                <div className="flex items-center gap-2">
                                    {currentStep < 3 ? (
                                        <Button
                                            type="button"
                                            id="btn-step-next"
                                            onClick={(e) => { e.preventDefault(); handleNext(); }}
                                            className="bg-[#121F78] hover:bg-[#0f1a66] text-white px-5"
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            id="btn-create-event-submit"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 font-semibold"
                                            onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                                        >
                                            Create Event
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {currentStep === 3 && scannerSearchResults.length > 0 && scannerStudentQuery && (
                        <div className="hidden h-fit w-72 shrink-0 self-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left-2 duration-200 dark:border-slate-700 dark:bg-slate-900 lg:block">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Search Results</span>
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
                                        onClick={() => addSelectedStudent(student)}
                                    >
                                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{student.name}</span>
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">#{student.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
