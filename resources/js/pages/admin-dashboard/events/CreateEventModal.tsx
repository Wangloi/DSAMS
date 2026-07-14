import { Calendar, MapPin, Users, GraduationCap, Check, Info, X } from 'lucide-react';
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
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    onSubmit: (payload: CreateEventPayload) => void;
    courses: Array<{ id: string; name: string; code: string; }>;
    yearLevels: Array<{ id: string; name: string; code: string; }>;
    totalStudents: number;
    studentCountsByCourseYear: Array<{ course: string; year_level: string; total: number }>;
    announcements?: Array<{ id: string | number; title: string; eventDate?: string; eventTime?: string }>;
    mode?: 'create' | 'edit';
    initialEvent?: Record<string, any> | null;
};

export default function CreateEventModal({ open, onOpenChange, onClose, onSubmit, courses, yearLevels, totalStudents, studentCountsByCourseYear, announcements, mode = 'create', initialEvent }: Props) {
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
        geofenceEnabled: false,
        geofenceLatitude: '',
        geofenceLongitude: '',
        geofenceRadiusM: '50',
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const courseSelectOptions = useMemo(() => dedupeCourseRows(courses), [courses]);

    // Populate form when editing an existing event or reset on create
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
                    geofenceEnabled: !!initialEvent.geofence_enabled,
                    geofenceLatitude: String(initialEvent.geofence_latitude ?? ''),
                    geofenceLongitude: String(initialEvent.geofence_longitude ?? ''),
                    geofenceRadiusM: String(initialEvent.geofence_radius_m ?? '50'),
                });
                setCurrentStep(1);
                setValidationErrors({});
            } else if (mode === 'create') {
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
                });
                setCurrentStep(1);
                setValidationErrors({});
            }
        }
    }, [open, mode, initialEvent]);

    const [scannerStudentQuery, setScannerStudentQuery] = useState('');
    const [scannerSearchResults, setScannerSearchResults] = useState<Array<{ id: string; name: string }>>([]);
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState('');
    const [selectedScannerStudents, setSelectedScannerStudents] = useState<Array<{ id: string; name: string }>>([]);

    const [showMapSelector, setShowMapSelector] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');

    const handleMapLocationSelect = (lat: number, lng: number, name?: string) => {
        setFormData(prev => ({
            ...prev,
            geofenceLatitude: lat.toFixed(6),
            geofenceLongitude: lng.toFixed(6),
        }));
        setSelectedLocationName(name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        if (validationErrors.geofenceLatitude || validationErrors.geofenceLongitude) {
            setValidationErrors(prev => {
                const copy = { ...prev };
                delete copy.geofenceLatitude;
                delete copy.geofenceLongitude;
                return copy;
            });
        }
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
                const data = await res.json() as { students?: Array<{ id: string; name: string }> };
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
        setFormData(prev => ({
            ...prev,
            scannerStudentIds: selectedScannerStudents.map(s => s.id)
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
            if (!formData.location.trim()) {
                errors.location = 'Location description is required';
            }
            if (formData.geofenceEnabled) {
                if (!formData.geofenceLatitude) {
                    errors.geofenceLatitude = 'Latitude is required when geofencing is enabled';
                } else if (isNaN(Number(formData.geofenceLatitude))) {
                    errors.geofenceLatitude = 'Latitude must be a valid number';
                }

                if (!formData.geofenceLongitude) {
                    errors.geofenceLongitude = 'Longitude is required when geofencing is enabled';
                } else if (isNaN(Number(formData.geofenceLongitude))) {
                    errors.geofenceLongitude = 'Longitude must be a valid number';
                }

                if (!formData.geofenceRadiusM) {
                    errors.geofenceRadiusM = 'Radius is required';
                } else {
                    const radiusNum = Number(formData.geofenceRadiusM);
                    if (isNaN(radiusNum) || radiusNum < 10 || radiusNum > 500) {
                        errors.geofenceRadiusM = 'Radius must be a number between 10 and 500 meters';
                    }
                }
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setValidationErrors({});
        setCurrentStep(prev => Math.max(prev - 1, 1));
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
        setSelectedScannerStudents(prev => {
            if (prev.some(s => s.id === student.id)) return prev;
            return [...prev, student];
        });
        setScannerStudentQuery('');
        setScannerSearchResults([]);
    };

    const removeSelectedStudent = (id: string) => {
        setSelectedScannerStudents(prev => prev.filter(s => s.id !== id));
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="mx-auto w-full max-w-5xl flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh]">
                
                {/* Header with stepper */}
                <div className="shrink-0 border-b border-transparent bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-white text-xl font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-200" />
                                {mode === 'edit' ? 'Edit Event' : 'Create New Event'}
                            </h1>
                            <p className="text-white/80 text-sm mt-1">
                                Fill in the event details to create a new attendance event.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Stepper Header UI */}
                    <div className="mt-6 flex items-center justify-between max-w-xl mx-auto px-4">
                        {/* Step 1 Indicator */}
                        <div className="flex flex-col items-center flex-1 relative">
                            <div 
                                className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                                    currentStep === 1 
                                        ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md' 
                                        : currentStep > 1 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-blue-800 text-blue-200'
                                }`}
                            >
                                {currentStep > 1 ? <Check className="h-5 w-5" /> : '1'}
                            </div>
                            <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 1 ? 'text-white' : 'text-blue-200'}`}>Basic Info</span>
                        </div>

                        {/* Line 1-2 */}
                        <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
                            <div 
                                className="absolute inset-0 bg-white transition-all duration-300"
                                style={{ width: currentStep > 1 ? '100%' : '0%' }}
                            />
                        </div>

                        {/* Step 2 Indicator */}
                        <div className="flex flex-col items-center flex-1 relative">
                            <div 
                                className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                                    currentStep === 2 
                                        ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md' 
                                        : currentStep > 2 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-blue-800 text-blue-200'
                                }`}
                            >
                                {currentStep > 2 ? <Check className="h-5 w-5" /> : '2'}
                            </div>
                            <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 2 ? 'text-white' : 'text-blue-200'}`}>Location</span>
                        </div>

                        {/* Line 2-3 */}
                        <div className="h-0.5 flex-1 mx-2 bg-blue-800 relative">
                            <div 
                                className="absolute inset-0 bg-white transition-all duration-300"
                                style={{ width: currentStep > 2 ? '100%' : '0%' }}
                            />
                        </div>

                        {/* Step 3 Indicator */}
                        <div className="flex flex-col items-center flex-1 relative">
                            <div 
                                className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                                    currentStep === 3 
                                        ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md' 
                                        : 'bg-blue-800 text-blue-200'
                                }`}
                            >
                                3
                            </div>
                            <span className={`text-[11px] mt-2 font-medium tracking-wide transition-colors ${currentStep === 3 ? 'text-white' : 'text-blue-200'}`}>Audience</span>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-slate-50/50 px-6 py-6 dark:bg-slate-900/40">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 gap-6">
                            
                            {/* Step 1: Basic Information */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out animate-in fade-in duration-200">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="eventName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Event Name *
                                            </Label>
                                            <Input
                                                id="eventName"
                                                list="announcementsList"
                                                value={formData.eventName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({ ...prev, eventName: val }));
                                                    
                                                    const matched = announcements?.find(a => a.title === val);
                                                    if (matched) {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            eventDate: matched.eventDate || prev.eventDate,
                                                            eventTime: matched.eventTime || prev.eventTime
                                                        }));
                                                    }
                                                    if (validationErrors.eventName) {
                                                        setValidationErrors(prev => {
                                                            const copy = { ...prev };
                                                            delete copy.eventName;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                placeholder="Enter or select an event name"
                                                className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.eventName ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                required
                                            />
                                            {validationErrors.eventName && (
                                                <span className="text-xs text-rose-500 font-medium">{validationErrors.eventName}</span>
                                            )}
                                            {announcements && announcements.length > 0 && (
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
                                                    setFormData(prev => ({ ...prev, organizer: value }));
                                                    if (validationErrors.organizer) {
                                                        setValidationErrors(prev => {
                                                            const copy = { ...prev };
                                                            delete copy.organizer;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                required
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
                                            <Label htmlFor="eventDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Date *
                                            </Label>
                                            <Input
                                                id="eventDate"
                                                type="date"
                                                value={formData.eventDate}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, eventDate: e.target.value }));
                                                    if (validationErrors.eventDate) {
                                                        setValidationErrors(prev => {
                                                            const copy = { ...prev };
                                                            delete copy.eventDate;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.eventDate ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                required
                                            />
                                            {validationErrors.eventDate && (
                                                <span className="text-xs text-rose-500 font-medium">{validationErrors.eventDate}</span>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="eventTime" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Time *
                                            </Label>
                                            <Input
                                                id="eventTime"
                                                type="time"
                                                value={formData.eventTime}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, eventTime: e.target.value }));
                                                    if (validationErrors.eventTime) {
                                                        setValidationErrors(prev => {
                                                            const copy = { ...prev };
                                                            delete copy.eventTime;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.eventTime ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                required
                                            />
                                            {validationErrors.eventTime && (
                                                <span className="text-xs text-rose-500 font-medium">{validationErrors.eventTime}</span>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="registrationEndTime" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Registration End Time
                                            </Label>
                                            <Input
                                                id="registrationEndTime"
                                                type="time"
                                                value={formData.registrationEndTime}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, registrationEndTime: e.target.value }))}
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
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Enter event description (optional)"
                                                className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-400 dark:ring-offset-slate-900"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 2: Location & Geofencing */}
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
                                                    setFormData(prev => ({ ...prev, location: e.target.value }));
                                                    if (validationErrors.location) {
                                                        setValidationErrors(prev => {
                                                            const copy = { ...prev };
                                                            delete copy.location;
                                                            return copy;
                                                        });
                                                    }
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
                                                    id="geofenceEnabled"
                                                    checked={formData.geofenceEnabled}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            geofenceEnabled: e.target.checked,
                                                            geofenceRadiusM: prev.geofenceRadiusM || '50',
                                                        }));
                                                        setValidationErrors({});
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-600 dark:bg-slate-800"
                                                />
                                                <Label htmlFor="geofenceEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                                    Enable geofence location validation
                                                </Label>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 pl-1 leading-relaxed">
                                                When enabled, students must be physically within the designated campus area to scan and record attendance. The coordinates can be populated manually or selected on the campus map below.
                                            </p>
                                        </div>

                                        {formData.geofenceEnabled && (
                                            <>
                                                <div className="grid gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        id="btn-select-map-location"
                                                        className="h-9 text-sm font-semibold border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:bg-blue-950/20"
                                                        onClick={() => setShowMapSelector(prev => !prev)}
                                                    >
                                                        📍 {showMapSelector ? 'Hide Campus Map' : 'Select Location on Campus Map'}
                                                    </Button>
                                                </div>

                                                {showMapSelector && (
                                                    <div className="border border-slate-200 rounded-lg p-2 bg-white dark:bg-slate-950/40 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                                                        <SchoolMapSelector
                                                            onLocationSelect={handleMapLocationSelect}
                                                            initialLocation={
                                                                formData.geofenceLatitude && formData.geofenceLongitude
                                                                    ? { latitude: parseFloat(formData.geofenceLatitude), longitude: parseFloat(formData.geofenceLongitude), name: selectedLocationName }
                                                                    : undefined
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {selectedLocationName && (
                                                    <div className="grid gap-2 bg-emerald-50/30 border border-emerald-200/50 rounded-lg px-4 py-2.5 dark:bg-emerald-950/10 dark:border-emerald-900/30">
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                                            Selected Facility: <span className="font-semibold text-emerald-800 dark:text-emerald-400">{selectedLocationName}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="geofenceLatitude" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Latitude
                                                        </Label>
                                                        <Input
                                                            id="geofenceLatitude"
                                                            value={formData.geofenceLatitude}
                                                            onChange={(e) => {
                                                                setFormData((prev) => ({ ...prev, geofenceLatitude: e.target.value }));
                                                                if (validationErrors.geofenceLatitude) {
                                                                    setValidationErrors(prev => {
                                                                        const copy = { ...prev };
                                                                        delete copy.geofenceLatitude;
                                                                        return copy;
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="e.g. 8.742771"
                                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofenceLatitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        />
                                                        {validationErrors.geofenceLatitude && (
                                                            <span className="text-xs text-rose-500 font-medium">{validationErrors.geofenceLatitude}</span>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="geofenceLongitude" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Longitude
                                                        </Label>
                                                        <Input
                                                            id="geofenceLongitude"
                                                            value={formData.geofenceLongitude}
                                                            onChange={(e) => {
                                                                setFormData((prev) => ({ ...prev, geofenceLongitude: e.target.value }));
                                                                if (validationErrors.geofenceLongitude) {
                                                                    setValidationErrors(prev => {
                                                                        const copy = { ...prev };
                                                                        delete copy.geofenceLongitude;
                                                                        return copy;
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="e.g. 124.774366"
                                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofenceLongitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                        />
                                                        {validationErrors.geofenceLongitude && (
                                                            <span className="text-xs text-rose-500 font-medium">{validationErrors.geofenceLongitude}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="geofenceRadiusM" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Geofence Radius (meters) *
                                                    </Label>
                                                    <Input
                                                        id="geofenceRadiusM"
                                                        type="number"
                                                        min={10}
                                                        max={500}
                                                        value={formData.geofenceRadiusM}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({ ...prev, geofenceRadiusM: e.target.value }));
                                                            if (validationErrors.geofenceRadiusM) {
                                                                setValidationErrors(prev => {
                                                                    const copy = { ...prev };
                                                                    delete copy.geofenceRadiusM;
                                                                    return copy;
                                                                });
                                                            }
                                                        }}
                                                        className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${validationErrors.geofenceRadiusM ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                    />
                                                    {validationErrors.geofenceRadiusM && (
                                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.geofenceRadiusM}</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 3: Audience & Security */}
                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 gap-6 transition-all duration-300 ease-in-out animate-in fade-in duration-200">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-4 sm:col-span-2">
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Target Courses
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                            formData.courses.length === 0
                                                            ? 'bg-[#1e40af] text-white border-transparent shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                        }`}
                                                        onClick={() => setFormData(prev => ({ ...prev, courses: [] }))}
                                                    >
                                                        {formData.courses.length === 0 && <Check className="h-3 w-3" />}
                                                        All Courses
                                                    </button>
                                                    {courseSelectOptions.map((course) => {
                                                        const isSelected = formData.courses.includes(course.id);
                                                        return (
                                                            <button
                                                                key={course.id}
                                                                type="button"
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                                    isSelected
                                                                    ? 'bg-blue-50 text-[#1e40af] border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-900/30'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                                }`}
                                                                onClick={() => {
                                                                    setFormData(prev => {
                                                                        const newCourses = prev.courses.includes(course.id)
                                                                            ? prev.courses.filter(id => id !== course.id)
                                                                            : [...prev.courses, course.id];
                                                                        return { ...prev, courses: newCourses };
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
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Target Year Levels
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                        formData.yearLevels.length === 0
                                                        ? 'bg-[#1e40af] text-white border-transparent shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                    }`}
                                                    onClick={() => setFormData(prev => ({ ...prev, yearLevels: [] }))}
                                                >
                                                    {formData.yearLevels.length === 0 && <Check className="h-3 w-3" />}
                                                    All Year Levels
                                                </button>
                                                {yearLevels.map((yearLevel) => {
                                                    const isSelected = formData.yearLevels.includes(yearLevel.id);
                                                    return (
                                                        <button
                                                            key={yearLevel.id}
                                                            type="button"
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                                                                isSelected
                                                                ? 'bg-blue-50 text-[#1e40af] border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-900/30'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                                                            }`}
                                                            onClick={() => {
                                                                setFormData(prev => {
                                                                    const newYearLevels = prev.yearLevels.includes(yearLevel.id)
                                                                        ? prev.yearLevels.filter(id => id !== yearLevel.id)
                                                                        : [...prev.yearLevels, yearLevel.id];
                                                                    return { ...prev, yearLevels: newYearLevels };
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
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="expectedAttendees" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Expected Attendees (Auto-calculated)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="expectedAttendees"
                                                type="number"
                                                value={formData.expectedAttendees}
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
                                                    <h4 className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                                                        Automatic Scanner Access Enabled
                                                    </h4>
                                                    <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                                                        All students belonging to the selected Target Courses and Target Year Levels are automatically authorized to act as attendance scanners from their student accounts. There is no need to manually assign scanner IDs.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="flex shrink-0 justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                    {currentStep === 1 ? (
                        <Button 
                            variant="secondary" 
                            type="button" 
                            id="btn-step-cancel"
                            onClick={handleClose}
                            className="px-4"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button 
                            variant="secondary" 
                            type="button" 
                            id="btn-step-prev"
                            onClick={handleBack}
                            className="px-4 gap-1.5"
                        >
                            Back
                        </Button>
                    )}

                    {currentStep < 3 ? (
                        <Button
                            type="button"
                            id="btn-step-next"
                            onClick={handleNext}
                            className="bg-[#121F78] hover:bg-[#0f1a66] text-white px-5"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            id="btn-create-event-submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 font-semibold"
                            onClick={handleSubmit}
                        >
                            {mode === 'edit' ? 'Update Event' : 'Create Event'}
                        </Button>
                    )}
                </div>
                
                {/* Step-conditional Scanner Student search results panel */}
                {currentStep === 3 && scannerSearchResults.length > 0 && scannerStudentQuery && (
                    <div className="hidden h-fit w-72 shrink-0 self-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left-2 duration-200 dark:border-slate-700 dark:bg-slate-900 lg:block">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Search Results</span>
                            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">{scannerSearchResults.length} found</span>
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
    );
}
