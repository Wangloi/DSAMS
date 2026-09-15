import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Edit,
    Globe,
    GraduationCap,
    Layers,
    MapPin,
    QrCode,
    Radio,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
    deriveEventLifecycleStatus,
    lifecycleStatusBadgeClass,
} from './deriveEventLifecycleStatus';
import { uniqueCourseStringsForDisplay } from './mergeCourseYearOptions';

export type ScannerStudent = {
    id: string | number;
    student_id?: string;
    name: string;
    course?: string | null;
    year_level?: string | null;
};

export type EventViewRecord = {
    id: number;
    event_name: string;
    description: string | null;
    courses: string[];
    year_levels: string[];
    location: string;
    event_date: string;
    event_time: string;
    registration_end_time: string | null;
    organizer: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    attendance_type?: string | null;
    geofence_enabled?: boolean | number | string | null;
    geofence_latitude?: number | string | null;
    geofence_longitude?: number | string | null;
    scanner_portal_active: boolean;
    scanner_student_ids?: (string | number)[] | null;
    scanner_students?: ScannerStudent[] | null;
    archived_at: string | null;
    attendances?: Array<{
        id: number;
        student_id?: number;
        student: {
            name: string;
            email: string;
        };
    }>;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventViewRecord | null;
    onEdit?: (event: EventViewRecord) => void;
};

function formatRegEnd(regEnd: string | null) {
    if (!regEnd) return 'No cutoff time set';
    return String(regEnd).includes('T')
        ? new Date(regEnd).toLocaleString()
        : regEnd;
}

