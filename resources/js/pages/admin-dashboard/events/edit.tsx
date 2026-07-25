
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, X, MapPin } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Button } from '@/components/ui/button';



import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminDashboard, adminEvents, adminEventsUpdate } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';


import {
    alignCourseIdsToCanonical,
    alignYearLevelIdsToCanonical,
    mergeAndDedupeCourses,
    mergeAndDedupeYearLevels,
    type CourseYearOption,
} from './mergeCourseYearOptions';

// Stepper utility
const stepperClass = (step: number) =>
    `h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${step === 3
        ? 'bg-white text-blue-900 ring-4 ring-white/20 scale-110 shadow-md'
        : step < 3
            ? 'bg-emerald-500 text-white'
            : 'bg-blue-800 text-blue-200'
    }`;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Events',
        href: adminEvents(),
    },
    {
        title: 'Edit Event',
        href: '#',
    },
];

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

export default function EditEventPage() {
    const { props } = usePage();

    const event = props.event as any;

    const eventDate =
        typeof event?.event_date === 'string'
            ? event.event_date.slice(0, 10)
            : event?.event_date
                ? String(event.event_date).slice(0, 10)
                : '';

    const courseOptions = (
        (props as { courses?: CourseYearOption[] }).courses ?? []
    ) as CourseYearOption[];

    const yearLevelOptions = (
        (props as { yearLevels?: CourseYearOption[] }).yearLevels ?? []
    ) as CourseYearOption[];

    const [showMapSelector, setShowMapSelector] = useState(false);

    const [selectedLocationName, setSelectedLocationName] = useState('');

    const { data, setData, put, processing, errors, reset } =
        useForm({
            event_name: event?.event_name || '',
            description: event?.description || '',

            courses: alignCourseIdsToCanonical(
                event?.courses || [],
                courseOptions,
            ),

            year_levels: alignYearLevelIdsToCanonical(
                event?.year_levels || [],
                yearLevelOptions,
            ),

            location: event?.location || '',

            event_date: eventDate,

            event_time: event?.event_time || '',

            registration_end_time:
                event?.registration_end_time || '',

            organizer: event?.organizer || '',

            geofence_enabled:
                event?.geofence_enabled || false,

            geofence_latitude:
                event?.geofence_latitude != null &&
                    event?.geofence_latitude !== ''
                    ? String(event.geofence_latitude)
                    : '',

            geofence_longitude:
                event?.geofence_longitude != null &&
                    event?.geofence_longitude !== ''
                    ? String(event.geofence_longitude)
                    : '',

            geofence_radius_m:
                event?.geofence_radius_m != null
                    ? String(event.geofence_radius_m)
                    : '50',

            scanner_portal_active:
                event?.scanner_portal_active || false,
        });

    const mergedCourseChoices = useMemo(
        () =>
            mergeAndDedupeCourses(
                courseOptions,
                event?.courses || [],
            ),
        [courseOptions, event?.courses],
    );

    const mergedYearChoices = useMemo(
        () =>
            mergeAndDedupeYearLevels(
                yearLevelOptions,
                event?.year_levels || [],
            ),
        [yearLevelOptions, event?.year_levels],
    );

    const handleMapLocationSelect = (
        lat: number,
        lng: number,
        name?: string,
    ) => {
        setData('geofence_latitude', lat.toFixed(6));

        setData('geofence_longitude', lng.toFixed(6));

        setSelectedLocationName(
            name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        put(adminEventsUpdate(event.id), {
            onSuccess: () => {
                router.visit(adminEvents());
            },

            onError: (err: any) => {
                console.error('Update error:', err);
            },
        });
    };

    const handleCourseChange = (
        course: string,
        checked: boolean,
    ) => {
        if (checked) {
            setData('courses', [...data.courses, course]);
        } else {
            setData(
                'courses',
                data.courses.filter((c: string) => c !== course),
            );
        }
    };

    const handleYearLevelChange = (
        yearLevel: string,
        checked: boolean,
    ) => {
        if (checked) {
            setData('year_levels', [
                ...data.year_levels,
                yearLevel,
            ]);
        } else {
            setData(
                'year_levels',
                data.year_levels.filter((y: string) => y !== yearLevel),
            );
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Event" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.visit(adminEvents())
                            }
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Edit Event
                            </h1>

                            <p className="text-gray-600 dark:text-gray-300">
                                Update the event information
                            </p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <Card className="overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-sm dark:bg-slate-800">
                        {/* Stepper */}
                        <div className="overflow-hidden rounded-t-3xl">
                            <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                                <div className="mx-auto flex max-w-xl items-center justify-between px-4">

                                    {/* Step 1 */}
                                    <div className="relative flex flex-1 flex-col items-center">
                                        <div className={stepperClass(1)}>
                                            1
                                        </div>

                                        <span className="mt-2 text-[11px] font-medium tracking-wide text-white">
                                            Basic Info
                                        </span>
                                    </div>

                                    <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                                        <div
                                            className="absolute inset-0 bg-white"
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    {/* Step 2 */}
                                    <div className="relative flex flex-1 flex-col items-center">
                                        <div className={stepperClass(2)}>
                                            2
                                        </div>

                                        <span className="mt-2 text-[11px] font-medium tracking-wide text-white">
                                            Location
                                        </span>
                                    </div>

                                    <div className="relative mx-2 h-0.5 flex-1 bg-blue-800">
                                        <div
                                            className="absolute inset-0 bg-white"
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    {/* Step 3 */}
                                    <div className="relative flex flex-1 flex-col items-center">
                                        <div className={stepperClass(3)}>
                                            3
                                        </div>

                                        <span className="mt-2 text-[11px] font-medium tracking-wide text-white">
                                            Audience
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardHeader>
                            <CardTitle>
                                Event Information
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="px-8 pt-8 pb-8">
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                    {/* Left Column */}
                                    <div className="space-y-4">

                                        <div>
                                            <Label htmlFor="event_name">
                                                Event Name *
                                            </Label>

                                            <Input
                                                id="event_name"
                                                type="text"
                                                value={data.event_name}
                                                onChange={(e) =>
                                                    setData(
                                                        'event_name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter event name"
                                                className={
                                                    errors.event_name
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />

                                            {errors.event_name && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {
                                                        errors.event_name
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="organizer">
                                                Organizer *
                                            </Label>

                                            <Input
                                                id="organizer"
                                                type="text"
                                                value={data.organizer}
                                                onChange={(e) =>
                                                    setData(
                                                        'organizer',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter organizer name"
                                                className={
                                                    errors.organizer
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />

                                            {errors.organizer && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.organizer}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">

                                        <div>
                                            <Label htmlFor="event_date">
                                                Event Date *
                                            </Label>

                                            <Input
                                                id="event_date"
                                                type="date"
                                                value={data.event_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'event_date',
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    errors.event_date
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />

                                            {errors.event_date && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.event_date}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="event_time">
                                                Event Time *
                                            </Label>

                                            <Input
                                                id="event_time"
                                                type="time"
                                                value={data.event_time}
                                                onChange={(e) =>
                                                    setData(
                                                        'event_time',
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    errors.event_time
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />

                                            {errors.event_time && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.event_time}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="registration_end_time">
                                                Registration End Time
                                            </Label>

                                            <Input
                                                id="registration_end_time"
                                                type="datetime-local"
                                                value={
                                                    data.registration_end_time
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'registration_end_time',
                                                        e.target.value,
                                                    )
                                                }
                                                className={
                                                    errors.registration_end_time
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />

                                            {errors.registration_end_time && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {
                                                        errors.registration_end_time
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="location">
                                            Location *
                                        </Label>

                                        <div className="mt-2 flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setShowMapSelector(
                                                        (prev) => !prev,
                                                    )
                                                }
                                                className="h-10 gap-2 border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                            >
                                                <MapPin className="inline-block mr-1 h-4 w-4" />
                                                {showMapSelector
                                                    ? 'Hide Map'
                                                    : 'Select Location on Map'}

                                            </Button>
                                        </div>
                                    </div>

                                    {showMapSelector && (
                                        <div className="mt-4 rounded-lg border p-2">
                                            <SchoolMapSelector
                                                className="w-full"
                                                onLocationSelect={
                                                    handleMapLocationSelect
                                                }
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
                                                            name: selectedLocationName,
                                                        }
                                                        : undefined
                                                }
                                            />
                                        </div>
                                    )}

                                    {selectedLocationName && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                            Selected Location:{' '}
                                            <span className="font-medium">
                                                {selectedLocationName}
                                            </span>
                                        </div>
                                    )}

                                    {errors.location && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                {/* Courses */}
                                <div>
                                    <h3 className="font-medium">Target Courses</h3>

                                    <div className="mt-2 grid grid-cols-2 gap-3">
                                        {mergedCourseChoices.map(
                                            (opt, idx) => (
                                                <div
                                                    key={opt.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`edit_course_${idx}`}
                                                        checked={data.courses.includes(
                                                            opt.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleCourseChange(
                                                                opt.id,
                                                                checked as boolean,
                                                            )
                                                        }
                                                    />

                                                    <Label
                                                        htmlFor={`edit_course_${idx}`}
                                                        className="text-sm font-normal"
                                                    >
                                                        {opt.name}

                                                        {opt.code !==
                                                            opt.name
                                                            ? ` (${opt.code})`
                                                            : ''}
                                                    </Label>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Year Levels */}
                                <div>
                                    <Label>
                                        Target Year Levels
                                    </Label>

                                    <div className="mt-2 grid grid-cols-2 gap-3">
                                        {mergedYearChoices.map(
                                            (opt, idx) => (
                                                <div
                                                    key={opt.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`edit_yl_${idx}`}
                                                        checked={data.year_levels.includes(
                                                            opt.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleYearLevelChange(
                                                                opt.id,
                                                                checked as boolean,
                                                            )
                                                        }
                                                    />

                                                    <Label
                                                        htmlFor={`edit_yl_${idx}`}
                                                        className="text-sm font-normal"
                                                    >
                                                        {opt.name}
                                                    </Label>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="space-y-4">

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="geofence_enabled"
                                            checked={
                                                data.geofence_enabled
                                            }
                                            onCheckedChange={(
                                                checked,
                                            ) =>
                                                setData(
                                                    'geofence_enabled',
                                                    checked as boolean,
                                                )
                                            }
                                        />

                                        <Label
                                            htmlFor="geofence_enabled"
                                            className="text-sm font-normal"
                                        >
                                            Enable Geofence
                                        </Label>
                                    </div>

                                    {data.geofence_enabled && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                            <div>
                                                <Label htmlFor="geofence_latitude">
                                                    Latitude *
                                                </Label>

                                                <Input
                                                    id="geofence_latitude"
                                                    type="text"
                                                    value={
                                                        data.geofence_latitude
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'geofence_latitude',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="geofence_longitude">
                                                    Longitude *
                                                </Label>

                                                <Input
                                                    id="geofence_longitude"
                                                    type="text"
                                                    value={
                                                        data.geofence_longitude
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'geofence_longitude',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="geofence_radius_m">
                                                    Radius (m)
                                                </Label>

                                                <Input
                                                    id="geofence_radius_m"
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
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="scanner_portal_active"
                                            checked={
                                                data.scanner_portal_active
                                            }
                                            onCheckedChange={(
                                                checked,
                                            ) =>
                                                setData(
                                                    'scanner_portal_active',
                                                    checked as boolean,
                                                )
                                            }
                                        />

                                        <Label
                                            htmlFor="scanner_portal_active"
                                            className="text-sm font-normal"
                                        >
                                            Activate Scanner Portal
                                        </Label>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 border-t pt-6">

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => reset()}
                                        disabled={processing}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2"
                                    >
                                        <Save className="h-4 w-4" />

                                        {processing
                                            ? 'Updating...'
                                            : 'Update Event'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
