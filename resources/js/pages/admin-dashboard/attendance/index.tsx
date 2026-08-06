import { Head, router, usePage } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import QRCode from 'qrcode';
import { 
    ArrowLeft, 
    Activity, 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Filter, 
    Search, 
    Pause, 
    Play, 
    RefreshCw, 
    BarChart3,
    MoreHorizontal,
    ChevronRight,
    ChevronLeft,
    LayoutDashboard,
    Zap,
    Camera,
    QrCode,
    Wifi,
    WifiOff,
    Info,
    ShieldCheck
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    adminDashboard,
    adminAttendance,
    adminAttendanceActivateScannerPortal,
    adminAttendanceLogs,
    adminAttendanceStudentsByCourse,
    adminAttendanceDynamicQrToken,
    adminAttendanceStore,
    adminAttendanceUpdate,
    adminAttendanceDestroy
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';
import EventEditModal from '../events/EventEditModal';
import type { EventViewRecord } from '../events/EventViewModal';
import type { CourseYearOption } from '../events/mergeCourseYearOptions';
import AttendanceHeader from './AttendanceHeader';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceTable from './AttendanceTable';
import EventAttendeesModal from './EventAttendeesModal';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: adminDashboard(),
    },
    {
        title: 'Attendance',
        href: adminAttendance(),
    },
];

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
    lateCount?: number;
    status: 'upcoming' | 'ongoing' | 'completed';
    location: string;
    scannerPortalActive?: boolean;
    attendance_type?: string;
    geofence_enabled?: boolean;
};

type LiveLogRow = {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    time: string;
    status: string;
};


type ByCourseRow = {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
};

type StudentByCourseRow = {
    id: string;
    student_id: string;
    name: string;
    course: string;
    year_level: string;
    scanned: boolean;
    status: string | null;
    checked_in_at: string | null;
};


