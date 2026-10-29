import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatLastNameFirst } from '@/lib/utils';
import {
    adminAttendanceActivateScannerPortal,
    adminAttendanceDynamicQrToken,
    adminAttendanceLogs,
    programHeadAttendanceActivateScannerPortal,
    programHeadAttendanceDynamicQrToken,
    programHeadAttendanceLogs,
} from '@/routes';
import { router } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import axios from 'axios';
import { getSocketInstance, joinEventRoom, leaveEventRoom } from '@/services/socket';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Camera,
    CheckCircle2,
    ChevronRight,
    Clock,
    Compass,
    Info,
    LogIn,
    LogOut,
    MapPin,
    Pause,
    Play,
    QrCode,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Users,
    Wifi,
    WifiOff,
    Zap,
} from 'lucide-react';
import QRCode from 'qrcode';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Swal from 'sweetalert2';
import {
    playScanSuccessSound,
    playScanErrorSound,
    playScanLateSound,
} from '@/services/notification-sound';

interface LiveLogRow {
    id: string;
    attendance_id?: number | null;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    checked_out_at?: string | null;
    mid_session_verified_at?: string | null;
    time: string;
    time_out?: string | null;
    mid_session_time?: string | null;
    status: string;
    is_flagged?: boolean;
    flagged_reason?: string | null;
    check_in_distance_m?: number | null;
    check_out_distance_m?: number | null;
}

interface ByCourseRow {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
}

interface RealTimeMonitoringPanelProps {
    monitoredEvent: any;
    onBack: () => void;
    hasBackendEvents: boolean;
    handleViewStudentsByCourse: (course: string) => void;
    setEvents: React.Dispatch<React.SetStateAction<any[]>>;
    userRole?: 'admin' | 'program_head';
}

