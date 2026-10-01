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
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Compass,
    Info,
    MapPin,
    Plus,
    Radio,
    Search,
    ShieldCheck,
    Sparkles,
    UserCheck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
    scannerStudentIdsModified?: boolean;
    geofenceEnabled: boolean;
    geofenceLatitude: string;
    geofenceLongitude: string;
    geofenceRadiusM: string;
    attendanceType: string;
};

const SCHOOL_MAP_LOCATIONS = [
    {
        name: "St. Rita's College of Balingasag (Full Campus)",
        lat: '8.743180',
        lng: '124.774380',
    },
    { name: 'Main Gate', lat: '8.742750', lng: '124.774450' },
    { name: 'Cafeteria', lat: '8.743160', lng: '124.774360' },
    { name: 'Gymnasium', lat: '8.742800', lng: '124.774200' },
    { name: 'RVM TTP Program Office', lat: '8.743890', lng: '124.774250' },
    { name: 'Power House', lat: '8.743050', lng: '124.774500' },
    { name: 'Parking Area', lat: '8.742700', lng: '124.774400' },
    { name: 'Outer Ground', lat: '8.742990', lng: '124.774390' },
    { name: 'Inner Ground', lat: '8.743170', lng: '124.774370' },
    { name: 'Parents Lounge', lat: '8.743130', lng: '124.774350' },
    {
        name: 'Christian Formation Office (1st floor)',
        lat: '8.743200',
        lng: '124.774280',
    },
    { name: 'Chapel (1st floor)', lat: '8.743220', lng: '124.774290' },
    { name: 'Room 101 (1st floor)', lat: '8.743240', lng: '124.774300' },
    { name: 'HM Laboratory (1st floor)', lat: '8.743150', lng: '124.774190' },
    {
        name: 'College Library (2nd Floor)',
        lat: '8.743260',
        lng: '124.774300',
    },
    {
        name: 'Dean of College (2nd Floor)',
        lat: '8.743280',
        lng: '124.774310',
    },
    {
        name: 'College Faculty Room (2nd Floor)',
        lat: '8.743300',
        lng: '124.774310',
    },
    {
        name: "Program Head's Office (2nd Floor)",
        lat: '8.743320',
        lng: '124.774320',
    },
    { name: 'IT LABORATORY (3rd floor)', lat: '8.743340', lng: '124.774320' },
    { name: 'Room 301 (3rd floor)', lat: '8.743360', lng: '124.774330' },
    { name: 'Room 302 (3rd floor)', lat: '8.743380', lng: '124.774330' },
    { name: 'Room 303 (3rd floor)', lat: '8.743400', lng: '124.774340' },
    { name: 'CRIM LAB (4th floor)', lat: '8.743420', lng: '124.774340' },
    { name: '401 Room (4th floor)', lat: '8.743440', lng: '124.774350' },
    { name: '402 Room (4th floor)', lat: '8.743460', lng: '124.774350' },
    { name: '403 Room (4th floor)', lat: '8.743480', lng: '124.774360' },
];

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
        id: string | number;
        title: string;
        eventDate?: string;
        eventTime?: string;
    }>;
    mode?: 'create' | 'edit';
    initialEvent?: Record<string, any> | null;
};

const DRAFT_KEY = 'dsams_create_event_draft_v1';

const getFormattedCutoff = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m + 60);
    let hh = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12;
    return `${hh}:${mm} ${ampm}`;
};

