import { useForm } from '@inertiajs/react';
import { Calendar, Check, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminEventsUpdate } from '@/routes';
import {
    deriveEventLifecycleStatus,
    lifecycleStatusBadgeClass,
} from './deriveEventLifecycleStatus';
import type { EventViewRecord } from './EventViewModal';
import {
    alignCourseIdsToCanonical,
    alignYearLevelIdsToCanonical,
    mergeAndDedupeCourses,
    mergeAndDedupeYearLevels,
    type CourseYearOption,
} from './mergeCourseYearOptions';

type EventEditRecord = EventViewRecord & {
    geofence_latitude?: number | string | null;
    geofence_longitude?: number | string | null;
    geofence_radius_m?: number | null;
};

interface FormData {
    event_name: string;
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
}

function buildDefaults(
    event: EventEditRecord,
    courseOptions: CourseYearOption[],
    yearLevelOptions: CourseYearOption[],
): FormData {
    const eventDate =
        typeof event.event_date === 'string'
            ? event.event_date.slice(0, 10)
            : event.event_date
              ? String(event.event_date).slice(0, 10)
              : '';

    return {
        event_name: event.event_name || '',
        description: event.description || '',
        courses: alignCourseIdsToCanonical(event.courses || [], courseOptions),
        year_levels: alignYearLevelIdsToCanonical(
            event.year_levels || [],
            yearLevelOptions,
        ),
        location: event.location || '',
        event_date: eventDate,
        event_time: event.event_time || '',
        registration_end_time: event.registration_end_time || '',
        organizer: event.organizer || '',
        geofence_enabled: event.geofence_enabled || false,
        geofence_latitude:
            event.geofence_latitude != null &&
            (typeof event.geofence_latitude !== 'string' ||
                event.geofence_latitude !== '')
                ? String(event.geofence_latitude)
                : '',
        geofence_longitude:
            event.geofence_longitude != null &&
            (typeof event.geofence_longitude !== 'string' ||
                event.geofence_longitude !== '')
                ? String(event.geofence_longitude)
                : '',
        geofence_radius_m:
            event.geofence_radius_m != null
                ? String(event.geofence_radius_m)
                : '50',
        scanner_portal_active: event.scanner_portal_active || false,
    };
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventEditRecord | null;
    onSaved: () => void;
    courseOptions?: CourseYearOption[];
    yearLevelOptions?: CourseYearOption[];
};