export default function RealTimeMonitoringPanel({
    monitoredEvent,
    onBack,
    hasBackendEvents,
    handleViewStudentsByCourse,
    setEvents,
    userRole = 'admin',
}: RealTimeMonitoringPanelProps) {
    const monitorEventId = monitoredEvent ? String(monitoredEvent.id) : '';
    const isProgramHead = userRole === 'program_head';
    const isUpcoming =
        monitoredEvent?.status === 'upcoming' ||
        monitoredEvent?.computed_status === 'upcoming';

    const logsUrl = isProgramHead
        ? programHeadAttendanceLogs(monitorEventId)
        : adminAttendanceLogs(monitorEventId);
    const scanUrl = isProgramHead
        ? `/program-head/attendance/${monitorEventId}/scan`
        : `/admin/attendance/${monitorEventId}/scan`;
    const activateScannerPortalUrl = isProgramHead
        ? programHeadAttendanceActivateScannerPortal(monitorEventId)
        : adminAttendanceActivateScannerPortal(monitorEventId);
    const dynamicQrTokenUrl = isProgramHead
        ? programHeadAttendanceDynamicQrToken(monitorEventId)
        : adminAttendanceDynamicQrToken(monitorEventId);

    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>(
        'entry',
    );
    const [monitoringTab, setMonitoringTab] = useState<
        'dashboard' | 'scanner' | 'dynamic-qr'
    >('dashboard');
    const [monitoringEnabled, setMonitoringEnabled] = useState(!isUpcoming);
    const [scannerPortalActive, setScannerPortalActive] = useState(!isUpcoming);
    const [feedFilter, setFeedFilter] = useState<'checked_in' | 'all'>('checked_in');

    const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
    const [liveRows, setLiveRows] = useState<LiveLogRow[]>([]);
    const [byCourse, setByCourse] = useState<ByCourseRow[]>([]);
    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
        flagged: 0,
    });
    const [liveCurrentPage, setLiveCurrentPage] = useState(1);
    const liveItemsPerPage = 5;

    const [timeInStart, setTimeInStart] = useState('08:00');
    const [timeInEnd, setTimeInEnd] = useState('09:00');
    const [timeOutStart, setTimeOutStart] = useState('10:30');
    const [timeOutEnd, setTimeOutEnd] = useState('12:00');

    // Camera scanner references
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{
        reader: BrowserQRCodeReader;
        stop: () => void;
    } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);
    const autoActivatedEventsRef = useRef<Record<string, boolean>>({});

    const [scanState, setScanState] = useState<{
        status: 'idle' | 'starting' | 'running' | 'error';
        errorMsg?: string;
    }>({ status: 'idle' });
    const [lastScanned, setLastScanned] = useState<{
        status: 'valid' | 'invalid';
        message: string;
    } | null>(null);
    const [scannerCounts, setScannerCounts] = useState({
        valid: 0,
        invalid: 0,
        total: 0,
    });

    // Dynamic QR state
    const [token, setToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [remaining, setRemaining] = useState<number>(30);
    const [qrLoading, setQrLoading] = useState<boolean>(true);
    const [qrError, setQrError] = useState<string | null>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    const barcodeDetectorSupported = useMemo(() => {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }, []);

    // Set designated time windows from event times
    useEffect(() => {
        if (monitoredEvent) {
            if (monitoredEvent.event_time) {
                setTimeInStart(monitoredEvent.event_time.substring(0, 5));
                const [h, m] = monitoredEvent.event_time.split(':').map(Number);
                // Cut-off for IN is 1 hour after start
                const endMinutes = h * 60 + m + 60;
                const endH = Math.floor(endMinutes / 60) % 24;
                const endM = endMinutes % 60;
                setTimeInEnd(
                    `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                );
            }
            const endTimeSource =
                monitoredEvent.registration_end_time ||
                monitoredEvent.registrationEndTime;
            if (endTimeSource) {
                const [h, m] = endTimeSource.split(':').map(Number);
                // Start for OUT is 30 minutes before end time
                const startOutMinutes = Math.max(0, h * 60 + m - 30);
                const startOutH = Math.floor(startOutMinutes / 60) % 24;
                const startOutM = startOutMinutes % 60;
                setTimeOutStart(
                    `${String(startOutH).padStart(2, '0')}:${String(startOutM).padStart(2, '0')}`,
                );
                // Out window extends up to 60 minutes after end time
                const endMinutes = h * 60 + m + 60;
                const endH = Math.floor(endMinutes / 60) % 24;
                const endM = endMinutes % 60;
                setTimeOutEnd(
                    `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                );
            }
        }
    }, [monitoredEvent]);

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId || !hasBackendEvents) {
            return;
        }
        try {
            const res = await fetch(logsUrl, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) return;

            const data = (await res.json()) as {
                rows?: Array<Record<string, unknown>>;
                counts?: { total?: number; present?: number; late?: number; flagged?: number; incomplete?: number };
                byCourse?: ByCourseRow[];
                server_time?: string;
                scanner_portal_active?: boolean;
            };

            const rows: LiveLogRow[] = (data.rows ?? []).map((r, idx) => ({
                id: String(r.id ?? idx),
                attendance_id: r.attendance_id ? Number(r.attendance_id) : null,
                student_id: String(r.student_id ?? ''),
                name: String(r.name ?? ''),
                program: String(r.program ?? ''),
                checked_in_at: String(r.checked_in_at ?? ''),
                checked_out_at: r.checked_out_at ? String(r.checked_out_at) : null,
                mid_session_verified_at: r.mid_session_verified_at ? String(r.mid_session_verified_at) : null,
                time: String(r.time ?? ''),
                time_out: r.time_out ? String(r.time_out) : null,
                mid_session_time: r.mid_session_time ? String(r.mid_session_time) : null,
                status: String(r.status ?? '').toLowerCase(),
                is_flagged: Boolean(r.is_flagged),
                flagged_reason: r.flagged_reason ? String(r.flagged_reason) : null,
                check_in_distance_m: typeof r.check_in_distance_m === 'number' ? r.check_in_distance_m : null,
                check_out_distance_m: typeof r.check_out_distance_m === 'number' ? r.check_out_distance_m : null,
            }));

            setLiveRows(rows);
            const isEventUpcoming =
                monitoredEvent?.status === 'upcoming' || monitoredEvent?.computed_status === 'upcoming';
            const totalScans = isEventUpcoming
                ? 0
                : Number(data.counts?.total ?? rows.filter((x) => x.status !== 'absent').length);
            const presentN = isEventUpcoming ? 0 : Number(data.counts?.present ?? 0);
            const lateN = isEventUpcoming ? 0 : Number(data.counts?.late ?? 0);
            const flaggedN = isEventUpcoming
                ? 0
                : Number(data.counts?.flagged ?? rows.filter((x) => x.is_flagged).length);
            setLiveCounts({
                total: totalScans,
                present: presentN,
                late: lateN,
                flagged: flaggedN,
            });
            if (Array.isArray(data.byCourse)) {
                setByCourse(data.byCourse as ByCourseRow[]);
            }
            setLastUpdatedAt(data.server_time ?? new Date().toLocaleString());
            setScannerPortalActive(isEventUpcoming ? false : Boolean(data.scanner_portal_active));

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
        } catch (err) {
            console.error('Error refreshing active attendance logs:', err);
        }
    }, [monitorEventId, hasBackendEvents, setEvents, monitoredEvent]);

    const handleClearFlag = async (attendanceId: number, studentName: string) => {
        const result = await Swal.fire({
            title: 'Verify Physical Presence?',
            text: `Are you sure you want to verify presence and clear the dwell gap flag for ${studentName}? This will restore eligibility for their certificate.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Verify & Clear Flag',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const endpoint = isProgramHead
                    ? `/program-head/attendance/${attendanceId}/clear-flag`
                    : `/admin/attendance/${attendanceId}/clear-flag`;

                const res = await axios.post(endpoint);
                if (res.data?.success) {
                    await Swal.fire({
                        title: 'Presence Verified!',
                        text: res.data.message || 'Flag cleared and certificate eligibility restored.',
                        icon: 'success',
                        timer: 2200,
                        showConfirmButton: false,
                    });
                    void refreshLogs();
                } else {
                    await Swal.fire('Error', res.data?.message || 'Failed to clear flag.', 'error');
                }
            } catch (err: any) {
                console.error('Error clearing flag:', err);
                await Swal.fire('Error', err.response?.data?.message || 'Failed to clear flag.', 'error');
            }
        }
    };

    // Real-time attendance WebSocket event listener & backed-off adaptive polling
    useEffect(() => {
        if (!monitoringEnabled || !monitorEventId) return;

        joinEventRoom(monitorEventId);

        const socket = getSocketInstance();
        const handleScanEvent = (payload: any) => {
            if (!payload || String(payload.event_id) !== String(monitorEventId)) return;

            setLastUpdatedAt(payload.time || new Date().toLocaleTimeString());

            // Prepend or update liveRows in place
            if (payload.log) {
                setLiveRows((prev) => {
                    const exists = prev.some(
                        (r) =>
                            String(r.id) === String(payload.log.id) ||
                            (r.student_id && r.student_id === payload.log.student_id),
                    );
                    if (exists) {
                        return prev.map((r) =>
                            String(r.id) === String(payload.log.id) ||
                            (r.student_id && r.student_id === payload.log.student_id)
                                ? { ...r, ...payload.log }
                                : r,
                        );
                    }
                    return [payload.log, ...prev];
                });
            }

            // Real-time optimistic update of liveCounts
            setLiveCounts((prev) => {
                const isLate = payload.status === 'late';
                const isPresent =
                    payload.status === 'present' || payload.status === 'completed';
                const isFlagged = Boolean(payload.is_flagged);

                return {
                    ...prev,
                    total: prev.total + 1,
                    present: isPresent ? prev.present + 1 : prev.present,
                    late: isLate ? prev.late + 1 : prev.late,
                    flagged: isFlagged ? prev.flagged + 1 : prev.flagged,
                };
            });

            // Update parent event count in parent dashboard
            setEvents((prev) =>
                prev.map((ev) =>
                    String(ev.id) === String(monitorEventId)
                        ? {
                              ...ev,
                              scannedCount: (ev.scannedCount || 0) + 1,
                              presentCount:
                                  payload.status === 'present'
                                      ? (ev.presentCount || 0) + 1
                                      : ev.presentCount,
                              lateCount:
                                  payload.status === 'late'
                                      ? (ev.lateCount || 0) + 1
                                      : ev.lateCount,
                          }
                        : ev,
                ),
            );
        };

        if (socket) {
            socket.on('attendance_scanned', handleScanEvent);
        }

        // Initial fetch
        void refreshLogs();

        // Adaptive polling: 20s if socket is active, 6s if offline/reconnecting
        const pollIntervalMs = socket?.connected ? 20000 : 6000;
        const interval = setInterval(() => {
            void refreshLogs();
        }, pollIntervalMs);

        return () => {
            leaveEventRoom(monitorEventId);
            if (socket) {
                socket.off('attendance_scanned', handleScanEvent);
            }
            clearInterval(interval);
        };
    }, [monitoringEnabled, monitorEventId, refreshLogs, setEvents]);

    // Automatically start live monitoring and activate scanner portal session on load once per event
    useEffect(() => {
        if (!monitorEventId) return;
        if (isUpcoming) {
            setScannerPortalActive(false);
            setMonitoringEnabled(false);
            return;
        }
        setMonitoringEnabled(true);

        if (hasBackendEvents && !autoActivatedEventsRef.current[monitorEventId]) {
            autoActivatedEventsRef.current[monitorEventId] = true;
            axios
                .post(
                    activateScannerPortalUrl,
                    {},
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                )
                .then((res) => {
                    if (res.data?.success || res.data?.scanner_portal_active) {
                        setScannerPortalActive(true);
                    }
                })
                .catch((err) => {
                    console.warn('Auto scanner portal activation skipped:', err);
                });
        }
    }, [monitorEventId, hasBackendEvents, activateScannerPortalUrl, isUpcoming]);

    const renderQr = useCallback(async (payload: string) => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;
        try {
            await QRCode.toCanvas(canvas, payload, {
                width: 320,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            });
        } catch (err) {
            console.error('Failed to generate QR code canvas:', err);
        }
    }, []);

    const fetchDynamicQrToken = useCallback(async () => {
        if (!monitorEventId) return;
        if (!scannerPortalActive) {
            setQrError('Activate the attendance session first.');
            return;
        }
        setQrLoading(true);
        setQrError(null);
        try {
            const res = await fetch(
                dynamicQrTokenUrl,
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
                    setQrError('Activate the attendance session first.');
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
    }, [monitorEventId, renderQr, scannerPortalActive, dynamicQrTokenUrl]);

    // Live sync and token updater for dynamic QR
    useEffect(() => {
        if (monitoringTab !== 'dynamic-qr' || !monitoringEnabled)
            return undefined;
        void fetchDynamicQrToken();
        const interval = setInterval(() => {
            void fetchDynamicQrToken();
        }, 30000);
        return () => clearInterval(interval);
    }, [monitoringTab, monitoringEnabled, fetchDynamicQrToken]);

    // Countdown timer for dynamic QR code expiration
    useEffect(() => {
        if (monitoringTab !== 'dynamic-qr' || !monitoringEnabled)
            return undefined;

        const countdownId = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(
                0,
                Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
            );
            setRemaining(diff);
            if (diff <= 0) {
                void fetchDynamicQrToken();
            }
        }, 1000);

        return () => clearInterval(countdownId);
    }, [monitoringTab, monitoringEnabled, expiresAt, fetchDynamicQrToken]);

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
                activateScannerPortalUrl,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setScannerPortalActive(true);
                        setMonitoringEnabled(true);
                        void refreshLogs();
                    },
                },
            );
        } else {
            setScannerPortalActive(true);
            setMonitoringEnabled(true);
            void refreshLogs();
        }
    };

    const processScan = async (code: string) => {
        const now = Date.now();
        if (
            lastValueRef.current &&
            lastValueRef.current.value === code &&
            now - lastValueRef.current.at < 3000
        ) {
            return;
        }
        lastValueRef.current = { value: code, at: now };

        // Enforce Designated Time Windows
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
                const msg = `Time-In scanning is closed. Time-In is only allowed between ${timeInStart} and ${timeInEnd}.`;
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
            if (timeOutEnd && currentHHMM > timeOutEnd) {
                const msg = `Time-Out scanning is closed. Attendance closed at ${timeOutEnd}.`;
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
                scanUrl,
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
                if (data?.status === 'late' || (data?.message && data.message.toLowerCase().includes('late'))) {
                    playScanLateSound();
                } else {
                    playScanSuccessSound();
                }

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
                playScanErrorSound();
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
            playScanErrorSound();
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

    const startScanner = async () => {
        if (
            typeof window !== 'undefined' &&
            !window.isSecureContext &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
        ) {
            const msg =
                'Camera access requires a Secure Context (HTTPS or localhost).';
            setScanState({ status: 'error', errorMsg: msg });
            Swal.fire({
                icon: 'warning',
                title: 'HTTPS Required',
                text: msg,
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg =
                'Camera API is not supported or blocked by browser settings.';
            setScanState({ status: 'error', errorMsg: msg });
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
            stopScanner();

            const video = videoRef.current;
            if (!video) {
                setScanState({
                    status: 'error',
                    errorMsg: 'Video element not available.',
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
                    ? 'Camera access permission was denied.'
                    : err?.name === 'NotFoundError'
                      ? 'No camera device found.'
                      : err?.message || 'Failed to start camera.';

            setScanState({ status: 'error', errorMsg: errMsg });
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

        setScanState({ status: 'idle' });
    };

    // Clean up scanner on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const displayLiveRows = useMemo(() => {
        if (isUpcoming) {
            return [];
        }
        if (feedFilter === 'checked_in') {
            return liveRows.filter(
                (r) => r.status?.toLowerCase() !== 'absent' && r.time && r.time !== '—',
            );
        }
        return liveRows;
    }, [isUpcoming, feedFilter, liveRows]);

    const liveStartIndex = (liveCurrentPage - 1) * liveItemsPerPage;
    const liveEndIndex = Math.min(
        liveStartIndex + liveItemsPerPage,
        displayLiveRows.length,
    );
    const paginatedLiveRows = useMemo(() => {
        return displayLiveRows.slice(liveStartIndex, liveEndIndex);
    }, [displayLiveRows, liveStartIndex, liveEndIndex]);
    const liveTotalPages = Math.max(
        1,
        Math.ceil(displayLiveRows.length / liveItemsPerPage),
    );

    return (
        <div className="flex animate-in flex-col gap-6 duration-500 fade-in">
            {/* --- DSAMS SIGNATURE REAL-TIME MONITORING HERO BANNER --- */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 text-white shadow-xl shadow-blue-900/20">
                {/* Ambient geometric orbs */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -top-4 -right-4 h-32 w-32 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 -translate-y-1/4 rounded-full bg-blue-400/10 blur-2xl" />

                <div className="relative flex flex-col gap-5">
                    {/* TOP ROW: Back Button + Event Info + Live Status */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 shrink-0 gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
                                onClick={onBack}
                                title="Return to event list"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Events</span>
                            </Button>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white shadow-inner ring-1 ring-white/25 backdrop-blur-sm">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                                            {monitoredEvent?.event || 'Select an Event'}
                                        </h1>
                                        <p className="text-xs font-medium text-blue-200/90">
                                            Live Telemetry & Attendance Scanning Portal
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                                    {monitoredEvent?.dateTime && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                                            <Clock className="h-3 w-3 text-blue-300" />
                                            {monitoredEvent.dateTime}
                                        </span>
                                    )}
                                    {monitoredEvent?.location && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                                            <MapPin className="h-3 w-3 text-blue-300" />
                                            {monitoredEvent.location}
                                        </span>
                                    )}
                                    {monitoredEvent?.organizer && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                                            <Users className="h-3 w-3 text-blue-300" />
                                            {monitoredEvent.organizer}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LIVE SYSTEM PILL */}
                        <div className="flex shrink-0 items-center justify-start gap-2 lg:justify-end">
                            <div
                                className={cn(
                                    'flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-black tracking-wider uppercase backdrop-blur-md transition-all duration-500',
                                    isUpcoming
                                        ? 'border-blue-400/40 bg-blue-500/20 text-blue-200'
                                        : monitoringEnabled
                                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/30'
                                        : 'border-white/20 bg-white/10 text-white/70',
                                )}
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    {isUpcoming ? (
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-400"></span>
                                    ) : (
                                        <>
                                            {monitoringEnabled && (
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            )}
                                            <span
                                                className={cn(
                                                    'relative inline-flex h-2.5 w-2.5 rounded-full',
                                                    monitoringEnabled ? 'bg-emerald-400' : 'bg-slate-400',
                                                )}
                                            ></span>
                                        </>
                                    )}
                                </span>
                                {isUpcoming ? 'Event Upcoming' : monitoringEnabled ? 'System Live' : 'System Paused'}
                            </div>
                        </div>
                    </div>

                    {/* TIME WINDOWS STRIP */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3 shadow-inner backdrop-blur-md">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 shadow-sm">
                            <LogIn className="h-4 w-4 text-emerald-300" />
                            <span className="text-[11px] font-extrabold tracking-wider text-emerald-200 uppercase">
                                Time-In (Cut-off 1hr):
                            </span>
                            <span className="text-xs font-black tracking-wide text-white">
                                {timeInStart === '08:00' && timeInEnd === '09:00'
                                    ? '08:00 AM - 09:00 AM'
                                    : `${timeInStart} - ${timeInEnd}`}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 shadow-sm">
                            <LogOut className="h-4 w-4 text-rose-300" />
                            <span className="text-[11px] font-extrabold tracking-wider text-rose-200 uppercase">
                                Time-Out (Flexible):
                            </span>
                            <span className="text-xs font-black tracking-wide text-white">
                                {timeOutStart === '10:30' && timeOutEnd === '12:00'
                                    ? '10:30 AM - 12:00 PM'
                                    : `${timeOutStart} - ${timeOutEnd}`}
                            </span>
                        </div>

                        {/* Scanner portal & last sync metadata tag */}
                        <div className="ml-auto hidden items-center gap-3 text-xs font-medium text-blue-200/80 md:flex">
                            <div className="flex items-center gap-1.5">
                                <Zap className={cn('h-3.5 w-3.5', !isUpcoming && scannerPortalActive ? 'text-emerald-300 animate-pulse' : 'text-slate-400')} />
                                <span>Portal {isUpcoming ? 'Closed (Upcoming)' : scannerPortalActive ? 'Active' : 'Inactive'}</span>
                            </div>
                            <span className="text-white/20">|</span>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-blue-300" />
                                <span>Sync: {lastUpdatedAt ? lastUpdatedAt.split(',')[1]?.trim() || lastUpdatedAt : 'Active'}</span>
                            </div>
                        </div>
                    </div>

                    {/* CONFLICTING SCHEDULE ALERT STRIP */}
                    {monitoredEvent?.conflicting_events && monitoredEvent.conflicting_events.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/20 p-3 text-amber-100 shadow-md backdrop-blur-md">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/30 text-amber-200">
                                    <AlertCircle className="h-4 w-4" />
                                </span>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                                        Conflicting Schedule Active
                                    </div>
                                    <div className="text-xs text-amber-100/90 font-medium">
                                        This event has a conflicting schedule with{' '}
                                        <strong className="text-white underline">
                                            {monitoredEvent.conflicting_events.map((c: any) => c.name || c.event).join(', ')}
                                        </strong>
                                        . Attendees will also be automatically scanned into conflicting events if eligible!
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                {monitoredEvent.conflicting_events.map((c: any) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            window.location.href = isProgramHead
                                                ? `/program-head/qr-scanner?event=${c.id}`
                                                : `/admin/qr-scanner?event=${c.id}`;
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-500/30 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500/50 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Switch to {c.name || c.event}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BOTTOM ROW: TABS & ACTION BUTTONS */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Tab Switcher */}
                        <div role="tablist" aria-label="Monitoring Views" className="inline-flex gap-1 rounded-xl border border-white/20 bg-black/20 p-1 shadow-inner backdrop-blur-md">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={monitoringTab === 'dashboard'}
                                onClick={() => setMonitoringTab('dashboard')}
                                className={cn(
                                    'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                    monitoringTab === 'dashboard'
                                        ? 'bg-white text-[#1e3a8a] shadow-md'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Dashboard
                            </button>
                            {(!monitoredEvent ||
                                monitoredEvent.attendance_type !== 'dynamic_qr') && (
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={monitoringTab === 'scanner'}
                                    onClick={() => setMonitoringTab('scanner')}
                                    className={cn(
                                        'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                        monitoringTab === 'scanner'
                                            ? 'bg-white text-[#1e3a8a] shadow-md'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                                    )}
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    {monitoredEvent?.geofence_enabled
                                        ? 'Geotagging'
                                        : 'QR Scanner'}
                                </button>
                            )}
                            {monitoredEvent &&
                                monitoredEvent.attendance_type === 'dynamic_qr' && (
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={monitoringTab === 'dynamic-qr'}
                                        onClick={() => setMonitoringTab('dynamic-qr')}
                                        className={cn(
                                            'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                            monitoringTab === 'dynamic-qr'
                                                ? 'bg-white text-[#1e3a8a] shadow-md'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        GPS Geofence
                                    </button>
                                )}
                        </div>

                        {/* Attendance Mode Selector & Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Entry vs Exit Selector */}
                            <div role="radiogroup" aria-label="Attendance Mode" className="inline-flex gap-1 rounded-xl border border-white/20 bg-black/20 p-1 backdrop-blur-md">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={attendanceMode === 'entry'}
                                    onClick={() => setAttendanceMode('entry')}
                                    className={cn(
                                        'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold tracking-wide uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                        attendanceMode === 'entry'
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                                    )}
                                    title="Open Entrance Attendance (Time-In)"
                                >
                                    <LogIn className="h-3.5 w-3.5" />
                                    Time-In
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={attendanceMode === 'exit'}
                                    onClick={() => setAttendanceMode('exit')}
                                    className={cn(
                                        'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold tracking-wide uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                        attendanceMode === 'exit'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                                    )}
                                    title="Exit Attendance (Time-Out)"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Time-Out
                                </button>
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                disabled={isUpcoming}
                                className={cn(
                                    'h-9 gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                                    isUpcoming
                                        ? 'border border-white/20 bg-white/10 text-white/50 cursor-not-allowed'
                                        : monitoringEnabled
                                        ? 'border border-white/25 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
                                        : 'bg-white text-[#1e3a8a] shadow-md hover:bg-blue-50',
                                )}
                                onClick={() => {
                                    if (isUpcoming) return;
                                    if (monitoringEnabled) {
                                        setMonitoringEnabled(false);
                                    } else {
                                        handleActivatePortalAndStartMonitoring();
                                    }
                                }}
                                title={
                                    isUpcoming
                                        ? 'Event is upcoming — portal cannot be started yet'
                                        : monitoringEnabled
                                        ? 'Pause live data sync'
                                        : 'Start live monitoring & activate scanner portal'
                                }
                            >
                                {isUpcoming ? (
                                    <>
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Upcoming</span>
                                    </>
                                ) : monitoringEnabled ? (
                                    <>
                                        <Pause className="h-3.5 w-3.5 fill-current" />
                                        <span>Pause</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        <span>Start Live</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Refresh attendance data"
                                className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                onClick={() => void refreshLogs()}
                                disabled={!monitorEventId}
                                title="Manually refresh attendance data"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${monitoringEnabled ? 'animate-[spin_3s_linear_infinite]' : ''}`}
                                />
                                <span className="sr-only">Refresh attendance data</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABBED CONTENTS */}
            {monitoringTab === 'dashboard' && (
                <>
                    {/* DSAMS KPI STATS CARDS */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue-500/5 blur-xl transition-all duration-500 group-hover:scale-125" />
                            <div className="relative flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-900/30">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Total Checked In
                                    </p>
                                    <p className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
                                        {isUpcoming ? 0 : liveCounts.total}
                                    </p>
                                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                        {isUpcoming ? 'Not Started Yet' : 'Active Attendees'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                                    style={{ width: isUpcoming ? '0%' : '100%' }}
                                />
                            </div>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-xl transition-all duration-500 group-hover:scale-125" />
                            <div className="relative flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-extrabold tracking-wider text-emerald-600/80 uppercase dark:text-emerald-400/80">
                                        On Time
                                    </p>
                                    <p className="mt-0.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                        {isUpcoming ? 0 : liveCounts.present}
                                    </p>
                                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {isUpcoming ? 'Check-in Closed' : 'Prompt Check-ins'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                    style={{
                                        width: isUpcoming
                                            ? '0%'
                                            : `${liveCounts.total > 0 ? (liveCounts.present / liveCounts.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-rose-500/5 blur-xl transition-all duration-500 group-hover:scale-125" />
                            <div className="relative flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-900/30">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-extrabold tracking-wider text-rose-600/80 uppercase dark:text-rose-400/80">
                                        Late Arrivals
                                    </p>
                                    <p className="mt-0.5 text-2xl font-black text-rose-700 dark:text-rose-300">
                                        {isUpcoming ? 0 : liveCounts.late}
                                    </p>
                                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                        {isUpcoming ? 'Check-in Closed' : 'Tardy Scans'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                                    style={{
                                        width: isUpcoming
                                            ? '0%'
                                            : `${liveCounts.total > 0 ? (liveCounts.late / liveCounts.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-lg shadow-amber-200/30 transition-all duration-300 hover:shadow-xl dark:border-amber-800/40 dark:bg-[#0B192C]/50 dark:from-amber-950/20 dark:shadow-none">
                            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-500/10 blur-xl transition-all duration-500 group-hover:scale-125" />
                            <div className="relative flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-300/60 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-900/40">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-extrabold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                        Dwell Gap Alerts
                                    </p>
                                    <p className="mt-0.5 text-2xl font-black text-amber-700 dark:text-amber-300">
                                        {isUpcoming ? 0 : liveCounts.flagged}
                                    </p>
                                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        {isUpcoming ? 'Geofence Inactive' : 'Suspected Split Exit'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                                    style={{
                                        width: isUpcoming
                                            ? '0%'
                                            : `${liveCounts.total > 0 ? (liveCounts.flagged / liveCounts.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* LEFT COLUMN: LIVE FEED (8/12) */}
                        <div className="flex flex-col gap-6 lg:col-span-8">
                            <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                                    Live Activity Feed
                                                </CardTitle>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {isUpcoming
                                                        ? 'Event is upcoming. Real-time check-ins will stream once attendance opens.'
                                                        : 'Streaming real-time student check-ins'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!isUpcoming && (
                                                <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/80">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFeedFilter('checked_in');
                                                            setLiveCurrentPage(1);
                                                        }}
                                                        className={cn(
                                                            'rounded-md px-2.5 py-1 text-[11px] font-bold transition-all',
                                                            feedFilter === 'checked_in'
                                                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                                                        )}
                                                    >
                                                        Checked In ({liveCounts.total})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFeedFilter('all');
                                                            setLiveCurrentPage(1);
                                                        }}
                                                        className={cn(
                                                            'rounded-md px-2.5 py-1 text-[11px] font-bold transition-all',
                                                            feedFilter === 'all'
                                                                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                                                        )}
                                                    >
                                                        All Eligible ({liveRows.length})
                                                    </button>
                                                </div>
                                            )}
                                            {isUpcoming ? (
                                                <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800/40 dark:bg-blue-950/30">
                                                    <span className="relative flex h-2 w-2 rounded-full bg-blue-500"></span>
                                                    <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                                        Upcoming Event
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                                        Live Sync
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-max border-collapse">
                                            <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                                <tr>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                        Program
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3.5 text-right text-[10px] font-bold tracking-wider uppercase">
                                                        Time
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/80 dark:bg-transparent">
                                                {paginatedLiveRows.length ? (
                                                    paginatedLiveRows.map(
                                                        (row, index) => (
                                                            <tr
                                                                key={row.id}
                                                                className={`group transition-all duration-200 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                                                                    index === 0 && monitoringEnabled
                                                                        ? 'bg-blue-50/20 dark:bg-blue-950/30'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-xs font-bold text-[#1e40af] shadow-sm dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                                                                            {(row.name || '')
                                                                                .split(' ')
                                                                                .map((n: string) => n[0])
                                                                                .join('')
                                                                                .substring(0, 2)
                                                                                .toUpperCase() || '??'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                                {formatLastNameFirst(row.name)}
                                                                            </div>
                                                                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                                {row.student_id || '---'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        {row.program || '---'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge
                                                                                className={
                                                                                    row.is_flagged || row.status?.toLowerCase() === 'flagged'
                                                                                        ? 'border border-amber-300 bg-amber-100 font-semibold text-amber-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                                                        : row.status?.toLowerCase() === 'late'
                                                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                                        : row.status?.toLowerCase() === 'incomplete' || row.status?.toLowerCase() === 'left_early'
                                                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                                                                        : row.status?.toLowerCase() === 'absent'
                                                                                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                                }
                                                                            >
                                                                                {row.is_flagged || row.status?.toLowerCase() === 'flagged' ? (
                                                                                    <span className="flex items-center gap-1">
                                                                                        ⚠️ Flagged: Dwell Gap
                                                                                    </span>
                                                                                ) : row.status?.toLowerCase() === 'incomplete' ? (
                                                                                    'Incomplete (Left Early)'
                                                                                ) : row.status?.toLowerCase() === 'left_early' ? (
                                                                                    'Left Early'
                                                                                ) : row.status ? (
                                                                                    row.status.charAt(0).toUpperCase() + row.status.slice(1)
                                                                                ) : (
                                                                                    'Present'
                                                                                )}
                                                                            </Badge>

                                                                            {row.is_flagged && row.attendance_id && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleClearFlag(row.attendance_id!, row.name)}
                                                                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                    title="Verify physical presence and clear flag to restore certificate"
                                                                                >
                                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                                    Verify Presence
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {row.is_flagged && row.flagged_reason && (
                                                                            <div className="flex items-start gap-1 rounded bg-amber-50 p-1.5 text-[10px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                                                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                                                                                <span>{row.flagged_reason}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                        IN: {row.time || '—'}
                                                                    </div>
                                                                    {row.time_out && row.time_out !== '—' && (
                                                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                            OUT: {row.time_out}
                                                                        </div>
                                                                    )}
                                                                    {row.mid_session_time && row.mid_session_time !== '—' && (
                                                                        <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                            MID: {row.mid_session_time}
                                                                        </div>
                                                                    )}
                                                                    {row.check_in_distance_m !== undefined &&
                                                                        row.check_in_distance_m !== null && (
                                                                            <div
                                                                                className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-violet-200/60 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-400"
                                                                                title="GPS Geofence Check-in distance from venue"
                                                                            >
                                                                                <span>📍 {row.check_in_distance_m}m</span>
                                                                            </div>
                                                                        )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                                    {isUpcoming
                                                                        ? 'Event is Upcoming'
                                                                        : monitoredEvent?.attendance_type === 'dynamic_qr'
                                                                        ? 'No GPS check-ins recorded yet'
                                                                        : 'No check-ins recorded yet'}
                                                                </p>
                                                                <p className="text-xs text-slate-500 max-w-sm">
                                                                    {isUpcoming
                                                                        ? `Check-in is currently closed. Student check-ins will open on ${monitoredEvent?.event_date || 'the scheduled date'} at ${timeInStart || monitoredEvent?.event_time || 'the start time'}.`
                                                                        : monitoredEvent?.attendance_type === 'dynamic_qr'
                                                                        ? 'Waiting for students to check in from their dashboard via GPS...'
                                                                        : 'Waiting for student check-ins to stream in real-time...'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination strip */}
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 dark:border-slate-800 dark:bg-[#0B192C]/40">
                                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{liveStartIndex + (paginatedLiveRows.length > 0 ? 1 : 0)}-{liveEndIndex}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{displayLiveRows.length}</span> records
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg px-2.5 text-xs font-bold transition-all hover:bg-slate-200/60 dark:hover:bg-slate-800"
                                                    onClick={() => setLiveCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={liveCurrentPage <= 1}
                                                >
                                                    Prev
                                                </Button>
                                                <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {liveCurrentPage} / {liveTotalPages}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg px-2.5 text-xs font-bold transition-all hover:bg-slate-200/60 dark:hover:bg-slate-800"
                                                    onClick={() => setLiveCurrentPage((p) => Math.min(liveTotalPages, p + 1))}
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
                        <div className="flex flex-col gap-5 lg:col-span-4">
                            {/* ATTENDANCE RATE DONUT FOR ALL PROGRAMS */}
                            <Card className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                <CardContent className="p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                <BarChart3 className="h-4 w-4" />
                                            </div>
                                            <p className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                                Attendance Rate
                                            </p>
                                        </div>
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:bg-blue-950/40 dark:text-blue-300">
                                            All Programs
                                        </span>
                                    </div>
                                    {(() => {
                                        const totalExpectedSum = byCourse.reduce((acc, c) => acc + (c.expected || 0), 0);
                                        const totalScannedSum = byCourse.reduce((acc, c) => acc + (c.scanned || 0), 0);
                                        const overallRate =
                                            totalExpectedSum > 0
                                                ? Math.round((totalScannedSum / totalExpectedSum) * 100)
                                                : liveCounts.total > 0
                                                  ? 88
                                                  : 0;

                                        const circumference = 2 * Math.PI * 54;
                                        let accumulatedOffset = 0;

                                        const getHexColor = (name: string) => {
                                            const u = (name || '').toUpperCase();
                                            if (u.includes('BSIT') || u.includes('COMPUTER') || u.includes('INFORMATION'))
                                                return '#f43f5e';
                                            if (u.includes('BSBA') || u.includes('BUSINESS'))
                                                return '#f59e0b';
                                            if (u.includes('BSHM') || u.includes('HOSPITALITY') || u.includes('HOTEL'))
                                                return '#10b981';
                                            if (u.includes('CRIM') || u.includes('BSCRIM'))
                                                return '#1d4ed8';
                                            if (u.includes('BSED') || u.includes('BEED') || u.includes('EDUCATION'))
                                                return '#38bdf8';
                                            return '#3b82f6';
                                        };

                                        return (
                                            <div className="flex flex-col items-center">
                                                <div className="relative">
                                                    <svg width="140" height="140" viewBox="0 0 140 140">
                                                        {/* Background ring */}
                                                        <circle
                                                            cx="70"
                                                            cy="70"
                                                            r="54"
                                                            fill="none"
                                                            strokeWidth="12"
                                                            className="stroke-slate-100 dark:stroke-slate-800"
                                                        />
                                                        {byCourse.map((c) => {
                                                            const proportion =
                                                                totalScannedSum > 0
                                                                    ? c.scanned / totalScannedSum
                                                                    : 1 / Math.max(1, byCourse.length);
                                                            const dashLen = proportion * circumference;
                                                            const offset = accumulatedOffset;
                                                            accumulatedOffset += dashLen;
                                                            const hex = getHexColor(c.program);

                                                            return (
                                                                <circle
                                                                    key={c.program}
                                                                    cx="70"
                                                                    cy="70"
                                                                    r="54"
                                                                    fill="none"
                                                                    strokeWidth="12"
                                                                    stroke={hex}
                                                                    strokeDasharray={`${dashLen} ${circumference}`}
                                                                    strokeDashoffset={-offset}
                                                                    transform="rotate(-90 70 70)"
                                                                    className="transition-all duration-1000"
                                                                />
                                                            );
                                                        })}
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                            {overallRate}%
                                                        </span>
                                                        <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                            Turnout
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* All Program Legend Grid */}
                                                <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                    {byCourse.map((c) => {
                                                        const hex = getHexColor(c.program);
                                                        return (
                                                            <div key={c.program} className="flex min-w-0 items-center gap-1.5">
                                                                <span
                                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                    style={{
                                                                        backgroundColor: hex,
                                                                    }}
                                                                />
                                                                <span className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                                    {c.program}
                                                                </span>
                                                                <span className="ml-auto text-[10px] font-black text-slate-900 dark:text-white">
                                                                    {c.scanned}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* PROGRAM BREAKDOWN */}
                            <Card className="flex-1 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-5 py-3.5 dark:border-slate-800 dark:bg-transparent">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                                By Program
                                            </CardTitle>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            {byCourse.length} Programs
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[320px] overflow-y-auto">
                                        {byCourse.length > 0 ? (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {[...byCourse]
                                                    .sort((a, b) => b.percentage - a.percentage)
                                                    .map((c) => {
                                                        const getProgramColors = (name: string) => {
                                                            const p = (name || '').toUpperCase();
                                                            if (p.includes('BSIT') || p.includes('INFORMATION TECHNOLOGY') || p.includes('COMPUTER SCIENCE')) {
                                                                return {
                                                                    dot: 'bg-rose-500 shadow-rose-500/50',
                                                                    text: 'text-rose-600 dark:text-rose-400',
                                                                    bar: 'from-rose-400 to-rose-600',
                                                                };
                                                            }
                                                            if (p.includes('BSBA') || p.includes('BUSINESS')) {
                                                                return {
                                                                    dot: 'bg-amber-500 shadow-amber-500/50',
                                                                    text: 'text-amber-600 dark:text-amber-400',
                                                                    bar: 'from-amber-400 to-amber-600',
                                                                };
                                                            }
                                                            if (p.includes('BSHM') || p.includes('HOSPITALITY') || p.includes('HOTEL')) {
                                                                return {
                                                                    dot: 'bg-emerald-500 shadow-emerald-500/50',
                                                                    text: 'text-emerald-600 dark:text-emerald-400',
                                                                    bar: 'from-emerald-400 to-emerald-600',
                                                                };
                                                            }
                                                            if (p.includes('CRIM') || p.includes('BSCRIM')) {
                                                                return {
                                                                    dot: 'bg-sky-400 shadow-sky-400/50',
                                                                    text: 'text-sky-500 dark:text-sky-400',
                                                                    bar: 'from-sky-300 to-sky-500',
                                                                };
                                                            }
                                                            if (p.includes('BSED') || p.includes('BEED') || p.includes('EDUCATION') || p.includes('TEACHER')) {
                                                                return {
                                                                    dot: 'bg-blue-600 shadow-blue-600/50',
                                                                    text: 'text-blue-700 dark:text-blue-400',
                                                                    bar: 'from-blue-600 to-blue-800',
                                                                };
                                                            }
                                                            return {
                                                                dot: 'bg-blue-500 shadow-blue-500/50',
                                                                text: 'text-blue-600 dark:text-blue-400',
                                                                bar: 'from-blue-400 to-blue-600',
                                                            };
                                                        };
                                                        const colorCfg = getProgramColors(c.program);

                                                        return (
                                                            <div
                                                                key={c.program}
                                                                className="group flex cursor-pointer flex-col gap-2 px-5 py-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                                                                onClick={() => handleViewStudentsByCourse(String(c.program))}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                                                                        <div className={cn('h-2 w-2 shrink-0 rounded-full shadow-sm', colorCfg.dot)} />
                                                                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                                            {c.program}
                                                                        </span>
                                                                    </div>
                                                                    <div className="ml-2 flex shrink-0 items-center gap-1">
                                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                                            {c.scanned}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">/</span>
                                                                        <span className="text-[10px] text-slate-400">{c.expected}</span>
                                                                        <span className={cn('ml-1.5 text-[10px] font-black', colorCfg.text)}>
                                                                            {c.percentage}%
                                                                        </span>
                                                                        <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                                                    </div>
                                                                </div>
                                                                <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                    <div
                                                                        className={cn('h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-1000', colorCfg.bar)}
                                                                        style={{ width: `${Math.min(c.percentage, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12">
                                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                                                    <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        No program data
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        Data will appear as students check in.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                                        <Button
                                            variant="outline"
                                            className="h-9 w-full gap-2 rounded-xl border-slate-200 text-xs font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
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
                <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="flex flex-col gap-6 lg:col-span-8">
                        <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <CardHeader className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <Camera className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                            Live Camera Scanner
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden items-center gap-2 border-r border-slate-200 pr-4 sm:flex dark:border-slate-700">
                                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                Status:
                                            </span>
                                            {scanState.status === 'running' ? (
                                                <Badge className="animate-pulse bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Running
                                                </Badge>
                                            ) : scanState.status === 'starting' ? (
                                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Starting...
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-slate-200 text-slate-500">
                                                    Idle
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                className="h-10 gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 active:scale-95"
                                                onClick={startScanner}
                                                disabled={scanState.status === 'starting' || scanState.status === 'running'}
                                            >
                                                <QrCode className="h-4 w-4" />
                                                Start Scanner
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold tracking-wider text-slate-600 uppercase transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                onClick={stopScanner}
                                            >
                                                Stop
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative aspect-video w-full overflow-hidden bg-slate-950 p-0">
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                                    playsInline
                                    muted
                                />
                                <div className="pointer-events-none absolute inset-0">
                                    <div className="absolute inset-0 border-[40px] border-black/40" />
                                    <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/50 shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
                                        <div className="absolute inset-0 animate-pulse rounded-2xl border-2 border-blue-500" />
                                        <div className="absolute -top-1 -left-1 h-8 w-8 rounded-tl-lg border-t-4 border-l-4 border-blue-500" />
                                        <div className="absolute -top-1 -right-1 h-8 w-8 rounded-tr-lg border-t-4 border-r-4 border-blue-500" />
                                        <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-blue-500" />
                                        <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-br-lg border-r-4 border-b-4 border-blue-500" />
                                        {scanState.status === 'running' && (
                                            <div className="absolute top-0 left-0 h-1 w-full animate-scan-line bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                                        )}
                                    </div>
                                </div>

                                {scanState.status !== 'running' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all duration-500">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-white/50 shadow-inner">
                                            <Camera className="h-8 w-8" />
                                        </div>
                                        <p className="text-xs font-bold tracking-wider text-white/70 uppercase">
                                            Camera Standby
                                        </p>
                                    </div>
                                )}

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    {lastScanned ? (
                                        <div
                                            className={cn(
                                                'flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 backdrop-blur-xl transition-all duration-500',
                                                lastScanned.status === 'valid'
                                                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-100'
                                                    : 'border-rose-500/30 bg-rose-500/20 text-rose-100',
                                            )}
                                        >
                                            {lastScanned.status === 'valid' ? (
                                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                            ) : (
                                                <AlertCircle className="h-6 w-6 text-rose-400" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black tracking-wider uppercase opacity-70">
                                                    {lastScanned.status === 'valid' ? 'Success' : 'Scan Failed'}
                                                </span>
                                                <span className="max-w-[240px] truncate text-sm font-bold">
                                                    {lastScanned.message}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-white/70 backdrop-blur-xl">
                                            <Info className="h-4 w-4 text-blue-300" />
                                            <span className="text-xs font-semibold tracking-wider">
                                                Position student QR code within frame to scan
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scanner Recent Activity Feed */}
                        <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                    Recent Scanner Check-ins
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-max border-collapse">
                                        <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Student
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Program
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-[10px] font-bold tracking-wider uppercase">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-right text-[10px] font-bold tracking-wider uppercase">
                                                    Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/80 dark:bg-transparent">
                                            {paginatedLiveRows.length ? (
                                                paginatedLiveRows.map((row) => (
                                                    <tr key={row.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {formatLastNameFirst(row.name)}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {row.student_id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                            {row.program}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge
                                                                className={
                                                                    row.status?.toLowerCase() === 'late'
                                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                        : row.status?.toLowerCase() === 'incomplete' || row.status?.toLowerCase() === 'left_early'
                                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                                                        : row.status?.toLowerCase() === 'absent'
                                                                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                }
                                                            >
                                                                {row.status?.toLowerCase() === 'incomplete'
                                                                    ? 'Incomplete (Left Early)'
                                                                    : row.status?.toLowerCase() === 'left_early'
                                                                    ? 'Left Early'
                                                                    : row.status
                                                                    ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                                                                    : 'Present'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                                                            {row.time}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                                        No scanner records yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-4">
                        <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                                Scanner Telemetry
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        Valid Scans
                                    </span>
                                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                                        {scannerCounts.valid}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 dark:border-rose-900/30 dark:bg-rose-950/20">
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                        Invalid Scans
                                    </span>
                                    <span className="text-xl font-black text-rose-800 dark:text-rose-200">
                                        {scannerCounts.invalid}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        Total Scanned
                                    </span>
                                    <span className="text-xl font-black text-blue-800 dark:text-blue-200">
                                        {scannerCounts.total}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {monitoringTab === 'dynamic-qr' && (
                <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="flex flex-col gap-6 lg:col-span-8">
                        <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                        GPS Location Check-in & Geofence
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Students check in directly using their device's GPS location
                                    </p>
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        Campus Active
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-6 p-6">
                                {/* Campus Perimeter Card */}
                                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white p-5 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-slate-900">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                    St. Rita's College of Balingasag
                                                </h4>
                                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                    Radius: 300m
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                Students physically located anywhere within the 300-meter campus perimeter can check in instantly from their student dashboard without scanning any QR codes.
                                            </p>
                                            <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Compass className="h-4 w-4 text-indigo-500" />
                                                    Center: 8.743070° N, 124.774500° E
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    Coverage: Full Campus Grounds
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live GPS Attendance Stats Grid */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Total GPS Checked In
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                                            {isUpcoming ? 0 : liveCounts.total}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
                                            On Time
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                            {isUpcoming ? 0 : liveCounts.present}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
                                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider dark:text-rose-400">
                                            Late Arrivals
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
                                            {isUpcoming ? 0 : liveCounts.late}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
                                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider dark:text-amber-400">
                                            Dwell Gap Alerts
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                                            {isUpcoming ? 0 : liveCounts.flagged}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-4">
                        <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                                GPS Attendance Status
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        Attendance Mode
                                    </span>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        GPS Check-in (No QR)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                        Geofence Center
                                    </span>
                                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                        8.74307, 124.7745
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                        Allowed Perimeter
                                    </span>
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                        300m Radius
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <h4 className="mb-2 text-xs font-bold tracking-wider text-blue-800 uppercase dark:text-blue-400">
                                How Students Attend
                            </h4>
                            <ol className="list-decimal space-y-1.5 pl-4 text-xs text-blue-700/90 dark:text-blue-300/80">
                                <li>
                                    Students log into OSAMS on their mobile phone or device.
                                </li>
                                <li>
                                    Open this event in their <strong>Student Dashboard</strong>.
                                </li>
                                <li>
                                    Click <strong>"Check In using GPS Location"</strong>.
                                </li>
                                <li>
                                    If within St. Rita's College campus grounds, their attendance is recorded immediately.
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

