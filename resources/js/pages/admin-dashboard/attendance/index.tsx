import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    adminAttendance,
    adminAttendanceActivateScannerPortal,
    adminAttendanceDestroy,
    adminAttendanceDynamicQrToken,
    adminAttendanceLogs,
    adminAttendanceStudentsByCourse,
    adminDashboard,
} from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import AdminLayout from '../admin-layout';
import EventEditModal from '../events/EventEditModal';
import type { EventViewRecord } from '../events/EventViewModal';
import type { CourseYearOption } from '../events/mergeCourseYearOptions';
import AttendanceHeader from './AttendanceHeader';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceTable from './AttendanceTable';
import EventAttendeesModal from './EventAttendeesModal';
import RealTimeMonitoringPanel from './RealTimeMonitoringPanel';

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
        (page.events as AttendanceRow[]) && (page.events as any[]).length > 0
            ? (page.events as AttendanceRow[])
            : [],
    );

    const incomingEvents = page.events as AttendanceRow[] | undefined;
    const hasBackendEvents =
        Array.isArray(incomingEvents) && incomingEvents.length > 0;

    useEffect(() => {
        if (hasBackendEvents && incomingEvents) {
            setEvents(incomingEvents);
        }
    }, [hasBackendEvents, incomingEvents]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    /** Row selected in the event list drives KPI scope (empty = aggregate ongoing + completed in filtered list) */
    const [selectedListEventId, setSelectedListEventId] = useState<string>('');

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            const matchesStatus = !statusFilter
                ? true
                : ev.status === statusFilter;
            const q = searchQuery.trim().toLowerCase();
            const matches =
                !q ||
                (ev.event && ev.event.toLowerCase().includes(q)) ||
                (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
                (ev.location && ev.location.toLowerCase().includes(q));
            return matchesStatus && matches;
        });
    }, [events, statusFilter, searchQuery]);

    useEffect(() => {
        if (
            selectedListEventId &&
            !filteredEvents.some((e) => String(e.id) === selectedListEventId)
        ) {
            setSelectedListEventId('');
        }
    }, [filteredEvents, selectedListEventId]);

    const statsSourceEvents = useMemo(() => {
        if (selectedListEventId) {
            return filteredEvents.filter(
                (e) => String(e.id) === selectedListEventId,
            );
        }
        return filteredEvents.filter(
            (e) => e.status === 'ongoing' || e.status === 'completed',
        );
    }, [filteredEvents, selectedListEventId]);

    const calculatedStats = useMemo(() => {
        const list = statsSourceEvents;
        const totalEvents = selectedListEventId
            ? list.length > 0
                ? 1
                : 0
            : filteredEvents.length;

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
                                  : (event.scannedCount ??
                                    event.presentCount ??
                                    0);
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
    const courses =
        (page.courses as any[])?.length > 0
            ? (page.courses as any[])
            : [
                  'Computer Science',
                  'Information Technology',
                  'Business Administration',
                  'Accountancy',
                  'Psychology',
                  'Engineering',
              ];

    const yearLevels =
        (page.yearLevels as any[])?.length > 0
            ? (page.yearLevels as any[])
            : ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    const totalStudents = (page.totalStudents as number) || 850;
    const studentCountsByCourseYear =
        (page.studentCountsByCourseYear as any[])?.length > 0
            ? (page.studentCountsByCourseYear as any[])
            : [
                  {
                      course: 'Computer Science',
                      year_level: '1st Year',
                      count: 45,
                  },
                  {
                      course: 'Computer Science',
                      year_level: '2nd Year',
                      count: 38,
                  },
                  {
                      course: 'Information Technology',
                      year_level: '1st Year',
                      count: 52,
                  },
                  {
                      course: 'Business Administration',
                      year_level: '3rd Year',
                      count: 41,
                  },
                  { course: 'Accountancy', year_level: '4th Year', count: 35 },
                  { course: 'Psychology', year_level: '2nd Year', count: 48 },
                  { course: 'Engineering', year_level: '3rd Year', count: 29 },
              ];

    // Real-time monitoring state
    const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
    const [monitoringEnabled, setMonitoringEnabled] = useState(true);
    const [scannerPortalActive, setScannerPortalActive] = useState(true);
    const [monitorEventId, setMonitorEventId] = useState<string>('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>(
        'entry',
    );
    const [timeInStart, setTimeInStart] = useState('08:00');
    const [timeInEnd, setTimeInEnd] = useState('09:00');
    const [timeOutStart, setTimeOutStart] = useState('11:00');
    const [timeOutEnd, setTimeOutEnd] = useState('12:00');

    // Segmented tab state inside Command Center
    const [monitoringTab, setMonitoringTab] = useState<
        'dashboard' | 'scanner' | 'dynamic-qr'
    >('dashboard');

    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
    });

    // Sample by course data for testing
    const sampleByCourse: ByCourseRow[] = [
        {
            program: 'Computer Science',
            expected: 45,
            scanned: 38,
            percentage: 84,
        },
        {
            program: 'Information Technology',
            expected: 52,
            scanned: 47,
            percentage: 90,
        },
        {
            program: 'Business Administration',
            expected: 41,
            scanned: 35,
            percentage: 85,
        },
        { program: 'Accountancy', expected: 35, scanned: 32, percentage: 91 },
        { program: 'Psychology', expected: 48, scanned: 42, percentage: 88 },
        { program: 'Engineering', expected: 29, scanned: 25, percentage: 86 },
    ];

    const [byCourse, setByCourse] = useState<ByCourseRow[]>(sampleByCourse);

    const [liveStartIndex, setLiveStartIndex] = useState(1);
    const [liveEndIndex, setLiveEndIndex] = useState(0);

    // --- QR Scanner state ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);
    const [scanState, setScanState] = useState<{
        status: 'idle' | 'starting' | 'running' | 'error';
        message?: string;
    }>({
        status: 'idle',
    });
    const [lastScanned, setLastScanned] = useState<{
        status: 'valid' | 'invalid';
        message: string;
    } | null>(null);
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
    const zxingRef = useRef<{
        reader: BrowserQRCodeReader;
        stop: () => void;
    } | null>(null);

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

        if (
            typeof window !== 'undefined' &&
            !window.isSecureContext &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
        ) {
            const msg =
                'Camera access requires a Secure Context (HTTPS or http://localhost). Please access this site over HTTPS or via localhost.';
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
            const msg =
                'Camera API (navigator.mediaDevices) is not supported or blocked by browser settings.';
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
                setScanState({
                    status: 'error',
                    message: 'Video element not available.',
                });
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
                const Detector = (window as any)
                    .BarcodeDetector as new (options: {
                    formats: string[];
                }) => {
                    detect: (
                        source: CanvasImageSource,
                    ) => Promise<Array<{ rawValue?: string }>>;
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
                    },
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
            const errMsg =
                err?.name === 'NotAllowedError'
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

        // Enforce Designated Time Windows (e.g., Time-In: 08:00 - 09:30, Time-Out: 11:00 - 12:30)
        const nowObj = new Date();
        const currentHHMM = `${String(nowObj.getHours()).padStart(2, '0')}:${String(nowObj.getMinutes()).padStart(2, '0')}`;

        const isWithinWindow = (
            current: string,
            start: string,
            end: string,
        ) => {
            if (!start || !end) return true;
            return current >= start && current <= end;
        };

        if (attendanceMode === 'entry') {
            if (!isWithinWindow(currentHHMM, timeInStart, timeInEnd)) {
                const msg = `Time-In scanning is closed. Time-In is only allowed between ${timeInStart} and ${timeInEnd}. (Current time: ${currentHHMM})`;
                setLastScanned({ status: 'invalid', message: msg });
                Swal.fire({
                    icon: 'warning',
                    title: 'Time-In Window Closed',
                    text: msg,
                    confirmButtonColor: '#0b2d66',
                });
                return;
            }
        } else if (attendanceMode === 'exit') {
            if (!isWithinWindow(currentHHMM, timeOutStart, timeOutEnd)) {
                const msg = `Time-Out scanning is closed. Time-Out is only allowed between ${timeOutStart} and ${timeOutEnd}. (Current time: ${currentHHMM})`;
                setLastScanned({ status: 'invalid', message: msg });
                Swal.fire({
                    icon: 'warning',
                    title: 'Time-Out Window Closed',
                    text: msg,
                    confirmButtonColor: '#0b2d66',
                });
                return;
            }
        }

        const getCsrfToken = () => {
            const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            if (match) {
                return decodeURIComponent(match[1]);
            }
            return (
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || ''
            );
        };
        const csrfToken = getCsrfToken();

        try {
            const res = await fetch(
                `/admin/attendance/${monitorEventId}/scan`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-XSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        value: code,
                        scan_type: attendanceMode,
                        mode: attendanceMode,
                    }),
                },
            );
            const data = await res.json();
            if (res.ok) {
                setLastScanned({
                    status: 'valid',
                    message: data.message || 'Attendance recorded',
                });
                setScannerCounts((prev) => ({
                    ...prev,
                    total: prev.total + 1,
                    valid: prev.valid + 1,
                }));
                void refreshLogs();
            } else {
                setLastScanned({
                    status: 'invalid',
                    message: data.message || 'Invalid QR code',
                });
                setScannerCounts((prev) => ({
                    ...prev,
                    total: prev.total + 1,
                    invalid: prev.invalid + 1,
                }));

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
            setLastScanned({
                status: 'invalid',
                message: 'Network error occurred',
            });
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
            setQrError(
                'Activate the attendance session first (click "Activate Scanner Portal" or "Start Live Monitoring").',
            );
            return;
        }
        setQrLoading(true);
        setQrError(null);
        try {
            const res = await fetch(
                adminAttendanceDynamicQrToken(monitorEventId),
                {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'include',
                },
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    setScannerPortalActive(false);
                    setQrError(
                        'Activate the attendance session first (click "Activate Scanner Portal" or "Start Live Monitoring").',
                    );
                } else {
                    setQrError(
                        (body as any)?.message ??
                            'Failed to generate QR token.',
                    );
                }
                setQrLoading(false);
                return;
            }
            const data: { payload: string; expires_at: string } =
                await res.json();
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
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
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
        if (monitoringTab !== 'dynamic-qr' || !showRealTimeMonitoring)
            return undefined;

        const countdownId = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(
                0,
                Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
            );
            setRemaining(diff);
        }, 250);

        return () => clearInterval(countdownId);
    }, [expiresAt, monitoringTab, showRealTimeMonitoring]);

    // Token rotating loop and live count loop for dynamic QR code
    useEffect(() => {
        if (
            monitoringTab !== 'dynamic-qr' ||
            !showRealTimeMonitoring ||
            !monitorEventId
        )
            return undefined;

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
    }, [
        monitoringTab,
        showRealTimeMonitoring,
        monitorEventId,
        fetchDynamicQrToken,
        fetchLiveCounts,
    ]);

    // Clean up camera scanner on tab change or monitoring toggle
    useEffect(() => {
        if (monitoringTab !== 'scanner' || !showRealTimeMonitoring) {
            stopScanner();
        }
        return () => stopScanner();
    }, [monitoringTab, showRealTimeMonitoring]);

    const handleOpenRealTimeMonitoringForEvent = (
        eventId: string,
        initialTab: 'dashboard' | 'scanner' | 'dynamic-qr' = 'dashboard',
    ) => {
        const id = String(eventId);
        const ev = events.find((e) => String(e.id) === id);
        const type = ev?.attendance_type || 'qr_scanner';

        let tab = initialTab;
        if (type === 'dynamic_qr' && tab === 'scanner') {
            tab = 'dynamic-qr';
        } else if (type === 'qr_scanner' && tab === 'dynamic-qr') {
            tab = 'scanner';
        }

        setMonitorEventId(id);
        setShowRealTimeMonitoring(true);
        setMonitoringEnabled(true);
        setScannerPortalActive(ev ? !!ev.scannerPortalActive : true);
        setLastUpdatedAt(null);
        setLiveCurrentPage(1);
        setMonitoringTab(tab);

        if (!hasBackendEvents) {
            setLiveRows(sampleLiveLogs);
            const present = sampleLiveLogs.filter(
                (r) => r.status?.toLowerCase() === 'present',
            ).length;
            const late = sampleLiveLogs.filter(
                (r) => r.status?.toLowerCase() === 'late',
            ).length;
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
            Swal.fire({
                icon: 'error',
                title: 'Select event',
                text: 'Choose an active event to monitor.',
            });
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
    const [showCourseStudentsModal, setShowCourseStudentsModal] =
        useState(false);

    // Live/checked-in timestamps for the selected event

    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const [courseStudentsRows, setCourseStudentsRows] = useState<
        StudentByCourseRow[]
    >([]);
    const [courseStudentsYearFilter, setCourseStudentsYearFilter] =
        useState<string>('all');
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<
        string | null
    >(null);

    const handleViewStudentsByCourse = async (courseName: string) => {
        if (!monitorEventId) {
            Swal.fire({
                icon: 'error',
                title: 'Select event',
                text: 'Choose an active event to monitor.',
            });
            return;
        }

        setSelectedCourse(courseName);
        setShowCourseStudentsModal(true);
        setCourseStudentsYearFilter('all');

        setCourseStudentsLoading(true);
        setCourseStudentsError(null);

        try {
            const url =
                adminAttendanceStudentsByCourse(String(monitorEventId)) +
                `?course=${encodeURIComponent(courseName)}`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Failed to load students');
            }

            const data = (await res.json()) as {
                rows?: StudentByCourseRow[];
            };

            setCourseStudentsRows(
                Array.isArray(data.rows)
                    ? (data.rows as StudentByCourseRow[])
                    : [],
            );
        } catch (e: any) {
            setCourseStudentsRows([]);
            setCourseStudentsError(
                e?.message ? String(e.message) : 'Failed to load students',
            );
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
            status: 'Present',
        },
        {
            id: '2',
            student_id: '2024-0002',
            name: 'Maria Santos',
            program: 'Information Technology',
            checked_in_at: '2026-03-25 13:18:45',
            time: '01:18 PM',
            status: 'Present',
        },
        {
            id: '3',
            student_id: '2024-0003',
            name: 'Jose Reyes',
            program: 'Business Administration',
            checked_in_at: '2026-03-25 13:22:10',
            time: '01:22 PM',
            status: 'Late',
        },
        {
            id: '4',
            student_id: '2024-0004',
            name: 'Ana Garcia',
            program: 'Accountancy',
            checked_in_at: '2026-03-25 13:25:55',
            time: '01:25 PM',
            status: 'Present',
        },
        {
            id: '5',
            student_id: '2024-0005',
            name: 'Carlos Rodriguez',
            program: 'Psychology',
            checked_in_at: '2026-03-25 13:28:20',
            time: '01:28 PM',
            status: 'Present',
        },
        {
            id: '6',
            student_id: '2024-0006',
            name: 'Sofia Martinez',
            program: 'Engineering',
            checked_in_at: '2026-03-25 13:31:15',
            time: '01:31 PM',
            status: 'Late',
        },
    ];

    const [liveRows, setLiveRows] = useState<LiveLogRow[]>(sampleLiveLogs);
    const [livePageSize, setLivePageSize] = useState(10);
    const [liveCurrentPage, setLiveCurrentPage] = useState(1);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventViewRecord | null>(
        null,
    );
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [viewingEventId, setViewingEventId] = useState<string | null>(null);
    const [viewingEventName, setViewingEventName] = useState<string>('');

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId || !hasBackendEvents) {
            return;
        }
        try {
            const res = await fetch(adminAttendanceLogs(monitorEventId), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
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
        return Math.max(
            1,
            Math.ceil(liveRows.length / Math.max(1, livePageSize)),
        );
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
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
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
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not load event details for editing.',
            });
        }
    };

    const handleViewAttendees = (eventId: string) => {
        const event = events.find((e) => String(e.id) === String(eventId));
        setViewingEventId(eventId);
        setViewingEventName(event?.event || 'Event Participants');
        setShowAttendeesModal(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        console.log('=== HANDLE DELETE CALLED ===');
        console.log('Deleting event with ID:', eventId);
        console.log('Delete URL:', adminAttendanceDestroy(eventId));
        console.log(
            'Current events:',
            events.map((e) => ({ id: e.id, event: e.event })),
        );

        if (
            !eventId ||
            eventId === 'undefined' ||
            eventId === 'null' ||
            eventId.trim() === ''
        ) {
            console.error('Event ID is missing or invalid!');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Event ID is missing or invalid. Cannot delete event.',
            });
            return;
        }

        // Additional validation: check if the event exists in the current list
        const eventExists = events.some(
            (event) => String(event.id) === eventId,
        );
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
            text: 'This event will be archived and hidden from the main list. You can restore it later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, archive it!',
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    console.log(
                        'About to make DELETE request to:',
                        adminAttendanceDestroy(eventId),
                    );
                    // Perform the delete request using POST with _method=DELETE for better compatibility
                    router.delete(adminAttendanceDestroy(eventId), {
                        onSuccess: () => {
                            setEvents(
                                events.filter(
                                    (event) =>
                                        String(event.id) !== String(eventId),
                                ),
                            );
                            setSelectedListEventId((cur) =>
                                String(cur) === String(eventId) ? '' : cur,
                            );

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
    const { totalEvents, totalAttendees, avgAttendanceRate, totalLate } =
        calculatedStats;

    // Prepare options for EventEditModal
    const formattedCourseOptions: CourseYearOption[] = useMemo(
        () => courses.map((c) => ({ id: c, name: c, code: c })),
        [courses],
    );

    const formattedYearLevelOptions: CourseYearOption[] = useMemo(
        () => yearLevels.map((y) => ({ id: y, name: y, code: y })),
        [yearLevels],
    );

    const monitoredEvent = events.find((e) => String(e.id) === monitorEventId);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />
            <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-6">
                    {showRealTimeMonitoring ? (
                        <RealTimeMonitoringPanel
                            monitoredEvent={monitoredEvent}
                            onBack={() => {
                                setShowRealTimeMonitoring(false);
                                setMonitoringEnabled(false);
                            }}
                            hasBackendEvents={hasBackendEvents}
                            handleViewStudentsByCourse={
                                handleViewStudentsByCourse
                            }
                            setEvents={setEvents}
                        />
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
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                                onViewStudents={handleViewAttendees}
                                onOpenRealTimeMonitoring={
                                    handleOpenRealTimeMonitoringForEvent
                                }
                                realTimeMonitoringActiveEventId={
                                    showRealTimeMonitoring
                                        ? monitorEventId
                                        : undefined
                                }
                                selectedEventId={selectedListEventId || null}
                                onSelectEventRow={(id) =>
                                    setSelectedListEventId(id ?? '')
                                }
                            />
                        </>
                    )}

                    <Dialog
                        open={showCourseStudentsModal}
                        onOpenChange={setShowCourseStudentsModal}
                    >
                        <DialogContent className="max-h-[85vh] w-[96vw] !max-w-6xl overflow-hidden bg-white p-0">
                            <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <DialogTitle className="text-base font-semibold text-slate-800">
                                            {selectedCourse
                                                ? `Students - ${selectedCourse}`
                                                : 'Students'}
                                        </DialogTitle>
                                        <div className="mt-1 text-sm text-slate-600">
                                            All students in this course for the
                                            selected event.
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                            <span className="h-2 w-2 rounded-full bg-[#23509A]" />
                                            {courseStudentsRows.length.toLocaleString()}{' '}
                                            Students
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                            {courseStudentsRows
                                                .filter((r) => r.scanned)
                                                .length.toLocaleString()}{' '}
                                            Scanned
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-6">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm font-semibold text-slate-700">
                                        Year Level
                                    </div>
                                    <select
                                        value={courseStudentsYearFilter}
                                        onChange={(e) =>
                                            setCourseStudentsYearFilter(
                                                e.target.value,
                                            )
                                        }
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
                                    <div className="text-sm text-slate-600">
                                        Loading students...
                                    </div>
                                ) : courseStudentsError ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                                        {courseStudentsError}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-max text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="px-5 py-3 font-medium">
                                                            Student ID
                                                        </th>
                                                        <th className="px-5 py-3 font-medium">
                                                            Name
                                                        </th>
                                                        <th className="px-5 py-3 font-medium">
                                                            Year
                                                        </th>
                                                        <th className="px-5 py-3 text-right font-medium">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {(courseStudentsYearFilter ===
                                                    'all'
                                                        ? courseStudentsRows
                                                        : courseStudentsRows.filter(
                                                              (row) => {
                                                                  const raw =
                                                                      String(
                                                                          row.year_level ??
                                                                              '',
                                                                      ).toLowerCase();
                                                                  return raw.includes(
                                                                      courseStudentsYearFilter,
                                                                  );
                                                              },
                                                          )
                                                    ).length ? (
                                                        (courseStudentsYearFilter ===
                                                        'all'
                                                            ? courseStudentsRows
                                                            : courseStudentsRows.filter(
                                                                  (row) => {
                                                                      const raw =
                                                                          String(
                                                                              row.year_level ??
                                                                                  '',
                                                                          ).toLowerCase();
                                                                      return raw.includes(
                                                                          courseStudentsYearFilter,
                                                                      );
                                                                  },
                                                              )
                                                        ).map((row) => (
                                                            <tr
                                                                key={row.id}
                                                                className="hover:bg-slate-50"
                                                            >
                                                                <td className="px-5 py-3 font-semibold text-slate-800">
                                                                    {row.student_id ||
                                                                        '—'}
                                                                </td>
                                                                <td className="px-5 py-3 text-slate-700">
                                                                    {row.name ||
                                                                        '—'}
                                                                </td>
                                                                <td className="px-5 py-3 text-slate-700">
                                                                    {row.year_level ||
                                                                        '—'}
                                                                </td>
                                                                <td className="px-5 py-3 text-right">
                                                                    {row.scanned ? (
                                                                        <span
                                                                            className={
                                                                                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ' +
                                                                                (row.status ===
                                                                                'late'
                                                                                    ? 'border-amber-200 bg-amber-100 text-amber-800'
                                                                                    : 'border-emerald-200 bg-emerald-100 text-emerald-800')
                                                                            }
                                                                        >
                                                                            {row.status ||
                                                                                'scanned'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                                            not
                                                                            scanned
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="px-5 py-6 text-center text-sm text-slate-600"
                                                            >
                                                                No students
                                                                found.
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