export default function EventEditModal({
    open,
    onOpenChange,
    event,
    onSaved,
    courseOptions = [],
    yearLevelOptions = [],
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    useEffect(() => {
        if (open) setCurrentStep(1);
    }, [open]);

    const mergedCourseChoices = useMemo(() => {
        if (!event) return [];
        return mergeAndDedupeCourses(courseOptions, event.courses || []);
    }, [event, courseOptions]);

    const mergedYearChoices = useMemo(() => {
        if (!event) return [];
        return mergeAndDedupeYearLevels(
            yearLevelOptions,
            event.year_levels || [],
        );
    }, [event, yearLevelOptions]);

    const { data, setData, put, processing, reset, errors } = useForm<FormData>(
        event
            ? buildDefaults(event, courseOptions, yearLevelOptions)
            : ({} as any),
    );

    useEffect(() => {
        if (!event) return;
        reset(buildDefaults(event, courseOptions, yearLevelOptions) as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, courseOptions, yearLevelOptions]);

    const handleSubmit = () => {
        if (!event) return;
        put(adminEventsUpdate(event.id), {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
            },
        });
    };

    if (!event) {
        return <Dialog open={open} onOpenChange={onOpenChange} />;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 p-0 sm:max-w-4xl dark:border-slate-700 dark:bg-slate-900">
                <DialogHeader className="shrink-0 border-b border-transparent bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white dark:border-slate-700">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                        <Calendar className="h-5 w-5 text-blue-200" />
                        Edit Event
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                        Update details using the same step-by-step layout as
                        Create.
                    </DialogDescription>

                    <div className="mx-auto mt-6 flex max-w-xl items-center justify-between px-4">
                        <div className="relative flex flex-1 flex-col items-center">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${currentStep === 1 ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20' : 'bg-emerald-500 text-white'}`}
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
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${currentStep === 2 ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20' : currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-blue-800 text-blue-200'}`}
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
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${currentStep === 3 ? 'scale-110 bg-white text-blue-900 shadow-md ring-4 ring-white/20' : 'bg-blue-800 text-blue-200'}`}
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
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
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
                                            Event Name *
                                        </Label>
                                        <Input
                                            id="eventName"
                                            value={data.event_name}
                                            onChange={(e) =>
                                                setData(
                                                    'event_name',
                                                    e.target.value,
                                                )
                                            }
                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.event_name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                        />
                                        {errors.event_name && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {String(errors.event_name)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="organizer"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Organizer *
                                        </Label>
                                        <Input
                                            id="organizer"
                                            value={data.organizer}
                                            onChange={(e) =>
                                                setData(
                                                    'organizer',
                                                    e.target.value,
                                                )
                                            }
                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.organizer ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="eventDate"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Date *
                                        </Label>
                                        <Input
                                            id="eventDate"
                                            type="date"
                                            value={data.event_date}
                                            onChange={(e) =>
                                                setData(
                                                    'event_date',
                                                    e.target.value,
                                                )
                                            }
                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.event_date ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="eventTime"
                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            Time *
                                        </Label>
                                        <Input
                                            id="eventTime"
                                            type="time"
                                            value={data.event_time}
                                            onChange={(e) =>
                                                setData(
                                                    'event_time',
                                                    e.target.value,
                                                )
                                            }
                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.event_time ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
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
                                            type="datetime-local"
                                            value={data.registration_end_time}
                                            onChange={(e) =>
                                                setData(
                                                    'registration_end_time',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 dark:border-slate-600 dark:bg-slate-800"
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
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            className="min-h-[80px] bg-white"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={lifecycleStatusBadgeClass(
                                                deriveEventLifecycleStatus(
                                                    data.event_date,
                                                ),
                                            )}
                                        >
                                            {deriveEventLifecycleStatus(
                                                data.event_date,
                                            )}
                                        </Badge>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Status changes with the event date.
                                        </span>
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
                                            Location *
                                        </Label>
                                        <Input
                                            id="location"
                                            value={data.location}
                                            onChange={(e) =>
                                                setData(
                                                    'location',
                                                    e.target.value,
                                                )
                                            }
                                            className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.location ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                        />
                                        {errors.location && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {String(errors.location)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                        <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            Geotagging & Validation Settings
                                        </Label>

                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <input
                                                type="checkbox"
                                                id="geofenceEnabled"
                                                checked={data.geofence_enabled}
                                                onChange={(e) =>
                                                    setData(
                                                        'geofence_enabled',
                                                        e.target.checked,
                                                    )
                                                }
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
                                    </div>

                                    {data.geofence_enabled && (
                                        <>
                                            <div className="grid gap-2 sm:col-span-2">
                                                <SchoolMapSelector
                                                    onLocationSelect={(
                                                        lat,
                                                        lng,
                                                    ) => {
                                                        setData(
                                                            'geofence_latitude',
                                                            lat.toFixed(6),
                                                        );
                                                        setData(
                                                            'geofence_longitude',
                                                            lng.toFixed(6),
                                                        );
                                                    }}
                                                    initialLocation={
                                                        data.geofence_latitude &&
                                                        data.geofence_longitude
                                                            ? {
                                                                  latitude:
                                                                      parseFloat(
                                                                          data.geofence_latitude,
                                                                      ),
                                                                  longitude:
                                                                      parseFloat(
                                                                          data.geofence_longitude,
                                                                      ),
                                                                  name: 'Selected facility',
                                                              }
                                                            : undefined
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="geofenceLatitude"
                                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Latitude
                                                </Label>
                                                <Input
                                                    id="geofenceLatitude"
                                                    value={
                                                        data.geofence_latitude
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'geofence_latitude',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.geofence_latitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="geofenceLongitude"
                                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Longitude
                                                </Label>
                                                <Input
                                                    id="geofenceLongitude"
                                                    value={
                                                        data.geofence_longitude
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'geofence_longitude',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.geofence_longitude ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label
                                                    htmlFor="geofenceRadiusM"
                                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                >
                                                    Geofence Radius (meters)
                                                </Label>
                                                <Input
                                                    id="geofenceRadiusM"
                                                    type="number"
                                                    min={10}
                                                    max={500}
                                                    value={
                                                        data.geofence_radius_m
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'geofence_radius_m',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`h-9 dark:border-slate-600 dark:bg-slate-800 ${errors.geofence_radius_m ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid animate-in grid-cols-1 gap-6 transition-all duration-200 duration-300 ease-in-out fade-in">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-4 sm:col-span-2">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Target Courses
                                        </Label>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${data.courses.length === 0 ? 'border-transparent bg-[#1e40af] text-white shadow-sm' : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                                onClick={() =>
                                                    setData('courses', [])
                                                }
                                            >
                                                All Courses
                                            </button>

                                            {mergedCourseChoices.map(
                                                (course) => {
                                                    const isSelected =
                                                        data.courses.includes(
                                                            course.id,
                                                        );

                                                    return (
                                                        <button
                                                            key={course.id}
                                                            type="button"
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'border-blue-200 bg-blue-50 text-[#1e40af] hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/30' : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                                            onClick={() => {
                                                                setData(
                                                                    'courses',
                                                                    isSelected
                                                                        ? data.courses.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  course.id,
                                                                          )
                                                                        : [
                                                                              ...data.courses,
                                                                              course.id,
                                                                          ],
                                                                );
                                                            }}
                                                        >
                                                            {course.name} (
                                                            {course.code})
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <Label className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Target Year Levels
                                        </Label>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${data.year_levels.length === 0 ? 'border-transparent bg-[#1e40af] text-white shadow-sm' : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                                onClick={() =>
                                                    setData('year_levels', [])
                                                }
                                            >
                                                All Year Levels
                                            </button>

                                            {mergedYearChoices.map((yl) => {
                                                const isSelected =
                                                    data.year_levels.includes(
                                                        yl.id,
                                                    );

                                                return (
                                                    <button
                                                        key={yl.id}
                                                        type="button"
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${isSelected ? 'border-blue-200 bg-blue-50 text-[#1e40af] hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/30' : 'dark:hover:bg-slate-750 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                                                        onClick={() => {
                                                            setData(
                                                                'year_levels',
                                                                isSelected
                                                                    ? data.year_levels.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              yl.id,
                                                                      )
                                                                    : [
                                                                          ...data.year_levels,
                                                                          yl.id,
                                                                      ],
                                                            );
                                                        }}
                                                    >
                                                        {yl.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Expected Attendees
                                        </Label>
                                        <Input
                                            value={'—'}
                                            readOnly
                                            className="h-9 bg-slate-50/50 pl-9 font-semibold text-[#1e40af]"
                                        />
                                    </div>

                                    <div className="grid gap-2 border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
                                        <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
                                            <div className="flex gap-2.5">
                                                <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <h4 className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                                                        Automatic Scanner Access
                                                    </h4>
                                                    <p className="mt-1 text-xs leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                                                        Portal scanner is{' '}
                                                        {data.scanner_portal_active
                                                            ? 'enabled'
                                                            : 'disabled'}
                                                        .
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center space-x-2">
                                            <Checkbox
                                                id="scanner_portal"
                                                checked={
                                                    data.scanner_portal_active
                                                }
                                                onCheckedChange={(v) =>
                                                    setData(
                                                        'scanner_portal_active',
                                                        Boolean(v),
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="scanner_portal"
                                                className="text-sm font-normal"
                                            >
                                                Activate scanner portal
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <DialogFooter className="flex shrink-0 items-center justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
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
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                        ) : (
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

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                className="bg-[#121F78] text-white hover:bg-[#0f1a66]"
                                onClick={() =>
                                    setCurrentStep((s) => (s + 1) as any)
                                }
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                disabled={processing}
                                onClick={handleSubmit}
                            >
                                Save changes
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
