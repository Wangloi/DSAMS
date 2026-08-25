import { SchoolMapSelector } from '@/components/SchoolMapSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { CourseYearOption } from './mergeCourseYearOptions';

export interface FormData {
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

interface EventFormProps {
    /** Current wizard step (1‑3) */
    currentStep: number;
    /** Form state */
    data: FormData;
    /** Update a single field */
    setData: (field: keyof FormData, value: any) => void;
    /** Validation errors from the server */
    errors: Record<string, string>;
    /** List of course options */
    mergedCourseChoices: CourseYearOption[];
    /** List of year‑level options */
    mergedYearChoices: CourseYearOption[];
    /** Handlers for checkbox groups */
    handleCourseChange: (id: string, checked: boolean) => void;
    handleYearLevelChange: (id: string, checked: boolean) => void;
    /** Geofence UI state */
    showMapSelector: boolean;
    setShowMapSelector: (v: boolean) => void;
    selectedLocationName: string;
    setSelectedLocationName: (name: string) => void;
    /** Callback when a location is chosen on the map */
    onMapLocationSelect: (lat: number, lng: number, name?: string) => void;
}

/**
 * Re‑usable multi‑step event form.
 *
 * The parent component is responsible for the stepper UI and for calling the appropriate
 * Inertia `post` / `put` actions. This component only renders the fields for the
 * current step and reports changes via `setData`.
 */
export default function EventForm({
    currentStep,
    data,
    setData,
    errors,
    mergedCourseChoices,
    mergedYearChoices,
    handleCourseChange,
    handleYearLevelChange,
    showMapSelector,
    setShowMapSelector,
    selectedLocationName,
    setSelectedLocationName,
    onMapLocationSelect,
}: EventFormProps) {
    return (
        <>
            {/** Step 1 – Basic information */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="event_name">Event Name *</Label>
                        <Input
                            id="event_name"
                            value={data.event_name}
                            onChange={(e) =>
                                setData('event_name', e.target.value)
                            }
                            placeholder="Enter event name"
                            className={
                                errors.event_name ? 'border-red-500' : ''
                            }
                        />
                        {errors.event_name && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.event_name}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="organizer">Organizer *</Label>
                        <Input
                            id="organizer"
                            value={data.organizer}
                            onChange={(e) =>
                                setData('organizer', e.target.value)
                            }
                            placeholder="Enter organizer name"
                            className={errors.organizer ? 'border-red-500' : ''}
                        />
                        {errors.organizer && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.organizer}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/** Step 2 – Location and geofence */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="location">Location *</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) =>
                                    setData('location', e.target.value)
                                }
                                placeholder="Enter location name"
                                className={
                                    errors.location ? 'border-red-500' : ''
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setShowMapSelector((prev) => !prev)
                                }
                                className="h-9 text-sm font-semibold"
                            >
                                📍{' '}
                                {showMapSelector
                                    ? 'Hide Map'
                                    : 'Select Location on Map'}
                            </Button>
                        </div>
                        {showMapSelector && (
                            <div className="mt-4 rounded border p-2">
                                <SchoolMapSelector
                                    onLocationSelect={onMapLocationSelect}
                                    initialLocation={
                                        data.geofence_latitude &&
                                        data.geofence_longitude
                                            ? {
                                                  latitude: parseFloat(
                                                      data.geofence_latitude,
                                                  ),
                                                  longitude: parseFloat(
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
                            <div className="mt-2 text-sm text-gray-600">
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

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="geofence_enabled"
                            checked={data.geofence_enabled}
                            onCheckedChange={(checked) =>
                                setData('geofence_enabled', !!checked)
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
                                    Geofence latitude *
                                </Label>
                                <Input
                                    id="geofence_latitude"
                                    value={data.geofence_latitude}
                                    onChange={(e) =>
                                        setData(
                                            'geofence_latitude',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. 14.5995"
                                    className={
                                        errors.geofence_latitude
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.geofence_latitude && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.geofence_latitude}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="geofence_longitude">
                                    Geofence longitude *
                                </Label>
                                <Input
                                    id="geofence_longitude"
                                    value={data.geofence_longitude}
                                    onChange={(e) =>
                                        setData(
                                            'geofence_longitude',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. 120.9842"
                                    className={
                                        errors.geofence_longitude
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.geofence_longitude && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.geofence_longitude}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="geofence_radius_m">
                                    Radius (meters) *
                                </Label>
                                <Input
                                    id="geofence_radius_m"
                                    type="number"
                                    min={10}
                                    max={500}
                                    value={data.geofence_radius_m}
                                    onChange={(e) =>
                                        setData(
                                            'geofence_radius_m',
                                            e.target.value,
                                        )
                                    }
                                    className={
                                        errors.geofence_radius_m
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.geofence_radius_m && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.geofence_radius_m}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="scanner_portal_active"
                            checked={data.scanner_portal_active}
                            onCheckedChange={(checked) =>
                                setData('scanner_portal_active', !!checked)
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
            )}

            {/** Step 3 – Audience selection */}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <div>
                        <Label>Target Courses</Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            {mergedCourseChoices.map((opt, idx) => (
                                <div
                                    key={opt.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`course_${idx}`}
                                        checked={data.courses.includes(opt.id)}
                                        onCheckedChange={(checked) =>
                                            handleCourseChange(
                                                opt.id,
                                                !!checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`course_${idx}`}
                                        className="text-sm font-normal"
                                    >
                                        {opt.name}
                                        {opt.code !== opt.name
                                            ? ` (${opt.code})`
                                            : ''}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Target Year Levels</Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            {mergedYearChoices.map((opt, idx) => (
                                <div
                                    key={opt.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`year_${idx}`}
                                        checked={data.year_levels.includes(
                                            opt.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleYearLevelChange(
                                                opt.id,
                                                !!checked,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`year_${idx}`}
                                        className="text-sm font-normal"
                                    >
                                        {opt.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
