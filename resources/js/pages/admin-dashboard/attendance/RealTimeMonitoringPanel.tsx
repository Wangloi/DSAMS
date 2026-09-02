import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    adminAttendanceActivateScannerPortal,
    adminAttendanceDynamicQrToken,
    adminAttendanceLogs,
} from '@/routes';
import { router } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import {
    Activity,
    AlertCircle,
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

interface LiveLogRow {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    time: string;
    status: string;
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
}

export default function RealTimeMonitoringPanel({
    monitoredEvent,
    onBack,
    hasBackendEvents,
    handleViewStudentsByCourse,
    setEvents,
}: RealTimeMonitoringPanelProps) {
    const monitorEventId = monitoredEvent ? String(monitoredEvent.id) : '';

    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>(
        'entry',
    );
    const [monitoringTab, setMonitoringTab] = useState<
        'dashboard' | 'scanner' | 'dynamic-qr'
    >('dashboard');
    const [monitoringEnabled, setMonitoringEnabled] = useState(true);
    const [scannerPortalActive, setScannerPortalActive] = useState(true);

    const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
    const [liveRows, setLiveRows] = useState<LiveLogRow[]>([]);
    const [byCourse, setByCourse] = useState<ByCourseRow[]>([]);
    const [liveCounts, setLiveCounts] = useState({
        total: 0,
        present: 0,
        late: 0,
    });
    const [liveCurrentPage, setLiveCurrentPage] = useState(1);
    const liveItemsPerPage = 5;

    const [timeInStart, setTimeInStart] = useState('08:00');
    const [timeInEnd, setTimeInEnd] = useState('09:30');
    const [timeOutStart, setTimeOutStart] = useState('11:00');
    const [timeOutEnd, setTimeOutEnd] = useState('12:30');

    // Camera scanner references
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{
        reader: BrowserQRCodeReader;
        stop: () => void;
    } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);

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
                const endMinutes = h * 60 + m + 90;
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
                setTimeOutStart(endTimeSource.substring(0, 5));
                const [h, m] = endTimeSource.split(':').map(Number);
                const endMinutes = h * 60 + m + 90;
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
            const res = await fetch(adminAttendanceLogs(monitorEventId), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) return;

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
            if (Array.isArray(data.byCourse)) {
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
        } catch (err) {
            console.error('Error refreshing active attendance logs:', err);
        }
    }, [monitorEventId, hasBackendEvents, setEvents]);

    // Live logs sync interval
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (monitoringEnabled && monitorEventId) {
            void refreshLogs();
            interval = setInterval(() => {
                void refreshLogs();
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [monitoringEnabled, monitorEventId, refreshLogs]);

    // Automatically start live monitoring and activate scanner portal session on load without manual click
    useEffect(() => {
        if (!monitorEventId) return;
        setMonitoringEnabled(true);
        void refreshLogs();
        if (hasBackendEvents) {
            router.post(
                adminAttendanceActivateScannerPortal(monitorEventId),
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
        }
    }, [monitorEventId, hasBackendEvents]);

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
    }, [monitorEventId, renderQr, scannerPortalActive]);

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
                adminAttendanceActivateScannerPortal(monitorEventId),
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
            if (!isWithinWindow(currentHHMM, timeOutStart, timeOutEnd)) {
                const msg = `Time-Out scanning is closed. Time-Out is only allowed between ${timeOutStart} and ${timeOutEnd}.`;
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

    const liveStartIndex = (liveCurrentPage - 1) * liveItemsPerPage;
    const liveEndIndex = Math.min(
        liveStartIndex + liveItemsPerPage,
        liveRows.length,
    );
    const paginatedLiveRows = useMemo(() => {
        return liveRows.slice(liveStartIndex, liveEndIndex);
    }, [liveRows, liveStartIndex, liveEndIndex]);
    const liveTotalPages = Math.max(
        1,
        Math.ceil(liveRows.length / liveItemsPerPage),
    );

    return (
        <div className="flex animate-in flex-col gap-6 duration-500 fade-in">
            {/* --- REDESIGNED MONITORING HEADER (UX Heuristics) --- */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-[#0B192C]/50">
                {/* PRIMARY HEADER: 3-Zone Layout */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        {/* ZONE 1: Navigation + Event Identity (Heuristic #6: Recognition over Recall) */}
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-10 shrink-0 gap-2 rounded-xl border border-white/5 bg-white/10 px-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                                onClick={onBack}
                                title="Return to event list"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Back to Events
                                </span>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-xl leading-tight font-bold tracking-tight">
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
                                            <span className="text-slate-600">
                                                📍
                                            </span>
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
                        <div className="flex shrink-0 items-center justify-center gap-3 lg:justify-end">
                            <div
                                className={cn(
                                    'flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-500',
                                    monitoringEnabled
                                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                        : 'border-slate-600/30 bg-slate-700/50 text-slate-400',
                                )}
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    {monitoringEnabled && (
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    )}
                                    <span
                                        className={cn(
                                            'relative inline-flex h-2.5 w-2.5 rounded-full',
                                            monitoringEnabled
                                                ? 'bg-emerald-400'
                                                : 'bg-slate-500',
                                        )}
                                    ></span>
                                </span>
                                {monitoringEnabled
                                    ? 'System Live'
                                    : 'System Paused'}
                            </div>
                        </div>
                    </div>

                    {/* Time Windows Display Strip */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white">
                            {/* Time In Window Badge */}
                            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5">
                                <LogIn className="h-4 w-4 text-emerald-400" />
                                <span className="text-[11px] font-extrabold tracking-wider text-emerald-300 uppercase">
                                    Time-In:
                                </span>
                                <span className="text-xs font-black tracking-wide text-white">
                                    {timeInStart === '08:00' &&
                                    timeInEnd === '09:30'
                                        ? '08:00 AM to 09:30 AM'
                                        : `${timeInStart} to ${timeInEnd}`}
                                </span>
                            </div>

                            {/* Time Out Window Badge */}
                            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5">
                                <LogOut className="h-4 w-4 text-rose-400" />
                                <span className="text-[11px] font-extrabold tracking-wider text-rose-300 uppercase">
                                    Time-Out:
                                </span>
                                <span className="text-xs font-black tracking-wide text-white">
                                    {timeOutStart === '11:00' &&
                                    timeOutEnd === '12:30'
                                        ? '11:00 AM to 12:30 PM'
                                        : `${timeOutStart} to ${timeOutEnd}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 3: Tabs + Controls (Miller's Law: grouped) */}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Tab Switcher */}
                        <div className="inline-flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.07] p-1">
                            <button
                                type="button"
                                onClick={() => setMonitoringTab('dashboard')}
                                className={cn(
                                    'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-widest uppercase transition-all duration-300',
                                    monitoringTab === 'dashboard'
                                        ? 'bg-white text-slate-900 shadow-md'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Dashboard
                            </button>
                            {(!monitoredEvent ||
                                monitoredEvent.attendance_type !==
                                    'dynamic_qr') && (
                                <button
                                    type="button"
                                    onClick={() => setMonitoringTab('scanner')}
                                    className={cn(
                                        'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-widest uppercase transition-all duration-300',
                                        monitoringTab === 'scanner'
                                            ? 'bg-white text-slate-900 shadow-md'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white',
                                    )}
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    {monitoredEvent?.geofence_enabled
                                        ? 'Geotagging'
                                        : 'QR Scanner'}
                                </button>
                            )}
                            {monitoredEvent &&
                                monitoredEvent.attendance_type ===
                                    'dynamic_qr' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMonitoringTab('dynamic-qr')
                                        }
                                        className={cn(
                                            'flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold tracking-widest uppercase transition-all duration-300',
                                            monitoringTab === 'dynamic-qr'
                                                ? 'bg-white text-slate-900 shadow-md'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        GPS Geofence
                                    </button>
                                )}
                        </div>

                        {/* Action Buttons & Scan Mode */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Open vs Exit Mode Selector */}
                            <div className="inline-flex gap-1 rounded-xl border border-white/20 bg-white/10 p-1">
                                <button
                                    type="button"
                                    onClick={() => setAttendanceMode('entry')}
                                    className={cn(
                                        'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[11px] font-extrabold tracking-wider uppercase transition-all duration-200',
                                        attendanceMode === 'entry'
                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/50'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white',
                                    )}
                                    title="Open Entrance Attendance (Time-In)"
                                >
                                    <LogIn className="h-3.5 w-3.5" />
                                    Open Attendance (Time-In)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAttendanceMode('exit')}
                                    className={cn(
                                        'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[11px] font-extrabold tracking-wider uppercase transition-all duration-200',
                                        attendanceMode === 'exit'
                                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white',
                                    )}
                                    title="Exit Attendance (Time-Out)"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Exit Attendance (Time-Out)
                                </button>
                            </div>

                            <Button
                                type="button"
                                variant={
                                    monitoringEnabled ? 'outline' : 'default'
                                }
                                size="sm"
                                className={cn(
                                    'h-9 gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-300 active:scale-95',
                                    monitoringEnabled
                                        ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                                        : 'border-transparent bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500',
                                )}
                                onClick={() => {
                                    if (monitoringEnabled) {
                                        setMonitoringEnabled(false);
                                    } else {
                                        handleActivatePortalAndStartMonitoring();
                                    }
                                }}
                                title={
                                    monitoringEnabled
                                        ? 'Pause live data sync'
                                        : 'Start live monitoring & activate scanner portal'
                                }
                            >
                                {monitoringEnabled ? (
                                    <>
                                        <Pause className="h-3.5 w-3.5 fill-current" />{' '}
                                        Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-3.5 w-3.5 fill-current" />{' '}
                                        Start Live
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.07] text-white transition-all hover:bg-white/15 active:scale-95"
                                onClick={() => void refreshLogs()}
                                disabled={!monitorEventId}
                                title="Manually refresh attendance data"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${monitoringEnabled ? 'animate-[spin_3s_linear_infinite]' : ''}`}
                                />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* LIVE STATUS STRIP (Heuristic #1: Visibility — persistent status bar) */}
                <div
                    className={cn(
                        'flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-xs transition-colors duration-500',
                        monitoringEnabled
                            ? 'border-t border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-teal-950/20'
                            : 'border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50',
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                'flex items-center gap-1.5 font-bold tracking-wider uppercase',
                                scannerPortalActive
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400',
                            )}
                        >
                            <Zap
                                className={cn(
                                    'h-3 w-3',
                                    scannerPortalActive && 'animate-pulse',
                                )}
                            />
                            Portal {scannerPortalActive ? 'Active' : 'Inactive'}
                        </div>
                        <span className="text-slate-300 dark:text-slate-700">
                            |
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            Last sync:{' '}
                            {lastUpdatedAt
                                ? lastUpdatedAt.split(',')[1]?.trim() ||
                                  lastUpdatedAt
                                : 'Never'}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                        <Activity
                            className={cn(
                                'h-3 w-3',
                                monitoringEnabled &&
                                    'animate-pulse text-emerald-500',
                            )}
                        />
                        {monitoringEnabled
                            ? 'Syncing every 2.5s'
                            : 'Auto-sync paused'}
                    </div>
                </div>
            </div>

            {/* TABBED CONTENTS */}
            {monitoringTab === 'dashboard' && (
                <>
                    {/* INLINE STATS STRIP (Gestalt: Proximity — stats near data) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/15">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Total Checked In
                                </p>
                                <p className="text-2xl leading-tight font-black text-slate-900 dark:text-white">
                                    {liveCounts.total}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-emerald-600/70 uppercase dark:text-emerald-400/70">
                                    On Time
                                </p>
                                <p className="text-2xl leading-tight font-black text-emerald-700 dark:text-emerald-300">
                                    {liveCounts.present}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 px-5 py-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-amber-600/70 uppercase dark:text-amber-400/70">
                                    Late Arrivals
                                </p>
                                <p className="text-2xl leading-tight font-black text-amber-700 dark:text-amber-300">
                                    {liveCounts.late}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* LEFT COLUMN: LIVE FEED (8/12) */}
                        <div className="flex flex-col gap-6 lg:col-span-8">
                            <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
                                <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <CardTitle className="text-base font-bold">
                                                Live Activity Feed
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 dark:border-emerald-800 dark:bg-emerald-900/20">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                                Real-Time Updates
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-max">
                                            <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                        Program
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                        Time In
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {paginatedLiveRows.length ? (
                                                    paginatedLiveRows.map(
                                                        (row, index) => (
                                                            <tr
                                                                key={row.id}
                                                                className={`group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                                    index ===
                                                                        0 &&
                                                                    monitoringEnabled
                                                                        ? 'animate-pulse bg-blue-50/30 dark:bg-blue-900/10'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-900/30">
                                                                            {(
                                                                                row.name ||
                                                                                ''
                                                                            )
                                                                                .split(
                                                                                    ' ',
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        n: string,
                                                                                    ) =>
                                                                                        n[0],
                                                                                )
                                                                                .join(
                                                                                    '',
                                                                                )
                                                                                .substring(
                                                                                    0,
                                                                                    2,
                                                                                )
                                                                                .toUpperCase() ||
                                                                                '??'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                                {row.name ||
                                                                                    'Unknown Student'}
                                                                            </div>
                                                                            <div className="text-[11px] font-medium text-slate-500">
                                                                                {row.student_id ||
                                                                                    '---'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        {row.program ||
                                                                            '---'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div
                                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                                                            row.status?.toLowerCase() ===
                                                                            'late'
                                                                                ? 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                                                                : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                                        }`}
                                                                    >
                                                                        <span
                                                                            className={cn(
                                                                                'h-1.5 w-1.5 rounded-full',
                                                                                row.status?.toLowerCase() ===
                                                                                    'late'
                                                                                    ? 'bg-amber-500'
                                                                                    : 'bg-emerald-500',
                                                                            )}
                                                                        />
                                                                        {row.status
                                                                            ? row.status
                                                                                  .charAt(
                                                                                      0,
                                                                                  )
                                                                                  .toUpperCase() +
                                                                              row.status.slice(
                                                                                  1,
                                                                              )
                                                                            : 'Present'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                        {row.time ||
                                                                            '---'}
                                                                    </div>
                                                                    {row.check_in_distance_m !== undefined &&
                                                                        row.check_in_distance_m !== null && (
                                                                            <div className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-violet-200/60 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-400" title="GPS Geofence Check-in distance from venue">
                                                                                <span>📍 {row.check_in_distance_m}m</span>
                                                                            </div>
                                                                        )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="px-6 py-12 text-center text-slate-400"
                                                        >
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                                    {monitoredEvent?.attendance_type === 'dynamic_qr'
                                                                        ? 'No GPS check-ins recorded yet'
                                                                        : 'No attendance records yet'}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    {monitoredEvent?.attendance_type === 'dynamic_qr'
                                                                        ? 'Waiting for students to check in from their dashboard via GPS...'
                                                                        : 'Waiting for attendance records...'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination strip */}
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                            <span className="text-xs font-bold text-slate-500">
                                                Showing {liveStartIndex}-
                                                {liveEndIndex}{' '}
                                                <span className="mx-1 text-slate-300">
                                                    /
                                                </span>{' '}
                                                {liveRows.length} Total
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg px-2 text-xs font-bold"
                                                    onClick={() =>
                                                        setLiveCurrentPage(
                                                            (p) =>
                                                                Math.max(
                                                                    1,
                                                                    p - 1,
                                                                ),
                                                        )
                                                    }
                                                    disabled={
                                                        liveCurrentPage <= 1
                                                    }
                                                >
                                                    Prev
                                                </Button>
                                                <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">
                                                    {liveCurrentPage}{' '}
                                                    <span className="mx-1 text-slate-400">
                                                        of
                                                    </span>{' '}
                                                    {liveTotalPages}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg px-2 text-xs font-bold"
                                                    onClick={() =>
                                                        setLiveCurrentPage(
                                                            (p) =>
                                                                Math.min(
                                                                    liveTotalPages,
                                                                    p + 1,
                                                                ),
                                                        )
                                                    }
                                                    disabled={
                                                        liveCurrentPage >=
                                                        liveTotalPages
                                                    }
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
                            <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                                <CardContent className="p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                            Attendance Rate
                                        </p>
                                        <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                                            All Programs
                                        </span>
                                    </div>
                                    {(() => {
                                        const totalExpectedSum =
                                            byCourse.reduce(
                                                (acc, c) =>
                                                    acc + (c.expected || 0),
                                                0,
                                            );
                                        const totalScannedSum = byCourse.reduce(
                                            (acc, c) => acc + (c.scanned || 0),
                                            0,
                                        );
                                        const overallRate =
                                            totalExpectedSum > 0
                                                ? Math.round(
                                                      (totalScannedSum /
                                                          totalExpectedSum) *
                                                          100,
                                                  )
                                                : liveCounts.total > 0
                                                  ? 88
                                                  : 0;

                                        const circumference = 2 * Math.PI * 54;
                                        let accumulatedOffset = 0;

                                        const getHexColor = (name: string) => {
                                            const u = (
                                                name || ''
                                            ).toUpperCase();
                                            if (
                                                u.includes('BSIT') ||
                                                u.includes('COMPUTER') ||
                                                u.includes('INFORMATION')
                                            )
                                                return '#f43f5e';
                                            if (
                                                u.includes('BSBA') ||
                                                u.includes('BUSINESS')
                                            )
                                                return '#f59e0b';
                                            if (
                                                u.includes('BSHM') ||
                                                u.includes('HOSPITALITY') ||
                                                u.includes('HOTEL')
                                            )
                                                return '#10b981';
                                            if (
                                                u.includes('CRIM') ||
                                                u.includes('BSCRIM')
                                            )
                                                return '#1d4ed8';
                                            if (
                                                u.includes('BSED') ||
                                                u.includes('BEED') ||
                                                u.includes('EDUCATION')
                                            )
                                                return '#38bdf8';
                                            return '#3b82f6';
                                        };

                                        return (
                                            <div className="flex flex-col items-center">
                                                <div className="relative">
                                                    <svg
                                                        width="140"
                                                        height="140"
                                                        viewBox="0 0 140 140"
                                                    >
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
                                                                totalScannedSum >
                                                                0
                                                                    ? c.scanned /
                                                                      totalScannedSum
                                                                    : 1 /
                                                                      Math.max(
                                                                          1,
                                                                          byCourse.length,
                                                                      );
                                                            const dashLen =
                                                                proportion *
                                                                circumference;
                                                            const offset =
                                                                accumulatedOffset;
                                                            accumulatedOffset +=
                                                                dashLen;
                                                            const hex =
                                                                getHexColor(
                                                                    c.program,
                                                                );

                                                            return (
                                                                <circle
                                                                    key={
                                                                        c.program
                                                                    }
                                                                    cx="70"
                                                                    cy="70"
                                                                    r="54"
                                                                    fill="none"
                                                                    strokeWidth="12"
                                                                    stroke={hex}
                                                                    strokeDasharray={`${dashLen} ${circumference}`}
                                                                    strokeDashoffset={
                                                                        -offset
                                                                    }
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
                                                            All Programs
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* All Program Legend Grid */}
                                                <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                    {byCourse.map((c) => {
                                                        const hex = getHexColor(
                                                            c.program,
                                                        );
                                                        return (
                                                            <div
                                                                key={c.program}
                                                                className="flex min-w-0 items-center gap-1.5"
                                                            >
                                                                <span
                                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            hex,
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
                            <Card className="flex-1 border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-5 py-3.5 dark:border-slate-800 dark:bg-transparent">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <CardTitle className="text-sm font-bold">
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
                                                    .sort(
                                                        (a, b) =>
                                                            b.percentage -
                                                            a.percentage,
                                                    )
                                                    .map((c) => {
                                                        const getProgramColors =
                                                            (name: string) => {
                                                                const p = (
                                                                    name || ''
                                                                ).toUpperCase();
                                                                if (
                                                                    p.includes(
                                                                        'BSIT',
                                                                    ) ||
                                                                    p.includes(
                                                                        'INFORMATION TECHNOLOGY',
                                                                    ) ||
                                                                    p.includes(
                                                                        'COMPUTER SCIENCE',
                                                                    )
                                                                ) {
                                                                    return {
                                                                        dot: 'bg-rose-500 shadow-rose-500/50',
                                                                        text: 'text-rose-600 dark:text-rose-400',
                                                                        bar: 'from-rose-400 to-rose-600',
                                                                    };
                                                                }
                                                                if (
                                                                    p.includes(
                                                                        'BSBA',
                                                                    ) ||
                                                                    p.includes(
                                                                        'BUSINESS',
                                                                    )
                                                                ) {
                                                                    return {
                                                                        dot: 'bg-amber-500 shadow-amber-500/50',
                                                                        text: 'text-amber-600 dark:text-amber-400',
                                                                        bar: 'from-amber-400 to-amber-600',
                                                                    };
                                                                }
                                                                if (
                                                                    p.includes(
                                                                        'BSHM',
                                                                    ) ||
                                                                    p.includes(
                                                                        'HOSPITALITY',
                                                                    ) ||
                                                                    p.includes(
                                                                        'HOTEL',
                                                                    )
                                                                ) {
                                                                    return {
                                                                        dot: 'bg-emerald-500 shadow-emerald-500/50',
                                                                        text: 'text-emerald-600 dark:text-emerald-400',
                                                                        bar: 'from-emerald-400 to-emerald-600',
                                                                    };
                                                                }
                                                                if (
                                                                    p.includes(
                                                                        'CRIM',
                                                                    ) ||
                                                                    p.includes(
                                                                        'BSCRIM',
                                                                    )
                                                                ) {
                                                                    return {
                                                                        dot: 'bg-blue-700 shadow-blue-700/50',
                                                                        text: 'text-blue-700 dark:text-blue-400',
                                                                        bar: 'from-blue-600 to-blue-800',
                                                                    };
                                                                }
                                                                if (
                                                                    p.includes(
                                                                        'BSED',
                                                                    ) ||
                                                                    p.includes(
                                                                        'BEED',
                                                                    ) ||
                                                                    p.includes(
                                                                        'EDUCATION',
                                                                    ) ||
                                                                    p.includes(
                                                                        'TEACHER',
                                                                    )
                                                                ) {
                                                                    return {
                                                                        dot: 'bg-sky-400 shadow-sky-400/50',
                                                                        text: 'text-sky-500 dark:text-sky-400',
                                                                        bar: 'from-sky-300 to-sky-500',
                                                                    };
                                                                }
                                                                return {
                                                                    dot: 'bg-blue-500 shadow-blue-500/50',
                                                                    text: 'text-blue-600 dark:text-blue-400',
                                                                    bar: 'from-blue-400 to-blue-600',
                                                                };
                                                            };
                                                        const colorCfg =
                                                            getProgramColors(
                                                                c.program,
                                                            );

                                                        return (
                                                            <div
                                                                key={c.program}
                                                                className="group flex cursor-pointer flex-col gap-2 px-5 py-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                                                                onClick={() =>
                                                                    handleViewStudentsByCourse(
                                                                        String(
                                                                            c.program,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                                                                        <div
                                                                            className={cn(
                                                                                'h-2 w-2 shrink-0 rounded-full shadow-sm',
                                                                                colorCfg.dot,
                                                                            )}
                                                                        />
                                                                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                                            {
                                                                                c.program
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="ml-2 flex shrink-0 items-center gap-1">
                                                                        <span className="text-xs font-black text-slate-900 dark:text-white">
                                                                            {
                                                                                c.scanned
                                                                            }
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            /
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {
                                                                                c.expected
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={cn(
                                                                                'ml-1.5 text-[10px] font-black',
                                                                                colorCfg.text,
                                                                            )}
                                                                        >
                                                                            {
                                                                                c.percentage
                                                                            }
                                                                            %
                                                                        </span>
                                                                        <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                                                    </div>
                                                                </div>
                                                                <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                    <div
                                                                        className={cn(
                                                                            'h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-1000',
                                                                            colorCfg.bar,
                                                                        )}
                                                                        style={{
                                                                            width: `${Math.min(c.percentage, 100)}%`,
                                                                        }}
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
                                                        Data will appear as
                                                        students check in.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                                        <Button
                                            variant="outline"
                                            className="h-9 w-full gap-2 rounded-xl border-slate-200 text-xs font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                            onClick={() =>
                                                monitorEventId &&
                                                handleViewStudentsByCourse(
                                                    byCourse[0]?.program || '',
                                                )
                                            }
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
                        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                            <CardHeader className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-blue-600/10 p-2.5 dark:bg-blue-600/20">
                                            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <CardTitle className="text-base font-bold">
                                            Live Camera
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden items-center gap-2 border-r border-slate-200 pr-4 sm:flex dark:border-slate-700">
                                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                Status
                                            </span>
                                            {scanState.status === 'running' ? (
                                                <Badge className="animate-pulse border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black tracking-wider text-emerald-600 uppercase">
                                                    Running
                                                </Badge>
                                            ) : scanState.status ===
                                              'starting' ? (
                                                <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-black tracking-wider text-amber-600 uppercase">
                                                    Starting...
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-slate-200 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                                                >
                                                    Idle
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                className="h-10 gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-blue-500/30 transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
                                                onClick={startScanner}
                                                disabled={
                                                    scanState.status ===
                                                        'starting' ||
                                                    scanState.status ===
                                                        'running'
                                                }
                                            >
                                                <QrCode className="h-4 w-4" />
                                                Start Scanner
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10 rounded-xl border-slate-200 bg-white px-5 text-xs font-bold tracking-wider text-slate-600 uppercase transition-all duration-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                onClick={stopScanner}
                                            >
                                                Stop
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative aspect-video w-full overflow-hidden bg-slate-900 p-0">
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
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-white/50">
                                            <Camera className="h-8 w-8" />
                                        </div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">
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
                                                <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">
                                                    {lastScanned.status ===
                                                    'valid'
                                                        ? 'Success'
                                                        : 'Scan Failed'}
                                                </span>
                                                <span className="max-w-[200px] truncate text-sm font-bold">
                                                    {lastScanned.message}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white/60 backdrop-blur-xl">
                                            <Info className="h-5 w-5" />
                                            <span className="text-xs font-bold tracking-widest uppercase">
                                                Ready to scan student QR codes
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scanner Recent Activity Feed */}
                        <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                                <CardTitle className="text-base font-bold">
                                    Recent Scanner Check-ins
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-max">
                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Student
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Program
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                    Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {paginatedLiveRows.length ? (
                                                paginatedLiveRows.map((row) => (
                                                    <tr
                                                        key={row.id}
                                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {row.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                {row.student_id}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                            {row.program}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                {row.status
                                                                    ? row.status
                                                                          .charAt(
                                                                              0,
                                                                          )
                                                                          .toUpperCase() +
                                                                      row.status.slice(
                                                                          1,
                                                                      )
                                                                    : 'Present'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                                                            {row.time}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-6 py-10 text-center text-slate-400"
                                                    >
                                                        No scanner scans
                                                        recorded yet
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
                        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                            <h3 className="mb-4 text-sm font-bold">
                                Scanner Statistics
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        Valid Scans
                                    </span>
                                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                                        {scannerCounts.valid}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                        Invalid Scans
                                    </span>
                                    <span className="text-xl font-black text-rose-800 dark:text-rose-200">
                                        {scannerCounts.invalid}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        Total Scans
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
                        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                                <div>
                                    <CardTitle className="text-base font-bold">
                                        GPS Location Check-in & Geofence
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Students check in directly using their device's GPS location
                                    </p>
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        Whole Campus Active
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
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Total GPS Checked In
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                                            {liveCounts.total}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
                                            On Time
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                            {liveCounts.present}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
                                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider dark:text-amber-400">
                                            Late Arrivals
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                                            {liveCounts.late}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-4">
                        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/50">
                            <h3 className="mb-4 text-sm font-bold">
                                GPS Attendance Status
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                                    <span className="text-xs font-bold text-slate-500">
                                        Attendance Mode
                                    </span>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        GPS Check-in (No QR)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                                    <span className="text-xs font-bold text-emerald-700">
                                        Geofence Center
                                    </span>
                                    <span className="text-xs font-mono font-bold text-emerald-700">
                                        8.74307, 124.7745
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                                    <span className="text-xs font-bold text-blue-700">
                                        Allowed Perimeter
                                    </span>
                                    <span className="text-xs font-bold text-blue-700">
                                        300m Radius
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <h4 className="mb-2 text-xs font-bold tracking-wider text-blue-800 uppercase dark:text-blue-400">
                                How Students Attend
                            </h4>
                            <ol className="list-decimal space-y-1.5 pl-4 text-xs text-blue-600/90 dark:text-blue-300/80">
                                <li>
                                    Students log into DSAMS on their mobile phone or device.
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