export default function AdminAttendancePage() {
    const page = usePage().props as Record<string, unknown>;

    // Debug: Check if there's an error from backend
    if (page.error) {
        console.error('Backend Error:', page.error);
    }

    // Use backend data if available, otherwise initialize as empty
    const [events, setEvents] = useState<AttendanceRow[]>(
        (page.events as AttendanceRow[] && (page.events as any[]).length > 0)
            ? page.events as AttendanceRow[]
            : []
    );

    const incomingEvents = page.events as AttendanceRow[] | undefined;
    const hasBackendEvents = Array.isArray(incomingEvents) && incomingEvents.length > 0;

    useEffect(() => {
        if (hasBackendEvents && incomingEvents) {
            setEvents(incomingEvents);
        }
    }, [hasBackendEvents, incomingEvents]);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    /** Row selected in the event list drives KPI scope (empty = aggregate ongoing + completed in filtered list) */
    const [selectedListEventId, setSelectedListEventId] = useState<string>('');

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const datePart = (ev.dateTime || '').split(/\s+/)[0]?.trim() ?? '';
            const inRange =
                (!dateRange.start || (datePart !== '' && datePart >= dateRange.start)) &&
                (!dateRange.end || (datePart !== '' && datePart <= dateRange.end));
            const q = searchQuery.trim().toLowerCase();
            const matches =
                !q ||
                (ev.event && ev.event.toLowerCase().includes(q)) ||
                (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
                (ev.location && ev.location.toLowerCase().includes(q));
            return inRange && matches;
        });
    }, [events, dateRange.start, dateRange.end, searchQuery]);

    useEffect(() => {
        if (selectedListEventId && !filteredEvents.some((e) => String(e.id) === selectedListEventId)) {
            setSelectedListEventId('');
        }
    }, [filteredEvents, selectedListEventId]);

    const statsSourceEvents = useMemo(() => {
        if (selectedListEventId) {
            return filteredEvents.filter((e) => String(e.id) === selectedListEventId);
        }
        return filteredEvents.filter((e) => e.status === 'ongoing' || e.status === 'completed');
    }, [filteredEvents, selectedListEventId]);

    const calculatedStats = useMemo(() => {
        const list = statsSourceEvents;
        const totalEvents = selectedListEventId ? (list.length > 0 ? 1 : 0) : filteredEvents.length;

        const totalAttendees = list.reduce((sum, event) => {
            const scans =
                event.status === 'upcoming'
                    ? 0
                    : (event.scannedCount ?? event.presentCount ?? 0);
            return sum + scans;
        }, 0);

        const avgAttendanceRate =
            list.length > 0
                ? Math.round(
                    list.reduce((sum, event) => {
                        const explicit = event.attendanceDenominator;
                        const expected = event.expectedAttendees ?? 0;
                        const eligible = event.eligibleStudentsCount ?? 0;
                        const denom =
                            typeof explicit === 'number' && explicit > 0
                                ? explicit
                                : expected > 0
                                    ? expected
                                    : eligible > 0
                                        ? eligible
                                        : event.totalAttendees > 0
                                            ? event.totalAttendees
                                            : 0;
                        const num =
                            event.status === 'upcoming'
                                ? 0
                                : (event.scannedCount ?? event.presentCount ?? 0);
                        return sum + (denom > 0 ? (num / denom) * 100 : 0);
                    }, 0) / list.length,
                )
                : 0;

        const totalLate = list.reduce((sum, event) => {
            if (event.status === 'upcoming') {
                return sum;
            }
            return sum + (event.lateCount ?? 0);
        }, 0);

        return {
            totalEvents,
            totalAttendees,
            avgAttendanceRate,
            totalLate,
        };
    }, [statsSourceEvents, selectedListEventId, filteredEvents]);

    // Sample courses and year levels
    const courses = (page.courses as any[])?.length > 0 ? page.courses as any[] : [
        'Computer Science',
        'Information Technology',
        'Business Administration',
        'Accountancy',
        'Psychology',
        'Engineering'
    ];

    const yearLevels = (page.yearLevels as any[])?.length > 0 ? page.yearLevels as any[] : [
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year'
    ];

    const totalStudents = (page.totalStudents as number) || 850;
    const studentCountsByCourseYear = (page.studentCountsByCourseYear as any[])?.length > 0
        ? page.studentCountsByCourseYear as any[]
        : [
            { course: 'Computer Science', year_level: '1st Year', count: 45 },
            { course: 'Computer Science', year_level: '2nd Year', count: 38 },
            { course: 'Information Technology', year_level: '1st Year', count: 52 },
            { course: 'Business Administration', year_level: '3rd Year', count: 41 },
            { course: 'Accountancy', year_level: '4th Year', count: 35 },
            { course: 'Psychology', year_level: '2nd Year', count: 48 },
            { course: 'Engineering', year_level: '3rd Year', count: 29 },
        ];

    // Real-time monitoring state
    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitoringEnabled, setMonitoringEnabled] = useState(false);
    const [scannerPortalActive, setScannerPortalActive] = useState(false);
    const [monitorEventId, setMonitorEventId] = useState<string>('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    
    // Segmented tab state inside Command Center
    const [monitoringTab, setMonitoringTab] = useState<'dashboard' | 'scanner' | 'dynamic-qr'>('dashboard');

    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
    });

    // Sample by course data for testing
    const sampleByCourse: ByCourseRow[] = [
        { program: 'Computer Science', expected: 45, scanned: 38, percentage: 84 },
        { program: 'Information Technology', expected: 52, scanned: 47, percentage: 90 },
        { program: 'Business Administration', expected: 41, scanned: 35, percentage: 85 },
        { program: 'Accountancy', expected: 35, scanned: 32, percentage: 91 },
        { program: 'Psychology', expected: 48, scanned: 42, percentage: 88 },
        { program: 'Engineering', expected: 29, scanned: 25, percentage: 86 }
    ];

    const [byCourse, setByCourse] = useState<ByCourseRow[]>(sampleByCourse);

    const [liveStartIndex, setLiveStartIndex] = useState(1);
    const [liveEndIndex, setLiveEndIndex] = useState(0);

    // --- QR Scanner state ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);
    const [scanState, setScanState] = useState<{ status: 'idle' | 'starting' | 'running' | 'error'; message?: string }>({
        status: 'idle',
    });
    const [lastScanned, setLastScanned] = useState<{ status: 'valid' | 'invalid'; message: string } | null>(null);
    const [scannerCounts, setScannerCounts] = useState({
        total: 0,
        valid: 0,
        invalid: 0,
    });
    const [scannerSortBy, setScannerSortBy] = useState('time');
    const [scannerFilterProgram, setScannerFilterProgram] = useState('all');
    const [scannerPageSize, setScannerPageSize] = useState(10);
    const [scannerCurrentPage, setScannerCurrentPage] = useState(1);

    // --- Dynamic QR mode state ---
    const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [remaining, setRemaining] = useState<number>(30);
    const [qrLoading, setQrLoading] = useState<boolean>(true);
    const [qrError, setQrError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{ reader: BrowserQRCodeReader; stop: () => void } | null>(null);

    const barcodeDetectorSupported = useMemo(() => {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }, []);

    // --- Camera scanner actions ---
    const startScanner = async () => {
        if (!monitorEventId) {
            Swal.fire({
                icon: 'info',
                title: 'Select an Event',
                text: 'Please select an event first before starting the camera scanner.',
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const msg = 'Camera access requires a Secure Context (HTTPS or http://localhost). Please access this site over HTTPS or via localhost.';
            setScanState({ status: 'error', message: msg });
            Swal.fire({
                icon: 'warning',
                title: 'HTTPS / Localhost Required',
                text: msg,
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg = 'Camera API (navigator.mediaDevices) is not supported or blocked by browser settings.';
            setScanState({ status: 'error', message: msg });
            Swal.fire({
                icon: 'error',
                title: 'Camera Unsupported',
                text: msg,
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        setScanState({ status: 'starting' });
        try {
            stopScanner(); // stop any active stream first

            const video = videoRef.current;
            if (!video) {
                setScanState({ status: 'error', message: 'Video element not available.' });
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;

            video.srcObject = stream;
            try {
                await video.play();
            } catch (playErr: any) {
                if (playErr?.name !== 'AbortError') {
                    throw playErr;
                }
            }

            if (barcodeDetectorSupported) {
                const Detector = (window as any).BarcodeDetector as new (options: { formats: string[] }) => {
                    detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
                };
                const detector = new Detector({ formats: ['qr_code'] });

                setScanState({ status: 'running' });

                intervalRef.current = window.setInterval(async () => {
                    const v = videoRef.current;
                    if (!v || v.readyState < 2) return;
                    try {
                        const results = await detector.detect(v);
                        const value = results?.[0]?.rawValue;
                        if (value) void processScan(value);
                    } catch {
                        return;
                    }
                }, 250);
            } else {
                const reader = new BrowserQRCodeReader();
                const controls = await reader.decodeFromVideoDevice(
                    undefined,
                    video,
                    (result) => {
                        const value = result?.getText?.() ?? '';
                        if (value) void processScan(value);
                    }
                );

                zxingRef.current = {
                    reader,
                    stop: () => {
                        try {
                            controls.stop();
                        } catch {
                            // ignore
                        }
                    },
                };

                setScanState({ status: 'running' });
            }
        } catch (err: any) {
            console.error('Camera startup error:', err);
            stopScanner();
            const errMsg = err?.name === 'NotAllowedError'
                ? 'Camera access permission was denied. Please grant camera permission in your browser.'
                : err?.name === 'NotFoundError'
                ? 'No camera device found on this system.'
                : err?.message || 'Failed to start camera.';
            
            setScanState({ status: 'error', message: errMsg });
            Swal.fire({
                icon: 'error',
                title: 'Camera Error',
                text: errMsg,
                confirmButtonColor: '#0b2d66',
            });
        }
    };

    const stopScanner = () => {
        if (intervalRef.current != null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (zxingRef.current) {
            zxingRef.current.stop();
            zxingRef.current = null;
        }

        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
                track.stop();
            }
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        if (codeReaderRef.current) {
            codeReaderRef.current = null;
        }

        setScanState({ status: 'idle' });
    };

    useEffect(() => {
        if (monitoringTab === 'scanner' && monitorEventId) {
            void startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [monitoringTab, monitorEventId]);

    const processScan = async (code: string) => {
        const now = Date.now();
        if (
            lastValueRef.current?.value === code &&
            now - lastValueRef.current.at < 2000
        ) {
            return;
        }
        lastValueRef.current = { value: code, at: now };

        const getCsrfToken = () => {
            const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            if (match) {
                return decodeURIComponent(match[1]);
            }
            return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        };
        const csrfToken = getCsrfToken();

        try {
            const res = await fetch(`/admin/attendance/${monitorEventId}/scan`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ value: code }),
            });
            const data = await res.json();
            if (res.ok) {
                setLastScanned({ status: 'valid', message: data.message || 'Attendance recorded' });
                setScannerCounts((prev) => ({ ...prev, total: prev.total + 1, valid: prev.valid + 1 }));
                void refreshLogs();
            } else {
                setLastScanned({ status: 'invalid', message: data.message || 'Invalid QR code' });
                setScannerCounts((prev) => ({ ...prev, total: prev.total + 1, invalid: prev.invalid + 1 }));
                
                Swal.fire({
                    icon: 'error',
                    title: 'Scan Failed',
                    text: data.message || 'Invalid QR code',
                    confirmButtonColor: '#0b2d66',
                });
            }
            setTimeout(() => setLastScanned(null), 3000);
        } catch (err) {
            console.error(err);
            setLastScanned({ status: 'invalid', message: 'Network error occurred' });
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'An error occurred while communicating with the server.',
                confirmButtonColor: '#0b2d66',
            });
        }
    };

    // --- Dynamic QR actions ---
    const renderQr = useCallback(async (payload: string) => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;
        try {
            await QRCode.toCanvas(canvas, payload, {
                width: 380,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            });
            setQrDataUrl(canvas.toDataURL());
        } catch (err) {
            console.error('Failed to generate QR code canvas:', err);
        }
    }, []);

    const fetchDynamicQrToken = useCallback(async () => {
        if (!monitorEventId) return;
        if (!scannerPortalActive) {
            setQrError('Activate the attendance session first (click "Activate Scanner Portal" or "Start Live Monitoring").');
            return;
        }
        setQrLoading(true);
        setQrError(null);
        try {
            const res = await fetch(adminAttendanceDynamicQrToken(monitorEventId), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    setScannerPortalActive(false);
                    setQrError('Activate the attendance session first (click "Activate Scanner Portal" or "Start Live Monitoring").');
                } else {
                    setQrError((body as any)?.message ?? 'Failed to generate QR token.');
                }
                setQrLoading(false);
                return;
            }
            const data: { payload: string; expires_at: string } = await res.json();
            const expiry = new Date(data.expires_at);
            setExpiresAt(expiry);
            setLastRefresh(new Date());

            try {
                const parsed = JSON.parse(data.payload);
                setToken(String(parsed?.token ?? '').slice(0, 12) + '…');
            } catch {
                setToken('');
            }

            await renderQr(data.payload);
            setScannerPortalActive(true);
        } catch (e: any) {
            setQrError(e?.message ?? 'Network error.');
        } finally {
            setQrLoading(false);
        }
    }, [monitorEventId, renderQr, scannerPortalActive]);

    const fetchLiveCounts = useCallback(async () => {
        if (!monitorEventId) return;
        try {
            const res = await fetch(adminAttendanceLogs(monitorEventId, 1), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.counts) {
                    setLiveCounts({
                        total: data.counts.total ?? 0,
                        present: data.counts.present ?? 0,
                        late: data.counts.late ?? 0,
                    });
                }
            }
        } catch {
            // silent
        }
    }, [monitorEventId]);

    // Countdown timer for dynamic QR code expiration
    useEffect(() => {
        if (monitoringTab !== 'dynamic-qr' || !showRealTimeMonitoring) return undefined;
        
        const countdownId = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
            setRemaining(diff);
        }, 250);

        return () => clearInterval(countdownId);
    }, [expiresAt, monitoringTab, showRealTimeMonitoring]);

    // Token rotating loop and live count loop for dynamic QR code
    useEffect(() => {
        if (monitoringTab !== 'dynamic-qr' || !showRealTimeMonitoring || !monitorEventId) return undefined;

        void fetchDynamicQrToken();
        void fetchLiveCounts();

        const tokenIntervalId = setInterval(() => {
            void fetchDynamicQrToken();
        }, 30000); // 30s token lifetime

        const countsIntervalId = setInterval(() => {
            void fetchLiveCounts();
        }, 10000); // 10s counts sync

        return () => {
            clearInterval(tokenIntervalId);
            clearInterval(countsIntervalId);
        };
    }, [monitoringTab, showRealTimeMonitoring, monitorEventId, fetchDynamicQrToken, fetchLiveCounts]);

    // Clean up camera scanner on tab change or monitoring toggle
    useEffect(() => {
        if (monitoringTab !== 'scanner' || !showRealTimeMonitoring) {
            stopScanner();
        }
        return () => stopScanner();
    }, [monitoringTab, showRealTimeMonitoring]);

    const handleOpenRealTimeMonitoringForEvent = (eventId: string, initialTab: 'dashboard' | 'scanner' | 'dynamic-qr' = 'dashboard') => {
        const id = String(eventId);
        const ev = events.find(e => String(e.id) === id);
        const type = ev?.attendance_type || 'qr_scanner';
        
        let tab = initialTab;
        if (type === 'dynamic_qr' && tab === 'scanner') {
            tab = 'dynamic-qr';
        } else if (type === 'qr_scanner' && tab === 'dynamic-qr') {
            tab = 'scanner';
        }

        setMonitorEventId(id);
        setShowRealTimeMonitoring(true);
        setMonitoringEnabled(false);
        setScannerPortalActive(ev ? !!ev.scannerPortalActive : false);
        setLastUpdatedAt(null);
        setLiveCurrentPage(1);
        setMonitoringTab(tab);

        if (!hasBackendEvents) {
            setLiveRows(sampleLiveLogs);
            const present = sampleLiveLogs.filter((r) => r.status?.toLowerCase() === 'present').length;
            const late = sampleLiveLogs.filter((r) => r.status?.toLowerCase() === 'late').length;
            setLiveCounts({ total: sampleLiveLogs.length, present, late });
            setByCourse(sampleByCourse);
            return;
        }

        setLiveRows([]);
        setLiveCounts({ total: 0, present: 0, late: 0 });
        setByCourse([]);
    };

    const handleActivatePortalAndStartMonitoring = () => {
        if (!monitorEventId) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
            return;
        }

        if (hasBackendEvents) {
            router.post(
                adminAttendanceActivateScannerPortal(monitorEventId),
                {},
                { preserveScroll: true },
            );
        }

        setScannerPortalActive(true);
        setMonitoringEnabled(true);
        setLastUpdatedAt(new Date().toLocaleString());
        void refreshLogs();
    };

    // Course students dialog state (temporary client-side integration)
    const [showCourseStudentsModal, setShowCourseStudentsModal] = useState(false);

    // Live/checked-in timestamps for the selected event

    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const [courseStudentsRows, setCourseStudentsRows] = useState<StudentByCourseRow[]>([]);
    const [courseStudentsYearFilter, setCourseStudentsYearFilter] = useState<string>('all');
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<string | null>(null);

    const handleViewStudentsByCourse = async (courseName: string) => {
        if (!monitorEventId) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
            return;
        }

        setSelectedCourse(courseName);
        setShowCourseStudentsModal(true);
        setCourseStudentsYearFilter('all');

        setCourseStudentsLoading(true);
        setCourseStudentsError(null);

        try {
            const url = adminAttendanceStudentsByCourse(String(monitorEventId)) + `?course=${encodeURIComponent(courseName)}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });


            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Failed to load students');
            }

            const data = (await res.json()) as {
                rows?: StudentByCourseRow[];
            };

            setCourseStudentsRows(Array.isArray(data.rows) ? (data.rows as StudentByCourseRow[]) : []);
        } catch (e: any) {
            setCourseStudentsRows([]);
            setCourseStudentsError(e?.message ? String(e.message) : 'Failed to load students');
        } finally {
            setCourseStudentsLoading(false);
        }
    };



    // Sample live logs data for testing
    const sampleLiveLogs: LiveLogRow[] = [
        {
            id: '1',
            student_id: '2024-0001',
            name: 'Juan Dela Cruz',
            program: 'Computer Science',
            checked_in_at: '2026-03-25 13:15:30',
            time: '01:15 PM',
            status: 'Present'
        },
        {
            id: '2',
            student_id: '2024-0002',
            name: 'Maria Santos',
            program: 'Information Technology',
            checked_in_at: '2026-03-25 13:18:45',
            time: '01:18 PM',
            status: 'Present'
        },
        {
            id: '3',
            student_id: '2024-0003',
            name: 'Jose Reyes',
            program: 'Business Administration',
            checked_in_at: '2026-03-25 13:22:10',
            time: '01:22 PM',
            status: 'Late'
        },
        {
            id: '4',
            student_id: '2024-0004',
            name: 'Ana Garcia',
            program: 'Accountancy',
            checked_in_at: '2026-03-25 13:25:55',
            time: '01:25 PM',
            status: 'Present'
        },
        {
            id: '5',
            student_id: '2024-0005',
            name: 'Carlos Rodriguez',
            program: 'Psychology',
            checked_in_at: '2026-03-25 13:28:20',
            time: '01:28 PM',
            status: 'Present'
        },
        {
            id: '6',
            student_id: '2024-0006',
            name: 'Sofia Martinez',
            program: 'Engineering',
            checked_in_at: '2026-03-25 13:31:15',
            time: '01:31 PM',
            status: 'Late'
        }
    ];


    const [liveRows, setLiveRows] = useState<LiveLogRow[]>(sampleLiveLogs);
    const [livePageSize, setLivePageSize] = useState(10);
    const [liveCurrentPage, setLiveCurrentPage] = useState(1);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventViewRecord | null>(null);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [viewingEventName, setViewingEventName] = useState<string>('');

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId || !hasBackendEvents) {
            return;
        }
        try {
            const res = await fetch(adminAttendanceLogs(monitorEventId), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                return;
            }
            const data = (await res.json()) as {
                rows?: Array<Record<string, unknown>>;
                counts?: { total?: number; present?: number; late?: number };
                byCourse?: ByCourseRow[];
                server_time?: string;
                scanner_portal_active?: boolean;
            };

            const rows: LiveLogRow[] = (data.rows ?? []).map((r, idx) => ({
                id: String(r.id ?? idx),
                student_id: String(r.student_id ?? ''),
                name: String(r.name ?? ''),
                program: String(r.program ?? ''),
                checked_in_at: String(r.checked_in_at ?? ''),

                time: String(r.time ?? ''),

                status: String(r.status ?? '').toLowerCase(),
            }));

            setLiveRows(rows);
            const totalScans = Number(data.counts?.total ?? rows.length);
            const presentN = Number(data.counts?.present ?? 0);
            const lateN = Number(data.counts?.late ?? 0);
            setLiveCounts({
                total: totalScans,
                present: presentN,
                late: lateN,
            });
            if (Array.isArray(data.byCourse) && data.byCourse.length > 0) {
                setByCourse(data.byCourse as ByCourseRow[]);
            }
            setLastUpdatedAt(data.server_time ?? new Date().toLocaleString());
            setScannerPortalActive(Boolean(data.scanner_portal_active));

            setEvents((prev) =>
                prev.map((ev) =>
                    String(ev.id) === String(monitorEventId)
                        ? {
                            ...ev,
                            scannedCount: totalScans,
                            presentCount: presentN,
                            lateCount: lateN,
                        }
                        : ev,
                ),
            );
        } catch {
            // polling: ignore transient errors
        }
    }, [monitorEventId, hasBackendEvents]);

    useEffect(() => {
        if (!showRealTimeMonitoring || !monitorEventId || !hasBackendEvents) {
            return undefined;
        }
        void refreshLogs();
        return undefined;
    }, [showRealTimeMonitoring, monitorEventId, hasBackendEvents, refreshLogs]);

    useEffect(() => {
        if (!monitoringEnabled || !monitorEventId || !hasBackendEvents) {
            return undefined;
        }
        const id = window.setInterval(() => void refreshLogs(), 2500);
        return () => window.clearInterval(id);
    }, [monitoringEnabled, monitorEventId, hasBackendEvents, refreshLogs]);

    useEffect(() => {
        if (!hasBackendEvents || showRealTimeMonitoring) {
            return undefined;
        }
        const intervalMs = 12000;
        const tick = window.setInterval(() => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            router.reload({ only: ['events', 'stats'] });
        }, intervalMs);
        return () => window.clearInterval(tick);
    }, [hasBackendEvents, showRealTimeMonitoring]);

    useEffect(() => {
        if (!hasBackendEvents || showRealTimeMonitoring) {
            return undefined;
        }
        const onVis = () => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['events', 'stats'] });
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [hasBackendEvents, showRealTimeMonitoring]);
    const liveTotalPages = useMemo(() => {
        return Math.max(1, Math.ceil(liveRows.length / Math.max(1, livePageSize)));
    }, [liveRows.length, livePageSize]);

    const paginatedLiveRows = useMemo(() => {
        const start = (liveCurrentPage - 1) * livePageSize;
        const end = start + livePageSize;
        return liveRows.slice(start, end);
    }, [liveRows, liveCurrentPage, livePageSize]);

    useEffect(() => {
        const start = (liveCurrentPage - 1) * livePageSize;
        const end = Math.min(start + livePageSize, liveRows.length);
        setLiveStartIndex(liveRows.length ? start + 1 : 0);
        setLiveEndIndex(end);
    }, [liveCurrentPage, livePageSize, liveRows.length]);

    const handleEditEvent = async (row: AttendanceRow) => {
        if (!hasBackendEvents) {
            Swal.fire({
                icon: 'info',
                title: 'Sample Data',
                text: 'Editing is disabled for sample data. Please use real event data.',
            });
            return;
        }

        try {
            const res = await fetch(`/admin/events/${row.id}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
                const data = await res.json();
                setEditingEvent(data.props?.event || data.event || data);
                setShowEditModal(true);
            } else {
                throw new Error('Failed to fetch event details');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load event details for editing.' });
        }
    };

    const handleViewAttendees = (eventId: string) => {
        const event = events.find(e => String(e.id) === String(eventId));
        setViewingEventId(eventId);
        setViewingEventName(event?.event || 'Event Participants');
        setShowAttendeesModal(true);
    };

    const handleDeleteEvent = (eventId: string) => {

        console.log('=== HANDLE DELETE CALLED ===');
        console.log('Deleting event with ID:', eventId);
        console.log('Delete URL:', adminAttendanceDestroy(eventId));
        console.log('Current events:', events.map(e => ({ id: e.id, event: e.event })));

        if (!eventId || eventId === 'undefined' || eventId === 'null' || eventId.trim() === '') {
            console.error('Event ID is missing or invalid!');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event ID is missing or invalid. Cannot delete event.',
            });
            return;
        }

        // Additional validation: check if the event exists in the current list
        const eventExists = events.some(event => String(event.id) === eventId);
        if (!eventExists) {
            console.error('Event not found in current list!');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event not found. Cannot delete event.',
            });
            return;
        }

        Swal.fire({
            title: 'Archive Event?',
            text: "This event will be archived and hidden from the main list. You can restore it later.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, archive it!'
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    console.log('About to make DELETE request to:', adminAttendanceDestroy(eventId));
                    // Perform the delete request using POST with _method=DELETE for better compatibility
                    router.delete(adminAttendanceDestroy(eventId), {
                        onSuccess: () => {
                            setEvents(events.filter((event) => String(event.id) !== String(eventId)));
                            setSelectedListEventId((cur) => (String(cur) === String(eventId) ? '' : cur));

                            Swal.fire({
                                icon: 'success',
                                title: 'Archived!',
                                text: 'Event has been archived successfully.',
                                showConfirmButton: false,
                                timer: 1500,
                            });
                        },
                        onError: (errors) => {
                            console.error('Delete request failed:', errors);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to archive event. Please try again.',
                            });
                        },
                    });
                } catch (error) {
                    console.error('Error during delete operation:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Invalid event ID or delete operation failed.',
                    });
                }
            }
        });
    };

    // Stats props for non-real-time view
    const { totalEvents, totalAttendees, avgAttendanceRate, totalLate } = calculatedStats;

    // Prepare options for EventEditModal
    const formattedCourseOptions: CourseYearOption[] = useMemo(() => 
        courses.map(c => ({ id: c, name: c, code: c })), [courses]);
    
    const formattedYearLevelOptions: CourseYearOption[] = useMemo(() => 
        yearLevels.map(y => ({ id: y, name: y, code: y })), [yearLevels]);

    const monitoredEvent = events.find(e => String(e.id) === monitorEventId);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">

                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {showRealTimeMonitoring ? (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                            {/* --- REDESIGNED MONITORING HEADER (UX Heuristics) --- */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-lg">
                                {/* PRIMARY HEADER: 3-Zone Layout */}
                                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        {/* ZONE 1: Navigation + Event Identity (Heuristic #6: Recognition over Recall) */}
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-10 shrink-0 rounded-xl bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 gap-2 border border-white/5 transition-all duration-200 active:scale-95"
                                                onClick={() => {
                                                    setShowRealTimeMonitoring(false);
                                                    setMonitoringEnabled(false);
                                                }}
                                                title="Return to event list"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                <span className="hidden sm:inline">Back to Events</span>
                                            </Button>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="text-xl font-bold tracking-tight truncate leading-tight">
                                                    {monitoredEvent?.event || 'Select an event'}
                                                </h2>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                                    {monitoredEvent?.dateTime && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-slate-500" />
                                                            {monitoredEvent.dateTime}
                                                        </span>
                                                    )}
                                                    {monitoredEvent?.location && (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="text-slate-600">📍</span>
                                                            {monitoredEvent.location}
                                                        </span>
                                                    )}
                                                    {monitoredEvent?.organizer && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="h-3 w-3 text-slate-500" />
                                                            {monitoredEvent.organizer}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ZONE 2: System Status (Heuristic #1: Visibility of System Status) */}
                                        <div className="flex items-center justify-center lg:justify-end gap-3 shrink-0">
                                            <div className={cn(
                                                "flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all duration-500",
                                                monitoringEnabled
                                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                    : "bg-slate-700/50 text-slate-400 border-slate-600/30"
                                            )}>
                                                <span className="relative flex h-2.5 w-2.5">
                                                    {monitoringEnabled && (
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    )}
                                                    <span className={cn(
                                                        "relative inline-flex rounded-full h-2.5 w-2.5",
                                                        monitoringEnabled ? "bg-emerald-400" : "bg-slate-500"
                                                    )}></span>
                                                </span>
                                                {monitoringEnabled ? 'System Live' : 'System Paused'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ZONE 3: Tabs + Controls (Miller's Law: grouped) */}
                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        {/* Tab Switcher */}
                                        <div className="inline-flex rounded-xl bg-white/[0.07] p-1 gap-0.5 border border-white/[0.06]">
                                            <button
                                                type="button"
                                                onClick={() => setMonitoringTab('dashboard')}
                                                className={cn(
                                                    "flex items-center gap-1.5 h-9 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                                    monitoringTab === 'dashboard'
                                                        ? "bg-white text-slate-900 shadow-md"
                                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                <Activity className="h-3.5 w-3.5" />
                                                Dashboard
                                            </button>
                                            {(!monitoredEvent || monitoredEvent.attendance_type !== 'dynamic_qr') && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMonitoringTab('scanner')}
                                                    className={cn(
                                                        "flex items-center gap-1.5 h-9 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                                        monitoringTab === 'scanner'
                                                            ? "bg-white text-slate-900 shadow-md"
                                                            : "text-white/70 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                    {monitoredEvent?.geofence_enabled ? 'Geotagging' : 'QR Scanner'}
                                                </button>
                                            )}
                                            {(monitoredEvent && monitoredEvent.attendance_type === 'dynamic_qr') && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMonitoringTab('dynamic-qr')}
                                                    className={cn(
                                                        "flex items-center gap-1.5 h-9 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                                        monitoringTab === 'dynamic-qr'
                                                            ? "bg-white text-slate-900 shadow-md"
                                                            : "text-white/70 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    <QrCode className="h-3.5 w-3.5" />
                                                    {monitoredEvent?.geofence_enabled ? 'Geo Dynamic QR' : 'Dynamic QR'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={monitoringEnabled ? 'outline' : 'default'}
                                                size="sm"
                                                className={cn(
                                                    "h-9 gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-300 active:scale-95",
                                                    monitoringEnabled
                                                        ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                                                        : "bg-blue-600 text-white hover:bg-blue-500 border-transparent shadow-lg shadow-blue-600/25"
                                                )}
                                                onClick={() => {
                                                    if (monitoringEnabled) {
                                                        setMonitoringEnabled(false);
                                                    } else {
                                                        handleActivatePortalAndStartMonitoring();
                                                    }
                                                }}
                                                title={monitoringEnabled ? 'Pause live data sync' : 'Start live monitoring & activate scanner portal'}
                                            >
                                                {monitoringEnabled ? (
                                                    <><Pause className="h-3.5 w-3.5 fill-current" /> Pause</>
                                                ) : (
                                                    <><Play className="h-3.5 w-3.5 fill-current" /> Start Live</>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl bg-white/[0.07] text-white hover:bg-white/15 border border-white/[0.06] transition-all active:scale-95"
                                                onClick={() => void refreshLogs()}
                                                disabled={!monitorEventId}
                                                title="Manually refresh attendance data"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${monitoringEnabled ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* LIVE STATUS STRIP (Heuristic #1: Visibility — persistent status bar) */}
                                <div className={cn(
                                    "flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-xs transition-colors duration-500",
                                    monitoringEnabled
                                        ? "bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-teal-950/20 border-t border-emerald-100 dark:border-emerald-900/30"
                                        : "bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex items-center gap-1.5 font-bold uppercase tracking-wider",
                                            scannerPortalActive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            <Zap className={cn("h-3 w-3", scannerPortalActive && "animate-pulse")} />
                                            Portal {scannerPortalActive ? 'Active' : 'Inactive'}
                                        </div>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            Last sync: {lastUpdatedAt ? lastUpdatedAt.split(',')[1]?.trim() || lastUpdatedAt : 'Never'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                                        <Activity className={cn("h-3 w-3", monitoringEnabled && "text-emerald-500 animate-pulse")} />
                                        {monitoringEnabled ? 'Syncing every 2.5s' : 'Auto-sync paused'}
                                    </div>
                                </div>
                            </div>

                            {/* TABBED CONTENTS */}
                            {monitoringTab === 'dashboard' && (
                                <>
                                {/* INLINE STATS STRIP (Gestalt: Proximity — stats near data) */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-5 py-4 shadow-sm">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/15">
                                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Checked In</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{liveCounts.total}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-5 py-4 shadow-sm">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">On Time</p>
                                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 leading-tight">{liveCounts.present}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-4 shadow-sm">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15">
                                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-400/70">Late Arrivals</p>
                                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 leading-tight">{liveCounts.late}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    {/* LEFT COLUMN: LIVE FEED (8/12) */}
                                    <div className="lg:col-span-8 flex flex-col gap-6">
                                        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <CardTitle className="text-base font-bold">Live Activity Feed</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 border border-emerald-100 dark:border-emerald-800">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Real-Time Updates</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Program</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Time In</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                            {paginatedLiveRows.length ? (
                                                                paginatedLiveRows.map((row, index) => (
                                                                    <tr 
                                                                        key={row.id} 
                                                                        className={`group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                                            index === 0 && monitoringEnabled ? 'bg-blue-50/30 dark:bg-blue-900/10 animate-pulse' : ''
                                                                        }`}
                                                                    >
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                                                                    {row.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name || 'Unknown Student'}</div>
                                                                                    <div className="text-[11px] font-medium text-slate-500">{row.student_id || '---'}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.program || '---'}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                                                                row.status?.toLowerCase() === 'late'
                                                                                    ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                                                                    : row.status?.toLowerCase() === 'present'
                                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                                                        : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                                            }`}>
                                                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                                                    row.status?.toLowerCase() === 'late' ? 'bg-amber-500' : row.status?.toLowerCase() === 'present' ? 'bg-emerald-500' : 'bg-slate-400'
                                                                                }`} />
                                                                                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '---'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.time || '---'}</div>
                                                                            <div className="text-[10px] font-medium text-slate-400">Just now</div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={4} className="px-6 py-20 text-center">
                                                                        <div className="flex flex-col items-center gap-3">
                                                                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                                                                                <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">No scans detected yet</p>
                                                                                <p className="mt-1 text-xs text-slate-500">Activity will appear here as students scan their IDs.</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* MODERN PAGINATION */}
                                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                            Showing {liveStartIndex}-{liveEndIndex} <span className="mx-1 text-slate-300">/</span> {liveRows.length} Total
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 rounded-lg px-2 text-xs font-bold"
                                                                onClick={() => setLiveCurrentPage(p => Math.max(1, p - 1))}
                                                                disabled={liveCurrentPage <= 1}
                                                            >
                                                                Prev
                                                            </Button>
                                                            <div className="flex h-8 items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-xs font-bold">
                                                                {liveCurrentPage} <span className="mx-1 text-slate-400">of</span> {liveTotalPages}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 rounded-lg px-2 text-xs font-bold"
                                                                onClick={() => setLiveCurrentPage(p => Math.min(liveTotalPages, p + 1))}
                                                                disabled={liveCurrentPage >= liveTotalPages}
                                                            >
                                                                Next
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* RIGHT COLUMN: ATTENDANCE OVERVIEW (4/12) */}
                                    <div className="lg:col-span-4 flex flex-col gap-5">
                                        {/* ATTENDANCE RATE DONUT (Heuristic #2: Real-world metaphor) */}
                                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50">
                                            <CardContent className="p-5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Attendance Rate</p>
                                                <div className="flex items-center justify-center">
                                                    {(() => {
                                                        const rate = liveCounts.total > 0 ? Math.round((liveCounts.present / liveCounts.total) * 100) : 0;
                                                        const circumference = 2 * Math.PI * 54;
                                                        const presentArc = liveCounts.total > 0 ? (liveCounts.present / liveCounts.total) * circumference : 0;
                                                        const lateArc = liveCounts.total > 0 ? (liveCounts.late / liveCounts.total) * circumference : 0;
                                                        return (
                                                            <div className="relative">
                                                                <svg width="140" height="140" viewBox="0 0 140 140">
                                                                    {/* Background ring */}
                                                                    <circle cx="70" cy="70" r="54" fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-slate-800" />
                                                                    {/* Present arc (emerald) */}
                                                                    <circle
                                                                        cx="70" cy="70" r="54" fill="none" strokeWidth="12"
                                                                        stroke="#10b981" strokeLinecap="round"
                                                                        strokeDasharray={`${presentArc} ${circumference}`}
                                                                        transform="rotate(-90 70 70)"
                                                                        className="transition-all duration-1000"
                                                                    />
                                                                    {/* Late arc (amber) */}
                                                                    <circle
                                                                        cx="70" cy="70" r="54" fill="none" strokeWidth="12"
                                                                        stroke="#f59e0b" strokeLinecap="round"
                                                                        strokeDasharray={`${lateArc} ${circumference}`}
                                                                        strokeDashoffset={`${-presentArc}`}
                                                                        transform="rotate(-90 70 70)"
                                                                        className="transition-all duration-1000"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{rate}%</span>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">On Time</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="mt-4 flex items-center justify-center gap-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">On Time ({liveCounts.present})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Late ({liveCounts.late})</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* PROGRAM BREAKDOWN */}
                                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50 flex-1">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent px-5 py-3.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <CardTitle className="text-sm font-bold">By Program</CardTitle>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{byCourse.length} Programs</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="max-h-[320px] overflow-y-auto">
                                                    {byCourse.length > 0 ? (
                                                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                                            {[...byCourse].sort((a, b) => b.percentage - a.percentage).map((c) => (
                                                                <div 
                                                                    key={c.program} 
                                                                    className="group flex flex-col gap-2 px-5 py-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer"
                                                                    onClick={() => handleViewStudentsByCourse(String(c.program))}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                                                            <div className={cn(
                                                                                "h-2 w-2 rounded-full shrink-0",
                                                                                c.percentage >= 90 ? 'bg-emerald-500' : c.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                                            )} />
                                                                            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">{c.program}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                            <span className="text-xs font-black text-slate-900 dark:text-white">{c.scanned}</span>
                                                                            <span className="text-[10px] text-slate-400">/</span>
                                                                            <span className="text-[10px] text-slate-400">{c.expected}</span>
                                                                            <span className={cn(
                                                                                "ml-1.5 text-[10px] font-black",
                                                                                c.percentage >= 90 ? 'text-emerald-600 dark:text-emerald-400' : c.percentage >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                                                                            )}>{c.percentage}%</span>
                                                                            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                        <div 
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-1000",
                                                                                c.percentage >= 90 ? 'bg-emerald-500' : c.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                                            )}
                                                                            style={{ width: `${Math.min(c.percentage, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3 py-12">
                                                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
                                                                <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">No program data</p>
                                                                <p className="mt-0.5 text-xs text-slate-500">Data will appear as students check in.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-slate-800 p-3">
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full h-9 rounded-xl text-xs font-bold gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                        onClick={() => monitorEventId && handleViewStudentsByCourse(byCourse[0]?.program || '')}
                                                        disabled={byCourse.length === 0}
                                                    >
                                                        <Users className="h-3.5 w-3.5" />
                                                        View All Students
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                                </>
                            )}

                            {monitoringTab === 'scanner' && (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 w-full">
                                    <div className="lg:col-span-8 flex flex-col gap-6">
                                        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm rounded-2xl">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                                            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <CardTitle className="text-base font-bold">Live Camera</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                                            {scanState.status === 'running' ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase tracking-wider animate-pulse">Running</Badge>
                                                            ) : scanState.status === 'starting' ? (
                                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[10px] uppercase tracking-wider">Starting...</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-slate-400 border-slate-200 font-black text-[10px] uppercase tracking-wider">Idle</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                className="h-10 gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all duration-300 active:scale-95"
                                                                onClick={startScanner}
                                                                disabled={scanState.status === 'starting' || scanState.status === 'running'}
                                                            >
                                                                <QrCode className="h-4 w-4" />
                                                                Start Scanner
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                                                                onClick={stopScanner}
                                                            >
                                                                Stop
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0 relative aspect-video w-full bg-slate-900 overflow-hidden">
                                                <video
                                                    ref={videoRef}
                                                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                                                    playsInline
                                                    muted
                                                />
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute inset-0 border-[40px] border-black/40" />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
                                                        <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl animate-pulse" />
                                                        <div className="absolute -left-1 -top-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                                                        <div className="absolute -right-1 -top-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                                                        <div className="absolute -left-1 -bottom-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                                                        <div className="absolute -right-1 -bottom-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                                                        {scanState.status === 'running' && (
                                                            <div className="absolute left-0 top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-scan-line" />
                                                        )}
                                                    </div>
                                                </div>

                                                {scanState.status !== 'running' && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all duration-500">
                                                        <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center text-white/50 mb-4 border border-white/10">
                                                            <Camera className="h-8 w-8" />
                                                        </div>
                                                        <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Camera Standby</p>
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                                    {lastScanned ? (
                                                        <div className={cn(
                                                            "flex items-center justify-center gap-3 rounded-2xl px-6 py-4 backdrop-blur-xl border transition-all duration-500",
                                                            lastScanned.status === 'valid' 
                                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" 
                                                                : "bg-rose-500/20 border-rose-500/30 text-rose-100"
                                                        )}>
                                                            {lastScanned.status === 'valid' ? (
                                                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                                            ) : (
                                                                <AlertCircle className="h-6 w-6 text-rose-400" />
                                                            )}
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                                                                    {lastScanned.status === 'valid' ? 'Success' : 'Scan Failed'}
                                                                </span>
                                                                <span className="text-sm font-bold truncate max-w-[200px]">
                                                                    {lastScanned.message}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-3 rounded-2xl px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white/60">
                                                            <Info className="h-5 w-5" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">Ready to scan student QR codes</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Scanner Recent Activity Feed */}
                                        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                                                <CardTitle className="text-base font-bold">Recent Scanner Check-ins</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Program</th>
                                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                            {paginatedLiveRows.length ? (
                                                                paginatedLiveRows.map((row) => (
                                                                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                                        <td className="px-6 py-4">
                                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name}</div>
                                                                            <div className="text-[11px] text-slate-500">{row.student_id}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{row.program}</td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Present'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{row.time}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No scanner scans recorded yet</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-4 flex flex-col gap-6">
                                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm rounded-2xl p-5">
                                            <h3 className="text-sm font-bold mb-4">Scanner Statistics</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Valid Scans</span>
                                                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">{scannerCounts.valid}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Invalid Scans</span>
                                                    <span className="text-xl font-black text-rose-800 dark:text-rose-200">{scannerCounts.invalid}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Total Scans</span>
                                                    <span className="text-xl font-black text-blue-800 dark:text-blue-200">{scannerCounts.total}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {monitoringTab === 'dynamic-qr' && (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 w-full">
                                    <div className="lg:col-span-8 flex flex-col gap-6">
                                        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm rounded-2xl">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-row items-center justify-between">
                                                <CardTitle className="text-base font-bold">Dynamic Rotation QR Code</CardTitle>
                                                <div>
                                                    {scannerPortalActive ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                            <Wifi className="h-3.5 w-3.5 text-emerald-500" /> Session Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <WifiOff className="h-3.5 w-3.5 text-rose-500" /> Session Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex flex-col items-center justify-center p-8 gap-6">
                                                {qrError ? (
                                                    <div className="flex flex-col items-center gap-3 text-center">
                                                        <WifiOff className="h-12 w-12 text-rose-500" />
                                                        <p className="text-sm font-medium text-rose-600">{qrError}</p>
                                                        <div className="flex gap-2.5">
                                                            <Button 
                                                                onClick={handleActivatePortalAndStartMonitoring} 
                                                                className="h-9 bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md shadow-blue-500/10 rounded-xl"
                                                            >
                                                                Activate Portal & Live Feed
                                                            </Button>
                                                            <Button 
                                                                onClick={fetchDynamicQrToken} 
                                                                variant="outline" 
                                                                className="h-9 rounded-xl font-bold border-slate-200"
                                                            >
                                                                Retry
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="relative">
                                                            <svg
                                                                className="absolute -rotate-90"
                                                                width="340"
                                                                height="340"
                                                                viewBox="0 0 340 340"
                                                                style={{ top: -10, left: -10 }}
                                                            >
                                                                <circle
                                                                    cx="170" cy="170" r="162"
                                                                    fill="none"
                                                                    stroke="rgba(148,163,184,0.15)"
                                                                    strokeWidth="4"
                                                                />
                                                                <circle
                                                                    cx="170" cy="170" r="162"
                                                                    fill="none"
                                                                    stroke={remaining <= 5 ? '#f87171' : '#3b82f6'}
                                                                    strokeWidth="4"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={`${2 * Math.PI * 162 * (remaining / 30)} ${2 * Math.PI * 162}`}
                                                                    className="transition-all duration-300"
                                                                />
                                                            </svg>
                                                            <div className={`overflow-hidden rounded-2xl bg-white p-3 shadow-md border ${qrLoading ? 'opacity-40' : 'opacity-100'}`}>
                                                                <canvas ref={qrCanvasRef} width={320} height={320} style={{ width: 320, height: 320 }} />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className={`flex items-center gap-2 text-sm font-bold ${remaining <= 5 ? 'text-rose-500' : 'text-slate-500'}`}>
                                                            <Clock className="h-4 w-4" />
                                                            {remaining > 0 ? `Refreshing in ${remaining}s` : 'Refreshing...'}
                                                        </div>

                                                        {token && (
                                                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 px-4 py-2 font-mono text-xs text-slate-500">
                                                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Active Token: {token}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="lg:col-span-4 flex flex-col gap-6">
                                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm rounded-2xl p-5">
                                            <h3 className="text-sm font-bold mb-4">Self Check-in Live Counts</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                    <span className="text-xs font-bold text-slate-500">Checked In</span>
                                                    <span className="text-xl font-black">{liveCounts.total}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                                                    <span className="text-xs font-bold text-emerald-700">Present</span>
                                                    <span className="text-xl font-black text-emerald-700">{liveCounts.present}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                                                    <span className="text-xs font-bold text-amber-700">Late</span>
                                                    <span className="text-xl font-black text-amber-700">{liveCounts.late}</span>
                                                </div>
                                            </div>
                                        </Card>
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20 p-5">
                                            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2">Instructions</h4>
                                            <ol className="space-y-1.5 text-xs text-blue-600/90 dark:text-blue-300/80 list-decimal pl-4">
                                                <li>Display this rotating QR code on a projector/screen.</li>
                                                <li>Students open their DSAMS mobile application.</li>
                                                <li>Tap "Scan Attendance QR" and scan this QR code.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <AttendanceHeader />

                            <AttendanceStatsCards
                                totalEvents={totalEvents}
                                totalAttendees={totalAttendees}
                                avgAttendanceRate={avgAttendanceRate}
                                totalLate={totalLate}
                            />


                            <AttendanceTable
                                attendanceEvents={filteredEvents}
                                dateRange={dateRange}
                                setDateRange={setDateRange}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                                onViewStudents={handleViewAttendees}
                                onOpenRealTimeMonitoring={handleOpenRealTimeMonitoringForEvent}
                                realTimeMonitoringActiveEventId={showRealTimeMonitoring ? monitorEventId : undefined}
                                selectedEventId={selectedListEventId || null}
                                onSelectEventRow={(id) => setSelectedListEventId(id ?? '')}
                            />
                        </>
                    )}

                    <Dialog open={showCourseStudentsModal} onOpenChange={setShowCourseStudentsModal}>
                        <DialogContent className="w-[96vw] !max-w-6xl max-h-[85vh] overflow-hidden bg-white p-0">
                            <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <DialogTitle className="text-base font-semibold text-slate-800">
                                            {selectedCourse ? `Students - ${selectedCourse}` : 'Students'}
                                        </DialogTitle>
                                        <div className="mt-1 text-sm text-slate-600">All students in this course for the selected event.</div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                            <span className="h-2 w-2 rounded-full bg-[#23509A]" />
                                            {courseStudentsRows.length.toLocaleString()} Students
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                            {courseStudentsRows.filter((r) => r.scanned).length.toLocaleString()} Scanned
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-6">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm font-semibold text-slate-700">Year Level</div>
                                    <select
                                        value={courseStudentsYearFilter}
                                        onChange={(e) => setCourseStudentsYearFilter(e.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 sm:w-[220px]"
                                    >
                                        <option value="all">All</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                {courseStudentsLoading ? (
                                    <div className="text-sm text-slate-600">Loading students...</div>
                                ) : courseStudentsError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                                        {courseStudentsError}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="px-5 py-3 font-medium">Student ID</th>
                                                        <th className="px-5 py-3 font-medium">Name</th>
                                                        <th className="px-5 py-3 font-medium">Year</th>
                                                        <th className="px-5 py-3 text-right font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {(courseStudentsYearFilter === 'all'
                                                        ? courseStudentsRows
                                                        : courseStudentsRows.filter((row) => {
                                                            const raw = String(row.year_level ?? '').toLowerCase();
                                                            return raw.includes(courseStudentsYearFilter);
                                                        })
                                                    ).length ? (
                                                        (courseStudentsYearFilter === 'all'
                                                            ? courseStudentsRows
                                                            : courseStudentsRows.filter((row) => {
                                                                const raw = String(row.year_level ?? '').toLowerCase();
                                                                return raw.includes(courseStudentsYearFilter);
                                                            })
                                                        ).map((row) => (
                                                            <tr key={row.id} className="hover:bg-slate-50">
                                                                <td className="px-5 py-3 font-semibold text-slate-800">{row.student_id || '—'}</td>
                                                                <td className="px-5 py-3 text-slate-700">{row.name || '—'}</td>
                                                                <td className="px-5 py-3 text-slate-700">{row.year_level || '—'}</td>
                                                                <td className="px-5 py-3 text-right">
                                                                    {row.scanned ? (
                                                                        <span
                                                                            className={
                                                                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ' +
                                                                                (row.status === 'late'
                                                                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200')
                                                                            }
                                                                        >
                                                                            {row.status || 'scanned'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                                                                            not scanned
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-600">
                                                                No students found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Modals */}
            <EventAttendeesModal 
                open={showAttendeesModal} 
                onOpenChange={setShowAttendeesModal} 
                eventId={viewingEventId}
                eventName={viewingEventName}
            />

            <EventEditModal 
                open={showEditModal} 
                onOpenChange={setShowEditModal} 
                event={editingEvent}
                onSaved={() => router.reload({ only: ['events'] })}
                courseOptions={formattedCourseOptions}
                yearLevelOptions={formattedYearLevelOptions}
            />

            {/* Print functionality now uses backend window.open - no client-side template needed */}
        </AdminLayout>
    );
}