const getFormattedTimeOutStart = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m - 30);
    let hh = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12;
    return `${hh}:${mm} ${ampm}`;
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
    mode = 'create',
    initialEvent,
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
        geofenceEnabled: false,
        geofenceLatitude: '',
        geofenceLongitude: '',
        geofenceRadiusM: '50',
        attendanceType: 'qr_scanner',
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});
    const [isDraftRestored, setIsDraftRestored] = useState(false);

    const courseSelectOptions = useMemo(
        () => dedupeCourseRows(courses),
        [courses],
    );

    const [scannerStudentQuery, setScannerStudentQuery] = useState('');
    const [scannerSearchResults, setScannerSearchResults] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState('');
    const [selectedScannerStudents, setSelectedScannerStudents] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [hasExplicitlyChangedScanners, setHasExplicitlyChangedScanners] = useState(false);
    const [suggestedScanners, setSuggestedScanners] = useState<
        Array<{ id: string; name: string; course?: string; year_level?: string }>
    >([]);
    const [suggestedEventName, setSuggestedEventName] = useState<string | null>(null);
    const [suggestedOrganizer, setSuggestedOrganizer] = useState<string | null>(null);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

    const parseScannersFromEvent = (ev: any): Array<{ id: string; name: string }> => {
        if (!ev) return [];

        const result: Array<{ id: string; name: string }> = [];
        const seen = new Set<string>();

        const addScanner = (rawId: any, rawName?: any) => {
            const id = String(rawId || '').trim();
            if (!id || seen.has(id)) return;
            seen.add(id);
            const name = String(rawName || '').trim() || id;
            result.push({ id, name });
        };

        // 1. Array of objects (scanner_students or scannerStudents)
        const scannerStudentsList = ev.scanner_students || ev.scannerStudents;
        if (Array.isArray(scannerStudentsList) && scannerStudentsList.length > 0) {
            scannerStudentsList.forEach((s: any) => {
                if (s && typeof s === 'object') {
                    addScanner(s.student_id || s.id, s.name);
                } else if (s) {
                    addScanner(s);
                }
            });
        }

        // 2. Array or JSON string of IDs (scanner_student_ids or scannerStudentIds)
        let scannerIdsList = ev.scanner_student_ids || ev.scannerStudentIds;
        if (typeof scannerIdsList === 'string') {
            try {
                const parsed = JSON.parse(scannerIdsList);
                if (Array.isArray(parsed)) scannerIdsList = parsed;
            } catch {}
        }
        if (Array.isArray(scannerIdsList) && scannerIdsList.length > 0) {
            scannerIdsList.forEach((id: any) => {
                if (id && typeof id === 'object') {
                    addScanner(id.student_id || id.id, id.name);
                } else if (id) {
                    addScanner(id);
                }
            });
        }

        // 3. Single ID (scanner_student_id or scannerStudentId)
        const singleScanner = ev.scanner_student_id || ev.scannerStudentId;
        if (singleScanner) {
            addScanner(singleScanner);
        }

        return result;
    };

    // Populate form when editing or restore draft on create
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialEvent) {
                const initialScanners = parseScannersFromEvent(initialEvent);

                setSelectedScannerStudents(initialScanners);
                setHasExplicitlyChangedScanners(false);
                setScannerStudentQuery('');
                setScannerSearchResults([]);
                setScannerStudentError('');

                // Resolve any student names that fell back to raw ID
                initialScanners.forEach((scanner) => {
                    if (scanner.name === scanner.id) {
                        fetch(
                            `/admin/students/lookup?student_id=${encodeURIComponent(scanner.id)}`,
                            {
                                headers: {
                                    Accept: 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            },
                        )
                            .then((res) => (res.ok ? res.json() : null))
                            .then((data) => {
                                if (data?.name) {
                                    setSelectedScannerStudents((prev) =>
                                        prev.map((item) =>
                                            item.id === scanner.id
                                                ? { ...item, name: data.name }
                                                : item,
                                        ),
                                    );
                                }
                            })
                            .catch(() => {});
                    }
                });

                setFormData({
                    eventName: initialEvent.event_name ?? '',
                    organizer: initialEvent.organizer ?? '',
                    location: initialEvent.location ?? '',
                    eventDate: (initialEvent.event_date ?? '').split('T')[0],
                    eventTime: initialEvent.event_time ?? '',
                    registrationEndTime:
                        initialEvent.registration_end_time ?? '',
                    expectedAttendees: String(
                        initialEvent.expected_attendees ?? '',
                    ),
                    description: initialEvent.description ?? '',
                    courses: initialEvent.courses ?? [],
                    yearLevels: initialEvent.year_levels ?? [],
                    scannerStudentIds: initialScanners.map((s) => s.id),
                    geofenceEnabled:
                        initialEvent.attendance_type === 'dynamic_qr'
                            ? (initialEvent.geofence_enabled ?? false)
                            : false,
                    geofenceLatitude: String(
                        initialEvent.geofence_latitude ?? '',
                    ),
                    geofenceLongitude: String(
                        initialEvent.geofence_longitude ?? '',
                    ),
                    geofenceRadiusM: String(
                        initialEvent.geofence_radius_m ?? '50',
                    ),
                    attendanceType:
                        initialEvent.attendance_type ?? 'qr_scanner',
                });
                setCurrentStep(1);
                setValidationErrors({});
                setIsDraftRestored(false);
            } else if (mode === 'create') {
                setSelectedScannerStudents([]);
                setScannerStudentQuery('');
                setScannerSearchResults([]);
                setScannerStudentError('');

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
                    geofenceEnabled: false,
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
                    JSON.stringify({ formData, currentStep }),
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
                e.returnValue =
                    'You have an unsaved event draft. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [open, mode, formData]);

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

    // Fetch suggested scanners based on the selected organizer (from the most recent event by that organizer)
    useEffect(() => {
        if (!open || mode !== 'create') {
            setSuggestedScanners([]);
            setSuggestedEventName(null);
            setSuggestedOrganizer(null);
            return;
        }

        const org = formData.organizer.trim();
        if (!org) {
            setSuggestedScanners([]);
            setSuggestedEventName(null);
            setSuggestedOrganizer(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsFetchingSuggestions(true);
            try {
                const res = await fetch(
                    `/admin/events/suggested-scanners?organizer=${encodeURIComponent(org)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.students) && data.students.length > 0) {
                        setSuggestedScanners(data.students);
                        setSuggestedEventName(data.last_event_name || null);
                        setSuggestedOrganizer(data.organizer || org);
                    } else {
                        setSuggestedScanners([]);
                        setSuggestedEventName(null);
                        setSuggestedOrganizer(null);
                    }
                }
            } catch {
                setSuggestedScanners([]);
            } finally {
                setIsFetchingSuggestions(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [open, mode, formData.organizer]);

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
                errors.eventTime = 'Time-In is required';
            }
            if (!formData.registrationEndTime) {
                errors.registrationEndTime = 'Time-End is required';
            } else if (
                formData.eventTime &&
                formData.registrationEndTime <= formData.eventTime
            ) {
                errors.registrationEndTime = 'Time-End must be after Time-In';
            }
        } else if (step === 2) {
            if (!formData.location.trim()) {
                errors.location = 'Event venue / location name is required';
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

        const isGpsMode = formData.attendanceType === 'dynamic_qr';
        const hasModifiedScanners = mode === 'edit' ? hasExplicitlyChangedScanners : true;
        const scannerIds =
            selectedScannerStudents.length > 0
                ? selectedScannerStudents.map((s) => s.id)
                : (hasModifiedScanners
                    ? []
                    : (formData.scannerStudentIds && formData.scannerStudentIds.length > 0
                        ? formData.scannerStudentIds
                        : parseScannersFromEvent(initialEvent).map((s) => s.id)));

        const payload: CreateEventPayload = {
            ...formData,
            scannerStudentIds: scannerIds,
            scannerStudentIdsModified: hasModifiedScanners,
            geofenceEnabled: isGpsMode ? true : !!formData.geofenceEnabled,
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
        setCurrentStep(1);
        setValidationErrors({});
        setScannerStudentQuery('');
        setSelectedScannerStudents([]);
        setScannerSearchResults([]);
        setScannerStudentError('');
        setSelectedLocationName('');
        setShowMapSelector(false);
        setHasExplicitlyChangedScanners(false);
        setSuggestedScanners([]);
        setSuggestedEventName(null);
        setSuggestedOrganizer(null);
        onClose();
    };

    const addSelectedStudent = (student: { id: string; name: string }) => {
        setHasExplicitlyChangedScanners(true);
        setSelectedScannerStudents((prev) => {
            if (prev.some((s) => s.id === student.id)) return prev;
            return [...prev, student];
        });
        setScannerStudentQuery('');
        setScannerSearchResults([]);
    };

    const addAllSuggestedScanners = () => {
        setHasExplicitlyChangedScanners(true);
        setSelectedScannerStudents((prev) => {
            const next = [...prev];
            suggestedScanners.forEach((student) => {
                if (!next.some((s) => s.id === student.id)) {
                    next.push({ id: student.id, name: student.name });
                }
            });
            return next;
        });
    };

    const removeSelectedStudent = (id: string) => {
        setHasExplicitlyChangedScanners(true);
        setSelectedScannerStudents((prev) => prev.filter((s) => s.id !== id));
    };

    if (!open) return null;
    if (typeof document === 'undefined') return null;

    const steps = [
        { id: 1, label: 'Basic Details' },
        { id: 2, label: 'Location & Check-In' },
        { id: 3, label: 'Target Audience' },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-xs transition-all sm:p-5">
            <div className="mx-auto flex max-h-[90vh] h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* ── MINIMAL BLUE HEADER ── */}
                <div className="shrink-0 bg-gradient-to-r from-[#000D6A] via-[#0B1E78] to-[#1E3A8A] px-6 py-4.5 text-white shadow-md sm:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#8CE4FF] shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                                {mode === 'edit' ? (
                                    <Sparkles className="h-5 w-5" />
                                ) : (
                                    <Calendar className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-white sm:text-lg">
                                        {mode === 'edit'
                                            ? 'Edit Event'
                                            : 'Create New Event'}
                                    </h2>
                                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-[#8CE4FF] backdrop-blur-xs">
                                        {mode === 'edit' ? 'Edit' : 'New'}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-100/80">
                                    Step {currentStep} of 3 —{' '}
                                    <span className="font-semibold text-white">
                                        {steps[currentStep - 1].label}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-xl bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="mt-4 flex items-center gap-2">
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
                                    className="group flex flex-1 items-center gap-2 text-left"
                                >
                                    <div
                                        className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                            isActive
                                                ? 'bg-[#8CE4FF] shadow-xs shadow-cyan-400/50'
                                                : isCompleted
                                                  ? 'bg-emerald-400'
                                                  : 'bg-white/20'
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── MODAL BODY ── */}
                <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
                    {isDraftRestored && mode === 'create' && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                            <span className="font-medium">
                                Restored your unsaved draft from your previous session.
                            </span>
                            <button
                                type="button"
                                onClick={discardDraft}
                                className="font-bold text-rose-700 underline hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200"
                            >
                                Discard Draft
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* STEP 1: BASIC DETAILS */}
                        {currentStep === 1 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-150">
                                {/* Event Name */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="eventName"
                                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        Event Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="eventName"
                                        list="announcementsList"
                                        value={formData.eventName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData((prev) => ({
                                                ...prev,
                                                eventName: val,
                                            }));

                                            const matched = announcements?.find(
                                                (a) => a.title === val,
                                            );
                                            if (matched) {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    eventDate:
                                                        matched.eventDate ||
                                                        prev.eventDate,
                                                    eventTime:
                                                        matched.eventTime ||
                                                        prev.eventTime,
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
                                        placeholder="e.g. Annual Sports Fest, IT Seminar 2026"
                                        className={`h-10 rounded-xl text-xs dark:border-slate-700 dark:bg-slate-800 ${
                                            validationErrors.eventName
                                                ? 'border-rose-500 focus-visible:ring-rose-500'
                                                : ''
                                        }`}
                                        required
                                    />
                                    {validationErrors.eventName && (
                                        <p className="text-xs font-medium text-rose-500">
                                            {validationErrors.eventName}
                                        </p>
                                    )}
                                    {announcements && announcements.length > 0 && (
                                        <datalist id="announcementsList">
                                            {announcements.map((a) => (
                                                <option
                                                    key={a.id}
                                                    value={a.title}
                                                />
                                            ))}
                                        </datalist>
                                    )}
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Organizer */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="organizer"
                                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Organizer <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="organizer"
                                            list="organizerSuggestions"
                                            value={formData.organizer}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    organizer: val,
                                                }));
                                                if (validationErrors.organizer) {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const copy = {
                                                                ...prev,
                                                            };
                                                            delete copy.organizer;
                                                            return copy;
                                                        },
                                                    );
                                                }
                                            }}
                                            placeholder="Enter or select organizing body"
                                            className={`h-10 rounded-xl text-xs dark:border-slate-700 dark:bg-slate-800 ${
                                                validationErrors.organizer
                                                    ? 'border-rose-500 focus-visible:ring-rose-500'
                                                    : ''
                                            }`}
                                            required
                                        />
                                        <datalist id="organizerSuggestions">
                                            <option value="Office of Student Affairs" />
                                            <option value="Student Affairs" />
                                            <option value="Dean of College" />
                                            <option value="Academic Affairs" />
                                            <option value="Admin Office" />
                                            <option value="College Student Government (CSG)" />
                                            <option value="Guidance Office" />
                                            <option value="HED Library" />
                                            <option value="Sports Department" />
                                        </datalist>
                                        {validationErrors.organizer && (
                                            <p className="text-xs font-medium text-rose-500">
                                                {validationErrors.organizer}
                                            </p>
                                        )}
                                    </div>

                                    {/* Event Date */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="eventDate"
                                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Event Date <span className="text-rose-500">*</span>
                                        </Label>
                                        <Input
                                            id="eventDate"
                                            type="date"
                                            value={formData.eventDate}
                                            onChange={(e) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    eventDate: e.target.value,
                                                }));
                                                if (validationErrors.eventDate) {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const copy = {
                                                                ...prev,
                                                            };
                                                            delete copy.eventDate;
                                                            return copy;
                                                        },
                                                    );
                                                }
                                            }}
                                            className={`h-10 rounded-xl text-xs dark:border-slate-700 dark:bg-slate-800 ${
                                                validationErrors.eventDate
                                                    ? 'border-rose-500 focus-visible:ring-rose-500'
                                                    : ''
                                            }`}
                                            required
                                        />
                                        {validationErrors.eventDate && (
                                            <p className="text-xs font-medium text-rose-500">
                                                {validationErrors.eventDate}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Schedule Pair: Time-In & Time-End */}
                                <div className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <Clock className="h-4 w-4 text-[#000D6A] dark:text-blue-400" />
                                            <span>Event Schedule</span>
                                        </div>
                                        {formData.eventTime &&
                                            formData.registrationEndTime &&
                                            formData.registrationEndTime >
                                                formData.eventTime && (
                                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                    Duration:{' '}
                                                    {(() => {
                                                        const [ih, im] =
                                                            formData.eventTime
                                                                .split(':')
                                                                .map(Number);
                                                        const [oh, om] =
                                                            formData.registrationEndTime
                                                                .split(':')
                                                                .map(Number);
                                                        const diff =
                                                            oh * 60 +
                                                            om -
                                                            (ih * 60 + im);
                                                        const h = Math.floor(
                                                            diff / 60,
                                                        );
                                                        const m = diff % 60;
                                                        return h > 0
                                                            ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim()
                                                            : `${m}m`;
                                                    })()}
                                                </span>
                                            )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="eventTime"
                                                className="text-[11px] font-medium text-slate-600 dark:text-slate-400"
                                            >
                                                Time-In <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="eventTime"
                                                type="time"
                                                value={formData.eventTime}
                                                onChange={(e) => {
                                                    const timeInVal = e.target.value;
                                                    let calculatedTimeOut = formData.registrationEndTime;
                                                    if (timeInVal) {
                                                        const [hours, minutes] = timeInVal.split(':').map(Number);
                                                        const tempDate = new Date();
                                                        tempDate.setHours(hours);
                                                        tempDate.setMinutes(minutes + 180);
                                                        const pad = (n: number) => n.toString().padStart(2, '0');
                                                        calculatedTimeOut = `${pad(tempDate.getHours())}:${pad(tempDate.getMinutes())}`;
                                                    }

                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        eventTime: timeInVal,
                                                        registrationEndTime: calculatedTimeOut,
                                                    }));

                                                    setValidationErrors((prev) => {
                                                        const copy = { ...prev };
                                                        if (timeInVal) delete copy.eventTime;
                                                        if (calculatedTimeOut) delete copy.registrationEndTime;
                                                        return copy;
                                                    });
                                                }}
                                                className={`h-9 rounded-lg bg-white text-xs dark:bg-slate-900 ${
                                                    validationErrors.eventTime
                                                        ? 'border-rose-500'
                                                        : ''
                                                }`}
                                                required
                                            />
                                            {validationErrors.eventTime && (
                                                <p className="text-[10px] font-medium text-rose-500">
                                                    {validationErrors.eventTime}
                                                </p>
                                            )}
                                            {formData.eventTime && (
                                                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    Cut-off for on-time: <strong>{getFormattedCutoff(formData.eventTime)}</strong> (1 hr after start)
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="registrationEndTime"
                                                className="text-[11px] font-medium text-slate-600 dark:text-slate-400"
                                            >
                                                Time-End <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="registrationEndTime"
                                                type="time"
                                                value={formData.registrationEndTime}
                                                onChange={(e) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        registrationEndTime: e.target.value,
                                                    }));
                                                    if (validationErrors.registrationEndTime) {
                                                        setValidationErrors((prev) => {
                                                            const copy = { ...prev };
                                                            delete copy.registrationEndTime;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                className={`h-9 rounded-lg bg-white text-xs dark:bg-slate-900 ${
                                                    validationErrors.registrationEndTime
                                                        ? 'border-rose-500'
                                                        : ''
                                                }`}
                                                required
                                            />
                                            {validationErrors.registrationEndTime && (
                                                <p className="text-[10px] font-medium text-rose-500">
                                                    {validationErrors.registrationEndTime}
                                                </p>
                                            )}
                                            {formData.registrationEndTime && (
                                                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                                    Time-Out opens: <strong>{getFormattedTimeOutStart(formData.registrationEndTime)}</strong> (30 min before end)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attendance Schedule Info Note */}
                                    <div className="mt-3 rounded-lg border border-blue-200/80 bg-blue-50/70 p-3 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
                                        <div className="flex items-start gap-2.5">
                                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#000D6A] dark:text-blue-400" />
                                            <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    Attendance Rules & Cut-off Guidelines:
                                                </div>
                                                <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed">
                                                    <li>
                                                        <strong>Time-In Cut-off:</strong> Check-in is considered <em>On-Time</em> within <strong>1 hour after start time</strong>
                                                        {formData.eventTime && (
                                                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                                                {' '}(cut-off at {getFormattedCutoff(formData.eventTime)})
                                                            </span>
                                                        )}. Scans recorded after 1 hour will be marked as <strong>Late</strong>.
                                                    </li>
                                                    <li>
                                                        <strong>Time-Out (Check-Out) Window:</strong> Time-out scanning starts <strong>30 minutes before event end time</strong>
                                                        {formData.registrationEndTime && (
                                                            <span className="font-medium text-blue-700 dark:text-blue-400">
                                                                {' '}(opens at {getFormattedTimeOutStart(formData.registrationEndTime)})
                                                            </span>
                                                        )}. Students cannot check out before this window.
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: LOCATION & CHECK-IN METHOD */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-150">
                                {/* Check-In Method Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Check-In Method <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* Option 1: QR Scanner */}
                                        <div
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attendanceType: 'qr_scanner',
                                                }))
                                            }
                                            className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                                                formData.attendanceType === 'qr_scanner'
                                                    ? 'border-[#000D6A] bg-blue-50/50 ring-1 ring-[#000D6A] dark:border-blue-500 dark:bg-blue-950/30'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                        formData.attendanceType === 'qr_scanner'
                                                            ? 'bg-[#000D6A] text-white dark:bg-blue-600'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <Radio className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                                                        <span>QR Scanner Check-in</span>
                                                        {formData.attendanceType === 'qr_scanner' && (
                                                            <Check className="h-4 w-4 text-[#000D6A] dark:text-blue-400" />
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        Authorized scanners or admins scan attendee QR codes.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option 2: GPS Location Check-in */}
                                        <div
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    attendanceType: 'dynamic_qr',
                                                    geofenceEnabled: true,
                                                }))
                                            }
                                            className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                                                formData.attendanceType === 'dynamic_qr'
                                                    ? 'border-[#000D6A] bg-blue-50/50 ring-1 ring-[#000D6A] dark:border-blue-500 dark:bg-blue-950/30'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                        formData.attendanceType === 'dynamic_qr'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                                                        <span>GPS Location Check-in</span>
                                                        {formData.attendanceType === 'dynamic_qr' && (
                                                            <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        Students check in via their device's GPS at the venue.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Venue */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="location"
                                            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                            Venue / Location Name <span className="text-rose-500">*</span>
                                        </Label>
                                        {formData.attendanceType === 'dynamic_qr' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Whole Campus Geotagged (300m)
                                            </span>
                                        )}
                                    </div>

                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData((prev) => ({
                                                ...prev,
                                                location: val,
                                                geofenceLatitude: prev.geofenceLatitude || '8.743070',
                                                geofenceLongitude: prev.geofenceLongitude || '124.774500',
                                                geofenceRadiusM: prev.geofenceRadiusM || '300',
                                            }));

                                            if (validationErrors.location) {
                                                setValidationErrors((prev) => {
                                                    const copy = { ...prev };
                                                    delete copy.location;
                                                    return copy;
                                                });
                                            }
                                        }}
                                        placeholder="e.g. Gymnasium, Audio Visual Room (AVR), Campus-Wide"
                                        className={`h-10 rounded-xl text-xs dark:border-slate-700 dark:bg-slate-800 ${
                                            validationErrors.location
                                                ? 'border-rose-500 focus-visible:ring-rose-500'
                                                : ''
                                        }`}
                                        required
                                    />

                                    {/* Quick Suggestions Chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[11px] text-slate-400">
                                            Suggestions:
                                        </span>
                                        {[
                                            'Gymnasium',
                                            'Audio Visual Room (AVR)',
                                            'Quadrangle / Grounds',
                                            'Mother Ignacia Hall',
                                            'Campus-Wide',
                                        ].map((venue) => (
                                            <button
                                                key={venue}
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        location: venue,
                                                        geofenceLatitude: '8.743070',
                                                        geofenceLongitude: '124.774500',
                                                        geofenceRadiusM: '300',
                                                    }));
                                                    if (validationErrors.location) {
                                                        setValidationErrors((prev) => {
                                                            const copy = { ...prev };
                                                            delete copy.location;
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                                {venue}
                                            </button>
                                        ))}
                                    </div>
                                    {validationErrors.location && (
                                        <p className="text-xs font-medium text-rose-500">
                                            {validationErrors.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: TARGET AUDIENCE & SCANNERS */}
                        {currentStep === 3 && (
                            <div className="space-y-5 animate-in fade-in-50 duration-150">
                                {/* Courses */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Target Courses
                                        </Label>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formData.courses.length === 0
                                                ? 'All courses included'
                                                : `${formData.courses.length} selected`}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                                        <button
                                            type="button"
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                                formData.courses.length === 0
                                                    ? 'border-[#000D6A] bg-[#000D6A] text-white shadow-2xs dark:border-blue-600 dark:bg-blue-600'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    courses: [],
                                                }))
                                            }
                                        >
                                            {formData.courses.length === 0 && (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                            All Courses
                                        </button>

                                        {courseSelectOptions.map((course) => {
                                            const isSelected = formData.courses.includes(course.id);
                                            return (
                                                <button
                                                    key={course.id}
                                                    type="button"
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                                        isSelected
                                                            ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                    {course.name} ({course.code})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Year Levels */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Target Year Levels
                                        </Label>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formData.yearLevels.length === 0
                                                ? 'All year levels included'
                                                : `${formData.yearLevels.length} selected`}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                                        <button
                                            type="button"
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                                formData.yearLevels.length === 0
                                                    ? 'border-[#000D6A] bg-[#000D6A] text-white shadow-2xs dark:border-blue-600 dark:bg-blue-600'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    yearLevels: [],
                                                }))
                                            }
                                        >
                                            {formData.yearLevels.length === 0 && (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                            All Year Levels
                                        </button>

                                        {yearLevels.map((yearLevel) => {
                                            const isSelected = formData.yearLevels.includes(yearLevel.id);
                                            return (
                                                <button
                                                    key={yearLevel.id}
                                                    type="button"
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                                        isSelected
                                                            ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                    {yearLevel.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Scanners In-Charge */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Attendance Scanner In-Charge
                                        </Label>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {selectedScannerStudents.length === 0
                                                ? 'Optional'
                                                : `${selectedScannerStudents.length} assigned`}
                                        </span>
                                    </div>

                                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                                        {/* Suggested Scanners Based on Organizer */}
                                        {mode === 'create' && suggestedScanners.length > 0 && (
                                            <div className="rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 p-3 shadow-2xs dark:border-blue-900/60 dark:bg-blue-950/30">
                                                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                        <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                                                            Suggested from last event
                                                        </span>
                                                        <span className="rounded-full bg-blue-100/90 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                                            {suggestedOrganizer || formData.organizer}
                                                        </span>
                                                        {suggestedEventName && (
                                                            <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">
                                                                (in &ldquo;{suggestedEventName}&rdquo;)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!suggestedScanners.every((s) => selectedScannerStudents.some((sel) => sel.id === s.id)) && (
                                                        <button
                                                            type="button"
                                                            onClick={addAllSuggestedScanners}
                                                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 cursor-pointer"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add All
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {suggestedScanners.map((student) => {
                                                        const isAdded = selectedScannerStudents.some((s) => s.id === student.id);
                                                        return (
                                                            <button
                                                                key={student.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!isAdded) addSelectedStudent(student);
                                                                }}
                                                                disabled={isAdded}
                                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                                                    isAdded
                                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 opacity-90 cursor-default dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                        : 'border-blue-200 bg-white text-blue-900 hover:border-blue-400 hover:bg-blue-50 shadow-2xs cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-blue-200'
                                                                }`}
                                                            >
                                                                {isAdded ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                ) : (
                                                                    <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                )}
                                                                <span className="font-semibold">{student.name}</span>
                                                                {isAdded ? (
                                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                        Assigned
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                        ({student.course || student.id})
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={scannerStudentQuery}
                                                onChange={(e) =>
                                                    setScannerStudentQuery(e.target.value)
                                                }
                                                placeholder="Search student by name or ID..."
                                                className="h-9 rounded-lg bg-white pl-8.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                                            />
                                            {scannerStudentLoading && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Search Results Dropdown */}
                                        {scannerSearchResults.length > 0 && (
                                            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
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
                                                                    ? 'cursor-default bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                    : 'text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{student.name}</span>
                                                            {alreadyAdded ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    Added
                                                                </span>
                                                            ) : (
                                                                <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {scannerStudentError && (
                                            <p className="text-[11px] text-slate-500 italic dark:text-slate-400">
                                                {scannerStudentError}
                                            </p>
                                        )}

                                        {/* Assigned Badges */}
                                        {selectedScannerStudents.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {selectedScannerStudents.map((student) => (
                                                    <span
                                                        key={student.id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        {student.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSelectedStudent(student.id)}
                                                            className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* ── MINIMAL FOOTER ── */}
                <div className="flex shrink-0 items-center justify-between border-t border-slate-200/80 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Expected: {formData.expectedAttendees || 0} attendees
                        </span>
                        <span>•</span>
                        <span>
                            {formData.attendanceType === 'dynamic_qr'
                                ? 'GPS Check-in'
                                : 'QR Scanner'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="h-9 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                        )}

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="h-9 gap-1.5 rounded-xl bg-[#000D6A] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#102A83] dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                className="h-9 gap-1.5 rounded-xl bg-[#000D6A] px-6 text-xs font-semibold text-white shadow-xs hover:bg-[#102A83] dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                <Check className="h-3.5 w-3.5" />
                                {mode === 'edit'
                                    ? 'Update Event'
                                    : 'Create Event'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
