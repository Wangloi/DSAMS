import { Calendar, MapPin, Users, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { deriveEventLifecycleStatus } from '@/pages/admin-dashboard/events/deriveEventLifecycleStatus';

type AttendanceRow = {
    id: string;
    event: string;
    dateTime: string;
    organizer: string;
    totalAttendees: number;
    presentCount: number;
    scannedCount?: number;
    eligibleStudentsCount?: number;
    expectedAttendees?: number;
    attendanceDenominator?: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
    registrationEndTime?: string | null;
    scannerStudentIds?: string[];
    courses?: Array<{ id: string; name: string; code: string; }>;
    year_levels?: Array<{ id: string; name: string; code: string; }>;
    geofenceEnabled?: boolean;
    geofenceLatitude?: number | string | null;
    geofenceLongitude?: number | string | null;
    geofenceRadiusM?: number | string | null;
    attendance_type?: string;
};

type EditEventPayload = {
    id: string;
    eventName: string;
    organizer: string;
    location: string;
    eventDate: string;
    eventTime: string;
    registrationEndTime: string;
    scannerStudentIds: string[];
    expectedAttendees: string;
    description: string;
    courses: string[];
    yearLevels: string[];
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
    onSubmit: (payload: EditEventPayload) => void;
    editingEvent: AttendanceRow | null;
    courses: Array<{ id: string; name: string; code: string; }>;
    yearLevels: Array<{ id: string; name: string; code: string; }>;
};

export default function EditEventModal({ open, onOpenChange, onClose, onSubmit, editingEvent, courses, yearLevels }: Props) {
    const [formData, setFormData] = useState<EditEventPayload>({
        id: '',
        eventName: '',
        organizer: '',
        location: '',
        eventDate: '',
        eventTime: '',
        registrationEndTime: '',
        scannerStudentIds: [],
        expectedAttendees: '',
        description: '',
        courses: [],
        yearLevels: [],
        geofenceEnabled: false,
        geofenceLatitude: '',
        geofenceLongitude: '',
        geofenceRadiusM: '50',
        attendanceType: 'qr_scanner',
    });

    const [scannerStudentIdInput, setScannerStudentIdInput] = useState<string>('');
    const [scannerStudentName, setScannerStudentName] = useState<string>('');
    const [scannerStudentLoading, setScannerStudentLoading] = useState(false);
    const [scannerStudentError, setScannerStudentError] = useState<string>('');

    const [showMapSelector, setShowMapSelector] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');
    const handleMapLocationSelect = (lat: number, lng: number, name?: string) => {
        setFormData(prev => ({
            ...prev,
            geofenceLatitude: lat.toFixed(6),
            geofenceLongitude: lng.toFixed(6),
            ...(name ? { location: name } : {}),
        }));
        setSelectedLocationName(name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    useEffect(() => {
        if (editingEvent) {
            const [date, time] = editingEvent.dateTime.split(' ');
            setFormData({
                id: editingEvent.id,
                eventName: editingEvent.event,
                organizer: editingEvent.organizer,
                location: editingEvent.location,
                eventDate: date,
                eventTime: time,
                registrationEndTime: String(editingEvent.registrationEndTime ?? ''),
                scannerStudentIds: Array.isArray(editingEvent.scannerStudentIds) ? editingEvent.scannerStudentIds : [],
                expectedAttendees:
                    editingEvent.expectedAttendees !== undefined && editingEvent.expectedAttendees !== null
                        ? String(editingEvent.expectedAttendees)
                        : String(editingEvent.totalAttendees ?? ''),
                description: '',
                courses: Array.isArray(editingEvent.courses) 
                    ? editingEvent.courses.map(c => typeof c === 'string' ? c : c.id) 
                    : [],
                yearLevels: Array.isArray(editingEvent.year_levels) 
                    ? editingEvent.year_levels.map(yl => typeof yl === 'string' ? yl : yl.id) 
                    : [],
                geofenceEnabled: Boolean((editingEvent as any)?.geofenceEnabled ?? false),
                geofenceLatitude: String((editingEvent as any)?.geofenceLatitude ?? ''),
                geofenceLongitude: String((editingEvent as any)?.geofenceLongitude ?? ''),
                geofenceRadiusM: String((editingEvent as any)?.geofenceRadiusM ?? 50),
                attendanceType: editingEvent.attendance_type ?? 'qr_scanner',
            });

            setScannerStudentIdInput('');
            setScannerStudentName('');
            setScannerStudentError('');
        }
    }, [editingEvent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            id: '',
            eventName: '',
            organizer: '',
            location: '',
            eventDate: '',
            eventTime: '',
            registrationEndTime: '',
            scannerStudentIds: [],
            expectedAttendees: '',
            description: '',
            courses: [],
            yearLevels: [],
            geofenceEnabled: false,
            geofenceLatitude: '',
            geofenceLongitude: '',
            geofenceRadiusM: '50',
            attendanceType: 'qr_scanner',
        });
        setScannerStudentIdInput('');
        setScannerStudentName('');
        setScannerStudentError('');
        onClose();
    };

    const lookupScannerStudent = async () => {
        const raw = String(scannerStudentIdInput ?? '').trim();
        if (!raw) {
            setScannerStudentName('');
            setScannerStudentError('');
            return;
        }

        setScannerStudentLoading(true);
        setScannerStudentError('');

        try {
            const url = `/admin/students/lookup?student_id=${encodeURIComponent(raw)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                setScannerStudentName('');
                setScannerStudentError('Student not found');
                return;
            }

            const data = (await res.json()) as { student_id?: string; name?: string };
            setScannerStudentName(String(data?.name ?? ''));
            setScannerStudentError('');

            setFormData((prev) => {
                const next = new Set(prev.scannerStudentIds);
                next.add(raw);
                return {
                    ...prev,
                    scannerStudentIds: Array.from(next),
                };
            });
        } catch {
            setScannerStudentName('');
            setScannerStudentError('Lookup failed');
        } finally {
            setScannerStudentLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl overflow-hidden p-0">
                <div className="bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Edit Event
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Update the event details to modify the attendance event.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="grid gap-4 lg:col-span-8 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="eventName" className="text-sm font-medium text-slate-700">
                                    Event Name *
                                </Label>
                                <Input
                                    id="eventName"
                                    value={formData.eventName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                                    placeholder="Enter event name"
                                    className="h-9"
                                    required
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="scannerStudentId" className="text-sm font-medium text-slate-700">
                                    Allowed Scanner Student IDs
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="scannerStudentId"
                                        value={scannerStudentIdInput}
                                        onChange={(e) => setScannerStudentIdInput(e.target.value)}
                                        placeholder="Enter student ID"
                                        className="h-9"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9"
                                        onClick={lookupScannerStudent}
                                        disabled={scannerStudentLoading}
                                    >
                                        {scannerStudentLoading ? 'Adding...' : 'Add'}
                                    </Button>
                                </div>
                                {scannerStudentName ? (
                                    <div className="text-xs text-slate-600">
                                        Selected: <span className="font-semibold text-slate-800">{scannerStudentName}</span>
                                    </div>
                                ) : null}
                                {scannerStudentError ? (
                                    <div className="text-xs text-rose-600">{scannerStudentError}</div>
                                ) : null}

                                {formData.scannerStudentIds.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.scannerStudentIds.map((id) => (
                                            <button
                                                key={id}
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        scannerStudentIds: prev.scannerStudentIds.filter((x) => x !== id),
                                                    }))
                                                }
                                                aria-label={`Remove ${id}`}
                                            >
                                                {id}
                                                <span className="text-slate-400">×</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic">No allowed scanner students added.</div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="organizer" className="text-sm font-medium text-slate-700">
                                    Organizer *
                                </Label>
                                <Select
                                    value={formData.organizer}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, organizer: value }))}
                                    required
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select organizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="Office Student Affairs">Office Student Affairs</SelectItem>
                                         <SelectItem value="Dean of College">Dean of College</SelectItem>
                                         <SelectItem value="HED Library">HED Library</SelectItem>
                                         <SelectItem value="Guidance Office">Guidance Office</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                                    Location *
                                </Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Enter location"
                                    className="h-9"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="attendanceType" className="text-sm font-medium text-slate-700">
                                    Attendance Method *
                                </Label>
                                <Select
                                    value={formData.attendanceType || 'qr_scanner'}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, attendanceType: val }))}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select check-in method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="qr_scanner">QR Scanner (Camera scan by admin)</SelectItem>
                                        <SelectItem value="dynamic_qr">Dynamic Rotation QR (Self scan by students)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="eventDate" className="text-sm font-medium text-slate-700">
                                    Date *
                                </Label>
                                <Input
                                    id="eventDate"
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                                    className="h-9"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="eventTime" className="text-sm font-medium text-slate-700">
                                    Time *
                                </Label>
                                <Input
                                    id="eventTime"
                                    type="time"
                                    value={formData.eventTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                                    className="h-9"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="registrationEndTime" className="text-sm font-medium text-slate-700">
                                    Registration End Time
                                </Label>
                                <Input
                                    id="registrationEndTime"
                                    type="time"
                                    value={formData.registrationEndTime}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, registrationEndTime: e.target.value }))}
                                    className="h-9"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-slate-700">Status</Label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="w-fit capitalize">
                                        {deriveEventLifecycleStatus(formData.eventDate)}
                                    </Badge>
                                    <span className="text-xs text-slate-500">
                                        From event date (before today = completed, today = ongoing, after = upcoming).
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="expectedAttendees" className="text-sm font-medium text-slate-700">
                                    Expected Attendees
                                </Label>
                                <Input
                                    id="expectedAttendees"
                                    type="number"
                                    value={formData.expectedAttendees}
                                    onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendees: e.target.value }))}
                                    placeholder="Number of expected attendees"
                                    className="h-9"
                                    min="1"
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="courses" className="text-sm font-medium text-slate-700">
                                    Target Courses
                                </Label>
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500">
                                        Select courses that should attend this event
                                    </div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="selectAllCourses"
                                            checked={formData.courses.length === courses.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        courses: courses.map(c => c.id)
                                                    }));
                                                } else {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        courses: []
                                                    }));
                                                }
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="selectAllCourses" className="text-sm font-medium text-slate-700 cursor-pointer">
                                            Select All Courses
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                                        {courses.map((course) => (
                                            <label key={course.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.courses.includes(course.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                courses: [...prev.courses, course.id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                courses: prev.courses.filter(id => id !== course.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">
                                                    {course.name} ({course.code})
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.courses.length === 0 && (
                                        <div className="text-xs text-slate-400 italic">
                                            No courses selected - this event is open to all courses
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="yearLevels" className="text-sm font-medium text-slate-700">
                                    Target Year Levels
                                </Label>
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500">
                                        Select year levels that should attend this event
                                    </div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="selectAllYearLevels"
                                            checked={formData.yearLevels.length === yearLevels.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        yearLevels: yearLevels.map(yl => yl.id)
                                                    }));
                                                } else {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        yearLevels: []
                                                    }));
                                                }
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="selectAllYearLevels" className="text-sm font-medium text-slate-700 cursor-pointer">
                                            Select All Year Levels
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                                        {yearLevels.map((yearLevel) => (
                                            <label key={yearLevel.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.yearLevels.includes(yearLevel.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                yearLevels: [...prev.yearLevels, yearLevel.id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                yearLevels: prev.yearLevels.filter(id => id !== yearLevel.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">
                                                    {yearLevel.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.yearLevels.length === 0 && (
                                        <div className="text-xs text-slate-400 italic">
                                            No year levels selected - this event is open to all year levels
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="geofenceEnabled"
                                        checked={formData.geofenceEnabled}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, geofenceEnabled: e.target.checked }))}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700">Enable geofence validation (50m strict)</span>
                                </div>
                            </div>

                            {formData.geofenceEnabled && (
                                <>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 text-sm"
                                            onClick={() => setShowMapSelector(true)}
                                        >
                                            📍 Select Location on Map
                                        </Button>
                                    </div>
                                    {showMapSelector && (
                                        <div className="grid gap-2 sm:col-span-2">
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
                                        <div className="grid gap-2 sm:col-span-2">
                                            <div className="text-sm text-slate-600">
                                                Selected: <span className="font-semibold">{selectedLocationName}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="geofenceLatitude" className="text-sm font-medium text-slate-700">
                                            Latitude
                                        </Label>
                                        <Input
                                            id="geofenceLatitude"
                                            value={formData.geofenceLatitude}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, geofenceLatitude: e.target.value }))}
                                            placeholder="e.g. 14.5995123"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="geofenceLongitude" className="text-sm font-medium text-slate-700">
                                            Longitude
                                        </Label>
                                        <Input
                                            id="geofenceLongitude"
                                            value={formData.geofenceLongitude}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, geofenceLongitude: e.target.value }))}
                                            placeholder="e.g. 120.9842195"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="geofenceRadiusM" className="text-sm font-medium text-slate-700">
                                            Radius (meters)
                                        </Label>
                                        <Input
                                            id="geofenceRadiusM"
                                            type="number"
                                            min={10}
                                            max={500}
                                            value={formData.geofenceRadiusM}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, geofenceRadiusM: e.target.value }))}
                                            className="h-9"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid gap-4 lg:col-span-4">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-slate-600" />
                                    <div className="text-sm font-semibold text-slate-700">Event Details</div>
                                </div>
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                        <span className="text-xs text-slate-600">Location: {formData.location || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <span className="text-xs text-slate-600">
                                            Status: {deriveEventLifecycleStatus(formData.eventDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <Button variant="secondary" type="button" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-[#121F78] hover:bg-[#0f1a66]"
                        onClick={handleSubmit}
                    >
                        Update Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