export default function EventViewModal({
    open,
    onOpenChange,
    event,
    onEdit,
}: Props) {
    const page = usePage();
    const geofenceConfig = (page.props as Record<string, any>).geofence as
        | { campus?: { latitude?: number; longitude?: number } }
        | undefined;

    const campusCenter = useMemo(
        () => ({
            lat: geofenceConfig?.campus?.latitude ?? 8.74307,
            lng: geofenceConfig?.campus?.longitude ?? 124.7745,
        }),
        [geofenceConfig],
    );

    const coursesForDisplay = useMemo(
        () => (event ? uniqueCourseStringsForDisplay(event.courses) : []),
        [event],
    );

    const computedStatus = useMemo(() => {
        if (!event) return 'upcoming';
        return deriveEventLifecycleStatus(
            event.event_date,
            event.event_time,
            event.registration_end_time,
        );
    }, [event]);

    const scannerStudents = useMemo<ScannerStudent[]>(() => {
        if (!event) return [];
        if (event.scanner_students && event.scanner_students.length > 0) {
            return event.scanner_students;
        }
        if (event.scanner_student_ids && event.scanner_student_ids.length > 0) {
            return event.scanner_student_ids.map((id) => ({
                id,
                student_id: String(id),
                name: String(id),
            }));
        }
        return [];
    }, [event]);

    const regEnd = formatRegEnd(event?.registration_end_time ?? null);
    const isDynamicQrAttendance = event?.attendance_type === 'dynamic_qr';
    const isGeofenceFlagEnabled =
        Boolean(event?.geofence_enabled) &&
        (event?.geofence_enabled as any) !== '0' &&
        (event?.geofence_enabled as any) !== 0 &&
        (event?.geofence_enabled as any) !== 'false' &&
        (event?.geofence_enabled as any) !== false;

    // The Event Geotagging & Campus Map is only shown if the admin is actively using Geotagging / Dynamic GPS Check-In
    const hasGeofencing =
        isDynamicQrAttendance &&
        isGeofenceFlagEnabled &&
        event?.geofence_latitude != null &&
        event?.geofence_longitude != null;

    if (!open || !event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-4xl dark:bg-slate-950 [&>button]:hidden">
                {/* Modern Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#23509A] px-6 py-6 text-white shadow-md sm:px-8">
                    <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8CE4FF] shadow-inner ring-1 ring-white/30 backdrop-blur-md">
                                <Calendar className="h-7 w-7" />
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#102A83]">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </span>
                            </div>

                            <DialogHeader className="p-0 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                        {event.event_name}
                                    </DialogTitle>
                                    <Badge
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider capitalize ${lifecycleStatusBadgeClass(
                                            computedStatus,
                                        )}`}
                                    >
                                        {computedStatus === 'completed'
                                            ? 'Ended'
                                            : computedStatus}
                                    </Badge>
                                </div>
                                <DialogDescription className="mt-1 text-xs font-medium text-blue-100/90 sm:text-sm">
                                    Organized by <strong className="text-white">{event.organizer || 'OSA / CSG'}</strong> • Complete Event Profile & Attendance Assignment
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {onEdit && (
                                <Button
                                    type="button"
                                    onClick={() => onEdit(event)}
                                    className="h-9 gap-1.5 rounded-xl bg-white/15 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-white/25 active:scale-98"
                                >
                                    <Edit className="h-3.5 w-3.5 text-[#8CE4FF]" />
                                    Edit Event
                                </Button>
                            )}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Unified Single-View Content (No Step-by-Step) */}
                <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
                    {/* Schedule & Timing Quick Strip */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-[#23509A] dark:text-[#8CE4FF]" />
                                Event Date
                            </span>
                            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                                {typeof event.event_date === 'string'
                                    ? event.event_date.split('T')[0]
                                    : 'N/A'}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                Time-In Start
                            </span>
                            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                                {event.event_time || '—'}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3 text-rose-500" />
                                Cutoff / End Time
                            </span>
                            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white truncate" title={regEnd}>
                                {regEnd}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-[#23509A] dark:text-[#8CE4FF]" />
                                Venue
                            </span>
                            <div className="mt-1 text-sm font-black text-slate-900 dark:text-white truncate" title={event.location}>
                                {event.location || 'Campus Grounds'}
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Assigned Student(s) in Charge of Attendance (PROMINENT HIGHLIGHT) */}
                    <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white p-5 shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-blue-950/20 dark:bg-slate-900 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-100 pb-4 dark:border-indigo-900/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#000D6A] to-[#23509A] text-white shadow-sm">
                                    <QrCode className="h-5 w-5 text-[#8CE4FF]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>Assigned Student Attendance Officers</span>
                                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full px-2 py-0 text-[10px] font-bold">
                                            {scannerStudents.length} Assigned
                                        </Badge>
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Students authorized to scan Dynamic QR attendance barcodes for this event
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Scanner Portal:
                                </span>
                                <Badge
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                        event.scanner_portal_active
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {event.scanner_portal_active
                                        ? 'Active & Scanning Ready'
                                        : 'Scanner Portal Disabled'}
                                </Badge>
                            </div>
                        </div>

                        {/* List of Assigned Students */}
                        <div className="mt-4">
                            {scannerStudents.length === 0 ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                    <span>
                                        No individual student scanner assigned yet. System administrators and CSG leads can conduct attendance scanning by default.
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {scannerStudents.map((scanner, idx) => {
                                        const displayName =
                                            scanner.name && scanner.name.trim() !== ''
                                                ? scanner.name
                                                : scanner.student_id || String(scanner.id);
                                        const idLabel = scanner.student_id
                                            ? `Student ID: ${scanner.student_id}`
                                            : scanner.id
                                            ? `Student ID: ${scanner.id}`
                                            : '';
                                        const subDetails = [
                                            idLabel,
                                            scanner.course,
                                            scanner.year_level,
                                        ]
                                            .filter(Boolean)
                                            .join(' • ');

                                        return (
                                            <div
                                                key={scanner.id || scanner.student_id || idx}
                                                className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-3.5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm dark:border-indigo-900/40 dark:bg-slate-900/80"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-700 ring-1 ring-indigo-200/50 dark:from-indigo-950/80 dark:to-blue-900/40 dark:text-indigo-300 dark:ring-indigo-800/40">
                                                    <UserCheck className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div
                                                        className="text-xs font-bold text-slate-900 dark:text-white truncate"
                                                        title={displayName}
                                                    >
                                                        {displayName}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                                        {subDetails || 'Authorized Officer'}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Authorized Scanner
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Target Audience & Eligible Programs */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Target Academic Programs */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#23509A] dark:bg-blue-950/50 dark:text-[#8CE4FF]">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        Target Academic Courses
                                    </h3>
                                    <p className="text-[11px] text-slate-400">Programs required to attend</p>
                                </div>
                            </div>

                            <div className="mt-3.5 flex flex-wrap gap-2">
                                {coursesForDisplay.length === 0 ? (
                                    <span className="text-xs text-slate-500 italic">
                                        All Courses / Campus-wide
                                    </span>
                                ) : (
                                    coursesForDisplay.map((course) => (
                                        <span
                                            key={course}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/70 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1e40af] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                                        >
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            {course}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Target Year Levels */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        Target Year Levels
                                    </h3>
                                    <p className="text-[11px] text-slate-400">Eligible grade/year cohorts</p>
                                </div>
                            </div>

                            <div className="mt-3.5 flex flex-wrap gap-2">
                                {event.year_levels.length === 0 ? (
                                    <span className="text-xs text-slate-500 italic">
                                        All Year Levels (1st to 4th Year)
                                    </span>
                                ) : (
                                    event.year_levels.map((y) => (
                                        <span
                                            key={y}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200/70 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
                                        >
                                            {y}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Event Description */}
                    {event.description && event.description.trim() && (
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300 mb-2">
                                Event Description & Guidelines
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* Section 4: Geofencing & Campus Map (Only displayed when admin has enabled Geotagging with valid coordinates) */}
                    {hasGeofencing && (
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                            Event Geotagging & Campus Map
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            {event.location || 'Designated Campus Grounds'}
                                        </p>
                                    </div>
                                </div>

                                <Badge className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                                    Geofence Active
                                </Badge>
                            </div>

                            {event.geofence_latitude != null &&
                                event.geofence_longitude != null && (
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/50">
                                            <SchoolMapSelector
                                                onLocationSelect={() => {}}
                                                initialLocation={{
                                                    latitude: Number(
                                                        event.geofence_latitude,
                                                    ),
                                                    longitude: Number(
                                                        event.geofence_longitude,
                                                    ),
                                                    name: event.location || 'Selected venue',
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                                <span className="text-slate-400 text-[10px] font-bold uppercase">Latitude</span>
                                                <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                    {Number(event.geofence_latitude).toFixed(6)}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                                                <span className="text-slate-400 text-[10px] font-bold uppercase">Longitude</span>
                                                <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                    {Number(event.geofence_longitude).toFixed(6)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <DialogFooter className="flex shrink-0 items-center justify-between border-t border-slate-200/90 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                    <div className="text-[11px] font-medium text-slate-400">
                        Event ID: #{event.id}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200 px-5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Close
                        </Button>
                        {onEdit && (
                            <Button
                                type="button"
                                onClick={() => onEdit(event)}
                                className="gap-1.5 rounded-xl bg-gradient-to-r from-[#000D6A] via-[#102A83] to-[#23509A] px-6 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98"
                            >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Event
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
