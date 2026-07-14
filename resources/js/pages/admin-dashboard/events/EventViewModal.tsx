import { usePage } from '@inertiajs/react';
import { Calendar, Edit, Users } from 'lucide-react';
import { Check, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    geofence_enabled: boolean;
    geofence_latitude?: number | null;
    geofence_longitude?: number | null;
    scanner_portal_active: boolean;
    archived_at: string | null;
    attendances: Array<{
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

function getStatusColor(status: string) {
    switch (status) {
        case 'upcoming':
            return 'bg-blue-100 text-blue-800';
        case 'ongoing':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uniqueCourseStringsForDisplay } from './mergeCourseYearOptions';

function formatRegEnd(regEnd: string | null) {
    if (!regEnd) return 'No end time set';
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
  console.log('EventViewModal event data:', event);
    const geofenceConfig = (page.props as Record<string, any>).geofence as
        | { campus?: { latitude?: number; longitude?: number } }
        | undefined;

    const campusCenter = useMemo(
        () => ({
            lat: geofenceConfig?.campus?.latitude ?? 8.744321,
            lng: geofenceConfig?.campus?.longitude ?? 124.776543,
        }),
        [geofenceConfig],
    );

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    useEffect(() => {
        if (open) setCurrentStep(1);
    }, [open]);

    const coursesForDisplay = useMemo(
        () => (event ? uniqueCourseStringsForDisplay(event.courses) : []),
        [event],
    );

const mapPoint = useMemo(() => {
    if (!event) return null;
    if (
        event.geofence_latitude == null ||
        event.geofence_longitude == null
    )
        return null;
    const lat = Number(event.geofence_latitude);
    const lng = Number(event.geofence_longitude);
    if (isNaN(lat) || isNaN(lng)) return null;

    const y = 50 - (lat - campusCenter.lat) / 0.0001;
    const x = 50 + (lng - campusCenter.lng) / 0.0001;
    return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
    };
}, [event, campusCenter]);

    if (!event) return null;

    const regEnd = formatRegEnd(event.registration_end_time);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 p-0 sm:max-w-4xl dark:border-slate-700 dark:bg-slate-900">
                <DialogHeader className="shrink-0 border-b border-transparent bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white dark:border-slate-700">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                        <Calendar className="h-5 w-5 text-blue-200" />
                        View Event
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        Read-only step-by-step summary. Use Edit to make
                        changes.
                    </DialogDescription>

                    <div className="mx-auto mt-6 flex max-w-xl items-center justify-between px-4">
                        <div className="relative flex flex-1 flex-col items-center">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                                    currentStep === 1
                                        ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20'
                                        : 'bg-emerald-500 text-white'
                                }`}
                            >
                                {currentStep > 1 ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    '1'
                                )}
                            </div>
                            <span
                                className={`mt-2 text-[11px] font-medium tracking-wide transition-colors ${currentStep === 1 ? 'text-white' : 'text-blue-200'}`}
                            >
                                Basic Info
                            </span>
                        </div>

                        <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                            <div
                                className="absolute inset-0 bg-white transition-all duration-300"
                                style={{
                                    width: currentStep > 1 ? '100%' : '0%',
                                }}
                            />
                        </div>

                        <div className="relative flex flex-1 flex-col items-center">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                                    currentStep === 2
                                        ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20'
                                        : currentStep > 2
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-blue-800 text-blue-200'
                                }`}
                            >
                                {currentStep > 2 ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    '2'
                                )}
                            </div>
                            <span
                                className={`mt-2 text-[11px] font-medium tracking-wide transition-colors ${currentStep === 2 ? 'text-white' : 'text-blue-200'}`}
                            >
                                Location
                            </span>
                        </div>

                        <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                            <div
                                className="absolute inset-0 bg-white transition-all duration-300"
                                style={{
                                    width: currentStep > 2 ? '100%' : '0%',
                                }}
                            />
                        </div>

                        <div className="relative flex flex-1 flex-col items-center">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                                    currentStep === 3
                                        ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20'
                                        : 'bg-blue-800 text-blue-200'
                                }`}
                            >
                                3
                            </div>
                            <span
                                className={`mt-2 text-[11px] font-medium tracking-wide transition-colors ${currentStep === 3 ? 'text-white' : 'text-blue-200'}`}
                            >
                                Audience
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-slate-50/50 px-6 py-6 dark:bg-slate-900/40">
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        noValidate
                        className="min-h-0"
                    >
                        {currentStep === 1 && (
                            <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label
                                            htmlFor="eventName"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Event Name
                                        </Label>
                                        <Input
                                            id="eventName"
                                            value={event.event_name}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="organizer"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Organizer
                                        </Label>
                                        <Input
                                            id="organizer"
                                            value={event.organizer}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="eventDate"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Date
                                        </Label>
                                        <Input
                                            id="eventDate"
                                            value={new Date(event.event_date)
                                                .toISOString()
                                                .slice(0, 10)}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="eventTime"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Time
                                        </Label>
                                        <Input
                                            id="eventTime"
                                            value={event.event_time}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
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
                                            value={regEnd}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label
                                            htmlFor="description"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={
                                                event.description?.trim()
                                                    ? event.description
                                                    : ''
                                            }
                                            readOnly
                                            className="min-h-[80px] bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label
                                            htmlFor="location"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Location
                                        </Label>
                                        <Input
                                            id="location"
                                            value={event.location}
                                            readOnly
                                            className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                        <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            Geotagging & Validation Settings
                                        </Label>
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <input
                                                type="checkbox"
                                                id="geofenceEnabled"
                                                checked={event.geofence_enabled}
                                                readOnly
                                                className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-600 dark:bg-slate-800"
                                            />
                                            <Label
                                                htmlFor="geofenceEnabled"
                                                className="cursor-pointer text-sm font-medium text-slate-700 select-none dark:text-slate-300"
                                            >
                                                Enable geofence location
                                                validation
                                            </Label>
                                        </div>
                                        <p className="pl-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            {event.geofence_enabled
                                                ? 'Students must be physically within the designated campus area.'
                                                : 'Geofence validation is disabled for this event.'}
                                        </p>
                                    </div>

                                    {event.geofence_latitude != null && event.geofence_longitude != null && (
                                        <>
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Campus Map (read-only)
                                                </Label>
                                                <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:col-span-2 dark:border-slate-800 dark:bg-slate-950/40">
                                                    <SchoolMapSelector
                                                        onLocationSelect={() => {}}
                                                        initialLocation={
                                                            event.geofence_latitude !=
                                                                null &&
                                                            event.geofence_longitude !=
                                                                null
                                                                ? {
                                                                      latitude:
                                                                          Number(
                                                                              event.geofence_latitude,
                                                                          ),
                                                                      longitude:
                                                                          Number(
                                                                              event.geofence_longitude,
                                                                          ),
                                                                      name: 'Selected facility',
                                                                  }
                                                                : undefined
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Latitude
                                                </Label>
                                                <Input
                                                    value={
                                                        event.geofence_latitude !=
                                                        null
                                                            ? Number(
                                                                  event.geofence_latitude,
                                                              ).toFixed(6)
                                                            : ''
                                                    }
                                                    readOnly
                                                    className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Longitude
                                                </Label>
                                                <Input
                                                    value={
                                                        event.geofence_longitude !=
                                                        null
                                                            ? Number(
                                                                  event.geofence_longitude,
                                                              ).toFixed(6)
                                                            : ''
                                                    }
                                                    readOnly
                                                    className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Geofence Radius (meters)
                                                </Label>
                                                <Input
                                                    value={'—'}
                                                    readOnly
                                                    className="h-9 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800"
                                                />
                                            </div>

                                            {mapPoint && (
                                                <div className="hidden">
                                                    {mapPoint.x},{mapPoint.y}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-4 sm:col-span-2">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Target Courses
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {coursesForDisplay.length ===
                                                0 ? (
                                                    <span className="text-sm text-slate-500">
                                                        None
                                                    </span>
                                                ) : (
                                                    coursesForDisplay.map(
                                                        (course) => (
                                                            <span
                                                                key={course}
                                                                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1e40af]"
                                                            >
                                                                {course}
                                                            </span>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2 grid gap-2 sm:col-span-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Target Year Levels
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {event.year_levels.length ===
                                                0 ? (
                                                    <span className="text-sm text-slate-500">
                                                        None
                                                    </span>
                                                ) : (
                                                    event.year_levels.map(
                                                        (y) => (
                                                            <span
                                                                key={y}
                                                                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1e40af]"
                                                            >
                                                                {y}
                                                            </span>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Expected Attendees
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                value={'—'}
                                                readOnly
                                                className="h-9 bg-slate-50/50 pl-9 font-semibold text-[#1e40af]"
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
                                                        Scanner Portal
                                                    </h4>
                                                    <p className="mt-1 text-xs leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                                                        {event.scanner_portal_active
                                                            ? 'Active: eligible students can scan from their portal.'
                                                            : 'Inactive: scanner portal is disabled.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <DialogFooter className="flex shrink-0 justify-between gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-4"
                        >
                            Close
                        </Button>
                        {onEdit && (
                            <Button
                                type="button"
                                className="gap-2 bg-[#121F78] px-5 text-white hover:bg-[#0f1a66]"
                                onClick={() => onEdit(event)}
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {currentStep > 1 && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() =>
                                    setCurrentStep((s) => (s === 2 ? 1 : 1))
                                }
                            >
                                Back
                            </Button>
                        )}
                        {currentStep < 3 && (
                            <Button
                                type="button"
                                className="bg-[#121F78] text-white hover:bg-[#0f1a66]"
                                onClick={() =>
                                    setCurrentStep((s) => (s + 1) as any)
                                }
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
